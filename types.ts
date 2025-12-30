
export type EntryType = 'note' | 'appointment' | 'contact' | 'document' | 'general';

export interface BusinessEntry {
  id: string;
  type: EntryType;
  title: string;
  content: string;
  date?: string;
  timestamp: number;
  isSensitive: boolean;
  metadata?: Record<string, string>;
}

export interface GuardianAlert {
  id: string;
  type: 'forgotten' | 'anomaly' | 'strategy';
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
}

export interface BehavioralInsights {
  writingStyle: string;
  frequentTopics: string[];
  anticipatedNeeds: string[];
  lastAnalysis: number;
  guardianAlerts: GuardianAlert[];
}

export interface WeeklyStrategy {
  goals: string[];
  dailyPlans: {
    day: string;
    slots: { time: string; activity: string; priority: 'high' | 'medium' | 'low'; reason: string }[];
  }[];
  criticalAlerts: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  duration: number; // in minuti
  isAIRelated: boolean;
}

export interface Reminder {
  id: string;
  text: string;
  dueTimestamp: number;
  isCompleted: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: { uri: string; title: string }[];
  imageUrl?: string;
  suggestedSave?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdate: number;
}

export interface UserProfile {
  name: string;
  companyName: string;
  email: string;
  registrationDate: number;
  isTrial: boolean;
  trialStartDate?: number;
}

export interface AuthState {
  isConfigured: boolean;
  hashedPassword?: string;
  email?: string;
}

export interface SocialPlatformSettings {
  platform: string;
  isConnected: boolean;
  isEnabled: boolean;
}
