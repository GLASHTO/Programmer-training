import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/auth';
import api from '../api/axios';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(location.state?.message || '');

  useEffect(() => {
    // Очистка сообщения через 5 секунд
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // POST /api/v1/auth/login
      // Ожидаем, что сервер вернет { access_token: "...", user_id: 123 }
      // Если структура другая, здесь потребуется адаптация
      const response = await api.post('/api/v1/auth/login', {
        username: formData.username,
        password: formData.password
      });

      const { access_token, user_id } = response.data;

      if (access_token) {
        // Сохраняем в Zustand
        setAuth(access_token, user_id);
        navigate('/');
      } else {
        setError("INVALID_RESPONSE_FORMAT");
      }

    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        setError("ACCESS_DENIED // INVALID CREDENTIALS");
      } else if (err.response && err.response.data && err.response.data.detail) {
        setError(typeof err.response.data.detail === 'string' 
          ? err.response.data.detail 
          : "VALIDATION_ERROR");
      } else {
        setError("SERVER_UNREACHABLE");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono p-4 relative overflow-hidden">
      {/* Background Grid Animation */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      
      <div className="w-full max-w-sm z-10">
        <div className="mb-10 text-center">
          <div className="inline-block border border-green-500/30 px-3 py-1 text-[10px] text-green-500 mb-4 tracking-widest uppercase">
            System Security Layer
          </div>
          <h1 className="text-4xl text-white font-bold tracking-tighter mb-2">
            LOGIN
          </h1>
        </div>

        {message && (
          <div className="mb-6 p-3 border border-green-800 bg-green-900/20 text-green-400 text-xs font-bold text-center animate-pulse">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {error && (
            <div className="p-3 border-l-4 border-red-600 bg-gray-900 text-red-500 text-xs font-bold">
              :: ERROR :: {error}
            </div>
          )}

          <div className="relative group">
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="peer w-full bg-transparent border-b-2 border-gray-800 text-gray-200 p-3 pt-5 focus:outline-none focus:border-green-500 transition-all placeholder-transparent"
              placeholder="Username"
            />
            <label className="absolute left-0 top-0 text-[10px] text-gray-500 uppercase tracking-widest transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-[10px] peer-focus:text-green-500">
              Operator_ID
            </label>
          </div>

          <div className="relative group">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="peer w-full bg-transparent border-b-2 border-gray-800 text-gray-200 p-3 pt-5 focus:outline-none focus:border-green-500 transition-all placeholder-transparent"
              placeholder="Password"
            />
            <label className="absolute left-0 top-0 text-[10px] text-gray-500 uppercase tracking-widest transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-[10px] peer-focus:text-green-500">
              Access_Key
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-[10px] text-gray-500 hover:text-green-500 uppercase tracking-wider transition-colors"
            >
              Lost_Key?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 font-bold text-sm tracking-[0.2em] uppercase border transition-all mt-4
              ${loading 
                ? 'bg-gray-800 text-gray-600 border-gray-700 cursor-wait' 
                : 'bg-green-600 text-black border-green-500 hover:bg-white hover:border-white shadow-[0_0_20px_rgba(0,255,0,0.3)]'
              }`}
          >
            {loading ? 'AUTHENTICATING...' : 'CONNECT'}
          </button>
        </form>

        <div className="mt-12 text-center border-t border-gray-900 pt-6">
          <p className="text-gray-600 text-xs mb-4">NO CREDENTIALS FOUND?</p>
          <button
            onClick={() => navigate('/register')}
            className="text-green-600 text-xs font-bold border border-green-900 px-6 py-2 hover:bg-green-900/30 transition-all uppercase tracking-widest"
          >
            Request Access
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;