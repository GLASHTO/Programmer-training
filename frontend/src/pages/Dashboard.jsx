import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/auth';
import api from '../api/axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAuth } = useAuthStore();
  
  const [view, setView] = useState('operators'); // 'operators' | 'squadrons'
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuth) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, teamsRes] = await Promise.all([
          api.get('/api/v1/users/users/'),
          api.get('/api/v1/teams/teams/')
        ]);
        setUsers(usersRes.data);
        setTeams(teamsRes.data);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuth, navigate]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-300 font-mono p-8 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-green-900 pb-4 mb-8">
        <div>
          <h1 className="text-3xl text-white font-bold tracking-tighter uppercase">
            Global_<span className="text-green-600">Network</span>
          </h1>
          <div className="text-xs text-gray-500 mt-1">
             DATA_INTERCEPT // SECURE_CONNECTION
          </div>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-xs text-gray-500 hover:text-green-500 px-3 py-1 border border-transparent hover:border-green-900 transition-all"
        >
          [ EXIT_MONITOR ]
        </button>
      </div>

      {/* Controls */}
      <div className="flex mb-6 gap-4">
        <button
          onClick={() => setView('operators')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest border transition-all
            ${view === 'operators' 
              ? 'bg-green-900/20 text-green-500 border-green-600 shadow-[0_0_10px_rgba(0,255,0,0.1)]' 
              : 'bg-black text-gray-600 border-gray-800 hover:text-gray-400'}`}
        >
          Operators_Index ({users.length})
        </button>
        <button
          onClick={() => setView('squadrons')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest border transition-all
            ${view === 'squadrons' 
              ? 'bg-green-900/20 text-green-500 border-green-600 shadow-[0_0_10px_rgba(0,255,0,0.1)]' 
              : 'bg-black text-gray-600 border-gray-800 hover:text-gray-400'}`}
        >
          Squadron_Registry ({teams.length})
        </button>
      </div>

      {/* Data Table Area */}
      <div className="flex-1 border border-gray-800 bg-black relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
            <div className="text-green-500 text-xs animate-pulse">DECRYPTING_DATA_STREAMS...</div>
          </div>
        )}

        <div className="overflow-auto h-full max-h-[70vh]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-900 sticky top-0 z-10">
              <tr>
                <th className="p-4 text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-800 w-16">
                  #ID
                </th>
                <th className="p-4 text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-800">
                  {view === 'operators' ? 'Codename' : 'Unit Designation'}
                </th>
                <th className="p-4 text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-800 text-right">
                  {view === 'operators' ? 'Affiliation' : 'Status'}
                </th>
              </tr>
            </thead>
            <tbody>
              {view === 'operators' ? (
                // Users List
                users.map((user) => (
                  <tr key={user.id} className="group hover:bg-green-900/5 transition-colors border-b border-gray-800/50">
                    <td className="p-4 text-xs font-mono text-gray-600 group-hover:text-green-500">
                      {user.id.toString().padStart(4, '0')}
                    </td>
                    <td className="p-4 text-sm font-bold text-gray-300 group-hover:text-white">
                      {user.username}
                    </td>
                    <td className="p-4 text-xs text-right text-gray-500">
                      {user.team_id ? (
                        <span className="text-green-700 bg-green-900/10 px-2 py-1">UNIT_{user.team_id}</span>
                      ) : (
                        <span className="text-gray-700">ROGUE_AGENT</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                // Teams List
                teams.map((team) => (
                  <tr key={team.id} className="group hover:bg-green-900/5 transition-colors border-b border-gray-800/50">
                    <td className="p-4 text-xs font-mono text-gray-600 group-hover:text-green-500">
                      {team.id.toString().padStart(4, '0')}
                    </td>
                    <td className="p-4 text-sm font-bold text-gray-300 group-hover:text-white">
                      {team.team_name}
                    </td>
                    <td className="p-4 text-xs text-right">
                       <span className="text-green-600 px-2 py-1 border border-green-900/30">ACTIVE</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {/* Empty States */}
          {((view === 'operators' && users.length === 0) || (view === 'squadrons' && teams.length === 0)) && !loading && (
             <div className="p-8 text-center text-gray-600 text-xs border-dashed">NO RECORDS FOUND IN DATABASE</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;