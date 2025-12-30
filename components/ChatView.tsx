
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, BusinessEntry, ChatSession, BehavioralInsights, GuardianAlert } from '../types';
import { queryGemini } from '../services/geminiService';
import { storageService } from '../services/storage';
import { exportToPDF, exportToWord } from '../services/fileExporter';
import VoiceAssistant from './VoiceAssistant';

interface ChatViewProps {
  entries: BusinessEntry[];
}

const ChatView: React.FC<ChatViewProps> = ({ entries }) => {
  const [mode, setMode] = useState<'search' | 'workspace'>('search');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [insights, setInsights] = useState<BehavioralInsights>(storageService.getInsights());
  const [historicalMemories, setHistoricalMemories] = useState<BusinessEntry[]>(storageService.getHistoricalEntries());
  
  const [searchMessages, setSearchMessages] = useState<ChatMessage[]>(storageService.getSearchHistory());
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === 'workspace') {
      const loadedSessions = storageService.getSessions();
      setSessions(loadedSessions);
      if (loadedSessions.length > 0 && !activeSessionId) {
        setActiveSessionId(loadedSessions[0].id);
      }
    }
  }, [mode]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [searchMessages, sessions, isTyping, activeSessionId, mode]);

  useEffect(() => {
    const interval = setInterval(() => {
      setInsights(storageService.getInsights());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const currentMessages = mode === 'search' ? searchMessages : (activeSession?.messages || []);

  const handleCreateSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `Protocollo Lab ${sessions.length + 1}`,
      messages: [],
      lastUpdate: Date.now()
    };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setActiveSessionId(newSession.id);
    storageService.saveSession(newSession);
  };

  const handleQuickSave = (msg: ChatMessage) => {
    const entry: BusinessEntry = {
      id: `save-${Date.now()}`,
      type: 'note',
      title: `Memoria del ${new Date().toLocaleDateString()}`,
      content: msg.content,
      timestamp: Date.now(),
      isSensitive: false
    };
    storageService.saveEntry(entry);
    alert("Dato salvato con successo nella Knowledge Base!");
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    if (mode === 'search') {
      const newHistory = [...searchMessages, userMsg];
      setSearchMessages(newHistory);
      storageService.saveSearchHistory(newHistory);
    } else if (activeSessionId) {
      const updated = sessions.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, userMsg], lastUpdate: Date.now() } : s);
      setSessions(updated);
    } else {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: input.slice(0, 25) + "...",
        messages: [userMsg],
        lastUpdate: Date.now()
      };
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id);
      storageService.saveSession(newSession);
    }

    const currentInput = input;
    setInput('');
    setIsTyping(true);

    const result = await queryGemini(currentInput, currentMessages, entries, mode);

    const assistantMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: result.text,
      sources: result.sources,
      imageUrl: result.imageUrl,
      timestamp: Date.now(),
      suggestedSave: result.suggestedSave
    };

    if (mode === 'search') {
      const newHistory = [...storageService.getSearchHistory(), assistantMsg];
      setSearchMessages(newHistory);
      storageService.saveSearchHistory(newHistory);
    } else if (activeSessionId || sessions.length > 0) {
      const sid = activeSessionId || (sessions.length > 0 ? sessions[0].id : null);
      if (sid) {
        const updated = sessions.map(s => {
          if (s.id === sid) {
            const newSession = { ...s, messages: [...s.messages, assistantMsg], lastUpdate: Date.now() };
            storageService.saveSession(newSession);
            return newSession;
          }
          return s;
        });
        setSessions(updated);
      }
    }
    
    setIsTyping(false);
  };

  return (
    <div className="flex h-full bg-[#020617] rounded-[2.5rem] border border-white/5 overflow-hidden animate-in fade-in zoom-in duration-500 relative">
      
      {mode === 'workspace' && (
        <div className="w-64 border-r border-white/5 bg-black/40 p-4 flex flex-col shrink-0">
          <button 
            onClick={handleCreateSession}
            className="w-full py-3 mb-6 bg-cyan-600/10 border border-cyan-500/30 text-cyan-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-600/20 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            Inizia Lab
          </button>
          
          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
            {sessions.map(s => (
              <button 
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={`w-full text-left p-3 rounded-lg text-xs truncate transition-all ${activeSessionId === s.id ? 'bg-white/10 text-white border border-white/10 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col relative min-w-0">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMode('search')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'search' ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(34,211,238,0.5)]' : 'text-slate-500 hover:text-white'}`}
            >
              Neural Search
            </button>
            <button 
              onClick={() => setMode('workspace')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'workspace' ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]' : 'text-slate-500 hover:text-white'}`}
            >
              Laboratorio Aziendale
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowInsights(!showInsights)}
              className={`p-2.5 rounded-full transition-all border ${showInsights ? 'bg-gold-500/20 border-amber-500 text-amber-400' : 'border-white/10 text-slate-500 hover:text-white'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </button>
            <button onClick={() => setIsVoiceActive(true)} className="text-cyan-400 p-2.5 hover:bg-white/5 rounded-full transition-all border border-transparent hover:border-white/10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            {currentMessages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 border border-white/10 ${mode === 'search' ? 'text-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.1)]' : 'text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.1)]'}`}>
                  {mode === 'search' ? (
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  ) : (
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  )}
                </div>
                <h3 className="text-xl font-black uppercase italic text-white tracking-tighter">
                  {mode === 'search' ? 'Neural Search Engine' : 'Workspace Lab'}
                </h3>
                <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-[0.3em]">
                  {mode === 'search' ? 'Accesso Web e Archivio in tempo reale' : 'Elaborazione Documenti e Strategia'}
                </p>
              </div>
            )}

            {currentMessages.map((m) => (
              <div key={m.id} className={`flex animate-in slide-in-from-bottom-4 duration-300 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-[2rem] p-6 ${m.role === 'user' ? 'bg-white/10 text-white border border-white/10' : 'bg-black/40 text-slate-200 border border-white/5 shadow-2xl relative'}`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  
                  {m.suggestedSave && m.role === 'assistant' && (
                    <div className="mt-4 flex justify-end">
                      <button 
                        onClick={() => handleQuickSave(m)}
                        className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                        Salvare nella memoria?
                      </button>
                    </div>
                  )}

                  {m.imageUrl && (
                    <div className="mt-4 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                      <img src={m.imageUrl} alt="IA Generated" className="w-full h-auto" />
                    </div>
                  )}
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-white/5">
                      <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></span>
                        Intelligenza Verificata:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {m.sources.map((s, idx) => (
                          <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="bg-white/5 hover:bg-cyan-500/20 text-[10px] text-slate-400 hover:text-cyan-300 px-3 py-1.5 rounded-lg border border-white/5 transition-all truncate max-w-[180px]">
                            {s.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/5 rounded-2xl px-6 py-4 border border-white/5 flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.2em]">Sincronizzazione...</span>
                </div>
              </div>
            )}
          </div>

          {showInsights && (
            <aside className="w-80 border-l border-white/5 bg-black/40 p-6 overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-500">
              <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                Neural Guardian HUD
              </h4>
              
              <div className="space-y-6">
                {insights.guardianAlerts.length > 0 && (
                  <section>
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Rilevamenti Attivi</label>
                    <div className="space-y-3">
                      {insights.guardianAlerts.map(alert => (
                        <div key={alert.id} className={`p-4 rounded-xl border flex gap-3 ${alert.type === 'forgotten' ? 'bg-red-500/10 border-red-500/20 text-red-400' : alert.type === 'anomaly' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'}`}>
                          <div className="shrink-0 mt-0.5">
                            {alert.type === 'forgotten' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                            {alert.type === 'anomaly' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            {alert.type === 'strategy' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
                          </div>
                          <p className="text-[11px] font-medium leading-relaxed">{alert.message}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {historicalMemories.length > 0 && (
                  <section>
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Accadde Oggi (Archivio)</label>
                    <div className="space-y-3">
                      {historicalMemories.map(mem => (
                        <div key={mem.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                           <p className="text-[10px] text-amber-500 font-bold uppercase tracking-tighter mb-1">
                             {new Date(mem.timestamp).getFullYear()} • {mem.type}
                           </p>
                           <h5 className="text-xs text-white font-bold mb-1 truncate">{mem.title}</h5>
                           <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight italic">"{mem.content}"</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <div className="pt-6 border-t border-white/5">
                  <p className="text-[8px] text-slate-600 uppercase text-center tracking-widest">
                    Neural Intelligence Loop v2.5
                  </p>
                </div>
              </div>
            </aside>
          )}
        </div>

        <div className="p-8 bg-black/60 border-t border-white/5 backdrop-blur-3xl shrink-0">
          <div className="max-w-4xl mx-auto flex gap-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={mode === 'search' ? "Interroga il web e il tuo archivio..." : "Scrivi 'Organizza la settimana' o pianifica..."}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:ring-1 focus:ring-cyan-500 outline-none transition-all resize-none h-[56px] custom-scrollbar text-sm font-medium"
              rows={1}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className={`p-4 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all disabled:opacity-50 ${mode === 'search' ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>
      </div>

      {isVoiceActive && <VoiceAssistant entries={entries} onClose={() => setIsVoiceActive(false)} />}
    </div>
  );
};

export default ChatView;
