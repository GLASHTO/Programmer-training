import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await api.get('/api/v1/teams/teams/');
        setTeams(res.data);
      } catch (err) {
        console.error("Fetch teams failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  if (loading) return <div className="h-screen bg-slate-950 text-cyan-500 flex items-center justify-center font-mono animate-pulse">SCANNING_GRID_FOR_TEAMS...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-mono p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-black italic uppercase">
            Available_<span className="text-cyan-500">Units</span>
          </h1>
          <button 
            onClick={() => navigate('/teams/create')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-4 py-2 uppercase rounded-sm transition-all"
          >
            + Create_New_Team
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div 
              key={team.id} 
              className="bg-slate-900/50 border border-slate-800 p-6 hover:border-cyan-500/50 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] text-slate-500 uppercase">Team_ID: {team.id}</span>
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_#10b981]"></span>
              </div>
              <h3 className="text-xl font-bold text-white mb-6 truncate">{team.team_name}</h3>
              
              <button 
                onClick={() => navigate(`/teams/${team.id}`)}
                className="w-full border border-slate-700 group-hover:bg-cyan-600 group-hover:text-white group-hover:border-cyan-600 text-slate-400 py-2 text-[10px] uppercase font-bold transition-all"
              >
                Inspect_Unit
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Teams;