import React, { useState } from 'react';
import { LogIn, LoaderCircle } from 'lucide-react';

interface LoginFormProps {
    onLogin: (email: string, password: string) => Promise<any>;
    onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onSwitchToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('Email dan kata sandi tidak boleh kosong.');
            return;
        }
        setIsLoading(true);
        try {
            await onLogin(email, password);
            // On success, App.tsx will handle the navigation.
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan saat login.');
        } finally {
            setIsLoading(false); 
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-center text-white">Login</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                 {error && <p className="text-sm text-center text-red-400 bg-red-500/10 p-2 rounded-md">{error}</p>}
                <div>
                    <label htmlFor="email-login" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                    <input 
                        id="email-login"
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="anda@email.com"
                        required 
                    />
                </div>
                <div>
                    <label htmlFor="password-login" className="block text-sm font-medium text-gray-300 mb-1">Kata Sandi</label>
                    <input 
                        id="password-login"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="••••••••"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? <LoaderCircle className="animate-spin" size={20} /> : <LogIn size={20} />}
                    <span>{isLoading ? 'Memeriksa...' : 'Login'}</span>
                </button>
            </form>
             <p className="text-center text-sm text-gray-400">
                Belum punya akun?{' '}
                <button onClick={onSwitchToRegister} className="font-medium text-teal-400 hover:text-teal-300">
                    Daftar di sini
                </button>
            </p>
        </div>
    );
};

export default LoginForm;