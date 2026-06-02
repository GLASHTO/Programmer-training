import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import Editor from '@monaco-editor/react';
import apiClient from '../api/client';
import '../css/game.css';
// Можно создать отдельный CSS или дописать в game.css стили для лидерборда

// Компонент Таймера (без изменений, как у тебя)
const Timer = ({ initialTime, onTimeUp }) => {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (initialTime !== undefined && initialTime !== null) {
            setTimeLeft(initialTime);
        }
    }, [initialTime]);

    useEffect(() => {
        if (timeLeft === null) return;
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

// Основной компонент Соревнования
export default function RoomGameApp() {
    const [room, setRoom] = useState(null);
    const [task, setTask] = useState(null);
    const [code, setCode] = useState('// Write your solution here\n');
    const [status, setStatus] = useState(null); 
    const [loading, setLoading] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);
    const [roomTimeLimit, setRoomTimeLimit] = useState(null);
    
    // Новые стейты для соревнования
    const [leaderboard, setLeaderboard] = useState([]);
    const [isFinished, setIsFinished] = useState(false);
    
    // Модалки
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showTimeoutModal, setShowTimeoutModal] = useState(false);

    const ws = useRef(null);

    // Подключение к комнате по WebSockets
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('roomId');
        // Достаем токен (зависит от того, как ты его хранишь, например в localStorage)
        const token = localStorage.getItem('token'); 

        if (!roomId) {
            setStatus({ type: 'error', msg: 'Room ID is missing in URL.' });
            return;
        }

        // 1. Сначала можно загрузить начальные данные о комнате и текущей задаче через обычный API
        const fetchInitialData = async () => {
            try {
                const res = await apiClient.get(`/api/v1/rooms/${roomId}/current-state`);
                setRoom(res.data.room);
                setTask(res.data.current_task);
                setLeaderboard(res.data.leaderboard || []);
                
                // Если комната еще ждет запуска
                if (res.data.room.status === 'waiting') {
                    setIsWaiting(true);
                } else if (res.data.room.status === 'active') {
                    // Если зашел во время игры, берем время комнаты
                    setRoomTimeLimit(res.data.room.time_limit_seconds);
                }
            } catch (error) {
                console.error("Ошибка загрузки комнаты", error);
            }
        };
        fetchInitialData();

        // 2. Подключаем WebSocket
        // ВАЖНО: Замени localhost на твой API_URL, если он другой
        // Автоматически возьмет '10.25.2.4' (или 'localhost', если тестируешь локально)
        const wsHost = window.location.hostname; 

        const wsUrl = `ws://${wsHost}:8000/api/v1/rooms/${roomId}/ws?token=${token}`;
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log("WS Connected to room", roomId);
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setLoading(false); // Снимаем лоадинг с кнопки

            switch (data.event) {
                case 'game_started':
                    setIsWaiting(false);
                    setRoomTimeLimit(data.time_limit); // Запускаем глобальный таймер комнаты
                    setStatus({ type: 'success', msg: data.message });
                    break;

                case 'task_passed':
                    setStatus({ type: 'success', msg: `SUCCESS! Output: ${data.output}` });
                    setShowSuccessModal(true);
                    
                    setTimeout(() => {
                        setShowSuccessModal(false);
                        setCode('// Write your solution here\n');
                        setStatus(null);
                        
                        // Если есть следующая задача - загружаем её.
                        // Если её нет, мы НИЧЕГО не делаем, так как сервер пришлет game_completed!
                        if (data.next_task) {
                            setTask(data.next_task); 
                        }
                    }, 2000);
                    break;

                // --- НОВЫЙ ОБРАБОТЧИК ---
                case 'game_completed':
                    // Чтобы победитель успел посмотреть на зеленую модалку "Успех", 
                    // делаем небольшую задержку перед переключением экрана у всех
                    setTimeout(() => {
                        setIsFinished(true);
                        setShowSuccessModal(false);
                        if (data.leaderboard) setLeaderboard(data.leaderboard);
                        if (data.message) setStatus({ type: 'success', msg: data.message });
                    }, 1000);
                    break;

                case 'task_failed':
                    const errorText = data.error || `Wrong Answer.\nGot: ${data.output}\nExpected: ${data.expected}`;
                    setStatus({ type: 'error', msg: errorText });
                    break;

                case 'leaderboard_update':
                    setLeaderboard(data.leaderboard);
                    break;

                case 'game_completed':
                    setIsFinished(true); // Переключает экран
                    setShowSuccessModal(false);
                    if (data.leaderboard) setLeaderboard(data.leaderboard);
                    if (data.message) setStatus({ type: 'success', msg: data.message });
                    break;
                
                case 'current_task_info':
                    // Если сервер шлет задачу при подключении или смене
                    setTask(data.task);
                    break;

                case 'error':
                    setStatus({ type: 'error', msg: data.message });
                    break;
                    
                default:
                    break;
            }
        };

        ws.current.onclose = () => {
            console.log("WS Disconnected");
            setStatus({ type: 'error', msg: 'Соединение с сервером разорвано.' });
        };

        return () => {
            if (ws.current) ws.current.close();
        };
    }, []);

    const handleTimeUp = () => {
        setShowTimeoutModal(true);
        setTimeout(() => {
            setShowTimeoutModal(false);
            setIsFinished(true); // <--- Вместо редиректа в меню, показываем таблицу лидеров
        }, 3000);
    };

    const handleBack = () => {
        window.location.href = '/menu.html';
    };

    const handleSubmit = () => {
        if (!task || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
            setStatus({ type: 'error', msg: 'Нет подключения к серверу' });
            return;
        }

        setLoading(true);
        setStatus(null);

        // Очистка кода (твой алгоритм)
        const cleanCode = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*|#.*/g, '').trim();

        // Отправляем решение через WebSocket!
        ws.current.send(JSON.stringify({
            action: 'submit_code',
            code: cleanCode
        }));
    };

    // Экран победы (окончания соревнования)
    if (isFinished) {
        return (
            <div className="game-container">
                <div style={{ textAlign: 'center', marginTop: '100px', color: '#fff' }}>
                    <h1 style={{ color: '#00f3ff', fontSize: '3rem' }}>СОРЕВНОВАНИЕ ЗАВЕРШЕНО!</h1>
                    <h2>Итоговая таблица лидеров:</h2>
                    <div style={{ background: '#111', padding: '20px', borderRadius: '10px', display: 'inline-block', textAlign: 'left', minWidth: '300px' }}>
                        {leaderboard.map((user, idx) => (
                            <div key={idx} style={{ fontSize: '1.2rem', margin: '10px 0' }}>
                                <strong>{idx + 1}. {user.username}</strong> — {user.score} pts
                            </div>
                        ))}
                    </div>
                    <br/><br/>
                    <button className="btn-submit" onClick={handleBack}>ВЕРНУТЬСЯ В МЕНЮ</button>
                </div>
            </div>
        );
    }
    // === ЭКРАН ОЖИДАНИЯ ДЛЯ СТУДЕНТОВ ===
    if (isWaiting) {
        return (
            <div className="game-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div className="loader" style={{ width: '50px', height: '50px', border: '5px solid #333', borderTop: '5px solid #00f3ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <h2 style={{ color: '#fff', marginTop: '20px' }}>Вы в лобби соревнования</h2>
                <p style={{ color: '#00f3ff', fontSize: '1.2rem' }}>Ожидаем, пока создатель запустит игру...</p>
                <div style={{ marginTop: '20px', color: '#888' }}>Студентов в комнате: {leaderboard.length}</div>
            </div>
        );
    }
    if (!task && !status) return <div className="game-container" style={{padding: 20}}>Loading competition...</div>;

    return (
        <div className="game-container">
            {/* МОДАЛЬНОЕ ОКНО ТАЙМАУТА */}
            {showTimeoutModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ borderColor: '#ff0055', boxShadow: '0 0 30px rgba(255, 0, 85, 0.3)' }}>
                        <h2 className="modal-title" style={{ color: '#ff0055' }}>ВНИМАНИЕ!</h2>
                        <p style={{ fontSize: '1.2rem' }}>ВРЕМЯ СОРЕВНОВАНИЯ ВЫШЛО!</p>
                    </div>
                </div>
            )}

            {/* МОДАЛЬНОЕ ОКНО УСПЕХА */}
            {showSuccessModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="modal-title">СТАТУС ЗАДАЧИ</h2>
                        <p>Задача успешно решена!</p>
                        <p style={{color: '#00f3ff', fontSize: '0.9rem'}}>Переход к следующей задаче...</p>
                        <div className="loader-bar" style={{width: '100%', height: '4px', background: '#00f3ff', marginTop: '20px', animation: 'shrink 2s linear'}} />
                    </div>
                </div>
            )}

            <header className="game-header">
                <button className="btn-back" onClick={handleBack}>&lt; ВЫЙТИ</button>
                {/* Если у тебя есть время на всю комнату (room.time_limit), можно передавать его */}
                {/* Таймер работает на уровне комнаты, а не задачи */}
                <Timer initialTime={roomTimeLimit} onTimeUp={handleTimeUp} />
                <div style={{width: 80}}>ROOM: {room?.code}</div> 
            </header>

            <div className="game-content" style={{ display: 'flex', gap: '20px' }}>
                
                {/* 1. Левая панель - Описание */}
                <aside className="task-panel" style={{ flex: '1 1 25%' }}>
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
                        <div className="task-desc">Task loading...</div>
                    )}
                </aside>

                {/* 2. Центральная панель - Редактор */}
                <main className="editor-area" style={{ flex: '1 1 55%' }}>
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
                            {loading ? 'TESTING CODE...' : 'SUBMIT CODE'}
                        </button>
                    </footer>
                </main>

                {/* 3. Правая панель - Лидерборд */}
                <aside className="leaderboard-panel" style={{ flex: '1 1 20%', background: '#1e1e1e', border: '1px solid #333', borderRadius: '5px', padding: '15px' }}>
                    <h3 style={{ color: '#00f3ff', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px' }}>
                        🏆 Лидерборд
                    </h3>
                    {leaderboard.length === 0 ? (
                        <p style={{ color: '#888', fontSize: '0.9rem' }}>Ожидание участников...</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {leaderboard.map((user, idx) => (
                                <li key={idx} style={{ 
                                    padding: '10px', 
                                    background: '#2d2d2d', 
                                    marginBottom: '8px', 
                                    borderRadius: '5px',
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}>
                                    <span style={{ fontWeight: 'bold', color: '#ccc' }}>{idx + 1}. {user.username}</span>
                                    <span style={{ color: '#00f3ff' }}>{user.score}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </aside>
            </div>
        </div>
    );
};

const container = document.getElementById('root');
if (container) {
    if (!window._reactRootGame) {
        window._reactRootGame = createRoot(container);
    }
    window._reactRootGame.render(<RoomGameApp />);
}