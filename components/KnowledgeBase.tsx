
import React, { useState, useRef } from 'react';
import { BusinessEntry, EntryType } from '../types';

interface KnowledgeBaseProps {
  entries: BusinessEntry[];
  onAdd: (entry: BusinessEntry) => void;
  onDelete: (id: string) => void;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ entries, onAdd, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<EntryType | 'all'>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<BusinessEntry | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [newType, setNewType] = useState<EntryType>('note');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newIsSensitive, setNewIsSensitive] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    const entry: BusinessEntry = {
      id: Date.now().toString(),
      type: newType,
      title: newTitle,
      content: newContent,
      date: newDate,
      timestamp: Date.now(),
      isSensitive: newIsSensitive
    };

    onAdd(entry);
    resetForm();
  };

  const resetForm = () => {
    setIsAdding(false);
    setNewTitle('');
    setNewContent('');
    setNewDate('');
    setNewIsSensitive(false);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          const entry: BusinessEntry = {
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'document',
            title: file.name,
            content: content,
            date: new Date().toISOString().split('T')[0],
            timestamp: Date.now(),
            isSensitive: false
          };
          onAdd(entry);
        }
      };
      reader.readAsText(file);
    });
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files); };

  const filteredEntries = filter === 'all' ? entries : entries.filter(e => e.type === filter);

  const icons: Record<EntryType, React.ReactNode> = {
    note: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    appointment: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    contact: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    document: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
    general: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
  };

  return (
    <div className="flex flex-col h-full bg-[#020617] rounded-[2.5rem] border border-white/5 overflow-hidden relative">
      {/* Header */}
      <div className="p-8 border-b border-white/5 flex items-center justify-between flex-wrap gap-4 bg-white/5 backdrop-blur-xl shrink-0">
        <div>
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Archivio <span className="text-cyan-400">Aziendale</span></h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Gestione Memoria Impresa</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e.target.files)} className="hidden" multiple accept=".txt,.md,.json,.csv,.log" />
          <button onClick={() => fileInputRef.current?.click()} className="bg-white/5 border border-white/10 text-slate-400 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
            Carica File
          </button>
          <button onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/20">
            Nuovo Dato
          </button>
        </div>
      </div>

      <div className="px-8 py-4 border-b border-white/5 bg-black/40 flex gap-2 overflow-x-auto custom-scrollbar shrink-0">
        {(['all', 'general', 'appointment', 'note', 'contact', 'document'] as const).map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filter === t ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'bg-white/5 text-slate-500 hover:text-white border border-white/5'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className={`flex-1 overflow-y-auto p-8 custom-scrollbar transition-colors ${isDragging ? 'bg-indigo-500/5' : ''}`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
        {filteredEntries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 opacity-40">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10"><svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg></div>
            <h3 className="text-white font-black uppercase italic tracking-tighter">Memoria Vuota</h3>
            <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-[0.3em]">Trascina i tuoi file per caricarli</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntries.map(entry => (
              <div key={entry.id} className="group p-6 bg-black/40 border border-white/5 rounded-3xl hover:border-cyan-500/30 hover:bg-white/5 transition-all relative cursor-pointer shadow-xl overflow-hidden" onClick={() => setSelectedEntry(entry)}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${entry.type === 'appointment' ? 'bg-blue-500/10 text-blue-400' : entry.type === 'note' ? 'bg-amber-500/10 text-amber-400' : entry.type === 'contact' ? 'bg-emerald-500/10 text-emerald-400' : entry.type === 'document' ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-500/10 text-slate-400'} border border-white/5`}>
                    {icons[entry.type]}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }} className="text-slate-600 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                <h4 className="font-black text-white mb-2 line-clamp-1 uppercase tracking-tighter text-sm italic">{entry.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-3 mb-4 h-12 leading-relaxed font-medium">{entry.content}</p>
                <div className="flex items-center justify-between text-[9px] text-slate-600 mt-4 border-t border-white/5 pt-4 font-black uppercase tracking-widest">
                  <span>{entry.date || new Date(entry.timestamp).toLocaleDateString()}</span>
                  <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-all">ANALIZZA PROFILO</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reader Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-[#020617] z-[250] flex flex-col animate-in slide-in-from-right duration-300">
          <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-3xl shrink-0">
            <div className="flex items-center gap-6">
              <button onClick={() => setSelectedEntry(null)} className="p-3 hover:bg-white/5 rounded-2xl text-slate-500 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div>
                <h3 className="font-black text-white text-lg uppercase italic tracking-tighter">{selectedEntry.title}</h3>
                <p className="text-[9px] text-cyan-400 uppercase font-black tracking-[0.3em]">{selectedEntry.type} • {selectedEntry.date || 'Senza Data'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedEntry(null)} className="p-3 text-slate-500 hover:text-white transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-12 lg:p-24 bg-[#020617] custom-scrollbar">
            <div className="max-w-3xl mx-auto bg-white/5 p-12 lg:p-20 shadow-2xl rounded-[3rem] border border-white/10 min-h-full">
               <div className="prose prose-invert max-w-none whitespace-pre-wrap font-medium text-lg leading-relaxed text-slate-300">
                 {selectedEntry.content}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-[#020617] rounded-[3rem] border border-white/10 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Immissione <span className="text-cyan-400">Dati</span></h3>
              <button onClick={resetForm} className="text-slate-500 hover:text-white transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo</label>
                  <select value={newType} onChange={(e) => setNewType(e.target.value as EntryType)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none transition-all">
                    <option value="general">Generale</option><option value="note">Nota</option><option value="appointment">Appuntamento</option><option value="contact">Contatto</option><option value="document">Documento</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data</label>
                  <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Titolo / Oggetto</label>
                <input type="text" required placeholder="Es. Strategia Q4, Fattura #123" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contenuto Memoria</label>
                <textarea required rows={4} placeholder="Inserisci i dettagli qui..." value={newContent} onChange={(e) => setNewContent(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none resize-none" />
              </div>
              <div className="flex items-center gap-3 bg-cyan-500/5 p-4 rounded-2xl border border-cyan-500/10">
                <input type="checkbox" id="sensitive" checked={newIsSensitive} onChange={(e) => setNewIsSensitive(e.target.checked)} className="w-5 h-5 bg-transparent border-white/10 rounded text-cyan-500 focus:ring-offset-0 focus:ring-0" />
                <label htmlFor="sensitive" className="text-[10px] font-black text-cyan-400 uppercase tracking-widest cursor-pointer flex items-center gap-2">
                  Protocollo Informazione Sensibile
                </label>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-xl">Salva Memoria</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
