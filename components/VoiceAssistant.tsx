
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { BusinessEntry } from '../types';

interface VoiceAssistantProps {
  entries: BusinessEntry[];
  onClose: () => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ entries, onClose }) => {
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'idle'>('connecting');
  const [transcription, setTranscription] = useState('');
  const [aiTranscription, setAiTranscription] = useState('');
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const contextText = entries.map(e => `[${e.type}] ${e.title}: ${e.content}`).join('\n');
      
      const systemInstruction = `
Sei un’Intelligenza Artificiale privata con interfaccia vocale chiamata "Braik ai imprenditor".
Il tuo scopo è rispondere alle domande utilizzando ESCLUSIVAMENTE le informazioni fornite nel database.

REGOLE ASSOLUTE:
1. Non usare mai conoscenza esterna.
2. Se un’informazione non è presente, rispondi ESATTAMENTE: "Questa informazione non è disponibile nei dati."
3. Sii sintetico per facilitare l'ascolto.
4. Non inventare dati.

DATABASE:
${contextText || "VUOTO"}
      `;

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction,
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            setStatus('listening');
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              sessionPromise.then(s => s.sendRealtimeInput({ 
                media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } 
              }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (msg) => {
            if (msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              setStatus('speaking');
              const audioBuffer = await decodeAudioData(
                decode(msg.serverContent.modelTurn.parts[0].inlineData.data),
                outputAudioContextRef.current!, 24000, 1
              );
              const source = outputAudioContextRef.current!.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContextRef.current!.destination);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current!.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus('listening');
              };
            }

            if (msg.serverContent?.inputTranscription) {
              setTranscription(msg.serverContent.inputTranscription.text);
            }
            if (msg.serverContent?.outputTranscription) {
              setAiTranscription(prev => prev + msg.serverContent!.outputTranscription!.text);
            }
            if (msg.serverContent?.turnComplete) {
              setAiTranscription('');
              setTranscription('');
            }
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => onClose(),
          onerror: (e) => console.error("Live Error:", e)
        }
      });
      
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to start voice session:", err);
      onClose();
    }
  };

  useEffect(() => {
    startSession();
    return () => {
      sessionRef.current?.close();
      audioContextRef.current?.close();
      outputAudioContextRef.current?.close();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-indigo-950/98 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 text-white/30 hover:text-white transition-colors p-2"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      <div className="relative flex items-center justify-center h-64 w-64 mb-12">
        <div className={`absolute inset-0 bg-indigo-500/10 rounded-full animate-ping duration-[4000ms] ${status === 'listening' ? 'opacity-100' : 'opacity-0'}`}></div>
        <div className={`absolute inset-4 bg-indigo-400/20 rounded-full animate-pulse ${status !== 'idle' ? 'opacity-100' : 'opacity-0'}`}></div>
        <div className={`w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl z-10 transition-transform duration-700 ${status === 'speaking' ? 'scale-110' : 'scale-100'}`}>
          <div className="flex gap-2 items-center h-10">
            {[1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className={`w-1.5 bg-indigo-600 rounded-full transition-all duration-200 ${
                  status === 'speaking' ? 'h-full animate-bounce' : 
                  status === 'listening' ? 'h-4 animate-pulse' : 'h-1'
                }`}
                style={{ animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-xl w-full text-center space-y-8">
        <div className="space-y-3">
          <h2 className="text-white text-3xl font-bold tracking-tight">
            {status === 'connecting' ? 'Inizializzazione Sicura...' : 
             status === 'listening' ? 'In ascolto...' : 
             status === 'speaking' ? 'Analisi Memoria in corso' : 'Pronto'}
          </h2>
          <p className="text-indigo-300/50 text-xs font-black uppercase tracking-[0.3em]">Braik ai imprenditor Voice Intelligence</p>
        </div>

        <div className="min-h-[140px] bg-white/5 rounded-[2rem] p-8 border border-white/10 flex flex-col justify-center shadow-inner">
          {transcription && (
            <p className="text-indigo-100 text-lg font-medium opacity-80 italic animate-in slide-in-from-bottom-2">
              "{transcription}"
            </p>
          )}
          {aiTranscription && (
            <p className="text-white text-xl font-bold mt-4 leading-relaxed">
              {aiTranscription}
            </p>
          )}
          {!transcription && !aiTranscription && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-white/20 text-sm italic">Ambiente di ricerca protetto.</p>
              <p className="text-white/10 text-[10px] uppercase font-bold tracking-widest">End-to-End Encrypted</p>
            </div>
          )}
        </div>
      </div>

      <button 
        onClick={onClose}
        className="mt-16 bg-white/10 hover:bg-red-500/20 hover:text-red-200 text-white px-10 py-4 rounded-2xl font-bold transition-all border border-white/10"
      >
        Disattiva Microfono
      </button>
    </div>
  );
};

export default VoiceAssistant;
