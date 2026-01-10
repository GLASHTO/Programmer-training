import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('input'); // input, processing, result

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setStep('processing');

    // Симуляция сетевого запроса, так как реального API для сброса нет
    setTimeout(() => {
      setLoading(false);
      setStep('result');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono p-4 text-gray-300">
      <div className="w-full max-w-md border border-red-900/30 p-8 bg-gray-900/50 relative overflow-hidden">
        
        {/* Декоративный элемент "Alert" */}
        <div className="absolute top-0 left-0 w-full h-1 bg-red-900 animate-pulse"></div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white uppercase tracking-widest mb-1">
            <span className="text-red-600">CRITICAL</span>_ERROR
          </h1>
          <div className="text-xs text-red-500 font-bold uppercase">
            :: ACCESS_KEY_LOSS_DETECTED ::
          </div>
        </div>

        {step === 'input' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <p className="text-sm text-gray-500">
              Please enter your Operator ID (Username) to initiate the recovery protocol sequence.
            </p>

            <div className="group">
              <label className="block text-[10px] text-red-700 font-bold mb-2 uppercase group-focus-within:text-red-500">
                Target Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-black border border-gray-700 text-white p-3 focus:outline-none focus:border-red-600 transition-colors"
                placeholder="identify_self..."
              />
            </div>

            <div className="flex gap-4 mt-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex-1 py-3 text-xs text-gray-500 border border-gray-800 hover:text-white hover:border-gray-600 transition-all uppercase"
              >
                Abort
              </button>
              <button
                type="submit"
                className="flex-1 py-3 text-xs font-bold text-red-500 border border-red-900/50 bg-red-950/20 hover:bg-red-900/40 hover:border-red-500 hover:text-red-400 transition-all uppercase tracking-widest"
              >
                Initiate
              </button>
            </div>
          </form>
        )}

        {step === 'processing' && (
          <div className="text-center py-10">
            <div className="inline-block w-12 h-12 border-2 border-t-red-600 border-r-red-600 border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
            <div className="text-red-500 text-xs tracking-widest animate-pulse">
              SEARCHING_DATABASE...
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="space-y-4">
            <div className="border border-red-600/50 bg-red-900/10 p-4 text-center">
              <div className="text-red-500 font-bold text-lg mb-2">AUTOMATED RECOVERY FAILED</div>
              <p className="text-xs text-gray-400 leading-relaxed text-justify">
                Protocol 404: Automated biometric verification systems are currently offline or the requested Operator ID lacks sufficient clearance for self-service recovery.
              </p>
            </div>
            
            <div className="text-center pt-4">
              <p className="text-xs text-gray-500 mb-4">
                REQUIRED ACTION:
              </p>
              <div className="text-white border border-gray-700 p-2 mb-6">
                 CONTACT_SYSADMIN_MANUALLY
              </div>
              
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 text-xs text-white border border-gray-600 hover:bg-gray-800 transition-all uppercase"
              >
                Return to Login Gate
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;