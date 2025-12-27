
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { AuthState } from '../types';

interface AuthProps {
  onAuthenticated: () => void;
}

type AuthView = 'login' | 'setup_init' | 'setup_verify';

const Auth: React.FC<AuthProps> = ({ onAuthenticated }) => {
  const [authState, setAuthState] = useState<AuthState>(storageService.getAuthState());
  const [view, setView] = useState<AuthView>(authState.isConfigured ? 'login' : 'setup_init');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Codice di test per la simulazione
  const MOCK_CODE = "123456";

  useEffect(() => {
    let timer: number;
    if (resendTimer > 0) {
      timer = window.setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const hashPassword = (pwd: string) => {
    return btoa(pwd).split('').reverse().join('');
  };

  const handleSetupInit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('La password deve contenere almeno 8 caratteri.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Le password non corrispondono.');
      return;
    }
    
    setIsLoading(true);
    // Simula l'invio dell'email
    setTimeout(() => {
      setIsLoading(false);
      setView('setup_verify');
      setResendTimer(30);
      setError('');
    }, 1500);
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = verificationCode.join('');
    
    if (enteredCode === MOCK_CODE) {
      setIsLoading(true);
      setTimeout(() => {
        const newState: AuthState = {
          isConfigured: true,
          email: email,
          hashedPassword: hashPassword(password)
        };
        storageService.saveAuthState(newState);
        onAuthenticated();
      }, 1000);
    } else {
      setError('Codice di verifica non valido. Riprova.');
      setVerificationCode(['', '', '', '', '', '']);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (hashPassword(password) === authState.hashedPassword) {
      onAuthenticated();
    } else {
      setError('Password errata. Accesso negato.');
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020617] flex items-center justify-center p-6 z-[200]">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/20">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Braik ai imprenditor</h1>
          <p className="text-slate-400 text-sm">
            {view === 'login' && 'Bentornato nella tua memoria aziendale'}
            {view === 'setup_init' && 'Crea il tuo Vault Aziendale sicuro'}
            {view === 'setup_verify' && 'Verifica la tua identità'}
          </p>
        </div>

        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Utente Autorizzato</p>
              <p className="text-white text-sm font-medium">{authState.email}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>
            {error && <div className="text-red-400 text-xs text-center">{error}</div>}
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-xl transition-all">
              Accedi
            </button>
          </form>
        )}

        {view === 'setup_init' && (
          <form onSubmit={handleSetupInit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Aziendale</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="nome@azienda.it"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Scegli Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Conferma Password</label>
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>
            {error && <div className="text-red-400 text-xs text-center">{error}</div>}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3"
            >
              {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Invia Codice di Verifica'}
            </button>
          </form>
        )}

        {view === 'setup_verify' && (
          <form onSubmit={handleVerifyCode} className="space-y-8">
            <div className="text-center">
              <p className="text-slate-400 text-xs mb-6">
                Abbiamo inviato un codice a 6 cifre a <br/><span className="text-white font-bold">{email}</span>
                <br/><span className="text-indigo-400 text-[10px] mt-2 block">(Per il test usa: 123456)</span>
              </p>
              
              <div className="flex justify-center gap-2">
                {verificationCode.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`code-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(idx, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !digit && idx > 0) {
                        document.getElementById(`code-${idx - 1}`)?.focus();
                      }
                    }}
                    className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                ))}
              </div>
            </div>

            {error && <div className="text-red-400 text-xs text-center">{error}</div>}

            <div className="space-y-4">
              <button 
                type="submit" 
                disabled={isLoading || verificationCode.some(d => !d)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-xl disabled:opacity-50 transition-all"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div> : 'Verifica e Attiva'}
              </button>
              
              <button 
                type="button"
                onClick={() => setResendTimer(30)}
                disabled={resendTimer > 0}
                className="w-full text-slate-500 text-xs font-bold hover:text-slate-300 transition-colors disabled:opacity-50"
              >
                {resendTimer > 0 ? `Invia di nuovo tra ${resendTimer}s` : 'Non hai ricevuto il codice? Invia di nuovo'}
              </button>
              
              <button 
                type="button"
                onClick={() => setView('setup_init')}
                className="w-full text-indigo-400/50 text-[10px] uppercase tracking-widest font-bold hover:text-indigo-400 transition-colors"
              >
                Torna Indietro
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
            Sistema di Criptazione Locale Attivo
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
