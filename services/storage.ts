
import { BusinessEntry, UserProfile, ChatMessage, AuthState, WhatsAppSettings, SocialPlatformSettings } from '../types';

const STORAGE_KEY = 'corporate_mind_entries';
const PROFILE_KEY = 'corporate_mind_profile';
const CHAT_KEY = 'corporate_mind_chat';
const AUTH_KEY = 'corporate_mind_auth';
const WHATSAPP_KEY = 'corporate_mind_whatsapp';
const SOCIAL_KEY = 'corporate_mind_social';

export const storageService = {
  getEntries: (): BusinessEntry[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveEntry: (entry: BusinessEntry) => {
    const entries = storageService.getEntries();
    const existingIndex = entries.findIndex(e => e.id === entry.id);
    if (existingIndex >= 0) entries[existingIndex] = entry;
    else entries.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  },

  deleteEntry: (id: string) => {
    const entries = storageService.getEntries();
    const filtered = entries.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  getProfile: (): UserProfile => {
    const data = localStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : { name: 'Proprietario', companyName: 'Mia Azienda' };
  },

  saveProfile: (profile: UserProfile) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  },

  getChatHistory: (): ChatMessage[] => {
    const data = localStorage.getItem(CHAT_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveChatHistory: (messages: ChatMessage[]) => {
    localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
  },

  getAuthState: (): AuthState => {
    const data = localStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data) : { isConfigured: false };
  },

  saveAuthState: (state: AuthState) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(state));
  },

  // Added method to retrieve WhatsApp integration settings from local storage
  getWhatsAppSettings: (): WhatsAppSettings => {
    const data = localStorage.getItem(WHATSAPP_KEY);
    return data ? JSON.parse(data) : {
      isConnected: false,
      isEnabled: false,
      lastActivity: 0,
      autoReplyMode: 'contacts_only'
    };
  },

  // Added method to persist WhatsApp integration settings
  saveWhatsAppSettings: (settings: WhatsAppSettings) => {
    localStorage.setItem(WHATSAPP_KEY, JSON.stringify(settings));
  },

  // Added method to retrieve Social Automation settings for all supported platforms
  getSocialSettings: (): SocialPlatformSettings[] => {
    const data = localStorage.getItem(SOCIAL_KEY);
    if (data) return JSON.parse(data);
    return [
      { platform: 'facebook', isConnected: false, isEnabled: false, managedPages: [], repliesCount: 0, lastReplyTimestamp: 0 },
      { platform: 'instagram', isConnected: false, isEnabled: false, managedPages: [], repliesCount: 0, lastReplyTimestamp: 0 },
      { platform: 'tiktok', isConnected: false, isEnabled: false, managedPages: [], repliesCount: 0, lastReplyTimestamp: 0 }
    ];
  },

  // Added method to persist Social Automation settings array
  saveSocialSettings: (settings: SocialPlatformSettings[]) => {
    localStorage.setItem(SOCIAL_KEY, JSON.stringify(settings));
  },

  resetAll: () => {
    localStorage.clear();
  }
};
