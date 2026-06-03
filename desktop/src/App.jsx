import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'alym.desktop.tasks.v1'

const FILTERS = {
  all: 'All',
  active: 'Active',
  done: 'Done',
}

function createTask(title) {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    completed: false,
    createdAt: Date.now(),
  }
}

function App() {
  const [tasks, setTasks] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  const [draft, setDraft] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  const filteredTasks = useMemo(() => {
    if (filter === 'active') {
      return tasks.filter((task) => !task.completed)
    }

    if (filter === 'done') {
      return tasks.filter((task) => task.completed)
    }

    return tasks
  }, [filter, tasks])

  const totalCount = tasks.length
  const completedCount = tasks.filter((task) => task.completed).length
  const activeCount = totalCount - completedCount

  const canAddTask = draft.trim().length > 0

  function addTask(event) {
    event.preventDefault()
    if (!canAddTask) {
      return
    }

    setTasks((current) => [createTask(draft), ...current])
    setDraft('')
  }

  function toggleTask(id) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    )
  }

  function removeTask(id) {
    setTasks((current) => current.filter((task) => task.id !== id))
  }

  function clearCompleted() {
    setTasks((current) => current.filter((task) => !task.completed))
  }

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <h1>Alym Tasks</h1>
          <p>Simple desktop task manager with local persistence.</p>
        </div>
        <div className="stats" aria-label="Task statistics">
          <span>Total: {totalCount}</span>
          <span>Active: {activeCount}</span>
          <span>Done: {completedCount}</span>
        </div>
      </header>

      <form className="task-form" onSubmit={addTask}>
        <input
          type="text"
          value={draft}
          placeholder="Add new task"
          onChange={(event) => setDraft(event.target.value)}
          aria-label="Task title"
        />
        <button type="submit" disabled={!canAddTask}>
          Add
        </button>
      </form>

      <section className="controls" aria-label="Task filters">
        <div className="filters">
          {Object.entries(FILTERS).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={filter === value ? 'active' : ''}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="clear-button"
          onClick={clearCompleted}
          disabled={completedCount === 0}
        >
          Clear completed
        </button>
      </section>

      <section className="task-list" aria-live="polite">
        {filteredTasks.length === 0 ? (
          <p className="empty-state">No tasks in this filter.</p>
        ) : (
          <ul>
            {filteredTasks.map((task) => (
              <li key={task.id} className={task.completed ? 'done' : ''}>
                <label>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                  />
                  <span>{task.title}</span>
                </label>
                <button type="button" onClick={() => removeTask(task.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App
