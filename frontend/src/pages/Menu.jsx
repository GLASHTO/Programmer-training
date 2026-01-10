import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/auth';

const Menu = () => {
  const navigate = useNavigate();
  const { userId, logout } = useAuthStore();
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        // Получаем данные конкретно этого пользователя
        const res = await api.get(`/api/v1/users/users/${userId}`);
        setUserStats(res.data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchUserStats();
  }, [userId]);

  const StatCard = ({ label, value, color = "text-cyan-400" }) => (
    <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-sm flex flex-col items-center justify-center min-w-[160px]">
      <span className="text-xs text-slate-500 uppercase tracking-widest mb-2">{label}</span>
      <span className={`text-3xl font-bold font-mono ${color}`}>{value}</span>
    </div>
  );

  if (loading) return <div className="h-screen bg-slate-950 text-cyan-500 flex items-center justify-center font-mono animate-pulse">SYNCHRONIZING_PROFILE...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-mono flex flex-col items-center justify-center p-4">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_#0f172a_0%,_#020617_100%)]"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        {/* Header Section */}
        <div className="flex justify-between items-end mb-12 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
              Code <span className="text-cyan-500">Battle</span> Arena
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-bold tracking-widest uppercase">
              Operator: <span className="text-emerald-500">{userStats?.username || 'GUEST'}</span>
            </p>
          </div>
          <button 
            onClick={() => { logout(); navigate('/login'); }}
            className="text-xs text-red-500 border border-red-900/50 px-3 py-1 hover:bg-red-950 transition-all uppercase"
          >
            Terminate_Session
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <StatCard label="Global_Rank" value="#128" />
          <StatCard label="Score_Points" value={userStats?.score || 0} color="text-emerald-400" />
          <StatCard label="Solved_Tasks" value={userStats?.tasks_completed || 0} color="text-purple-400" />
        </div>

        {/* Action Section */}
        <div className="flex flex-col items-center">
          <button 
            onClick={() => navigate('/game')}
            className="group relative px-12 py-4 bg-cyan-600 text-white font-black text-xl uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)]"
          >
            <span className="relative z-10">Start_Challenge</span>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
          
          <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-md">
            <button 
              onClick={() => navigate('/profile')}
              className="py-2 border border-slate-800 hover:border-slate-600 text-slate-400 text-sm uppercase transition-all"
            >
              Profile_Settings
            </button>
            <button 
              onClick={() => navigate('/leaderboard')}
              className="py-2 border border-slate-800 hover:border-slate-600 text-slate-400 text-sm uppercase transition-all"
            >
              Global_Board
            </button>
          </div>
        </div>
      </div>

      {/* Bottom status line */}
      <div className="fixed bottom-4 left-6 text-[10px] text-slate-700 flex gap-4 uppercase tracking-[0.2em]">
        <span>System: Online</span>
        <span>Latent: 24ms</span>
        <span>v0.1.0-alpha</span>
      </div>
    </div>
  );
};

export default Menu;