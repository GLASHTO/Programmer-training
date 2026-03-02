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
            // Теперь мы просто дергаем нужный эндпоинт в зависимости от вкладки
            const endpoint = activeTab === 'users' 
                ? '/api/v1/leaderboard/leaderboard/users' 
                : '/api/v1/leaderboard/leaderboard/teams';

            const response = await apiClient.get(endpoint);
            // Бэкенд уже все посчитал и отсортировал, просто кладем в стейт
            setData(response.data || []);
            
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
                                {/* Бонус: теперь мы можем показывать команду прямо в таблице игроков */}
                                {activeTab === 'users' && <th>UNIT</th>}
                                <th className="score-col">SCORE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length > 0 ? (
                                data.map((item, index) => (
                                    // В качестве ключа используем username или team_name, так как id мы из бэка не передаем
                                    <tr key={activeTab === 'users' ? item.username : item.team_name}>
                                        <td className={`rank-col ${getRankStyle(index)}`}>
                                            {item.rank}
                                        </td>
                                        <td>
                                            {activeTab === 'users' ? item.username : item.team_name}
                                        </td>
                                        
                                        {activeTab === 'users' && (
                                            <td style={{color: '#666', fontSize: '0.8rem'}}>
                                                {item.team_name || 'Solo'}
                                            </td>
                                        )}

                                        <td className="score-col">
                                            {item.score}
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