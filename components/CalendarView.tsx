
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { CalendarEvent, Reminder, BusinessEntry } from '../types';

interface CalendarViewProps {
  entries: BusinessEntry[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ entries }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>(storageService.getReminders());
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    duration: 60
  });

  // LOGICA AI: Sincronizza AUTOMATICAMENTE gli appuntamenti dal Knowledge Base
  useEffect(() => {
    const appointmentsAsEvents = entries
      .filter(e => e.type === 'appointment')
      .map(e => ({
        id: `kb-${e.id}`,
        title: e.title,
        description: e.content,
        date: e.date || new Date(e.timestamp).toISOString().split('T')[0],
        time: "09:00", 
        duration: 60,
        isAIRelated: true
      }));
    
    const manualEvents = storageService.getCalendarEvents();
    setEvents([...manualEvents, ...appointmentsAsEvents]);
  }, [entries]);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const event: CalendarEvent = {
      ...newEvent as CalendarEvent,
      id: Date.now().toString(),
      isAIRelated: false
    };
    storageService.saveCalendarEvent(event);
    setEvents(prev => [...prev, event]);
    setIsAddingEvent(false);
  };

  const handleAddReminder = (text: string) => {
    const reminder: Reminder = {
      id: Date.now().toString(),
      text,
      dueTimestamp: Date.now() + 86400000,
      isCompleted: false
    };
    storageService.saveReminder(reminder);
    setReminders(prev => [...prev, reminder]);
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  return (
    <div className="flex flex-col h-full bg-[#020617] rounded-[2.5rem] border border-white/5 overflow-hidden animate-in fade-in zoom-in duration-500">
      {/* Header HUD */}
      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-xl">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
            Agenda <span className="text-cyan-400">Mensile</span> Braik
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Protocollo Sincronizzazione AI Attivo</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-black/40 rounded-xl p-1 border border-white/5">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:text-cyan-400 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-[10px] font-black text-white uppercase tracking-widest px-4 min-w-[140px] text-center">
              {currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => changeMonth(1)} className="p-2 hover:text-cyan-400 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <button onClick={() => setIsAddingEvent(true)} className="bg-white text-black h-10 w-10 flex items-center justify-center rounded-xl hover:bg-cyan-400 transition-all shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Griglia Mensile */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-7 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
              <div key={d} className="bg-[#020617] p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center border-b border-white/5">{d}</div>
            ))}
            {Array.from({ length: 42 }).map((_, i) => {
              const day = i - (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1) + 1;
              const isValidDay = day > 0 && day <= daysInMonth(currentDate.getFullYear(), currentDate.getMonth());
              const dayStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = events.filter(e => e.date === dayStr);
              const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

              return (
                <div key={i} className={`min-h-[120px] bg-[#020617] border-white/5 p-3 transition-colors ${isValidDay ? 'hover:bg-white/5' : 'opacity-10'}`}>
                  {isValidDay && (
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-bold ${isToday ? 'text-cyan-400 underline underline-offset-4 decoration-2' : 'text-slate-500'}`}>{day}</span>
                        {dayEvents.length > 0 && <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.map(ev => (
                          <div key={ev.id} className={`text-[9px] p-2 rounded-lg border leading-tight ${ev.isAIRelated ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.1)]' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'}`}>
                            <p className="font-black uppercase truncate">{ev.title}</p>
                            <p className="opacity-60">{ev.time}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Reminders Sidebar HUD */}
        <div className="w-80 border-l border-white/5 bg-black/20 p-8 flex flex-col gap-8">
          <div>
            <h3 className="text-xs font-black text-cyan-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
              Alert AI
            </h3>
            <div className="space-y-3">
              {reminders.filter(r => !r.isCompleted).map(rem => (
                <div key={rem.id} className="bg-white/5 border border-white/5 p-4 rounded-xl group hover:bg-white/10 transition-all">
                  <div className="flex items-start gap-3">
                    <button 
                      onClick={() => {
                        storageService.toggleReminder(rem.id);
                        setReminders(storageService.getReminders());
                      }}
                      className="w-4 h-4 rounded border border-cyan-500/50 mt-0.5 group-hover:bg-cyan-500/20 transition-all"
                    ></button>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">{rem.text}</p>
                  </div>
                </div>
              ))}
              <button 
                onClick={() => {
                  const txt = prompt("Cosa devo ricordarti?");
                  if(txt) handleAddReminder(txt);
                }}
                className="w-full py-3 border border-dashed border-white/10 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:border-cyan-500/50 hover:text-cyan-400 transition-all"
              >
                + Aggiungi Alert
              </button>
            </div>
          </div>

          <div className="mt-auto">
            <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Stato Sincronizzazione</p>
              <p className="text-[11px] text-indigo-200/80 leading-relaxed italic">
                "Gli appuntamenti salvati nell'Archivio Dati sono stati proiettati correttamente nell'agenda mensile."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Aggiunta Manuale */}
      {isAddingEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-6">
          <div className="bg-[#020617] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-black text-white uppercase italic mb-6">Punto <span className="text-cyan-400">Temporale Manuale</span></h3>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <input type="text" placeholder="Titolo Evento" required value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-cyan-500" />
              <textarea placeholder="Dettagli" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-cyan-500 resize-none h-24" />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
                <input type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAddingEvent(false)} className="flex-1 py-4 border border-white/10 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-white/5">Annulla</button>
                <button type="submit" className="flex-1 py-4 bg-cyan-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Sincronizza</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
