import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/auth';

const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Согласно OpenAPI запрос принимает UserLogin (json)
      const res = await api.post('/api/v1/auth/login', {
        username: formData.username,
        password: formData.password
      });

      // Сохраняем данные в стор (token и user_id приходят из вашего FastAPI login)
      setAuth(res.data.access_token, res.data.user_id);
      
      // Перенаправляем в главное меню
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.detail || 'ACCESS_DENIED';
      setError(typeof msg === 'string' ? msg : 'INVALID_CREDENTIALS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center font-mono p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* Декоративная линия сверху */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-right from-transparent via-cyan-500 to-transparent"></div>
        
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
            User_<span className="text-cyan-500">Auth</span>
          </h2>
          <div className="text-[10px] text-slate-500 mt-2 tracking-[0.3em] uppercase">Secure Terminal Connection</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="group">
            <label className="block text-[10px] text-slate-500 uppercase mb-2 group-focus-within:text-cyan-500 transition-colors">
              Ident_Name
            </label>
            <input
              type="text"
              required
              className="w-full bg-black/40 border border-slate-800 p-3 text-cyan-400 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-800"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="ROOT_USER"
            />
          </div>

          <div className="group">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] text-slate-500 uppercase group-focus-within:text-cyan-500 transition-colors">
                Access_Key
              </label>
              <Link to="/forgot-password" size="sm" className="text-[10px] text-slate-600 hover:text-cyan-500 transition-colors uppercase">
                Reset_Key?
              </Link>
            </div>
            <input
              type="password"
              required
              className="w-full bg-black/40 border border-slate-800 p-3 text-cyan-400 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-800"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="********"
            />
          </div>

          {error && (
            <div className="border-l-2 border-red-600 bg-red-900/10 p-3 text-red-500 text-[11px] uppercase font-bold animate-pulse">
              System_Error: {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-black py-4 uppercase tracking-widest hover:bg-cyan-500 hover:text-white transition-all disabled:opacity-30"
          >
            {loading ? 'AUTHENTICATING...' : 'ESTABLISH_LINK'}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-2">
          <span className="text-[10px] text-slate-700 uppercase">No Account?</span>
          <Link to="/register" className="text-xs text-cyan-500 hover:text-white transition-colors uppercase font-bold tracking-tighter">
            [ Create_New_Identity ]
          </Link>
        </div>
      </div>
      
      {/* Background glitch effect helper */}
      <div className="fixed bottom-0 right-0 p-4 text-[8px] text-slate-800 uppercase pointer-events-none">
        Encryption: AES-256-GCM | Node: 10.25.2.4
      </div>
    </div>
  );
};

export default Login;