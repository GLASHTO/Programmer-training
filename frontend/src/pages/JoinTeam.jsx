import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/auth';

const JoinTeam = () => {
  const navigate = useNavigate();
  const { userId } = useAuthStore();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTeams = await api.get('/api/v1/teams/teams/');
    setTeams(fetchTeams.data);
  }, []);

  const handleJoin = async (teamId) => {
    setLoading(true);
    try {
      await api.put('/api/v1/users/users/to_team', {
        user_id: parseInt(userId),
        team_id: teamId
      });
      navigate('/profile');
    } catch (err) {
      alert("FAILED_TO_JOIN_TEAM");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-mono p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black mb-8 border-b border-slate-800 pb-4 uppercase italic">
          Select_<span className="text-cyan-500">Unit</span>
        </h1>
        <div className="grid gap-4">
          {teams.map(team => (
            <div key={team.id} className="bg-slate-900 border border-slate-800 p-4 flex justify-between items-center group hover:border-cyan-500 transition-all">
              <div>
                <div className="text-xs text-slate-500 uppercase">Unit_ID: {team.id}</div>
                <div className="text-xl font-bold">{team.team_name}</div>
              </div>
              <button
                onClick={() => handleJoin(team.id)}
                disabled={loading}
                className="bg-slate-800 hover:bg-emerald-600 text-white px-6 py-2 text-[10px] font-bold uppercase transition-all disabled:opacity-50"
              >
                Join_Contract
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JoinTeam;