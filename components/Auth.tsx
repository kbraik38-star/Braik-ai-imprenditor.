
import React, { useState } from 'react';
import { storageService } from '../services/storage';
import { AuthState, UserProfile } from '../types';

interface AuthProps {
  onAuthenticated: () => void;
}

type AuthView = 'login' | 'register';

const TechLogo = () => (
  <div className="relative w-20 h-20 mx-auto mb-4">
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(79,70,229,0.5)]">
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <path d="M30 20 H55 C65 20 75 25 75 35 C75 42 70 48 60 50 C72 52 80 60 80 70 C80 85 70 90 55 90 H30 V20Z" fill="none" stroke="url(#logoGrad)" strokeWidth="4" />
      <path d="M30 20 V90" stroke="url(#logoGrad)" strokeWidth="6" strokeLinecap="round" />
    </svg>
  </div>
);

const Auth: React.FC<AuthProps> = ({ onAuthenticated }) => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');

  const hashPassword = (pwd: string) => btoa(pwd).split('').reverse().join('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return setError('Compila tutti i campi.');
    
    const db = storageService.getUsersRegistry();
    if (db[email]) return setError('Questa email è già registrata.');

    const profile: UserProfile = {
      email,
      name,
      companyName: company || 'Libero Professionista',
      registrationDate: Date.now(),
      isTrial: false
    };

    const auth: AuthState = {
      isConfigured: true,
      email,
      hashedPassword: hashPassword(password)
    };

    storageService.saveUserToRegistry(email, profile, auth);
    storageService.setActiveUser(email);
    onAuthenticated();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const db = storageService.getUsersRegistry();
    const user = db[email];

    if (!user) return setError('Utente non trovato.');
    if (user.auth.hashedPassword !== hashPassword(password)) return setError('Password errata.');

    storageService.setActiveUser(email);
    onAuthenticated();
  };

  const handleQuickPreview = () => {
    // Crea o recupera un profilo demo
    const guestEmail = 'demo@braik.ai';
    const db = storageService.getUsersRegistry();
    
    if (!db[guestEmail]) {
      const profile: UserProfile = {
        email: guestEmail,
        name: 'Visitatore Demo',
        companyName: 'Braik Preview',
        registrationDate: Date.now(),
        isTrial: true,
        trialStartDate: Date.now()
      };
      const auth: AuthState = { isConfigured: true, email: guestEmail };
      storageService.saveUserToRegistry(guestEmail, profile, auth);
    }

    storageService.setActiveUser(guestEmail);
    onAuthenticated();
  };

  return (
    <div className="fixed inset-0 bg-[#020617] flex items-center justify-center p-6 z-[200]">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-6">
          <TechLogo />
          <h1 className="text-2xl font-black text-white mb-1 tracking-tighter uppercase italic">Braik <span className="text-cyan-400">AI</span></h1>
          <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.3em]">Neural Entrepreneurship</p>
        </div>

        <button 
          onClick={handleQuickPreview} 
          className="w-full bg-cyan-500 text-black font-black py-4 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)] uppercase tracking-widest text-[10px] mb-8 hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 group"
        >
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Sblocca Anteprima Immediata
        </button>

        <div className="relative py-4 mb-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
          <div className="relative flex justify-center text-[8px] uppercase font-bold tracking-widest"><span className="bg-[#0f172a] px-4 text-slate-600">Oppure accedi al tuo Vault</span></div>
        </div>

        {view === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 text-sm" />
            <input type="password" placeholder="Password Master" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 text-sm" />
            <button type="submit" className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 rounded-xl uppercase tracking-widest text-[10px] transition-all">Accedi</button>
            <p className="text-center text-[9px] text-slate-500 uppercase tracking-widest">Nuovo? <button type="button" onClick={() => setView('register')} className="text-cyan-400 font-bold">Crea Account</button></p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <input type="text" placeholder="Nome" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" />
            <button type="submit" className="w-full bg-white text-black font-bold py-3.5 rounded-xl uppercase tracking-widest text-[10px]">Registrati</button>
            <p className="text-center text-[9px] text-slate-500 uppercase tracking-widest">Hai un account? <button type="button" onClick={() => setView('login')} className="text-cyan-400 font-bold">Accedi</button></p>
          </form>
        )}

        {error && <p className="text-red-400 text-[9px] text-center font-bold uppercase mt-4 tracking-widest">{error}</p>}
      </div>
    </div>
  );
};

export default Auth;
