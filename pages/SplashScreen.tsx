
import React, { useState, useEffect } from 'react';
import Spinner from '../components/shared/Spinner';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import { Droplets, ArrowLeft } from 'lucide-react';

interface SplashScreenProps {
  onLogin: (email: string, password: string) => Promise<any>;
  onRegister: (email: string, password: string) => Promise<any>;
  isLoading: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onLogin, onRegister, isLoading }) => {
  const [authView, setAuthView] = useState<'welcome' | 'login' | 'register'>('welcome');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    let transitionTimeout: ReturnType<typeof setTimeout>;

    if (isAnimating) {
      // Transition to the next page after the animation completes (3 seconds)
      transitionTimeout = setTimeout(() => {
        setAuthView('login');
        setIsAnimating(false);
      }, 3000);
    }
    
    return () => {
      clearTimeout(transitionTimeout);
    };
  }, [isAnimating]);

  const handleStartAnimation = () => {
    setIsAnimating(true);
  };

  if (isLoading) {
      return (
        <div className="relative flex flex-col items-center justify-center h-screen w-screen bg-gray-900">
             <Spinner text="Mempersiapkan Dashboard..." />
        </div>
      );
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-900 via-teal-900 to-gray-800 animate-gradient-slow">
      
      <style>{`
        @keyframes spin-clockwise {
            0% { 
                transform: scale(1) rotate(0deg); 
                opacity: 1; 
            }
            100% { 
                transform: scale(0) rotate(360deg); 
                opacity: 0; 
            }
        }
        .animate-spin-clockwise {
            animation: spin-clockwise 3s ease-in-out forwards;
        }
      `}</style>

      {/* Back Button for Forms */}
      {authView !== 'welcome' && (
         <button 
            onClick={() => setAuthView('welcome')} 
            className="absolute top-4 left-4 text-white/70 hover:text-white flex items-center gap-2 z-20 transition-colors bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm"
         >
            <ArrowLeft size={18} /> 
            <span className="text-sm font-medium">Kembali</span>
         </button>
      )}

      {authView === 'welcome' && (
        <>
            <div className="absolute top-4 right-4 z-20">
                <button
                onClick={handleStartAnimation}
                disabled={isAnimating}
                className="px-6 py-2 bg-white/10 backdrop-blur-md text-white font-semibold rounded-lg shadow-lg hover:bg-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                >
                {isAnimating ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                    'Log In'
                )}
                </button>
            </div>

            <div className="text-center z-10 flex flex-col items-center">
                <div className="p-5 bg-black/20 rounded-full mb-8 backdrop-blur-sm shadow-2xl">
                    <Droplets size={80} className="text-teal-300 drop-shadow-[0_0_15px_rgba(56,189,179,0.7)]" />
                </div>

                <div className={`${isAnimating ? 'animate-spin-clockwise' : ''}`}>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                        Rahajeng Rauh
                    </h1>
                    <p className="text-lg md:text-2xl text-teal-200 drop-shadow-md">
                        Ring Aplikasi Bacol Bigalow
                    </p>
                </div>
            </div>
            {isAnimating && <Spinner text="Mempersiapkan Log In..." />}
        </>
      )}

      {/* LOGIN VIEW */}
      {authView === 'login' && (
          <div className="z-10 w-full max-w-md p-4">
             <div className="bg-gray-900/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-gray-700/50 animate-fade-in-up">
                <div className="flex justify-center mb-6">
                    <Droplets size={40} className="text-teal-400" />
                </div>
                <LoginForm onLogin={onLogin} onSwitchToRegister={() => setAuthView('register')} />
             </div>
          </div>
      )}

       {/* REGISTER VIEW */}
       {authView === 'register' && (
          <div className="z-10 w-full max-w-md p-4">
             <div className="bg-gray-900/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-gray-700/50 animate-fade-in-up">
                <div className="flex justify-center mb-6">
                    <Droplets size={40} className="text-teal-400" />
                </div>
                <RegisterForm onRegister={onRegister} onSwitchToLogin={() => setAuthView('login')} />
             </div>
          </div>
       )}
    </div>
  );
};

export default SplashScreen;
