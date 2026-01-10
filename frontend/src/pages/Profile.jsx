import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/auth';
import api from '../api/axios';

const Profile = () => {
  const navigate = useNavigate();
  const { userId, isAuth } = useAuthStore();
  
  const [user, setUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuth || !userId) {
      navigate('/login');
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await api.get(`/api/v1/users/users/${userId}`);
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch profile', error);
        setStatus({ type: 'error', msg: 'FAILED_TO_LOAD_USER_DATA' });
      }
    };

    fetchUser();
  }, [isAuth, userId, navigate]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword) return;

    setLoading(true);
    setStatus({ type: '', msg: '' });

    try {
      // PUT /api/v1/users/users/new_password
      // Body: { id: int, password: string }
      await api.put('/api/v1/users/users/new_password', {
        id: userId,
        password: newPassword
      });

      setStatus({ type: 'success', msg: 'PASSWORD_UPDATED_SUCCESSFULLY' });
      setNewPassword('');
    } catch (error) {
      console.error('Update failed', error);
      setStatus({ type: 'error', msg: 'UPDATE_FAILED' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-green-500 font-mono">
        LOADING_PROFILE...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-300 font-mono p-8">
      {/* Header with Navigation */}
      <div className="max-w-4xl mx-auto mb-12 border-b border-green-900 pb-4 flex justify-between items-end">
        <h1 className="text-3xl text-white font-bold tracking-tighter">
          OPERATOR_<span className="text-green-600">PROFILE</span>
        </h1>
        <button 
          onClick={() => navigate('/')}
          className="text-xs text-gray-500 hover:text-green-500 uppercase tracking-widest transition-colors"
        >
          [ Return to Main Menu ]
        </button>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Read-only Info */}
        <div className="border border-green-900/50 bg-black p-6 relative">
          <div className="absolute -top-3 left-4 bg-black px-2 text-xs text-green-600 font-bold uppercase">
            Identity Card
          </div>
          
          <div className="space-y-6 mt-4">
            <div>
              <label className="text-[10px] text-gray-600 uppercase tracking-widest block mb-1">
                Unique Identifier (UID)
              </label>
              <div className="text-xl font-mono text-gray-400">
                {user.id || userId}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-600 uppercase tracking-widest block mb-1">
                Codename
              </label>
              <div className="text-2xl font-bold text-white tracking-wide">
                {user.username}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-600 uppercase tracking-widest block mb-1">
                Unit Assignment
              </label>
              <div className="inline-block border border-gray-800 px-3 py-1 text-sm text-green-500">
                {user.team_id ? `SQUADRON_${user.team_id}` : 'UNASSIGNED_MERCENARY'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings */}
        <div className="border border-gray-800 bg-gray-900/20 p-6 relative">
          <div className="absolute -top-3 left-4 bg-gray-950 px-2 text-xs text-gray-500 font-bold uppercase">
            Security Protocols
          </div>

          <form onSubmit={handlePasswordChange} className="mt-4 flex flex-col h-full">
            <div className="flex-grow">
              <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">
                Reset Access Key
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password..."
                className="w-full bg-black border border-gray-700 text-white p-3 focus:outline-none focus:border-green-500 transition-colors text-sm"
              />
              <p className="text-[10px] text-gray-600 mt-2">
                * Action will be logged in security audit.
              </p>
            </div>

            {status.msg && (
              <div className={`mt-4 p-2 text-xs border ${
                status.type === 'success' 
                  ? 'border-green-800 text-green-500 bg-green-900/20' 
                  : 'border-red-800 text-red-500 bg-red-900/20'
              }`}>
                {status.type === 'success' ? '>> SUCCESS: ' : '>> ERROR: '}
                {status.msg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !newPassword}
              className={`w-full mt-6 py-3 text-xs font-bold uppercase tracking-widest border transition-all
                ${loading || !newPassword
                  ? 'bg-gray-800 text-gray-600 border-gray-800 cursor-not-allowed'
                  : 'bg-green-900/10 text-green-500 border-green-700 hover:bg-green-500 hover:text-black'
                }`}
            >
              {loading ? 'ENCRYPTING...' : 'UPDATE_CREDENTIALS'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Profile;