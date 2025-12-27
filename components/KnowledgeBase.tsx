
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
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Archivio Aziendale</h2>
          <p className="text-sm text-gray-500">Gestisci la memoria della tua impresa</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e.target.files)} className="hidden" multiple accept=".txt,.md,.json,.csv,.log" />
          <button onClick={() => fileInputRef.current?.click()} className="bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            Carica File
          </button>
          <button onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Nuovo Dato
          </button>
        </div>
      </div>

      <div className="px-6 py-4 bg-gray-50/50 flex gap-2 overflow-x-auto custom-scrollbar">
        {(['all', 'general', 'appointment', 'note', 'contact', 'document'] as const).map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${filter === t ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className={`flex-1 overflow-y-auto p-6 custom-scrollbar transition-colors ${isDragging ? 'bg-indigo-50/50 outline-2 outline-dashed outline-indigo-300 outline-offset-[-12px]' : ''}`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
        {filteredEntries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="bg-indigo-50 p-4 rounded-full mb-4"><svg className="w-8 h-8 text-indigo-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg></div>
            <h3 className="text-gray-900 font-medium">Memoria vuota</h3>
            <p className="text-sm text-gray-500 max-w-xs mt-1">Aggiungi manualmente o trascina qui i tuoi file per popolare l'archivio.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEntries.map(entry => (
              <div key={entry.id} className="group p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all relative cursor-pointer" onClick={() => setSelectedEntry(entry)}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${entry.type === 'appointment' ? 'bg-blue-50 text-blue-600' : entry.type === 'note' ? 'bg-amber-50 text-amber-600' : entry.type === 'contact' ? 'bg-emerald-50 text-emerald-600' : entry.type === 'document' ? 'bg-purple-50 text-purple-600' : 'bg-gray-50 text-gray-600'}`}>
                    {icons[entry.type]}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }} className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                <h4 className="font-bold text-gray-900 mb-1 line-clamp-1">{entry.title}</h4>
                <p className="text-xs text-gray-600 line-clamp-3 mb-3 h-12 leading-relaxed">{entry.content}</p>
                <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2 border-t border-gray-50 pt-2">
                  <span>{entry.date || new Date(entry.timestamp).toLocaleDateString()}</span>
                  <span className="text-indigo-600 font-bold group-hover:underline flex items-center gap-1">
                    Apri 
                    <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reader Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in slide-in-from-right duration-300">
          <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0">
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedEntry(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div>
                <h3 className="font-bold text-gray-900">{selectedEntry.title}</h3>
                <p className="text-[10px] text-gray-400 uppercase font-semibold">{selectedEntry.type} • {selectedEntry.date || 'Data non specificata'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => window.print()} className="p-2 text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg></button>
              <button onClick={() => setSelectedEntry(null)} className="p-2 text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-12 lg:p-24 bg-gray-50">
            <div className="max-w-3xl mx-auto bg-white p-12 lg:p-20 shadow-xl rounded-sm border border-gray-100 min-h-full">
               <div className="prose prose-indigo max-w-none whitespace-pre-wrap font-serif text-lg leading-relaxed text-gray-800">
                 {selectedEntry.content}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Aggiungi Nuovo Dato</h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tipo</label>
                  <select value={newType} onChange={(e) => setNewType(e.target.value as EntryType)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                    <option value="general">Generale</option><option value="note">Nota Interna</option><option value="appointment">Appuntamento</option><option value="contact">Contatto</option><option value="document">Documento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Data (opzionale)</label>
                  <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Titolo / Oggetto</label>
                <input type="text" required placeholder="Es. PEC Aziendale, Nota Progetto X" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Contenuto</label>
                <textarea required rows={4} placeholder="Inserisci i dettagli qui..." value={newContent} onChange={(e) => setNewContent(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none" />
              </div>
              <div className="flex items-center gap-3 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                <input type="checkbox" id="sensitive" checked={newIsSensitive} onChange={(e) => setNewIsSensitive(e.target.checked)} className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                <label htmlFor="sensitive" className="text-sm font-medium text-indigo-900 flex items-center gap-1.5 cursor-pointer">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                  Segna come Informazione Sensibile
                </label>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Salva nella Memoria</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
