import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface UserSettings {
  // Profile settings
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    timezone: string;
    language: string;
  };
  
  // Theme preferences
  theme: {
    mode: 'light' | 'dark' | 'system';
    primaryColor: string;
    compactMode: boolean;
  };
  
  // Notification preferences
  notifications: {
    email: {
      enabled: boolean;
      marketing: boolean;
      security: boolean;
      updates: boolean;
      billing: boolean;
    };
    push: {
      enabled: boolean;
      mentions: boolean;
      comments: boolean;
      updates: boolean;
    };
    digest: 'never' | 'daily' | 'weekly';
  };
  
  // API configuration
  api: {
    airtableKey?: string;
    hasValidKey: boolean;
    keyLastTested?: string;
  };
}

interface SettingsState {
  // Settings data
  settings: UserSettings;
  
  // UI state
  isLoading: boolean;
  isSaving: boolean;
  lastSaved?: string;
  hasUnsavedChanges: boolean;
  
  // Actions
  updateProfile: (profile: Partial<UserSettings['profile']>) => void;
  updateTheme: (theme: Partial<UserSettings['theme']>) => void;
  updateNotifications: (notifications: Partial<UserSettings['notifications']>) => void;
  updateApiKey: (key: string, isValid?: boolean) => void;
  removeApiKey: () => void;
  saveSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;
  resetToDefaults: () => void;
  
  // Utilities
  markAsUnsaved: () => void;
  markAsSaved: () => void;
}

const defaultSettings: UserSettings = {
  profile: {
    firstName: '',
    lastName: '',
    email: '',
    timezone: 'UTC',
    language: 'en',
  },
  theme: {
    mode: 'system',
    primaryColor: '#3b82f6',
    compactMode: false,
  },
  notifications: {
    email: {
      enabled: true,
      marketing: false,
      security: true,
      updates: true,
      billing: true,
    },
    push: {
      enabled: true,
      mentions: true,
      comments: true,
      updates: false,
    },
    digest: 'weekly',
  },
  api: {
    hasValidKey: false,
  },
};

export const useSettingsStore = create<SettingsState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    settings: defaultSettings,
    isLoading: false,
    isSaving: false,
    hasUnsavedChanges: false,

    // Actions
    updateProfile: (profile) => {
      set((state) => ({
        settings: {
          ...state.settings,
          profile: { ...state.settings.profile, ...profile },
        },
        hasUnsavedChanges: true,
      }));
    },

    updateTheme: (theme) => {
      set((state) => ({
        settings: {
          ...state.settings,
          theme: { ...state.settings.theme, ...theme },
        },
        hasUnsavedChanges: true,
      }));
    },

    updateNotifications: (notifications) => {
      set((state) => ({
        settings: {
          ...state.settings,
          notifications: {
            ...state.settings.notifications,
            ...notifications,
            email: notifications.email 
              ? { ...state.settings.notifications.email, ...notifications.email }
              : state.settings.notifications.email,
            push: notifications.push
              ? { ...state.settings.notifications.push, ...notifications.push }
              : state.settings.notifications.push,
          },
        },
        hasUnsavedChanges: true,
      }));
    },

    updateApiKey: (key, isValid = false) => {
      set((state) => ({
        settings: {
          ...state.settings,
          api: {
            ...state.settings.api,
            airtableKey: key,
            hasValidKey: isValid,
            keyLastTested: isValid ? new Date().toISOString() : state.settings.api.keyLastTested,
          },
        },
        hasUnsavedChanges: true,
      }));
    },

    removeApiKey: () => {
      set((state) => ({
        settings: {
          ...state.settings,
          api: {
            hasValidKey: false,
          },
        },
        hasUnsavedChanges: true,
      }));
    },

    saveSettings: async () => {
      const { settings } = get();
      set({ isSaving: true });

      try {
        // Simulate API call to save settings
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real app, make API call here:
        // await settingsApi.update(settings);
        
        set({ 
          hasUnsavedChanges: false, 
          lastSaved: new Date().toISOString() 
        });
      } catch (error) {
        console.error('Failed to save settings:', error);
        throw error;
      } finally {
        set({ isSaving: false });
      }
    },

    loadSettings: async () => {
      set({ isLoading: true });

      try {
        // Simulate API call to load settings
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // In a real app, make API call here:
        // const userSettings = await settingsApi.get();
        // set({ settings: userSettings });
        
        // For now, use default settings
        set({ 
          settings: defaultSettings,
          hasUnsavedChanges: false,
        });
      } catch (error) {
        console.error('Failed to load settings:', error);
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },

    resetToDefaults: () => {
      set({
        settings: defaultSettings,
        hasUnsavedChanges: true,
      });
    },

    // Utilities
    markAsUnsaved: () => set({ hasUnsavedChanges: true }),
    markAsSaved: () => set({ 
      hasUnsavedChanges: false, 
      lastSaved: new Date().toISOString() 
    }),
  }))
);