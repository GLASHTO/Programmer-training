import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Editor from '@monaco-editor/react';
import apiClient from '../api/client';
import '../css/game.css';

// Компонент Таймера
const Timer = ({ initialTime }) => {
    const [timeLeft, setTimeLeft] = useState(initialTime || 3600);

    useEffect(() => {
        if (!initialTime) return;
        setTimeLeft(initialTime);
    }, [initialTime]);

    useEffect(() => {
        if (timeLeft <= 0) return;
        const intervalId = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(intervalId);
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return <div className="timer">TIME: {formatTime(timeLeft)}</div>;
};

// Основной компонент игры
const GameApp = () => {
    const [task, setTask] = useState(null);
    const [code, setCode] = useState('// Write your solution here\n');
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', msg: string }
    const [loading, setLoading] = useState(false);

    // Загрузка задачи при старте
    useEffect(() => {
        const fetchTask = async () => {
            try {
                // Получаем список задач и берем первую (для упрощения, т.к. логика выбора не описана)
                const response = await apiClient.get('/api/v1/tasks/tasks/');
                if (response.data && response.data.length > 0) {
                    setTask(response.data[0]);
                } else {
                    setStatus({ type: 'error', msg: 'No tasks available.' });
                }
            } catch (error) {
                console.error("Failed to load task", error);
                setStatus({ type: 'error', msg: 'Error loading task data.' });
            }
        };

        fetchTask();
    }, []);

    const handleBack = () => {
        window.location.href = '/menu.html';
    };

    const handleSubmit = async () => {
        if (!task) return;
        setLoading(true);
        setStatus(null);

        try {
            const payload = {
                task_id: task.id,
                code: code
            };
            
            // 1. Сохраняем ответ сервера в переменную
            const response = await apiClient.post('/api/v1/games/submit', payload);
            const result = response.data; // { status: true, output: "string", error: null, ... }
            
            // 2. Проверяем поле status из твоего JSON
            if (result.status === true) {
                // Если решение верное
                setStatus({ 
                    type: 'success', 
                    msg: `SUCCESS! Output: ${result.output}` 
                });
            } else {
                // Если решение неверное или код упал с ошибкой
                // Если есть error (из stderr), показываем его, иначе показываем output (неверный вывод)
                const errorText = result.error ? result.error : `Wrong Answer. Got: ${result.output}`;
                setStatus({ 
                    type: 'error', 
                    msg: errorText 
                });
            }

        } catch (error) {
            console.error(error);
            // Обработка ошибок сети или 500-х ошибок сервера
            const errorMsg = error.response?.data?.detail 
                ? JSON.stringify(error.response.data.detail) 
                : 'Connection Failed';
            setStatus({ type: 'error', msg: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    
    if (!task && !status) return <div className="game-container" style={{padding: 20}}>Loading system...</div>;

    return (
        <div className="game-container">
            {/* Header */}
            <header className="game-header">
                <button className="btn-back" onClick={handleBack}>&lt; EXIT</button>
                <Timer initialTime={task ? task.task_time : 0} />
                <div style={{width: 80}}></div> {/* Spacer for centering */}
            </header>

            {/* Content */}
            <div className="game-content">
                {/* Left: Task Info */}
                <aside className="task-panel">
                    {task ? (
                        <>
                            <h2 className="task-title">{task.title}</h2>
                            <div className="task-desc">
                                <p>{task.description}</p>
                            </div>
                            <div className="task-example">
                                <strong>Expected Output:</strong>
                                <pre style={{background: '#000', padding: 10, marginTop: 5}}>
                                    {task.expected_output}
                                </pre>
                            </div>
                            <div className="task-meta">
                                <span>Score: {task.task_score} pts</span>
                            </div>
                        </>
                    ) : (
                        <div className="task-desc">Task not loaded.</div>
                    )}
                </aside>

                {/* Right: Editor */}
                <main className="editor-area">
                    <div className="editor-wrapper">
                        <Editor
                            height="100%"
                            defaultLanguage="python"
                            theme="vs-dark"
                            value={code}
                            onChange={(value) => setCode(value)}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                            }}
                        />
                    </div>
                    
                    {/* Control Panel */}
                    <footer className="control-panel">
                        {status && (
                            <div className={`status-msg ${status.type}`}>
                                 {status.msg}
                            </div>
                        )}
                        <button 
                            className="btn-submit" 
                            onClick={handleSubmit} 
                            disabled={loading || !task}
                        >
                            {loading ? 'UPLOADING...' : 'SUBMIT CODE'}
                        </button>
                    </footer>
                </main>
            </div>
        </div>
    );
};

// Монтирование React приложения
const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<GameApp />);
}