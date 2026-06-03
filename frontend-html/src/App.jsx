import { useEffect, useMemo, useState } from 'react'
import apiClient from './api/client'
import './App.css'

const API = {
  register: '/users/users/',
  login: '/auth/login',
  tasks: '/tasks/tasks/',
  submit: '/games/submit',
  leaderboardUsers: '/leaderboard/leaderboard/users',
}

function App() {
  const [mode, setMode] = useState('login')
  const [auth, setAuth] = useState({
    username: '',
    password: '',
  })
  const [registerForm, setRegisterForm] = useState({
    username: '',
    password: '',
  })
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [tasks, setTasks] = useState([])
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [code, setCode] = useState('print("Hello, Arena!")')
  const [submitResult, setSubmitResult] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  )

  useEffect(() => {
    if (!token) {
      return
    }

    const savedUser = localStorage.getItem('arena_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    void loadDashboard()
  }, [token])

  const loadDashboard = async () => {
    setLoading(true)
    setError('')
    try {
      const [tasksRes, leaderboardRes] = await Promise.all([
        apiClient.get(API.tasks),
        apiClient.get(API.leaderboardUsers),
      ])
      setTasks(tasksRes.data ?? [])
      setSelectedTaskId((prev) => prev ?? tasksRes.data?.[0]?.id ?? null)
      setLeaderboard(leaderboardRes.data ?? [])
    } catch (loadError) {
      setError(extractError(loadError))
    } finally {
      setLoading(false)
    }
  }

  const handleAuthInput = (event) => {
    const { name, value } = event.target
    setAuth((prev) => ({ ...prev, [name]: value }))
  }

  const handleRegisterInput = (event) => {
    const { name, value } = event.target
    setRegisterForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await apiClient.post(API.register, registerForm)
      setMode('login')
      setAuth({
        username: registerForm.username,
        password: '',
      })
      setRegisterForm({ username: '', password: '' })
    } catch (registerError) {
      setError(extractError(registerError))
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await apiClient.post(API.login, auth)
      const nextToken = response.data?.access_token
      if (!nextToken) {
        throw new Error('Server did not return token')
      }

      const currentUser = {
        id: response.data.user_id,
        username: response.data.username,
      }
      localStorage.setItem('token', nextToken)
      localStorage.setItem('arena_user', JSON.stringify(currentUser))
      setToken(nextToken)
      setUser(currentUser)
    } catch (loginError) {
      setError(extractError(loginError))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitCode = async (event) => {
    event.preventDefault()
    if (!selectedTaskId) {
      setError('Сначала выбери задачу')
      return
    }

    setLoading(true)
    setError('')
    setSubmitResult(null)
    try {
      const response = await apiClient.post(API.submit, {
        task_id: selectedTaskId,
        code,
      })
      setSubmitResult(response.data)
      await loadDashboard()
    } catch (submitError) {
      setError(extractError(submitError))
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('arena_user')
    setToken(null)
    setUser(null)
    setTasks([])
    setLeaderboard([])
    setSelectedTaskId(null)
    setSubmitResult(null)
    setError('')
    setMode('login')
  }

  if (!token) {
    return (
      <main className="auth-layout">
        <section className="panel auth-panel">
          <h1>Code Battle Arena</h1>
          <p className="subtitle">Desktop React клиент</p>
          <div className="tabs">
            <button
              className={mode === 'login' ? 'tab tab-active' : 'tab'}
              type="button"
              onClick={() => {
                setError('')
                setMode('login')
              }}
            >
              Вход
            </button>
            <button
              className={mode === 'register' ? 'tab tab-active' : 'tab'}
              type="button"
              onClick={() => {
                setError('')
                setMode('register')
              }}
            >
              Регистрация
            </button>
          </div>

          {mode === 'login' ? (
            <form className="form" onSubmit={handleLogin}>
              <label>
                Логин
                <input
                  name="username"
                  value={auth.username}
                  onChange={handleAuthInput}
                  required
                />
              </label>
              <label>
                Пароль
                <input
                  name="password"
                  type="password"
                  value={auth.password}
                  onChange={handleAuthInput}
                  required
                />
              </label>
              <button disabled={loading} type="submit">
                {loading ? 'Вход...' : 'Войти'}
              </button>
            </form>
          ) : (
            <form className="form" onSubmit={handleRegister}>
              <label>
                Логин
                <input
                  name="username"
                  value={registerForm.username}
                  onChange={handleRegisterInput}
                  required
                />
              </label>
              <label>
                Пароль
                <input
                  name="password"
                  type="password"
                  value={registerForm.password}
                  onChange={handleRegisterInput}
                  required
                />
              </label>
              <button disabled={loading} type="submit">
                {loading ? 'Создание...' : 'Создать аккаунт'}
              </button>
            </form>
          )}
          {error && <p className="error">{error}</p>}
        </section>
      </main>
    )
  }

  return (
    <main className="desktop-app">
      <header className="panel topbar">
        <div>
          <h2>Code Battle Arena</h2>
          <p className="subtitle">Добро пожаловать, {user?.username}</p>
        </div>
        <div className="topbar-actions">
          <button type="button" onClick={() => void loadDashboard()} disabled={loading}>
            Обновить
          </button>
          <button type="button" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </header>

      <section className="desktop-grid">
        <article className="panel">
          <h3>Задачи</h3>
          <div className="task-list">
            {tasks.map((task) => (
              <button
                key={task.id}
                type="button"
                className={selectedTaskId === task.id ? 'task-item active' : 'task-item'}
                onClick={() => setSelectedTaskId(task.id)}
              >
                <strong>{task.title}</strong>
                <span>+{task.task_score} очков</span>
              </button>
            ))}
          </div>

          {selectedTask && (
            <div className="task-details">
              <h4>{selectedTask.title}</h4>
              <p>{selectedTask.description}</p>
              <p>
                <strong>Ожидаемый вывод:</strong> {selectedTask.expected_output}
              </p>
            </div>
          )}
        </article>

        <article className="panel">
          <h3>Решение</h3>
          <form className="form" onSubmit={handleSubmitCode}>
            <label>
              Python код
              <textarea
                value={code}
                onChange={(event) => setCode(event.target.value)}
                rows={14}
                spellCheck={false}
              />
            </label>
            <button disabled={loading} type="submit">
              {loading ? 'Проверка...' : 'Отправить решение'}
            </button>
          </form>

          {submitResult && (
            <div className={submitResult.status ? 'result success' : 'result fail'}>
              <h4>{submitResult.status ? 'Задача решена' : 'Ошибка решения'}</h4>
              {submitResult.output && <p>Output: {submitResult.output}</p>}
              {submitResult.error && <p>Error: {submitResult.error}</p>}
              {Number.isFinite(submitResult.awarded_points) && (
                <p>Начислено очков: {submitResult.awarded_points}</p>
              )}
            </div>
          )}

          {error && <p className="error">{error}</p>}
        </article>

        <article className="panel">
          <h3>Лидерборд</h3>
          <div className="leaderboard">
            {leaderboard.map((player) => (
              <div className="leaderboard-row" key={`${player.rank}-${player.username}`}>
                <span>#{player.rank}</span>
                <span>{player.username}</span>
                <span>{player.score}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  )
}

function extractError(error) {
  return (
    error?.response?.data?.detail ??
    error?.response?.data?.message ??
    error?.message ??
    'Unknown error'
  )
}

export default App
