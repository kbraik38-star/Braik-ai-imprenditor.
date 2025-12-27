
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, BusinessEntry } from '../types';
import { queryGemini } from '../services/geminiService';
import { storageService } from '../services/storage';
import { exportToPDF, exportToWord, exportToPPT } from '../services/fileExporter';
import VoiceAssistant from './VoiceAssistant';

interface ChatViewProps {
  entries: BusinessEntry[];
}

const ChatView: React.FC<ChatViewProps> = ({ entries }) => {
  const [messages, setMessages] = useState<(ChatMessage & { imageUrl?: string })[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const history = storageService.getChatHistory();
    setMessages(history);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      storageService.saveChatHistory(messages);
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const result = await queryGemini(input, messages, entries);

    const assistantMessage: ChatMessage & { imageUrl?: string } = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: result.text,
      imageUrl: result.imageUrl,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Braik Intelligence</span>
        </div>
        <button 
          onClick={() => setIsVoiceActive(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          Voce
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${m.role === 'user' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-800'}`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
              
              {m.imageUrl && (
                <div className="mt-4 rounded-xl overflow-hidden shadow-lg border border-white/20">
                  <img src={m.imageUrl} alt="AI Generated" className="w-full h-auto max-h-96 object-cover" />
                </div>
              )}

              {m.role === 'assistant' && m.content.length > 50 && (
                <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                  <button 
                    onClick={() => exportToPDF("Documento Braik", m.content)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-[10px] font-bold text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>
                    PDF
                  </button>
                  <button 
                    onClick={() => exportToWord("Relazione Braik", m.content)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-[10px] font-bold text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>
                    Word
                  </button>
                  <button 
                    onClick={() => exportToPPT("Presentazione Braik", m.content)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-[10px] font-bold text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>
                    PPT
                  </button>
                </div>
              )}

              <div className={`text-[10px] mt-2 opacity-60 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-5 py-3 animate-pulse">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Braik sta elaborando...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <div className="relative max-w-4xl mx-auto flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Chiedi un'immagine, una traduzione o un parere legale..."
            className="flex-1 bg-white border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none shadow-sm"
            rows={1}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      </div>

      {isVoiceActive && <VoiceAssistant entries={entries} onClose={() => setIsVoiceActive(false)} />}
    </div>
  );
};

export default ChatView;
