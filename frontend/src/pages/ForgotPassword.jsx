import React from 'react';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center font-mono p-4">
      <div className="w-full max-w-md bg-slate-900 border border-red-900/30 p-8 relative overflow-hidden">
        {/* Анимированный фон сканирования */}
        <div className="absolute top-0 left-0 w-full h-1 bg-red-600/50 shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-scan"></div>
        
        <div className="mb-8 text-center">
          <div className="inline-block p-3 border border-red-600 mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m10-6a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">
            Access_<span className="text-red-600">Lost</span>
          </h2>
          <p className="text-slate-500 text-[10px] mt-2 uppercase tracking-[0.2em]">Security Protocol Override Needed</p>
        </div>

        <div className="space-y-6 text-center">
          <div className="p-4 bg-black/40 border border-slate-800 text-xs text-slate-400 leading-relaxed uppercase">
            Автоматическое восстановление ключа отключено в целях безопасности. 
            <br /><br />
            Для сброса пароля свяжитесь с 
            <span className="text-cyan-500 block mt-1">SYSTEM_ADMIN@10.25.2.4</span>
            предоставив свой <span className="text-white italic">Unique_ID</span>.
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.href = 'mailto:admin@arena.local'}
              className="w-full bg-red-900/20 border border-red-900 text-red-500 font-bold py-3 text-xs uppercase hover:bg-red-900/40 transition-all"
            >
              Contact_Administrator
            </button>
            
            <button
              onClick={() => navigate('/login')}
              className="w-full border border-slate-800 text-slate-500 font-bold py-3 text-xs uppercase hover:text-white transition-all"
            >
              Return_to_Login
            </button>
          </div>
        </div>

        {/* Индикатор прогресса внизу */}
        <div className="mt-8 flex justify-between items-center text-[8px] text-slate-800 font-bold uppercase">
          <span>Error_Code: 403_FORBIDDEN</span>
          <span className="animate-pulse">Waiting_for_input...</span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;