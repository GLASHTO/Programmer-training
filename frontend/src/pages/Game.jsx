import React, { useEffect, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import api from '../api/axios';
import { useGameStore } from '../store/game';
import Timer from '../components/Timer';
import CodeEditor from '../components/CodeEditor';

const Game = () => {
  const { task, code, setCode, setTask, status, setStatus } = useGameStore();
  const [results, setResults] = useState(null);

  // Загрузка задачи (автоматически берем первую доступную для игрока)
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await api.get('/api/v1/tasks/tasks/');
        // Берем последнюю или по уровню, здесь для примера первую
        if (res.data.length > 0) setTask(res.data[0]);
      } catch (err) {
        console.error("Task fetch error", err);
      }
    };
    fetchTask();
  }, [setTask]);

  const handleSubmit = async () => {
    if (!task) return;
    setStatus('loading');
    try {
      const res = await api.post('/api/v1/games/submit', {
        task_id: task.id,
        code: code
      });
      setResults(res.data);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setResults({ error: "Compilation Error or Connection Failed" });
    }
  };

  if (!task) return <div className="h-screen bg-slate-950 text-cyan-500 flex items-center justify-center">INITIALIZING_SYSTEM...</div>;

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col font-mono">
      {/* Header */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50">
        <div className="flex items-center gap-4">
          <span className="text-cyan-500 font-bold tracking-widest text-lg">CORE_SESSION</span>
          <span className="text-slate-500">|</span>
          <span className="text-sm text-slate-400">{task.title}</span>
        </div>
        <Timer duration={task.task_time} onExpire={() => console.log('Time out!')} />
        <button 
          onClick={handleSubmit}
          disabled={status === 'loading'}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-1 rounded-sm transition-all uppercase text-sm font-bold disabled:opacity-50"
        >
          {status === 'loading' ? 'EXECUTING...' : 'RUN_CODE'}
        </button>
      </div>

      {/* Main Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor */}
        <div className="flex-1 border-r border-slate-800 relative">
          <CodeEditor value={code} onChange={(val) => setCode(val)} />
        </div>

        {/* Right: Task & Output */}
        <div className="w-1/3 flex flex-col bg-slate-900/30 overflow-y-auto p-6">
          <div className="mb-8">
            <h2 className="text-emerald-500 mb-2 uppercase tracking-tighter text-sm font-bold">// MISSION_BRIEF</h2>
            <p className="text-slate-300 leading-relaxed text-sm">{task.description}</p>
          </div>

          <div className="mb-8 p-4 bg-slate-900 border-l-2 border-cyan-500">
            <h3 className="text-xs text-slate-500 mb-2 uppercase">Expected Output:</h3>
            <pre className="text-cyan-400 text-sm italic">{task.expected_output}</pre>
          </div>

          <div className="mt-auto">
            <h2 className="text-emerald-500 mb-2 uppercase text-sm font-bold">// SYSTEM_OUTPUT</h2>
            <div className="p-4 bg-black/50 border border-slate-800 rounded min-h-[100px] text-xs font-mono">
              {results ? (
                <div className={results.error ? "text-red-400" : "text-emerald-400"}>
                  {JSON.stringify(results, null, 2)}
                </div>
              ) : (
                <span className="text-slate-600 tracking-widest animate-pulse font-bold">AWAITING_EXECUTION...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;