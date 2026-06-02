import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import apiClient from '../api/client';
import '../css/game.css';

export default function RoomObserveApp() {
    const [room, setRoom] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [logs, setLogs] = useState([]);
    const [timeLimitMinutes, setTimeLimitMinutes] = useState(60); 
    const ws = useRef(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('roomId');
        const token = localStorage.getItem('token');

        apiClient.get(`/api/v1/rooms/${roomId}`).then(res => {
            setRoom(res.data);
            fetchLeaderboard(roomId);
        });

        const wsHost = window.location.hostname;
        const wsUrl = `ws://${wsHost}:8000/api/v1/rooms/${roomId}/ws?token=${token}`;
        ws.current = new WebSocket(wsUrl);

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.event === 'leaderboard_update') {
                setLeaderboard(data.leaderboard);
                addLog(data.message || "Таблица лидеров обновлена");
            } else if (data.event === 'game_started') {
                // Принудительно меняем статус на активный
                setRoom(prev => ({...prev, status: 'active'}));
                addLog("СОРЕВНОВАНИЕ ЗАПУЩЕНО!");
            } else if (data.event === 'game_completed') {
                setLeaderboard(data.leaderboard);
                setRoom(prev => ({...prev, status: 'finished'}));
                addLog(data.message);
                alert(data.message);
            } else if (data.event === 'user_joined' || data.event === 'user_left') {
                addLog(data.message);
                fetchLeaderboard(roomId);
            }
        };

        return () => ws.current?.close();
    }, []);

    const fetchLeaderboard = (id) => {
        apiClient.get(`/api/v1/rooms/${id}`).then(res => {
            const formatted = res.data.participants.map(p => ({
                username: p.username,
                score: p.score,
                completed_tasks: p.completed_tasks_count
            }));
            setLeaderboard(formatted);
        });
    };

    const addLog = (msg) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
    };

    const handleStartGame = () => {
        // Проверка перенесена сюда, чтобы кнопка не пропадала из-за disabled
        if (leaderboard.length === 0) {
            return alert('В лобби пока пусто. Дождитесь подключения хотя бы одного участника!');
        }
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
            return alert('Нет связи с сервером');
        }
        ws.current.send(JSON.stringify({
            action: 'start_game',
            time_limit: timeLimitMinutes * 60 
        }));
    };
    const handleForceEnd = () => {
        // Добавляем окно подтверждения, чтобы не нажать случайно
        if (window.confirm("Вы уверены, что хотите досрочно завершить соревнование для всех участников?")) {
            if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
                return alert('Нет связи с сервером');
            }
            ws.current.send(JSON.stringify({
                action: 'force_end_game'
            }));
        }
    };

    // Надежная проверка статуса (независимо от регистра)
    const isWaiting = room?.status?.toLowerCase() === 'waiting';

// === ЭКРАН ОЖИДАНИЯ (ЛОББИ) ===
if (isWaiting) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', textAlign: 'center' }}>
            <h1 style={{ color: '#00f3ff', fontSize: '3rem', margin: '0 0 10px 0' }}>КОД КОМНАТЫ: {room.code}</h1>
            <p style={{ color: '#aaa', fontSize: '1.2rem', margin: '0 0 30px 0' }}>Раздайте этот код студентам. Они появятся в списке ниже.</p>
            
            <div style={{ width: '100%', maxWidth: '400px', background: '#111', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}>
                <h3 style={{ margin: '0 0 15px 0' }}>Участники в лобби ({leaderboard.length}):</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '200px', overflowY: 'auto' }}>
                    {leaderboard.length === 0 && <li style={{color: '#666'}}>Пока никого нет...</li>}
                    {leaderboard.map((u, i) => <li key={i} style={{padding: '8px', color: '#00f3ff', borderBottom: '1px solid #222'}}>{u.username} готов!</li>)}
                </ul>
            </div>

            <div style={{ marginTop: '30px' }}>
                <label style={{ fontSize: '1.2rem', marginRight: '15px', color: '#fff' }}>Время на решение (мин):</label>
                <input 
                    type="number" 
                    value={timeLimitMinutes} 
                    onChange={(e) => setTimeLimitMinutes(e.target.value)}
                    style={{ padding: '10px', fontSize: '1.2rem', width: '80px', textAlign: 'center', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '5px' }}
                    min="1"
                />
            </div>

            <button 
                style={{ 
                    marginTop: '40px', 
                    padding: '15px 50px', 
                    fontSize: '1.3rem',
                    background: leaderboard.length === 0 ? '#333' : '#00f3ff',
                    color: leaderboard.length === 0 ? '#888' : '#000',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: leaderboard.length === 0 ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    transition: '0.3s',
                    boxShadow: leaderboard.length === 0 ? 'none' : '0 0 15px rgba(0, 243, 255, 0.4)'
                }} 
                onClick={handleStartGame}
            >
                ЗАПУСТИТЬ СОРЕВНОВАНИЕ!
            </button>
        </div>
    );
}

    // === ЭКРАН НАБЛЮДЕНИЯ (ИГРА ИДЕТ) ===
    return (
        <div className="observe-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '20px' }}>
            <header className="game-header">
                <button className="btn-back" onClick={() => window.location.href='/rooms.html'}>&lt; ВЫХОД</button>
                <div className="room-info">
                    КОД КОМНАТЫ: <span style={{color: '#00f3ff', fontSize: '1.5rem'}}>{room?.code}</span>
                </div>
                
                {/* Панель управления справа */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{color: room?.status?.toLowerCase() === 'finished' ? '#ff0055' : '#00f3ff', fontWeight: 'bold'}}>
                        СТАТУС: {room?.status?.toUpperCase()}
                    </div>
                    
                    {/* Кнопка досрочного завершения видна только во время активной игры */}
                    {room?.status?.toLowerCase() === 'active' && (
                        <button 
                            onClick={handleForceEnd}
                            style={{
                                background: '#ff0055',
                                color: '#fff',
                                border: 'none',
                                padding: '8px 15px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                boxShadow: '0 0 10px rgba(255, 0, 85, 0.4)'
                            }}
                        >
                            Завершить досрочно
                        </button>
                    )}
                </div>
            </header>

            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', flexGrow: 1 }}>
                <div className="log-panel" style={{ background: '#111', border: '1px solid #333', padding: '15px', overflowY: 'auto', fontFamily: 'monospace' }}>
                    <h3 style={{color: '#888', marginBottom: '15px'}}>ЖУРНАЛ СОБЫТИЙ</h3>
                    {logs.map((log, i) => (
                        <div key={i} style={{marginBottom: '5px', borderLeft: '2px solid #00f3ff', paddingLeft: '10px', color: '#ddd'}}>
                            {log}
                        </div>
                    ))}
                </div>

                <div className="leaderboard-panel" style={{background: '#1e1e1e', padding: '15px'}}>
                    <h3 style={{color: '#00f3ff'}}>🏆 РЕЙТИНГ</h3>
                    <ul style={{listStyle: 'none', padding: 0}}>
                        {leaderboard.sort((a,b) => b.score - a.score).map((user, idx) => (
                            <li key={idx} style={{padding: '10px', background: '#2d2d2d', marginBottom: '5px', display: 'flex', justifyContent: 'space-between', borderRadius: '4px'}}>
                                <span style={{color: '#ccc'}}>{idx + 1}. {user.username}</span>
                                <span style={{color: '#00f3ff', fontWeight: 'bold'}}>{user.score} pts</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

// Защита от двойного рендера Vite HMR
const container = document.getElementById('root');
if (container) {
    if (!window._reactRootObserve) {
        window._reactRootObserve = createRoot(container);
    }
    window._reactRootObserve.render(<RoomObserveApp />);
}