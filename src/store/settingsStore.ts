import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OpenRouterKey, GeminiKey, OllamaKey, AppSettings, CustomCss, AIProvider, FirebaseConfig } from '@/types/blog';

const generateId = () => Math.random().toString(36).substr(2, 9);

interface SettingsStore {
  settings: AppSettings;
  
  // OpenRouter actions
  addOpenRouterKey: (key: string, name: string) => void;
  removeOpenRouterKey: (id: string) => void;
  updateOpenRouterKey: (id: string, updates: Partial<OpenRouterKey>) => void;
  toggleKeyActive: (id: string) => void;
  markKeyFailed: (id: string) => void;
  resetKeyFailCount: (id: string) => void;
  getActiveKey: () => OpenRouterKey | null;
  getNextWorkingKey: () => OpenRouterKey | null;
  
  // Gemini actions
  addGeminiKey: (key: string, name: string) => void;
  removeGeminiKey: (id: string) => void;
  updateGeminiKey: (id: string, updates: Partial<GeminiKey>) => void;
  toggleGeminiKeyActive: (id: string) => void;
  markGeminiKeyFailed: (id: string) => void;
  resetGeminiKeyFailCount: (id: string) => void;
  getActiveGeminiKey: () => GeminiKey | null;
  
  // Ollama actions
  addOllamaKey: (key: string, name: string) => void;
  removeOllamaKey: (id: string) => void;
  updateOllamaKey: (id: string, updates: Partial<OllamaKey>) => void;
  toggleOllamaKeyActive: (id: string) => void;
  markOllamaKeyFailed: (id: string) => void;
  resetOllamaKeyFailCount: (id: string) => void;
  getActiveOllamaKey: () => OllamaKey | null;
  
  // General settings
  setDefaultModel: (model: string) => void;
  setDefaultOllamaModel: (model: string) => void;
  setDefaultProvider: (provider: AIProvider) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Custom CSS actions
  addCustomCss: (name: string, code: string, description?: string) => void;
  removeCustomCss: (id: string) => void;
  updateCustomCss: (id: string, updates: Partial<CustomCss>) => void;
  toggleCustomCss: (id: string) => void;
  
  // Firebase actions
  setFirebaseConfig: (config: FirebaseConfig | undefined) => void;
  setFirebaseAutoSync: (enabled: boolean) => void;
  setSyncNotifications: (enabled: boolean) => void;
  
  // Sound notifications
  setSoundNotificationsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: {
        openRouterKeys: [],
        geminiKeys: [],
        ollamaKeys: [],
        defaultModel: 'gemini-2.5-flash',
        defaultOllamaModel: 'gemini-3-flash-preview:cloud',
        defaultProvider: 'lovable',
        theme: 'system',
        customCss: [],
        soundNotificationsEnabled: true,
      },
      
      // OpenRouter actions
      addOpenRouterKey: (key, name) => set((state) => ({
        settings: {
          ...state.settings,
          openRouterKeys: [...state.settings.openRouterKeys, { id: generateId(), key, name, isActive: state.settings.openRouterKeys.length === 0, failCount: 0 }],
        },
      })),
      
      removeOpenRouterKey: (id) => set((state) => ({
        settings: { ...state.settings, openRouterKeys: state.settings.openRouterKeys.filter((k) => k.id !== id) },
      })),
      
      updateOpenRouterKey: (id, updates) => set((state) => ({
        settings: { ...state.settings, openRouterKeys: state.settings.openRouterKeys.map((k) => k.id === id ? { ...k, ...updates } : k) },
      })),
      
      toggleKeyActive: (id) => set((state) => ({
        settings: { ...state.settings, openRouterKeys: state.settings.openRouterKeys.map((k) => k.id === id ? { ...k, isActive: !k.isActive } : k) },
      })),
      
      markKeyFailed: (id) => set((state) => {
        const keys = state.settings.openRouterKeys.map((k) => k.id === id ? { ...k, failCount: k.failCount + 1 } : k);
        const failedKey = keys.find((k) => k.id === id);
        if (failedKey && failedKey.failCount >= 3) {
          const nextKey = keys.find((k) => k.id !== id && k.isActive && k.failCount < 3);
          if (nextKey) {
            return { settings: { ...state.settings, openRouterKeys: keys.map((k) => ({ ...k, isActive: k.id === nextKey.id })) } };
          }
        }
        return { settings: { ...state.settings, openRouterKeys: keys } };
      }),
      
      resetKeyFailCount: (id) => set((state) => ({
        settings: { ...state.settings, openRouterKeys: state.settings.openRouterKeys.map((k) => k.id === id ? { ...k, failCount: 0 } : k) },
      })),
      
      getActiveKey: () => {
        const { settings } = get();
        return settings.openRouterKeys.find((k) => k.isActive && k.failCount < 3) || null;
      },
      
      getNextWorkingKey: () => {
        const { settings } = get();
        const activeKey = settings.openRouterKeys.find((k) => k.isActive);
        if (!activeKey || activeKey.failCount >= 3) {
          return settings.openRouterKeys.find((k) => k.failCount < 3) || null;
        }
        return activeKey;
      },
      
      // Gemini actions
      addGeminiKey: (key, name) => set((state) => ({
        settings: {
          ...state.settings,
          geminiKeys: [...state.settings.geminiKeys, { id: generateId(), key, name, isActive: state.settings.geminiKeys.length === 0, failCount: 0 }],
        },
      })),
      
      removeGeminiKey: (id) => set((state) => ({
        settings: { ...state.settings, geminiKeys: state.settings.geminiKeys.filter((k) => k.id !== id) },
      })),
      
      updateGeminiKey: (id, updates) => set((state) => ({
        settings: { ...state.settings, geminiKeys: state.settings.geminiKeys.map((k) => k.id === id ? { ...k, ...updates } : k) },
      })),
      
      toggleGeminiKeyActive: (id) => set((state) => ({
        settings: { ...state.settings, geminiKeys: state.settings.geminiKeys.map((k) => k.id === id ? { ...k, isActive: !k.isActive } : k) },
      })),
      
      markGeminiKeyFailed: (id) => set((state) => {
        const keys = state.settings.geminiKeys.map((k) => k.id === id ? { ...k, failCount: k.failCount + 1 } : k);
        const failedKey = keys.find((k) => k.id === id);
        if (failedKey && failedKey.failCount >= 3) {
          const nextKey = keys.find((k) => k.id !== id && k.isActive && k.failCount < 3);
          if (nextKey) {
            return { settings: { ...state.settings, geminiKeys: keys.map((k) => ({ ...k, isActive: k.id === nextKey.id })) } };
          }
        }
        return { settings: { ...state.settings, geminiKeys: keys } };
      }),
      
      resetGeminiKeyFailCount: (id) => set((state) => ({
        settings: { ...state.settings, geminiKeys: state.settings.geminiKeys.map((k) => k.id === id ? { ...k, failCount: 0 } : k) },
      })),
      
      getActiveGeminiKey: () => {
        const { settings } = get();
        return settings.geminiKeys.find((k) => k.isActive && k.failCount < 3) || null;
      },
      
      // Ollama actions
      addOllamaKey: (key, name) => set((state) => ({
        settings: {
          ...state.settings,
          ollamaKeys: [...(state.settings.ollamaKeys || []), { id: generateId(), key, name, isActive: (state.settings.ollamaKeys?.length || 0) === 0, failCount: 0 }],
        },
      })),
      
      removeOllamaKey: (id) => set((state) => ({
        settings: { ...state.settings, ollamaKeys: (state.settings.ollamaKeys || []).filter((k) => k.id !== id) },
      })),
      
      updateOllamaKey: (id, updates) => set((state) => ({
        settings: { ...state.settings, ollamaKeys: (state.settings.ollamaKeys || []).map((k) => k.id === id ? { ...k, ...updates } : k) },
      })),
      
      toggleOllamaKeyActive: (id) => set((state) => ({
        settings: { ...state.settings, ollamaKeys: (state.settings.ollamaKeys || []).map((k) => k.id === id ? { ...k, isActive: !k.isActive } : k) },
      })),
      
      markOllamaKeyFailed: (id) => set((state) => {
        const keys = (state.settings.ollamaKeys || []).map((k) => k.id === id ? { ...k, failCount: k.failCount + 1 } : k);
        const failedKey = keys.find((k) => k.id === id);
        if (failedKey && failedKey.failCount >= 3) {
          const nextKey = keys.find((k) => k.id !== id && k.isActive && k.failCount < 3);
          if (nextKey) {
            return { settings: { ...state.settings, ollamaKeys: keys.map((k) => ({ ...k, isActive: k.id === nextKey.id })) } };
          }
        }
        return { settings: { ...state.settings, ollamaKeys: keys } };
      }),
      
      resetOllamaKeyFailCount: (id) => set((state) => ({
        settings: { ...state.settings, ollamaKeys: (state.settings.ollamaKeys || []).map((k) => k.id === id ? { ...k, failCount: 0 } : k) },
      })),
      
      getActiveOllamaKey: () => {
        const { settings } = get();
        return (settings.ollamaKeys || []).find((k) => k.isActive && k.failCount < 3) || null;
      },
      
      // General settings
      setDefaultModel: (model) => set((state) => ({ settings: { ...state.settings, defaultModel: model } })),
      setDefaultOllamaModel: (model) => set((state) => ({ settings: { ...state.settings, defaultOllamaModel: model } })),
      setDefaultProvider: (provider) => set((state) => ({ settings: { ...state.settings, defaultProvider: provider } })),
      setTheme: (theme) => set((state) => ({ settings: { ...state.settings, theme } })),
      
      // Custom CSS
      addCustomCss: (name, code, description) => set((state) => ({
        settings: {
          ...state.settings,
          customCss: [...state.settings.customCss, { id: generateId(), name, code, description, isActive: true, createdAt: new Date() }],
        },
      })),
      
      removeCustomCss: (id) => set((state) => ({
        settings: { ...state.settings, customCss: state.settings.customCss.filter((c) => c.id !== id) },
      })),
      
      updateCustomCss: (id, updates) => set((state) => ({
        settings: { ...state.settings, customCss: state.settings.customCss.map((c) => c.id === id ? { ...c, ...updates } : c) },
      })),
      
      toggleCustomCss: (id) => set((state) => ({
        settings: { ...state.settings, customCss: state.settings.customCss.map((c) => c.id === id ? { ...c, isActive: !c.isActive } : c) },
      })),
      
      // Firebase
      setFirebaseConfig: (config) => set((state) => ({ settings: { ...state.settings, firebaseConfig: config } })),
      setFirebaseAutoSync: (enabled) => set((state) => ({ settings: { ...state.settings, firebaseAutoSync: enabled } })),
      setSyncNotifications: (enabled) => set((state) => ({ settings: { ...state.settings, syncNotifications: enabled } })),
      
      // Sound notifications
      setSoundNotificationsEnabled: (enabled) => set((state) => ({ settings: { ...state.settings, soundNotificationsEnabled: enabled } })),
    }),
    { name: 'blog-settings-storage' }
  )
);
