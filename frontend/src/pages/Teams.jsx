import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/auth';
import api from '../api/axios';

const Teams = () => {
  const navigate = useNavigate();
  const { userId, isAuth } = useAuthStore();
  
  const [teams, setTeams] = useState([]);
  const [userTeamId, setUserTeamId] = useState(null);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  // -- Data Fetching --
  const fetchData = async () => {
    try {
      const [teamsRes, userRes] = await Promise.all([
        api.get('/api/v1/teams/teams/'),
        api.get(`/api/v1/users/users/${userId}`)
      ]);
      
      setTeams(teamsRes.data);
      setUserTeamId(userRes.data.team_id);
    } catch (err) {
      console.error('Data sync failed', err);
      setError('SYNC_FAILURE');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuth) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [isAuth, userId, navigate]);

  // -- Handlers --

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setActionLoading(true);
    setError(null);

    try {
      await api.post('/api/v1/teams/teams/', {
        team_name: newTeamName
      });
      setNewTeamName('');
      setShowCreateModal(false);
      await fetchData();
    } catch (err) {
      console.error(err);
      setError('CREATION_FAILED: ' + (err.response?.data?.detail || 'Unknown Error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('CONFIRM DISBANDMENT? This action cannot be undone.')) return;

    setActionLoading(true);
    setError(null);

    try {
      await api.delete(`/api/v1/teams/teams/${teamId}`);
      if (userTeamId === teamId) {
        setUserTeamId(null);
      }
      await fetchData();
    } catch (err) {
      console.error(err);
      setError('DISBAND_FAILED: ' + (err.response?.data?.detail || 'Permission Denied'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinTeam = async (teamId) => {
    setActionLoading(true);
    setError(null);

    try {
      // PUT /api/v1/users/users/to_team
      // Body: { user_id: int, team_id: int }
      await api.put('/api/v1/users/users/to_team', {
        user_id: userId,
        team_id: teamId
      });

      await fetchData(); // Обновляем состояние, чтобы отобразить "Current_Unit"
    } catch (err) {
      console.error(err);
      setError('JOIN_FAILED: ' + (err.response?.data?.detail || 'Operation Rejected'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-300 font-mono p-8 relative">
      
      {/* -- Header -- */}
      <div className="flex justify-between items-end border-b border-green-900 pb-4 mb-8">
        <div>
          <h1 className="text-3xl text-white font-bold tracking-tighter uppercase">
            Squadron_<span className="text-green-600">Registry</span>
          </h1>
          <div className="text-xs text-gray-500 mt-1">
            STATUS: {userTeamId ? 'DEPLOYED' : 'AWAITING ASSIGNMENT'}
          </div>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-xs text-gray-500 hover:text-green-500 px-3 py-1 border border-transparent hover:border-green-900 transition-all"
        >
          [ BACK ]
        </button>
      </div>

      {/* -- Error Banner -- */}
      {error && (
        <div className="bg-red-900/20 border border-red-900 text-red-500 p-3 mb-6 text-sm font-bold flex justify-between items-center">
          <span>:: SYSTEM ERROR :: {error}</span>
          <button onClick={() => setError(null)} className="text-white hover:text-red-300">X</button>
        </div>
      )}

      {/* -- Main Grid -- */}
      {loading ? (
        <div className="text-green-600 animate-pulse">LOADING_DATA_STREAMS...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* 1. Create Button (Only if not in team) */}
          {!userTeamId && (
            <button 
              onClick={() => setShowCreateModal(true)}
              disabled={actionLoading}
              className="group border border-green-900/30 bg-green-900/5 p-6 flex flex-col justify-center items-center text-center hover:bg-green-900/10 hover:border-green-500 transition-all cursor-pointer min-h-[220px] border-dashed"
            >
              <div className="text-5xl text-green-800 group-hover:text-green-500 mb-4 transition-colors font-light">+</div>
              <div className="text-green-600 font-bold tracking-widest text-sm group-hover:text-green-400">
                INITIALIZE_NEW_UNIT
              </div>
            </button>
          )}

          {/* 2. Team Cards */}
          {teams.map((team) => {
             const isMyTeam = userTeamId === team.id;
             
             return (
              <div 
                key={team.id}
                className={`relative border p-6 flex flex-col justify-between transition-all duration-300 min-h-[220px]
                  ${isMyTeam 
                    ? 'border-green-500 bg-green-900/10 shadow-[0_0_20px_rgba(0,255,0,0.15)]' 
                    : 'border-gray-800 bg-black hover:border-gray-600'
                  }`}
              >
                {isMyTeam && (
                  <div className="absolute top-0 right-0 bg-green-600 text-black text-[10px] font-bold px-2 py-1 uppercase">
                    Commanding / Member
                  </div>
                )}

                <div>
                  <div className="text-[10px] text-gray-500 mb-2 uppercase tracking-widest font-bold">
                    ID_Ref: #{team.id}
                  </div>
                  <h3 className={`text-xl font-bold tracking-wide break-all ${isMyTeam ? 'text-white' : 'text-gray-300'}`}>
                    {team.team_name}
                  </h3>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-800/50">
                  {isMyTeam ? (
                    <div className="flex gap-2">
                       <button 
                        onClick={() => handleDeleteTeam(team.id)}
                        disabled={actionLoading}
                        className="w-full py-2 text-[10px] font-bold text-red-500 border border-red-900/30 hover:bg-red-900/20 hover:border-red-600 transition-all uppercase tracking-widest"
                       >
                         {actionLoading ? '...' : 'DISBAND_UNIT'}
                       </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleJoinTeam(team.id)}
                      disabled={!!userTeamId || actionLoading} 
                      className={`w-full py-2 text-[10px] font-bold uppercase tracking-widest border transition-all
                        ${userTeamId 
                          ? 'border-gray-800 text-gray-700 cursor-not-allowed'
                          : 'border-gray-600 text-green-500 hover:bg-green-500 hover:text-black hover:border-green-500'
                        }`}
                    >
                      {actionLoading ? 'PROCESSING...' : (userTeamId ? 'UNAVAILABLE' : 'JOIN UNIT')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* -- Create Team Modal -- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-green-500 w-full max-w-md p-8 shadow-[0_0_50px_rgba(0,255,0,0.1)] relative">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-white p-2"
            >
              ✕
            </button>

            <h2 className="text-xl text-green-500 font-bold mb-6 uppercase tracking-wider border-b border-gray-800 pb-2">
              Unit Registration
            </h2>
            
            <form onSubmit={handleCreateTeam}>
              <div className="mb-6">
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-2">
                  Designation (Team Name)
                </label>
                <input 
                  autoFocus
                  type="text" 
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full bg-black border border-gray-700 text-white p-3 focus:outline-none focus:border-green-500 transition-all"
                  placeholder="Enter name..."
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs text-gray-500 hover:text-white uppercase tracking-widest px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-green-600 text-black px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-green-500 transition-all"
                >
                  {actionLoading ? 'PROCESSING...' : 'CONFIRM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;