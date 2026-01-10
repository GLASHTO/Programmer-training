import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('PASSWORDS_DO_NOT_MATCH');
    }

    setLoading(true);
    try {
      await api.post('/api/v1/users/users/', {
        username: formData.username,
        password: formData.password
      });
      // После успешной регистрации отправляем на вход
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail?.[0]?.msg || 'REGISTRATION_FAILED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center font-mono p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 shadow-2xl relative">
        {/* Декоративный элемент угла */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-500"></div>
        
        <div className="mb-8">
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">
            Create_<span className="text-cyan-500">Account</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">Join the arena, initiate protocol</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs text-slate-500 uppercase mb-2">Username</label>
            <input
              type="text"
              required
              className="w-full bg-slate-950 border border-slate-800 p-3 text-cyan-400 focus:border-cyan-500 outline-none transition-all"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="operator_name"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 uppercase mb-2">Password</label>
            <input
              type="password"
              required
              className="w-full bg-slate-950 border border-slate-800 p-3 text-cyan-400 focus:border-cyan-500 outline-none transition-all"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 uppercase mb-2">Confirm_Password</label>
            <input
              type="password"
              required
              className="w-full bg-slate-950 border border-slate-800 p-3 text-cyan-400 focus:border-cyan-500 outline-none transition-all"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-900 text-red-500 p-3 text-xs uppercase font-bold animate-pulse">
              Error: {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {loading ? 'PROCESSING...' : 'INITIALIZE_USER'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-xs text-slate-600 hover:text-cyan-500 transition-colors uppercase italic">
            Already_registered? Login_here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;