
import React, { useState } from 'react';
import { BusinessEntry, CalendarEvent, WeeklyStrategy } from '../types';
import { generateWeeklyStrategy } from '../services/geminiService';
import { storageService } from '../services/storage';

interface NeuralStrategyProps {
  entries: BusinessEntry[];
}

const NeuralStrategy: React.FC<NeuralStrategyProps> = ({ entries }) => {
  const [strategy, setStrategy] = useState<WeeklyStrategy | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const events = storageService.getCalendarEvents();
      const plan = await generateWeeklyStrategy(entries, events);
      setStrategy(plan);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#020617] rounded-[2.5rem] border border-white/5 overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-xl shrink-0">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
            Neural <span className="text-cyan-400">Strategy Lab</span>
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">IA Autonoma di Coordinamento Aziendale</p>
        </div>
        {!strategy && (
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-cyan-500 text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                Analisi in corso...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Organizza la Settimana
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
        {!strategy ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto opacity-40">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10 animate-pulse">
              <svg className="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            </div>
            <h3 className="text-white font-black uppercase italic tracking-tighter text-xl">Nessun Piano Attivo</h3>
            <p className="text-slate-500 text-xs mt-3 leading-relaxed">
              Attiva il protocollo per far sì che l'IA scansioni i tuoi appuntamenti e note, creando una roadmap di lavoro autonoma.
            </p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-12 pb-10">
            {/* Goals section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {strategy.goals.map((goal, idx) => (
                <div key={idx} className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-3xl relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 block">Macro Obiettivo 0{idx+1}</span>
                  <p className="text-white font-bold text-sm italic">"{goal}"</p>
                </div>
              ))}
            </div>

            {/* Daily Roadmap */}
            <div className="space-y-8">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-4">
                <span className="h-px flex-1 bg-white/5"></span>
                Roadmap Giornaliera
                <span className="h-px flex-1 bg-white/5"></span>
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {strategy.dailyPlans.map((dayPlan, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/[0.07] transition-all">
                    <h5 className="text-lg font-black text-white italic mb-6 border-b border-white/5 pb-4">{dayPlan.day}</h5>
                    <div className="space-y-6">
                      {dayPlan.slots.map((slot, sIdx) => (
                        <div key={sIdx} className="relative pl-6 border-l-2 border-white/10 hover:border-cyan-500 transition-all">
                          <div className={`absolute -left-[5px] top-0 w-2 h-2 rounded-full ${slot.priority === 'high' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : slot.priority === 'medium' ? 'bg-amber-500' : 'bg-cyan-500'}`}></div>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{slot.time}</span>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${slot.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-slate-500'}`}>{slot.priority}</span>
                          </div>
                          <p className="text-white font-bold text-sm mb-1">{slot.activity}</p>
                          <p className="text-slate-500 text-[10px] italic leading-tight">{slot.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Alerts */}
            {strategy.criticalAlerts.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8">
                <h4 className="text-[10px] font-black text-red-400 uppercase tracking-[0.3em] mb-4">Punti Critici Rilevati</h4>
                <div className="space-y-3">
                  {strategy.criticalAlerts.map((alert, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-red-200/80 text-xs">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      {alert}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center pt-8">
              <button onClick={() => setStrategy(null)} className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] hover:text-white transition-all">
                Reset Protocollo Strategico
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NeuralStrategy;
