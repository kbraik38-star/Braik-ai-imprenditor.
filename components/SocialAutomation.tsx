
import React, { useState, useEffect } from 'react';
import { SocialPlatformSettings, BusinessEntry } from '../types';
import { storageService } from '../services/storage';
import { queryGemini } from '../services/geminiService';

interface SocialAutomationProps {
  entries: BusinessEntry[];
}

const SocialAutomation: React.FC<SocialAutomationProps> = ({ entries }) => {
  const [settings, setSettings] = useState<SocialPlatformSettings[]>(storageService.getSocialSettings());
  const [testComment, setTestComment] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    storageService.saveSocialSettings(settings);
  }, [settings]);

  const togglePlatform = (platform: string) => {
    setSettings(prev => prev.map(s => {
      if (s.platform === platform) {
        return { ...s, isConnected: !s.isConnected, isEnabled: !s.isConnected };
      }
      return s;
    }));
  };

  const handleTest = async () => {
    if (!testComment.trim()) return;
    setIsSimulating(true);
    setTestResponse('');
    const response = await queryGemini(`Commento social: "${testComment}". Rispondi in modo professionale.`, [], entries);
    setTestResponse(response.text);
    setIsSimulating(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xl font-bold">Automazione Social</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['facebook', 'instagram', 'tiktok'].map(p => {
            const s = settings.find(set => set.platform === p);
            return (
              <div key={p} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center space-y-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${p === 'facebook' ? 'bg-[#1877F2]' : p === 'instagram' ? 'bg-[#E4405F]' : 'bg-black'}`}>
                  {p.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-bold uppercase">{p}</p>
                <button onClick={() => togglePlatform(p)} className={`text-xs px-4 py-1.5 rounded-full font-bold ${s?.isConnected ? 'bg-red-50 text-red-500' : 'bg-indigo-600 text-white'}`}>
                  {s?.isConnected ? 'Scollega' : 'Collega'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Test Risposta Automatica</h3>
          <textarea 
            value={testComment} 
            onChange={e => setTestComment(e.target.value)} 
            placeholder="Incolla qui un commento ricevuto..." 
            className="w-full border rounded-xl p-4 text-sm resize-none"
            rows={3}
          />
          <button onClick={handleTest} disabled={isSimulating} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">
            {isSimulating ? "Analisi..." : "Genera Risposta AI"}
          </button>
          {testResponse && (
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm italic">
              "{testResponse}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialAutomation;
