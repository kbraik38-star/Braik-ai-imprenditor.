
import React, { useRef, useState, useEffect } from 'react';
import { analyzeDocument } from '../services/geminiService';
import { BusinessEntry } from '../types';

interface DocumentScannerProps {
  onScanComplete: (entry: BusinessEntry) => void;
  onClose: () => void;
}

const DocumentScanner: React.FC<DocumentScannerProps> = ({ onScanComplete, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      setError("Impossibile accedere alla fotocamera. Verifica i permessi nelle impostazioni del browser.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || isScanning) return;

    setIsScanning(true);
    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    const base64 = canvasRef.current.toDataURL('image/jpeg', 0.8);

    try {
      const analysis = await analyzeDocument(base64);
      const entry: BusinessEntry = {
        id: `scan-${Date.now()}`,
        type: analysis.type,
        title: analysis.title,
        content: analysis.content,
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
        isSensitive: false
      };
      onScanComplete(entry);
    } catch (err) {
      setError("Analisi fallita. Riprova con una luce migliore o inquadrando più da vicino.");
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="absolute top-6 left-6 z-10 flex items-center gap-4">
        <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-4 rounded-full text-white backdrop-blur-md transition-all border border-white/10">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Inquadramento Attivo</p>
        </div>
      </div>

      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-center p-8 bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-red-500/20 max-w-xs">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <p className="text-white text-sm font-bold mb-6 leading-relaxed">{error}</p>
            <button onClick={() => { setError(null); startCamera(); }} className="w-full bg-white text-black px-6 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest">Riprova</button>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            
            {/* Scanner HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner Brackets */}
              <div className="absolute top-20 left-10 w-12 h-12 border-t-2 border-l-2 border-cyan-400 rounded-tl-3xl shadow-[-5px_-5px_20px_rgba(34,211,238,0.3)]"></div>
              <div className="absolute top-20 right-10 w-12 h-12 border-t-2 border-r-2 border-cyan-400 rounded-tr-3xl shadow-[5px_-5px_20px_rgba(34,211,238,0.3)]"></div>
              <div className="absolute bottom-40 left-10 w-12 h-12 border-b-2 border-l-2 border-cyan-400 rounded-bl-3xl shadow-[-5px_5px_20px_rgba(34,211,238,0.3)]"></div>
              <div className="absolute bottom-40 right-10 w-12 h-12 border-b-2 border-r-2 border-cyan-400 rounded-br-3xl shadow-[5px_5px_20px_rgba(34,211,238,0.3)]"></div>

              {/* Laser Animation */}
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-[scan_3s_infinite_linear]"></div>
              
              <style>{`
                @keyframes scan {
                  0% { transform: translateY(-30vh); opacity: 0; }
                  20% { opacity: 1; }
                  80% { opacity: 1; }
                  100% { transform: translateY(30vh); opacity: 0; }
                }
              `}</style>

              {/* Center Crosshair */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 opacity-40">
                <div className="absolute top-1/2 left-0 w-full h-px bg-white"></div>
                <div className="absolute left-1/2 top-0 h-full w-px bg-white"></div>
              </div>
            </div>

            <div className="absolute bottom-12 flex flex-col items-center gap-6 w-full px-8">
              {isScanning ? (
                <div className="flex flex-col items-center gap-4 bg-black/80 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-cyan-500/30 shadow-2xl scale-110 transition-transform">
                  <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                  <div className="text-center">
                    <p className="text-cyan-400 text-xs font-black uppercase tracking-[0.3em] animate-pulse">Analisi Neurale...</p>
                    <p className="text-white/40 text-[8px] uppercase tracking-widest mt-1">Estraendo Memoria</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-8">
                  <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/5 text-center">
                     <p className="text-white font-medium text-xs">Punta la fotocamera su una nota o un contratto</p>
                  </div>
                  <button 
                    onClick={captureAndAnalyze}
                    className="w-24 h-24 bg-white rounded-full border-8 border-white/20 shadow-[0_0_60px_rgba(255,255,255,0.4)] flex items-center justify-center group active:scale-95 transition-all"
                  >
                    <div className="w-16 h-16 bg-white rounded-full border-2 border-black/10 group-hover:scale-105 transition-transform flex items-center justify-center">
                       <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default DocumentScanner;
