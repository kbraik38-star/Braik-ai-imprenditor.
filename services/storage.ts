
import { BusinessEntry, UserProfile, ChatMessage, AuthState, CalendarEvent, Reminder, SocialPlatformSettings, ChatSession, BehavioralInsights } from '../types';

// Chiavi globali
const CURRENT_USER_EMAIL = 'braik_active_user';
const USERS_DB = 'braik_users_registry';

export const storageService = {
  // --- AUTH & USER REGISTRY ---
  getActiveUserEmail: (): string | null => {
    return localStorage.getItem(CURRENT_USER_EMAIL);
  },

  setActiveUser: (email: string) => {
    localStorage.setItem(CURRENT_USER_EMAIL, email);
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_EMAIL);
  },

  getUsersRegistry: (): Record<string, { profile: UserProfile, auth: AuthState }> => {
    const data = localStorage.getItem(USERS_DB);
    return data ? JSON.parse(data) : {};
  },

  saveUserToRegistry: (email: string, profile: UserProfile, auth: AuthState) => {
    const db = storageService.getUsersRegistry();
    db[email] = { profile, auth };
    localStorage.setItem(USERS_DB, JSON.stringify(db));
  },

  // --- TRIAL LOGIC (NON-BLOCKING) ---
  checkTrialStatus: (): { isValid: boolean; daysLeft: number; isExpired: boolean } => {
    const email = storageService.getActiveUserEmail();
    if (!email) return { isValid: false, daysLeft: 0, isExpired: false };
    
    const db = storageService.getUsersRegistry();
    const user = db[email];
    
    // Gli utenti registrati "Full" non hanno trial
    if (!user || !user.profile.isTrial) return { isValid: true, daysLeft: 999, isExpired: false };

    const start = user.profile.trialStartDate || user.profile.registrationDate;
    const now = Date.now();
    const diff = now - start;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    
    const daysPassed = Math.floor(diff / (24 * 60 * 60 * 1000));
    const isExpired = diff >= sevenDaysMs;
    
    return { 
      isValid: !isExpired, 
      isExpired,
      daysLeft: Math.max(0, 7 - daysPassed) 
    };
  },

  // --- DATA ACCESS (Scoped by Email) ---
  getUserKey: (base: string) => {
    const email = storageService.getActiveUserEmail();
    return email ? `braik_${btoa(email)}_${base}` : `braik_guest_${base}`;
  },

  getEntries: (): BusinessEntry[] => {
    const data = localStorage.getItem(storageService.getUserKey('entries'));
    return data ? JSON.parse(data) : [];
  },

  getHistoricalEntries: (): BusinessEntry[] => {
    const entries = storageService.getEntries();
    const today = new Date();
    return entries.filter(e => {
      const d = new Date(e.timestamp);
      return d.getDate() === today.getDate() && 
             d.getMonth() === today.getMonth() && 
             d.getFullYear() < today.getFullYear();
    });
  },

  saveEntry: (entry: BusinessEntry) => {
    const entries = storageService.getEntries();
    const existingIndex = entries.findIndex(e => e.id === entry.id);
    if (existingIndex >= 0) entries[existingIndex] = entry;
    else entries.push(entry);
    localStorage.setItem(storageService.getUserKey('entries'), JSON.stringify(entries));
  },

  deleteEntry: (id: string) => {
    const entries = storageService.getEntries();
    const filtered = entries.filter(e => e.id !== id);
    localStorage.setItem(storageService.getUserKey('entries'), JSON.stringify(filtered));
  },

  getInsights: (): BehavioralInsights => {
    const data = localStorage.getItem(storageService.getUserKey('insights'));
    return data ? JSON.parse(data) : {
      writingStyle: 'Analisi in corso...',
      frequentTopics: [],
      anticipatedNeeds: [],
      guardianAlerts: [],
      lastAnalysis: 0
    };
  },

  saveInsights: (insights: BehavioralInsights) => {
    localStorage.setItem(storageService.getUserKey('insights'), JSON.stringify(insights));
  },

  getCalendarEvents: (): CalendarEvent[] => {
    const data = localStorage.getItem(storageService.getUserKey('calendar'));
    return data ? JSON.parse(data) : [];
  },

  saveCalendarEvent: (event: CalendarEvent) => {
    const events = storageService.getCalendarEvents();
    events.push(event);
    localStorage.setItem(storageService.getUserKey('calendar'), JSON.stringify(events));
  },

  getReminders: (): Reminder[] => {
    const data = localStorage.getItem(storageService.getUserKey('reminders'));
    return data ? JSON.parse(data) : [];
  },

  saveReminder: (reminder: Reminder) => {
    const reminders = storageService.getReminders();
    reminders.push(reminder);
    localStorage.setItem(storageService.getUserKey('reminders'), JSON.stringify(reminders));
  },

  getSocialSettings: (): SocialPlatformSettings[] => {
    const data = localStorage.getItem(storageService.getUserKey('social_settings'));
    return data ? JSON.parse(data) : [
      { platform: 'facebook', isConnected: false, isEnabled: false },
      { platform: 'instagram', isConnected: false, isEnabled: false },
      { platform: 'tiktok', isConnected: false, isEnabled: false }
    ];
  },

  saveSocialSettings: (settings: SocialPlatformSettings[]) => {
    localStorage.setItem(storageService.getUserKey('social_settings'), JSON.stringify(settings));
  },

  toggleReminder: (id: string) => {
    const reminders = storageService.getReminders().map(r => 
      r.id === id ? { ...r, isCompleted: !r.isCompleted } : r
    );
    localStorage.setItem(storageService.getUserKey('reminders'), JSON.stringify(reminders));
  },

  getSearchHistory: (): ChatMessage[] => {
    const data = localStorage.getItem(storageService.getUserKey('search_history'));
    return data ? JSON.parse(data) : [];
  },

  saveSearchHistory: (messages: ChatMessage[]) => {
    localStorage.setItem(storageService.getUserKey('search_history'), JSON.stringify(messages));
  },

  getSessions: (): ChatSession[] => {
    const data = localStorage.getItem(storageService.getUserKey('workspace_sessions'));
    return data ? JSON.parse(data) : [];
  },

  saveSession: (session: ChatSession) => {
    const sessions = storageService.getSessions();
    const idx = sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) sessions[idx] = session;
    else sessions.push(session);
    localStorage.setItem(storageService.getUserKey('workspace_sessions'), JSON.stringify(sessions));
  },

  getProfile: (): UserProfile => {
    const email = storageService.getActiveUserEmail();
    if (!email) return { name: 'Ospite', companyName: 'Demo Azienda', email: 'guest@braik.ai', registrationDate: Date.now(), isTrial: true };
    const db = storageService.getUsersRegistry();
    return db[email]?.profile || { name: 'Ospite', companyName: 'Demo Azienda', email, registrationDate: Date.now(), isTrial: true };
  },

  saveProfile: (profile: UserProfile) => {
    const email = storageService.getActiveUserEmail();
    if (!email) return;
    const db = storageService.getUsersRegistry();
    if (db[email]) {
      db[email].profile = profile;
      localStorage.setItem(USERS_DB, JSON.stringify(db));
    }
  },

  getAuthState: (): AuthState => {
    const email = storageService.getActiveUserEmail();
    if (!email) return { isConfigured: false };
    const db = storageService.getUsersRegistry();
    return db[email]?.auth || { isConfigured: false };
  },

  resetAll: () => {
    localStorage.clear();
  }
};
