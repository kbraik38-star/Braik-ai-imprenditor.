
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: string[];
}

export interface UserProfile {
  name: string;
  companyName: string;
  email?: string;
}

export interface AuthState {
  isConfigured: boolean;
  hashedPassword?: string;
  email?: string;
}

// Added ManagedPage interface for social automation tracking
export interface ManagedPage {
  id: string;
  name: string;
  handle: string;
  isActive: boolean;
  platform: 'facebook' | 'instagram' | 'tiktok';
  connectedAt: number;
}

// Added SocialPlatformSettings interface for tracking platform-specific automation state
export interface SocialPlatformSettings {
  platform: string;
  isConnected: boolean;
  isEnabled: boolean;
  managedPages: ManagedPage[];
  repliesCount: number;
  lastReplyTimestamp: number;
}

// Added WhatsAppSettings interface for managing WhatsApp integration state
export interface WhatsAppSettings {
  isConnected: boolean;
  isEnabled: boolean;
  lastActivity: number;
  autoReplyMode: 'contacts_only' | 'all';
}
