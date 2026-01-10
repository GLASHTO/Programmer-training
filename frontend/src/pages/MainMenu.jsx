import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/auth';
import api from '../api/axios';

const MainMenu = () => {
  const navigate = useNavigate();
  const { userId, isAuth, logout } = useAuthStore();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Проверка авторизации и загрузка данных
  useEffect(() => {
    if (!isAuth) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        // GET запрос по ID пользователя
        const response = await api.get(`/api/v1/users/users/${userId}`);
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user data', error);
        // Если ошибка 401/403, можно разлогинить
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            logout();
            navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isAuth, userId, navigate, logout]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { label: 'INITIATE_BATTLE', path: '/game', description: 'Start a new coding challenge', active: true },
    { label: 'OPERATOR_PROFILE', path: '/profile', description: 'Configure account settings', active: false }, // Временно false пока нет страницы
    { label: 'SQUADRONS', path: '/teams', description: 'Manage team affiliations', active: false },
    { label: 'GLOBAL_NETWORK', path: '/dashboard', description: 'View leaderboards', active: false },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-300 font-mono p-8 flex flex-col">
      {/* Top Bar */}
      <div className="flex justify-between items-end border-b-2 border-green-900 pb-4 mb-12">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tighter">
            <span className="text-green-600">CODE</span>_BATTLE_ARENA
          </h1>
          <div className="text-xs text-green-800 mt-1">v.0.1.0 // SYSTEM ONLINE</div>
        </div>
        <div className="text-right">
            <div className="text-sm text-gray-500">CURRENT_USER:</div>
            <div className="text-xl text-green-500 font-bold">
                {loading ? 'LOADING...' : user?.username || `USER_${userId}`}
            </div>
        </div>
      </div>

      <div className="flex flex-1 gap-8">
        {/* Left Column: Navigation */}
        <div className="w-full md:w-2/3 grid grid-cols-1 gap-4 content-start">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className="group relative border border-gray-800 bg-gray-900/50 p-6 text-left hover:border-green-500 hover:bg-green-900/10 transition-all duration-300"
            >
              <div className="absolute top-2 right-2 text-xs text-gray-700 group-hover:text-green-500">
                0{index + 1}
              </div>
              <div className="text-2xl font-bold text-gray-200 group-hover:text-green-400 mb-2 tracking-wider">
                {item.label}
              </div>
              <div className="text-sm text-gray-500 group-hover:text-gray-400">
                {item.description}
              </div>
            </button>
          ))}
          
          <button
            onClick={handleLogout}
            className="mt-8 border border-red-900/50 bg-red-950/10 p-4 text-center text-red-500 hover:bg-red-900/20 hover:border-red-500 transition-all uppercase tracking-widest text-sm"
          >
            Terminate Session
          </button>
        </div>

        {/* Right Column: Statistics Panel */}
        <div className="hidden md:flex w-1/3 flex-col gap-4">
            <div className="border border-green-900 bg-black p-6 h-full shadow-[0_0_20px_rgba(0,255,0,0.05)]">
                <h2 className="text-green-600 font-bold border-b border-gray-800 pb-2 mb-4 text-sm">
                    :: STATISTICS_MODULE ::
                </h2>
                
                {loading ? (
                    <div className="animate-pulse text-green-900">FETCHING DATA...</div>
                ) : (
                    <div className="flex flex-col gap-6">
                        <div>
                            <div className="text-xs text-gray-500 mb-1">RANKING</div>
                            <div className="text-3xl font-bold text-white">N/A</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 mb-1">TEAM_AFFILIATION</div>
                            {/* Показываем ID команды или заглушку, т.к. в базовом объекте User поля может не быть явно без populate */}
                            <div className="text-xl text-gray-300">
                                {user?.team_id ? `SQUAD_${user.team_id}` : 'NO_AFFILIATION'}
                            </div>
                        </div>
                        
                        <div className="mt-auto border-t border-gray-800 pt-4">
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-gray-500">SYSTEM STATUS</span>
                                <span className="text-green-500">OPTIMAL</span>
                            </div>
                            <div className="w-full bg-gray-900 h-1">
                                <div className="bg-green-600 h-1 w-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;