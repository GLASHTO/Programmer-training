import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../store/game';
import api from '../api/axios';
import CodeEditor from '../components/CodeEditor';
import Timer from '../components/Timer';

const Game = () => {
  const navigate = useNavigate();
  const { task, code, status, setTask, setCode, setStatus, resetGame } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        resetGame();
        // Получаем список задач и берем случайную для "Битвы"
        const response = await api.get('/api/v1/tasks/tasks/');
        const tasks = response.data;
        if (tasks && tasks.length > 0) {
          const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
          setTask(randomTask);
          setStatus('playing');
        } else {
          setResult('No tasks available');
        }
      } catch (error) {
        console.error('Failed to load tasks', error);
        setResult('Error loading task');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [setTask, setStatus, resetGame]);

  const handleTimeExpire = () => {
    setStatus('finished');
    setResult('Time expired! Game Over.');
  };

  const handleSubmit = async () => {
    if (!task) return;
    
    try {
      setResult('Submitting...');
      // POST /api/v1/games/submit отправляет JSON
      // Authorization header добавится автоматически в axios.js
      await api.post('/api/v1/games/submit', {
        task_id: task.id,
        code: code
      });
      
      setStatus('finished');
      setResult('Submission received. Check your dashboard for results.');
    } catch (error) {
      console.error('Submission failed', error);
      setResult('Submission failed. Try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-green-500 font-mono">
        INITIALIZING SEQUENCE...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-green-500 font-mono gap-4">
        <div>SYSTEM ERROR: TASK NOT FOUND</div>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 border border-green-600 hover:bg-green-900 transition-colors"
        >
          RETURN TO MENU
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-300 font-mono p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-green-900 pb-4">
        <div>
          <h1 className="text-2xl text-green-500 font-bold uppercase tracking-wider">
            {task.title}
          </h1>
          <span className="text-xs text-gray-500">SCORE: {task.task_score} // TIME: {task.task_time}s</span>
        </div>
        {status === 'playing' && (
          <Timer duration={task.task_time} onExpire={handleTimeExpire} />
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Task Description */}
        <div className="flex flex-col gap-4">
          <div className="bg-black border border-green-900 p-4 min-h-[200px] text-sm leading-relaxed shadow-lg">
            <h3 className="text-green-600 font-bold mb-2">:: MISSION BRIEFING ::</h3>
            <p>{task.description}</p>
            
            <div className="mt-4 pt-4 border-t border-gray-800">
              <h4 className="text-green-600 font-bold text-xs mb-1">EXPECTED OUTPUT:</h4>
              <pre className="bg-gray-900 p-2 text-xs text-gray-400 overflow-x-auto">
                {task.expected_output}
              </pre>
            </div>
          </div>
          
          {/* Result Area */}
          <div className="bg-black border border-gray-800 p-4 min-h-[100px] text-sm font-mono">
             <span className="text-gray-500">{'>'} SYSTEM STATUS:</span>
             <div className={`mt-2 ${result?.includes('failed') || result?.includes('Over') ? 'text-red-500' : 'text-green-400'}`}>
               {result || 'Waiting for submission...'}
             </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex flex-col gap-4">
          <CodeEditor value={code} onChange={setCode} />
          
          <div className="flex justify-end gap-4">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 text-sm text-gray-400 border border-gray-700 hover:text-white hover:border-gray-500 transition-all"
            >
              ABORT
            </button>
            <button
              onClick={handleSubmit}
              disabled={status !== 'playing'}
              className={`px-8 py-2 text-sm font-bold border transition-all uppercase tracking-widest
                ${status === 'playing' 
                  ? 'bg-green-900/20 text-green-500 border-green-600 hover:bg-green-500 hover:text-black shadow-[0_0_15px_rgba(0,255,0,0.3)]' 
                  : 'bg-gray-900 text-gray-600 border-gray-800 cursor-not-allowed'}`}
            >
              Submit_Solution()
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;