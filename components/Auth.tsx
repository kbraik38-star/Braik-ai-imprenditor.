
import React, { useState } from 'react';
import { storageService } from '../services/storage';
import { AuthState, UserProfile } from '../types';

interface AuthProps {
  onAuthenticated: () => void;
}

type AuthView = 'login' | 'register' | 'trial_expired';

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
    
    const trial = storageService.checkTrialStatus();
    if (!trial.isValid) {
      setView('trial_expired');
      return;
    }

    onAuthenticated();
  };

  const handleTrialEntry = () => {
    const trialEmail = `trial_${Date.now()}@braik.temp`;
    const profile: UserProfile = {
      email: trialEmail,
      name: 'Utente Prova',
      companyName: 'Azienda Demo',
      registrationDate: Date.now(),
      isTrial: true,
      trialStartDate: Date.now()
    };
    const auth: AuthState = { isConfigured: true, email: trialEmail };

    storageService.saveUserToRegistry(trialEmail, profile, auth);
    storageService.setActiveUser(trialEmail);
    onAuthenticated();
  };

  if (view === 'trial_expired') {
    return (
      <div className="fixed inset-0 bg-[#020617] flex items-center justify-center p-6 z-[200]">
        <div className="w-full max-w-md bg-slate-900 border border-red-500/20 rounded-[2rem] p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
             <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-2xl font-black text-white uppercase italic">Prova Scaduta</h2>
          <p className="text-slate-400 text-sm">I tuoi 7 giorni di prova sono terminati. Passa alla versione Full per continuare a gestire la tua azienda con Braik AI.</p>
          <button onClick={() => setView('login')} className="w-full bg-white text-black py-4 rounded-xl font-bold uppercase tracking-widest text-xs">Torna al Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#020617] flex items-center justify-center p-6 z-[200]">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-8 lg:p-10 shadow-2xl">
        <div className="text-center mb-6">
          <TechLogo />
          <h1 className="text-2xl font-black text-white mb-1 tracking-tighter uppercase italic">Braik <span className="text-cyan-400">AI</span></h1>
          <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.3em]">Neural Entrepreneurship</p>
        </div>

        {view === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500" />
            <input type="password" placeholder="Password Master" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500" />
            <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-black py-4 rounded-xl shadow-lg uppercase tracking-widest text-xs">Accedi al Vault</button>
            <p className="text-center text-[10px] text-slate-500">Non hai un account? <button type="button" onClick={() => setView('register')} className="text-cyan-400 font-bold">Registrati ora</button></p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <input type="text" placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
            <input type="text" placeholder="Nome Azienda (opzionale)" value={company} onChange={e => setCompany(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
            <input type="password" placeholder="Scegli Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
            <button type="submit" className="w-full bg-white text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs">Crea Account</button>
            <p className="text-center text-[10px] text-slate-500">Hai già un account? <button type="button" onClick={() => setView('login')} className="text-cyan-400 font-bold">Accedi</button></p>
          </form>
        )}

        <div className="relative py-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
          <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-widest"><span className="bg-slate-900 px-4 text-slate-600">Nuovo su Braik?</span></div>
        </div>

        <button onClick={handleTrialEntry} className="w-full border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/10 font-bold py-4 rounded-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2">
          Prova Gratuita (7 Giorni)
        </button>

        {error && <p className="text-red-400 text-[10px] text-center font-bold uppercase mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default Auth;
