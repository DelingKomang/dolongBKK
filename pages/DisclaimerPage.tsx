
import React from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';

interface DisclaimerPageProps {
  onContinue: () => void;
}

const DisclaimerPage: React.FC<DisclaimerPageProps> = ({ onContinue }) => {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-gray-900 text-gray-100 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-8 max-w-2xl w-full text-center animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-teal-500/10 rounded-full border-2 border-teal-500/20">
            <ShieldCheck className="h-12 w-12 text-teal-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Pemberitahuan</h1>
        <p className="text-gray-300 mb-4 leading-relaxed text-lg">
          Aplikasi ini adalah aplikasi simulasi data keuangan, bukan dengan data riil. Apabila ada nama ataupun gelar yang sama di aplikasi ini bukanlah kesengajaan.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          Terima Kasih. Selamat menggunakan aplikasi ini untuk latihan dan simulasi data keuangan.
        </p>
        <button
          onClick={onContinue}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-teal-500/40"
        >
          <span>Saya Mengerti & Lanjutkan</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default DisclaimerPage;