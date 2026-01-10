import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Сбрасываем ошибку при вводе
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Простая валидация на клиенте
    if (formData.password !== formData.confirmPassword) {
      setError("PASSWORDS_DO_NOT_MATCH");
      return;
    }

    if (formData.password.length < 4) {
      setError("PASSWORD_TOO_WEAK (MIN 4 CHARS)");
      return;
    }

    setLoading(true);

    try {
      // POST /api/v1/users/users/
      // Отправляем только username и password согласно схеме UserCreate
      await api.post('/api/v1/users/users/', {
        username: formData.username,
        password: formData.password
      });

      // Успешная регистрация -> редирект на логин
      navigate('/login', { state: { message: 'REGISTRATION_COMPLETE. PLEASE LOGIN.' } });
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        // Обработка ошибок валидации от бэкенда
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
            setError(detail.map(e => e.msg).join(' // '));
        } else {
            setError(detail);
        }
      } else {
        setError("CONNECTION_REFUSED_OR_SERVER_ERROR");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono p-4 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-900 via-green-500 to-green-900 opacity-50"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgNDBMMTQwIDBoMSIHN0cm9rZT0icmdiYSgwLCAyNTUsIDAsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')] opacity-20 pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl text-white font-bold tracking-tighter mb-2">
            NEW_OPERATOR_ENTRY
          </h1>
          <p className="text-green-600 text-xs uppercase tracking-widest">
            :: Establish Neural Link ::
          </p>
        </div>

        <form onSubmit={handleSubmit} className="border border-green-900 bg-gray-900/80 p-8 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-sm">
          
          {error && (
            <div className="mb-6 p-3 border border-red-800 bg-red-900/20 text-red-500 text-xs font-bold">
              ERROR: {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="group">
              <label className="block text-green-700 text-xs font-bold mb-2 group-focus-within:text-green-500 transition-colors">
                USERNAME
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full bg-black border-b border-gray-700 text-gray-300 p-2 focus:outline-none focus:border-green-500 focus:text-white transition-all placeholder-gray-800"
                placeholder="enter_identifier..."
              />
            </div>

            <div className="group">
              <label className="block text-green-700 text-xs font-bold mb-2 group-focus-within:text-green-500 transition-colors">
                PASSWORD
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-black border-b border-gray-700 text-gray-300 p-2 focus:outline-none focus:border-green-500 focus:text-white transition-all placeholder-gray-800"
                placeholder="******"
              />
            </div>

            <div className="group">
              <label className="block text-green-700 text-xs font-bold mb-2 group-focus-within:text-green-500 transition-colors">
                CONFIRM_PASSWORD
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full bg-black border-b border-gray-700 text-gray-300 p-2 focus:outline-none focus:border-green-500 focus:text-white transition-all placeholder-gray-800"
                placeholder="******"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-8 py-3 font-bold text-sm tracking-widest uppercase border transition-all
              ${loading 
                ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-wait' 
                : 'bg-green-900/20 text-green-500 border-green-700 hover:bg-green-500 hover:text-black hover:shadow-[0_0_15px_rgba(0,255,0,0.4)]'
              }`}
          >
            {loading ? 'PROCESSING...' : 'INITIALIZE_ACCOUNT'}
          </button>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-xs text-gray-500 hover:text-green-400 underline decoration-gray-700 hover:decoration-green-400 underline-offset-4 transition-all"
            >
              ALREADY_REGISTERED? // ACCESS_TERMINAL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;