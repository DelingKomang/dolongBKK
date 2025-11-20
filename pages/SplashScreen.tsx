
import React, { useState } from 'react';
import Spinner from '../components/shared/Spinner';
import { Droplets } from 'lucide-react';

interface SplashScreenProps {
  onLogin: () => void;
  isLoading: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onLogin, isLoading }) => {
  const [isRotating, setIsRotating] = useState(false);

  const handleLoginClick = () => {
    setIsRotating(true);
    onLogin();
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-900 via-teal-900 to-gray-800 animate-gradient-slow">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleLoginClick}
          disabled={isLoading}
          className="px-6 py-2 bg-white/10 backdrop-blur-md text-white font-semibold rounded-lg shadow-lg hover:bg-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
        >
          {isLoading ? (
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

        <div className={`transition-transform duration-[3000ms] ease-in-out ${isRotating ? 'animate-[spin_3s_ease-in-out_forwards]' : ''}`}>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Rahajeng Rauh
          </h1>
          <p className="text-lg md:text-2xl text-teal-200 drop-shadow-md">
            Ring Aplikasi Bacol Bigalow
          </p>
        </div>
      </div>
      {isLoading && <Spinner text="Mempersiapkan Dashboard..." />}
    </div>
  );
};

export default SplashScreen;
