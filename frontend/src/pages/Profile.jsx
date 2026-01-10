import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuthStore } from '../store/auth';

const Profile = () => {
  const { userId } = useAuthStore();
  const [user, setUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/api/v1/users/users/${userId}`);
        setUser(res.data);
      } catch (err) {
        console.error("Fetch profile error", err);
      }
    };
    if (userId) fetchProfile();
  }, [userId]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Согласно OpenAPI: { id: int, password: str }
      await api.put('/api/v1/users/users/new_password', {
        id: parseInt(userId),
        password: newPassword
      });
      setMessage({ type: 'success', text: 'PASSWORD_UPDATED_SUCCESSFULLY' });
      setNewPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: 'UPDATE_FAILED' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="h-screen bg-slate-950 text-cyan-500 flex items-center justify-center font-mono">LOADING_PROFILE_DATA...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-mono p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black mb-8 border-b border-slate-800 pb-4 italic uppercase">
          User_<span className="text-cyan-500">Settings</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Информация о пользователе */}
          <div className="space-y-6">
            <h2 className="text-emerald-500 text-sm font-bold uppercase tracking-widest">// Identity_Specs</h2>
            
            <div className="bg-slate-900/50 border border-slate-800 p-6 space-y-4">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block mb-1">Unique_ID</span>
                <span className="text-cyan-400 font-bold"># {user.id}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block mb-1">Username</span>
                <span className="text-white text-xl">{user.username}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block mb-1">Assigned_Team</span>
                <span className="text-emerald-400">{user.team_id ? `TEAM_${user.team_id}` : 'UNASSIGNED'}</span>
              </div>
            </div>
          </div>

          {/* Смена пароля */}
          <div className="space-y-6">
            <h2 className="text-emerald-500 text-sm font-bold uppercase tracking-widest">// Security_Protocol</h2>
            
            <form onSubmit={handlePasswordChange} className="bg-slate-900/50 border border-slate-800 p-6 space-y-4">
              <div>
                <label className="text-slate-500 text-[10px] uppercase block mb-2">New_Access_Key</label>
                <input
                  type="password"
                  required
                  className="w-full bg-slate-950 border border-slate-800 p-2 text-cyan-400 focus:border-cyan-500 outline-none transition-all"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="NEW_PASSWORD"
                />
              </div>

              {message.text && (
                <div className={`text-[10px] p-2 uppercase font-bold border ${
                  message.type === 'success' ? 'border-emerald-900 text-emerald-500' : 'border-red-900 text-red-500'
                }`}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-800 hover:bg-cyan-600 text-white py-2 text-xs uppercase tracking-widest transition-all font-bold"
              >
                {loading ? 'REWRITING...' : 'UPDATE_SECURITY_KEY'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;