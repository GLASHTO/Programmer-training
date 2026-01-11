import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import apiClient from '../api/client';
import '../css/dashboard.css';

const DashboardApp = () => {
    const [activeTab, setActiveTab] = useState('users'); // 'users' | 'teams'
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Для обоих видов всегда нужны пользователи (чтобы считать очки)
            const usersRes = await apiClient.get('/api/v1/users/users/');
            const users = usersRes.data || [];

            if (activeTab === 'users') {
                // Сортировка пользователей по очкам
                const sortedUsers = users.sort((a, b) => (b.score || 0) - (a.score || 0));
                setData(sortedUsers);
            } else {
                // Для команд нужно получить список команд и посчитать сумму очков их участников
                const teamsRes = await apiClient.get('/api/v1/teams/teams/');
                const teams = teamsRes.data || [];

                // Группировка очков пользователей по team_id
                const teamScores = {};
                users.forEach(u => {
                    if (u.team_id) {
                        teamScores[u.team_id] = (teamScores[u.team_id] || 0) + (u.score || 0);
                    }
                });

                // Формирование итогового массива команд с очками
                const teamsWithScores = teams.map(t => ({
                    ...t,
                    total_score: teamScores[t.id] || 0
                }));

                // Сортировка команд
                const sortedTeams = teamsWithScores.sort((a, b) => b.total_score - a.total_score);
                setData(sortedTeams);
            }
        } catch (error) {
            console.error("Dashboard fetch error:", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const getRankStyle = (index) => {
        if (index === 0) return 'rank-1';
        if (index === 1) return 'rank-2';
        if (index === 2) return 'rank-3';
        return '';
    };

    return (
        <div className="dashboard-layout">
            <header className="dash-header">
                <h1 className="dash-title">Global Network Analysis</h1>
                <a href="/menu.html" className="btn-home">&lt; MENU</a>
            </header>

            <div className="tabs">
                <button 
                    className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    OPERATORS (Users)
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'teams' ? 'active' : ''}`}
                    onClick={() => setActiveTab('teams')}
                >
                    UNITS (Teams)
                </button>
            </div>

            <div className="table-container">
                {loading ? (
                    <div className="loading">SYNCING DATA STREAMS...</div>
                ) : (
                    <table className="rank-table">
                        <thead>
                            <tr>
                                <th className="rank-col">#</th>
                                <th>{activeTab === 'users' ? 'IDENTITY' : 'UNIT DESIGNATION'}</th>
                                {activeTab === 'teams' && <th>UNIT ID</th>}
                                <th className="score-col">SCORE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length > 0 ? (
                                data.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className={`rank-col ${getRankStyle(index)}`}>
                                            {index + 1}
                                        </td>
                                        <td>
                                            {activeTab === 'users' ? item.username : (item.team_name || item.name)}
                                        </td>
                                        {activeTab === 'teams' && (
                                            <td style={{color: '#666', fontSize: '0.8rem'}}>
                                                {item.id}
                                            </td>
                                        )}
                                        <td className="score-col">
                                            {activeTab === 'users' ? (item.score || 0) : item.total_score}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{textAlign: 'center', padding: 20}}>
                                        NO DATA FOUND
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<DashboardApp />);
}