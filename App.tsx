
import React, { useState, useEffect } from 'react';
import ChatView from './components/ChatView';
import KnowledgeBase from './components/KnowledgeBase';
import Auth from './components/Auth';
import WhatsAppIntegration from './components/WhatsAppIntegration';
import SocialAutomation from './components/SocialAutomation';
import { storageService } from './services/storage';
import { BusinessEntry, UserProfile, AuthState } from './types';

type ActiveTab = 'chat' | 'knowledge' | 'whatsapp' | 'social' | 'settings';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [entries, setEntries] = useState<BusinessEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ name: 'User', companyName: 'Company' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      setEntries(storageService.getEntries());
      const p = storageService.getProfile();
      const auth = storageService.getAuthState();
      setProfile({ ...p, email: auth.email });
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
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Auth onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] animate-in fade-in duration-500">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-40 w-72 h-full bg-white border-r border-gray-100 transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-none">Braik AI</h1>
              <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider">Business Memory</span>
            </div>
          </div>

          <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-2">
            <button 
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              Assistente Virtuale
            </button>
            <button 
              onClick={() => setActiveTab('knowledge')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'knowledge' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7" /></svg>
              Knowledge Base
            </button>
            <div className="pt-4 border-t border-gray-100 mt-4 space-y-1.5">
              <button 
                onClick={() => setActiveTab('whatsapp')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'whatsapp' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.516a3 3 0 11-3.033-2.92m6.295 1.584l.013.013" /></svg>
                WhatsApp AI
              </button>
              <button 
                onClick={() => setActiveTab('social')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'social' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                Social Channels
              </button>
            </div>
            
            <div className="pt-4 border-t border-gray-100 mt-4">
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Impostazioni
              </button>
            </div>
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100">
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">
                {profile.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-900 truncate">{profile.name}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide truncate">{profile.companyName}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 p-4 lg:p-8 h-screen overflow-hidden">
        <div className="flex-1 max-w-6xl w-full mx-auto relative h-full">
          {activeTab === 'chat' && <ChatView entries={entries} />}
          {activeTab === 'knowledge' && (
            <KnowledgeBase 
              entries={entries} 
              onAdd={handleAddEntry} 
              onDelete={handleDeleteEntry} 
            />
          )}
          {activeTab === 'whatsapp' && <WhatsAppIntegration entries={entries} />}
          {activeTab === 'social' && <SocialAutomation entries={entries} />}
          {activeTab === 'settings' && (
            <div className="p-10 bg-white rounded-2xl shadow-sm border border-gray-100 h-full overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-2xl font-bold">Configurazione</h2>
                  <p className="text-sm text-gray-500">Gestisci i parametri del tuo assistente.</p>
                </div>
                <button onClick={handleLogout} className="bg-slate-100 text-slate-600 px-6 py-2.5 rounded-xl text-sm font-bold">Scollega Vault</button>
              </div>

              <div className="space-y-12">
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">Nome Proprietario</label>
                    <input type="text" value={profile.name} onChange={(e) => { const newP = { ...profile, name: e.target.value }; setProfile(newP); storageService.saveProfile(newP); }} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">Nome Azienda</label>
                    <input type="text" value={profile.companyName} onChange={(e) => { const newP = { ...profile, companyName: e.target.value }; setProfile(newP); storageService.saveProfile(newP); }} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                  </div>
                </section>
                <section className="pt-8 border-t border-gray-100">
                  <button onClick={() => { if (confirm("Cancellare tutto?")) { storageService.resetAll(); window.location.reload(); } }} className="text-red-500 text-xs font-bold">Wipe Totale Memoria</button>
                </section>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
