import { create } from 'zustand';
import { loadSettings, saveSettings } from '@/lib/storage/settings';

type ThemeMode = 'light' | 'dark';

type ThemeState = {
  overrideSystemTheme: boolean;
  themeMode: ThemeMode;

  hydrated: boolean;

  setOverrideSystemTheme: (v: boolean) => void;
  setThemeMode: (v: ThemeMode) => void;

  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  overrideSystemTheme: false,
  themeMode: 'dark',
  hydrated: false,

  setOverrideSystemTheme: (v) => {
    set({ overrideSystemTheme: v });
    get().persist();
  },

  setThemeMode: (v) => {
    set({ themeMode: v });
    get().persist();
  },

  hydrate: async () => {
    const settings = await loadSettings();

    set({
      overrideSystemTheme: settings.overrideSystemTheme,
      themeMode: settings.themeMode,
      hydrated: true,
    });
  },

  persist: async () => {
    const state = get();

    await saveSettings({
      overrideSystemTheme: state.overrideSystemTheme,
      themeMode: state.themeMode,
    });
  },
}));