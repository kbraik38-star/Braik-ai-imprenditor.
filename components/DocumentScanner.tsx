
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
      // Fix: Changed '理想' to 'ideal' to match standard Web API property names for constraints.
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      setError("Impossibile accedere alla fotocamera. Verifica i permessi.");
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
      setError("Analisi fallita. Riprova con una luce migliore.");
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="absolute top-6 left-6 z-10">
        <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-4 rounded-full text-white backdrop-blur-md transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-center p-8">
            <p className="text-red-400 font-bold mb-4">{error}</p>
            <button onClick={onClose} className="bg-white text-black px-6 py-3 rounded-xl font-bold">Torna Indietro</button>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            
            {/* Overlay Scanner GUI */}
            <div className="absolute inset-0 border-[2px] border-cyan-500/30 pointer-events-none">
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-[scan_3s_infinite_linear]"></div>
              <div className="absolute inset-10 border-2 border-dashed border-white/20 rounded-3xl"></div>
              
              <style>{`
                @keyframes scan {
                  0% { transform: translateY(-30vh); opacity: 0; }
                  20% { opacity: 1; }
                  80% { opacity: 1; }
                  100% { transform: translateY(30vh); opacity: 0; }
                }
              `}</style>
            </div>

            <div className="absolute bottom-12 flex flex-col items-center gap-6 w-full px-8">
              {isScanning ? (
                <div className="flex flex-col items-center gap-4 bg-black/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-cyan-500/30">
                  <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                  <p className="text-cyan-400 text-xs font-black uppercase tracking-[0.3em] animate-pulse">Analisi Neurale in corso...</p>
                </div>
              ) : (
                <button 
                  onClick={captureAndAnalyze}
                  className="w-20 h-20 bg-white rounded-full border-8 border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center justify-center group active:scale-90 transition-all"
                >
                  <div className="w-14 h-14 bg-white rounded-full border-2 border-black/10 group-hover:scale-110 transition-transform"></div>
                </button>
              )}
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest text-center">
                Inquadra il documento: contratto, nota o appunto fisso
              </p>
            </div>
          </>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default DocumentScanner;
