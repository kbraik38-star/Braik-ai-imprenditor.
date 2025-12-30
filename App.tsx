
import React, { useState, useEffect } from 'react';
import ChatView from './components/ChatView';
import KnowledgeBase from './components/KnowledgeBase';
import CalendarView from './components/CalendarView';
import NeuralStrategy from './components/NeuralStrategy';
import Auth from './components/Auth';
import { storageService } from './services/storage';
import { BusinessEntry, UserProfile, AuthState } from './types';

type ActiveTab = 'chat' | 'knowledge' | 'calendar' | 'strategy' | 'settings';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [entries, setEntries] = useState<BusinessEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [trialInfo, setTrialInfo] = useState({ isValid: true, daysLeft: 0, isExpired: false });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const email = storageService.getActiveUserEmail();
    if (email) {
      // Carichiamo l'utente ma non blocchiamo più se il trial è scaduto
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      // Nota: Non apriamo più automaticamente openSelectKey all'avvio per non bloccare l'utente.
      // Verrà aperto solo se l'utente richiede funzioni che richiedono modelli Pro/Veo.
      
      setEntries(storageService.getEntries());
      setProfile(storageService.getProfile());
      setTrialInfo(storageService.checkTrialStatus());
    }
  }, [isAuthenticated]);

  const handleAddEntry = (entry: BusinessEntry) => {
    storageService.saveEntry(entry);
    setEntries(storageService.getEntries());
  };

  const handleDeleteEntry = (id: string) => {
    storageService.deleteEntry(id);
    setEntries(storageService.getEntries());
  };

  const handleLogout = () => {
    storageService.logout();
    setIsAuthenticated(false);
    setProfile(null);
  };

  if (!isAuthenticated) {
    return <Auth onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen w-full bg-[#020617] animate-in fade-in duration-500">
      <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-40 w-72 h-full bg-[#020617] border-r border-white/5 transition-transform duration-300 ease-in-out text-white shadow-2xl`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-900/20">
              <span className="font-black text-white text-xl">B</span>
            </div>
            <div>
              <h1 className="font-black text-white leading-none tracking-tight uppercase italic text-lg">Braik <span className="text-cyan-400">AI</span></h1>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Neural Entrepreneur</span>
            </div>
          </div>

          <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-2">
            <button onClick={() => setActiveTab('chat')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'chat' ? 'bg-white/10 text-cyan-400 border border-white/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Neural Search
            </button>
            <button onClick={() => setActiveTab('strategy')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'strategy' ? 'bg-white/10 text-cyan-400 border border-white/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Strategy Lab
            </button>
            <button onClick={() => setActiveTab('knowledge')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'knowledge' ? 'bg-white/10 text-cyan-400 border border-white/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7" /></svg>
              Knowledge Base
            </button>
            <button onClick={() => setActiveTab('calendar')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'calendar' ? 'bg-white/10 text-cyan-400 border border-white/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Agenda
            </button>
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
            {profile?.isTrial && (
              <div className={`px-4 py-3 border rounded-xl transition-all ${trialInfo.isExpired ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${trialInfo.isExpired ? 'text-red-500' : 'text-amber-500'}`}>
                  {trialInfo.isExpired ? 'Periodo Prova Terminato' : 'Status Prova'}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white font-bold">
                    {trialInfo.isExpired ? 'Account Limited' : `${trialInfo.daysLeft} Giorni Rimanenti`}
                  </span>
                  <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${trialInfo.isExpired ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: trialInfo.isExpired ? '100%' : `${(trialInfo.daysLeft / 7) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400 font-bold border border-cyan-500/30">
                {profile?.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{profile?.name}</p>
                <button onClick={handleLogout} className="text-[9px] text-slate-500 uppercase tracking-widest hover:text-red-400 transition-colors">Logout Sicuro</button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 p-4 lg:p-8 h-screen overflow-hidden bg-[#020617]">
        <div className="flex-1 max-w-6xl w-full mx-auto relative h-full">
          {activeTab === 'chat' && <ChatView entries={entries} />}
          {activeTab === 'strategy' && <NeuralStrategy entries={entries} />}
          {activeTab === 'knowledge' && <KnowledgeBase entries={entries} onAdd={handleAddEntry} onDelete={handleDeleteEntry} />}
          {activeTab === 'calendar' && <CalendarView entries={entries} />}
        </div>
      </main>
    </div>
  );
};

export default App;
