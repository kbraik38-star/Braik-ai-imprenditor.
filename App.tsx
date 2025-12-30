
import React, { useState, useEffect, useRef } from 'react';
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
  const [trialInfo, setTrialInfo] = useState({ isValid: true, daysLeft: 0 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  
  // Touch gesture tracking
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  useEffect(() => {
    const email = storageService.getActiveUserEmail();
    if (email) {
      const trial = storageService.checkTrialStatus();
      if (trial.isValid) {
        setIsAuthenticated(true);
      } else {
        storageService.logout();
      }
    }

    const handleResize = () => {
      if (window.innerWidth > 1024) setIsSidebarOpen(true);
      else setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const checkApiKey = async () => {
        // @ts-ignore
        if (typeof window.aistudio !== 'undefined' && !(await window.aistudio.hasSelectedApiKey())) {
          // @ts-ignore
          await window.aistudio.openSelectKey();
        }
      };
      checkApiKey();
      
      setEntries(storageService.getEntries());
      setProfile(storageService.getProfile());
      setTrialInfo(storageService.checkTrialStatus());
    }
  }, [isAuthenticated]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && isSidebarOpen) {
      setIsSidebarOpen(false);
    } else if (isRightSwipe && !isSidebarOpen) {
      setIsSidebarOpen(true);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

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
    <div 
      className="flex h-screen w-full bg-[#020617] animate-in fade-in duration-500 overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && window.innerWidth <= 1024 && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Floating Menu Toggle Button (Mobile Only) */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-6 left-6 z-50 p-3 bg-white/5 border border-white/10 rounded-2xl text-white shadow-2xl backdrop-blur-xl lg:hidden animate-in zoom-in duration-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      )}

      <aside className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        fixed lg:relative z-40 w-72 h-full bg-[#020617] border-r border-white/5 
        transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) text-white
      `}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-10 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-900/20">
                <span className="font-black text-white text-xl">B</span>
              </div>
              <div>
                <h1 className="font-black text-white leading-none tracking-tight uppercase italic text-lg">Braik <span className="text-cyan-400">AI</span></h1>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Neural Entrepreneur</span>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-500 p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
          </div>

          <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-2">
            <button onClick={() => { setActiveTab('chat'); if(window.innerWidth <= 1024) setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'chat' ? 'bg-white/10 text-cyan-400 border border-white/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Neural Search
            </button>
            <button onClick={() => { setActiveTab('strategy'); if(window.innerWidth <= 1024) setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'strategy' ? 'bg-white/10 text-cyan-400 border border-white/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Strategy Lab
            </button>
            <button onClick={() => { setActiveTab('knowledge'); if(window.innerWidth <= 1024) setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'knowledge' ? 'bg-white/10 text-cyan-400 border border-white/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7" /></svg>
              Knowledge Base
            </button>
            <button onClick={() => { setActiveTab('calendar'); if(window.innerWidth <= 1024) setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'calendar' ? 'bg-white/10 text-cyan-400 border border-white/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
              Agenda
            </button>
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
            {profile?.isTrial && (
              <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Status Prova</p>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white font-bold">{trialInfo.daysLeft} Giorni Rimanenti</span>
                  <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${(trialInfo.daysLeft / 7) * 100}%` }}></div>
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
