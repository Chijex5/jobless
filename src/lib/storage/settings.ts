import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

export type LocalSettings = {
  overrideSystemTheme: boolean;
  themeMode: ThemeMode;
};

const SETTINGS_KEY = 'local_settings';

const DEFAULT_SETTINGS: LocalSettings = {
  overrideSystemTheme: false,
  themeMode: 'dark',
};

export async function loadSettings(): Promise<LocalSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);

    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(raw),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: LocalSettings) {
  try {
    await AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(settings)
    );
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}