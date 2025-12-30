
import React, { useMemo } from 'react';
import { BusinessEntry, CalendarEvent, Reminder } from '../types';
import { storageService } from '../services/storage';

interface TimelineViewProps {
  entries: BusinessEntry[];
}

interface TimelineItem {
  id: string;
  type: string;
  title: string;
  content: string;
  timestamp: number;
  dateStr: string;
  color: string;
  icon: React.ReactNode;
}

const TimelineView: React.FC<TimelineViewProps> = ({ entries }) => {
  const calendarEvents = storageService.getCalendarEvents();
  const reminders = storageService.getReminders();

  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];

    // Mappa Business Entries
    entries.forEach(e => {
      items.push({
        id: e.id,
        type: e.type,
        title: e.title,
        content: e.content,
        timestamp: e.timestamp,
        dateStr: new Date(e.timestamp).toLocaleString('it-IT'),
        color: e.type === 'appointment' ? 'indigo' : e.type === 'document' ? 'purple' : e.type === 'contact' ? 'emerald' : 'cyan',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      });
    });

    // Mappa Calendar Events
    calendarEvents.forEach(e => {
      const ts = new Date(`${e.date}T${e.time}`).getTime();
      items.push({
        id: e.id,
        type: 'event',
        title: e.title,
        content: e.description,
        timestamp: ts,
        dateStr: `${e.date} alle ${e.time}`,
        color: 'amber',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      });
    });

    // Mappa Reminders
    reminders.forEach(r => {
      items.push({
        id: r.id,
        type: 'reminder',
        title: 'Promemoria',
        content: r.text,
        timestamp: r.dueTimestamp,
        dateStr: new Date(r.dueTimestamp).toLocaleString('it-IT'),
        color: r.isCompleted ? 'slate' : 'red',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        )
      });
    });

    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [entries, calendarEvents, reminders]);

  const colorMap: Record<string, string> = {
    indigo: 'border-indigo-500 text-indigo-400 bg-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.2)]',
    purple: 'border-purple-500 text-purple-400 bg-purple-500/10 shadow-[0_0_10px_rgba(168,85,247,0.2)]',
    emerald: 'border-emerald-500 text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    cyan: 'border-cyan-500 text-cyan-400 bg-cyan-500/10 shadow-[0_0_10px_rgba(6,182,212,0.2)]',
    amber: 'border-amber-500 text-amber-400 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
    red: 'border-red-500 text-red-400 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
    slate: 'border-slate-500 text-slate-500 bg-slate-500/10 opacity-50'
  };

  return (
    <div className="flex flex-col h-full bg-[#020617] rounded-[2.5rem] border border-white/5 overflow-hidden animate-in fade-in duration-700">
      <div className="p-8 border-b border-white/5 bg-white/5 backdrop-blur-xl shrink-0">
        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
          Azienda <span className="text-cyan-400">Neural Flow</span>
        </h2>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Registro Cronologico Omnicomprensivo</p>
      </div>

      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
        {/* Vertical Line */}
        <div className="absolute left-[54px] top-10 bottom-10 w-px bg-white/5"></div>

        <div className="space-y-12 max-w-4xl">
          {timelineItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-white font-bold text-lg">Timeline in Attesa di Dati</h3>
              <p className="text-slate-500 text-sm max-w-xs mt-2 italic">Aggiungi note, appuntamenti o documenti per popolare il flusso temporale.</p>
            </div>
          ) : (
            timelineItems.map((item) => (
              <div key={item.id} className="relative flex items-start gap-8 group">
                {/* Node */}
                <div className={`w-10 h-10 rounded-xl border shrink-0 flex items-center justify-center transition-all duration-300 z-10 ${colorMap[item.color]}`}>
                  {item.icon}
                </div>

                <div className="flex-1 space-y-2 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.dateStr}</span>
                    <span className="text-[9px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded uppercase tracking-tighter">{item.type}</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-6 rounded-2xl group-hover:border-white/10 group-hover:bg-white/[0.07] transition-all cursor-default">
                    <h4 className="text-white font-bold text-lg mb-2">{item.title}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">{item.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
