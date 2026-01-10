import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tab, setTab] = useState('users'); // 'users' | 'teams'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const [usersRes, teamsRes] = await Promise.all([
          api.get('/api/v1/users/users/'),
          api.get('/api/v1/teams/teams/')
        ]);
        
        // Сортируем пользователей по убыванию счета (score)
        const sortedUsers = (usersRes.data || []).sort((a, b) => b.score - a.score);
        // Сортируем команды (если в API есть score для команд, иначе просто по ID или размеру)
        const sortedTeams = (teamsRes.data || []).sort((a, b) => b.id - a.id);

        setUsers(sortedUsers);
        setTeams(sortedTeams);
      } catch (err) {
        console.error("LEADERBOARD_SYNC_ERROR", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const RankRow = ({ rank, name, score, subtext, highlight = false }) => (
    <div className={`flex items-center p-4 border-b border-slate-800 transition-all ${highlight ? 'bg-cyan-500/5' : 'hover:bg-slate-900/40'}`}>
      <div className="w-12 font-black text-slate-500 italic">
        {rank === 0 && <span className="text-yellow-500">01</span>}
        {rank === 1 && <span className="text-slate-300">02</span>}
        {rank === 2 && <span className="text-orange-600">03</span>}
        {rank > 2 && rank + 1}
      </div>
      <div className="flex-1">
        <div className="text-white font-bold tracking-tight uppercase">{name}</div>
        <div className="text-[10px] text-slate-500 uppercase">{subtext}</div>
      </div>
      <div className="text-right">
        <div className="text-cyan-400 font-black font-mono">{score}</div>
        <div className="text-[8px] text-slate-600 uppercase">Points</div>
      </div>
    </div>
  );

  if (loading) return <div className="h-screen bg-slate-950 text-cyan-500 flex items-center justify-center font-mono">CALCULATING_GLOBAL_RANKINGS...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-mono p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">
              Global_<span className="text-cyan-500">Leaderboard</span>
            </h1>
            <p className="text-slate-500 text-xs mt-2 uppercase tracking-[0.3em]">Operational Standings & Network Power</p>
          </div>

          <div className="flex bg-slate-900 p-1 border border-slate-800">
            <button 
              onClick={() => setTab('users')}
              className={`px-6 py-2 text-[10px] font-black uppercase transition-all ${tab === 'users' ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-white'}`}
            >
              Top_Operators
            </button>
            <button 
              onClick={() => setTab('teams')}
              className={`px-6 py-2 text-[10px] font-black uppercase transition-all ${tab === 'teams' ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-white'}`}
            >
              Active_Units
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-sm">
          {/* Table Head */}
          <div className="flex items-center p-4 bg-slate-900 text-[10px] text-slate-500 uppercase font-bold tracking-widest border-b border-slate-800">
            <div className="w-12">Rank</div>
            <div className="flex-1">Identity</div>
            <div className="text-right">Statistics</div>
          </div>

          {/* Table Body */}
          <div className="flex flex-col">
            {tab === 'users' ? (
              users.length > 0 ? (
                users.map((u, idx) => (
                  <RankRow 
                    key={u.id}
                    rank={idx}
                    name={u.username}
                    score={u.score || 0}
                    subtext={u.team_id ? `Unit_Attached: ${u.team_id}` : 'Freelance_Operator'}
                  />
                ))
              ) : <div className="p-8 text-center text-slate-700 uppercase">No_Operator_Data_Found</div>
            ) : (
              teams.length > 0 ? (
                teams.map((t, idx) => (
                  <RankRow 
                    key={t.id}
                    rank={idx}
                    name={t.team_name}
                    score={t.id * 10} // Пример, если в API нет score команд
                    subtext={`Unit_ID: ${t.id} | Status: Online`}
                  />
                ))
              ) : <div className="p-8 text-center text-slate-700 uppercase">No_Units_Active_In_Grid</div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-[9px] text-slate-700 flex justify-between uppercase">
          <span>Data_Refresh: Realtime</span>
          <span>Last_Sync: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;