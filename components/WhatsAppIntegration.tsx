
import React, { useState, useEffect } from 'react';
import { WhatsAppSettings, BusinessEntry } from '../types';
import { storageService } from '../services/storage';
import { queryGemini } from '../services/geminiService';

interface WhatsAppIntegrationProps {
  entries: BusinessEntry[];
}

const WhatsAppIntegration: React.FC<WhatsAppIntegrationProps> = ({ entries }) => {
  const [settings, setSettings] = useState<WhatsAppSettings>(storageService.getWhatsAppSettings());
  const [step, setStep] = useState<'intro' | 'pairing' | 'connected'>(
    settings.isConnected ? 'connected' : 'intro'
  );
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [pairingStatus, setPairingStatus] = useState<'generating' | 'ready' | 'scanning' | 'loading'>('generating');
  const [qrToken, setQrToken] = useState('');

  useEffect(() => {
    storageService.saveWhatsAppSettings(settings);
  }, [settings]);

  const generateNewToken = () => {
    const randomId = Math.random().toString(36).substring(2, 15);
    setQrToken(`1@${randomId},${btoa(Date.now().toString())},${randomId.split('').reverse().join('')}`);
  };

  const startPairing = () => {
    setStep('pairing');
    setPairingStatus('generating');
    generateNewToken();
    setTimeout(() => setPairingStatus('ready'), 2000);
  };

  const simulateScan = () => {
    setPairingStatus('scanning');
    setTimeout(() => {
      setPairingStatus('loading');
      setTimeout(() => {
        const newSettings = { ...settings, isConnected: true, isEnabled: true, lastActivity: Date.now() };
        setSettings(newSettings);
        setStep('connected');
      }, 2500);
    }, 2000);
  };

  const disconnect = () => {
    if (confirm("Vuoi davvero scollegare l'account WhatsApp?")) {
      setSettings({ ...settings, isConnected: false, isEnabled: false });
      setStep('intro');
    }
  };

  const runSimulation = async () => {
    if (!testMessage.trim()) return;
    setIsSimulating(true);
    setTestResponse('');
    const response = await queryGemini(testMessage, [], entries);
    setTestResponse(response.text);
    setIsSimulating(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5] rounded-2xl border border-gray-200 overflow-hidden">
      <div className="bg-[#00a884] p-4 text-white flex items-center justify-between">
        <h2 className="font-bold flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.63 1.438h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          WhatsApp AI
        </h2>
        {step === 'connected' && (
          <button onClick={disconnect} className="text-xs bg-black/10 px-3 py-1 rounded">Scollega</button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-white">
        {step === 'intro' && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="w-16 h-16 bg-green-50 text-[#00a884] rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-xl font-bold">Collega il tuo WhatsApp</h3>
            <p className="text-gray-500 max-w-xs">Permetti all'IA di rispondere ai tuoi contatti aziendali in modo automatico e intelligente.</p>
            <button onClick={startPairing} className="bg-[#00a884] text-white px-8 py-3 rounded-full font-bold">Collega Ora</button>
          </div>
        )}

        {step === 'pairing' && (
          <div className="flex flex-col items-center justify-center h-full space-y-8">
            <div className="bg-gray-100 p-4 rounded-xl relative group cursor-pointer" onClick={pairingStatus === 'ready' ? simulateScan : undefined}>
              {qrToken && pairingStatus !== 'scanning' && pairingStatus !== 'loading' && (
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrToken)}`} alt="QR" className="w-48 h-48" />
              )}
              {pairingStatus === 'generating' && <div className="w-48 h-48 flex items-center justify-center animate-pulse text-gray-400">Generazione...</div>}
              {(pairingStatus === 'scanning' || pairingStatus === 'loading') && (
                <div className="w-48 h-48 flex flex-col items-center justify-center bg-white/90">
                  <div className="w-8 h-8 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs mt-4 font-bold text-[#00a884]">Connessione...</p>
                </div>
              )}
            </div>
            <p className="text-sm text-center text-gray-500">Inquadra il codice QR con il tuo telefono per collegare Braik.</p>
          </div>
        )}

        {step === 'connected' && (
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-green-800">Bot Attivo</p>
                <p className="text-xs text-green-600">L'IA sta monitorando i messaggi in arrivo.</p>
              </div>
              <button onClick={() => setSettings({...settings, isEnabled: !settings.isEnabled})} className={`w-12 h-6 rounded-full transition-colors ${settings.isEnabled ? 'bg-[#00a884]' : 'bg-gray-300'} relative`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.isEnabled ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Test Bot</h4>
              <div className="flex gap-2">
                <input type="text" value={testMessage} onChange={(e) => setTestMessage(e.target.value)} placeholder="Messaggio di test..." className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                <button onClick={runSimulation} disabled={isSimulating} className="bg-gray-100 px-4 py-2 rounded-lg text-sm font-bold">Invia</button>
              </div>
              {testResponse && (
                <div className="bg-[#DCF8C6] p-3 rounded-lg text-sm text-gray-800 animate-in fade-in">
                  {testResponse}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppIntegration;
