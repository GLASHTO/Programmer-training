import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Editor from '@monaco-editor/react';
import apiClient from '../api/client';
import '../css/game.css';

// Компонент Таймера
const Timer = ({ initialTime, onTimeUp }) => {
    // Используем null, чтобы понимать, загрузилась ли уже задача
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (initialTime !== undefined && initialTime !== null) {
            setTimeLeft(initialTime);
        }
    }, [initialTime]);

    useEffect(() => {
        // Если таймер еще не инициализирован, ничего не делаем
        if (timeLeft === null) return;

        // Если время вышло, останавливаемся и вызываем колбэк
        if (timeLeft <= 0) {
            if (onTimeUp) onTimeUp();
            return;
        }

        const intervalId = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timeLeft, onTimeUp]);

    const formatTime = (seconds) => {
        if (seconds === null) return "--:--";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isCritical = timeLeft !== null && timeLeft < 60 && timeLeft > 0; 

    return <div className={`timer ${isCritical ? 'timer-critical' : ''}`}>TIME: {formatTime(timeLeft)}</div>;
};

// Основной компонент игры
const GameApp = () => {
    // Новые стейты для работы со списком задач
    const [tasks, setTasks] = useState([]);
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    
    const [task, setTask] = useState(null);
    const [code, setCode] = useState('// Write your solution here\n');
    const [status, setStatus] = useState(null); 
    const [loading, setLoading] = useState(false);
    
    // Стейт для управления модальным окном
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    // Внутри компонента GameApp, там где у тебя объявлены другие useState:
    const [showTimeoutModal, setShowTimeoutModal] = useState(false);

    // Функция, которая сработает, когда таймер достигнет 0
    const handleTimeUp = () => {
        setShowTimeoutModal(true);
    
    // Автоматически выкидываем пользователя на страницу выбора задач через 3 секунды
    setTimeout(() => {
        window.location.href = '/tasks.html';
    }, 3000);
    };


    // Загрузка списка задач при старте
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                // Читаем параметры из URL (например, ?taskId=5)
                const urlParams = new URLSearchParams(window.location.search);
                const requestedTaskId = urlParams.get('taskId');

                const response = await apiClient.get('/api/v1/tasks/tasks/');
                const allTasks = response.data;

                if (allTasks && allTasks.length > 0) {
                    setTasks(allTasks);

                    if (requestedTaskId) {
                        // Если передан ID, ищем эту задачу в массиве
                        const foundIndex = allTasks.findIndex(t => t.id === parseInt(requestedTaskId));
                        
                        if (foundIndex !== -1) {
                            setCurrentTaskIndex(foundIndex);
                            setTask(allTasks[foundIndex]);
                        } else {
                            setStatus({ type: 'error', msg: 'Task not found. System error.' });
                        }
                    } else {
                        // Если зашли просто на /game.html без ID, даем первую задачу
                        setCurrentTaskIndex(0);
                        setTask(allTasks[0]);
                    }
                } else {
                    setStatus({ type: 'error', msg: 'No tasks available in database.' });
                }
            } catch (error) {
                console.error("Failed to load tasks", error);
                setStatus({ type: 'error', msg: 'Error loading task data.' });
            }
        };

        fetchTasks();
    }, []);

    const handleBack = () => {
        window.location.href = '/menu.html';
    };

    // Логика перехода к следующей задаче
    const handleNextTask = () => {
        const nextIndex = currentTaskIndex + 1;
        if (nextIndex < tasks.length) {
            setCurrentTaskIndex(nextIndex);
            setTask(tasks[nextIndex]);
            setCode('// Write your solution here\n'); // Сбрасываем код
            setStatus(null); // Очищаем статус
            setShowSuccessModal(false); // Закрываем модалку
        } else {
            alert("Вы решили все доступные задачи!");
            window.location.href = '/menu.html';
        }
    };

    const handleSubmit = async () => {
        if (!task) return;
        setLoading(true);
        setStatus(null);

        try {
            // === ОЧИСТКА КОДА ===
            // Удаляем:
            // 1. Многострочные комментарии /* ... */
            // 2. Однострочные JS/C++ комментарии // ...
            // 3. Однострочные Python комментарии # ...
            const cleanCode = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*|#.*/g, '').trim();

            const payload = {
                task_id: task.id,
                code: cleanCode // Отправляем очищенный код
            };
            
            const response = await apiClient.post('/api/v1/games/submit', payload);
            const result = response.data;
            
            // --- ТВОЙ НОВЫЙ БЛОК КОДА ---
            if (result.status === true) {
                // Формируем сообщение в зависимости от того, решалась ли задача ранее
                let successMsg = `SUCCESS! Output: ${result.output}`;
                
                if (result.already_solved) {
                    successMsg = `SUCCESS! Output: ${result.output} (Задача уже была решена ранее. Новые баллы не начислены.)`;
                }

                setStatus({ 
                    type: 'success', 
                    msg: successMsg 
                });
                
                // Показываем модальное окно
                setShowSuccessModal(true);
            } else {
                // Если решение неверное
                const errorText = result.error ? result.error : `Wrong Answer. Got: ${result.output}`;
                setStatus({ type: 'error', msg: errorText });
            }

        } catch (error) {
            console.error(error);
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
            {/* --- МОДАЛЬНОЕ ОКНО ТАЙМАУТА --- */}
            {showTimeoutModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ borderColor: '#ff0055', boxShadow: '0 0 30px rgba(255, 0, 85, 0.3)' }}>
                        <h2 className="modal-title" style={{ color: '#ff0055' }}>ВНИМАНИЕ!</h2>
                        <p style={{ fontSize: '1.2rem' }}>ВРЕМЯ ВЫШЛО!</p>
                        <p style={{ color: '#ffaa00' }}>СОЕДИНЕНИЕ ПРЕРВАНО...</p>
                    </div>
                </div>
            )}
            {/* --- МОДАЛЬНОЕ ОКНО --- */}
            {showSuccessModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="modal-title">СТАТУС ЗАДАЧИ</h2>
                        <p>Задача успешно решена!</p>
                        
                        {/* Показываем статус начисления */}
                        {status?.msg?.includes('уже была решена') ? (
                            <p style={{color: '#ffaa00', fontSize: '0.9rem'}}>Повторное решение. Баллы не начислены.</p>
                        ) : (
                            <p style={{color: '#00f3ff', fontSize: '0.9rem'}}>Баллы успешно зачислены в систему.</p>
                        )}
                        
                        <div className="modal-actions">
                            <button className="btn-action" onClick={handleNextTask}>
                                [ Следующая задача ]
                            </button>
                            <button className="btn-action logout" onClick={handleBack}>
                                [ В меню ]
                            </button>
                        </div>
                    </div>
                </div>
            )}
            

            <header className="game-header">
                <button className="btn-back" onClick={handleBack}>&lt; НАЗАД</button>
                <Timer initialTime={task ? task.task_time : null} onTimeUp={handleTimeUp} />
                <div style={{width: 80}}></div> 
            </header>

            <div className="game-content">
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

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<GameApp />);
}