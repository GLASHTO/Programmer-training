import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/auth';

const ManageTeam = () => {
  const navigate = useNavigate();
  const { userId } = useAuthStore();
  const [teamName, setTeamName] = useState('');
  const [myTeam, setMyTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Проверяем, состоит ли пользователь уже в команде
  useEffect(() => {
    const checkUserTeam = async () => {
      try {
        const res = await api.get(`/api/v1/users/users/${userId}`);
        if (res.data.team_id) {
          const teamRes = await api.get(`/api/v1/teams/teams/${res.data.team_id}`);
          setMyTeam(teamRes.data);
        }
      } catch (err) {
        console.error("Error checking team status", err);
      }
    };
    checkUserTeam();
  }, [userId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/v1/teams/teams/', { team_name: teamName });
      setMyTeam(res.data);
      // Автоматически привязываем создателя к команде (если бэкенд не делает это сам)
      await api.put('/api/v1/users/users/to_team', { user_id: parseInt(userId), team_id: res.data.id });
    } catch (err) {
      setError('CREATION_FAILED_NAME_TAKEN');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("CONFIRM_TEAM_DISMANTLE?")) return;
    setLoading(true);
    try {
      await api.delete(`/api/v1/teams/teams/${myTeam.id}`);
      setMyTeam(null);
      setTeamName('');
    } catch (err) {
      setError('DELETE_FAILED_ONLY_LEADER_CAN_REMOVE');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-mono p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-black mb-8 border-b border-slate-800 pb-4 uppercase italic">
          Team_<span className="text-cyan-500">Management</span>
        </h1>

        {myTeam ? (
          /* Интерфейс управления существующей командой */
          <div className="bg-slate-900 border border-emerald-900/30 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 text-[10px] text-emerald-500 bg-emerald-500/10">ACTIVE_UNIT</div>
            <h2 className="text-xs text-slate-500 uppercase mb-2">Current_Unit_Name</h2>
            <div className="text-3xl font-bold text-white mb-8 tracking-tighter">{myTeam.team_name}</div>
            
            <div className="space-y-4">
              <div className="p-4 bg-black/40 border border-slate-800 text-xs text-slate-400">
                Команда активна. Вы можете управлять участниками или распустить юнит.
              </div>
              
              <button
                onClick={handleDelete}
                disabled={loading}
                className="w-full bg-red-900/20 border border-red-900 text-red-500 py-3 text-xs font-bold uppercase hover:bg-red-900/40 transition-all disabled:opacity-50"
              >
                {loading ? 'DISMANTLING...' : 'Dismantle_Team'}
              </button>
            </div>
          </div>
        ) : (
          /* Форма создания новой команды */
          <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 p-8">
            <h2 className="text-emerald-500 text-sm font-bold uppercase mb-6 tracking-widest">// Initiate_New_Unit</h2>
            
            <div className="mb-6">
              <label className="block text-[10px] text-slate-500 uppercase mb-2">Codename</label>
              <input
                type="text"
                required
                className="w-full bg-black/40 border border-slate-800 p-3 text-cyan-400 focus:border-cyan-500 outline-none transition-all"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="ENTER_UNIT_NAME"
              />
            </div>

            {error && <div className="text-red-500 text-[10px] mb-4 uppercase font-bold">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 uppercase tracking-widest transition-all disabled:opacity-50"
            >
              {loading ? 'REGISTERING...' : 'Deploy_Team'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ManageTeam;