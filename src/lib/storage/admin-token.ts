import * as SecureStore from 'expo-secure-store';

const ADMIN_TOKEN_KEY = 'admin_token';

export async function loadAdminToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function saveAdminToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(ADMIN_TOKEN_KEY, token);
  } catch (e) {
    console.error('Failed to save admin token', e);
  }
}

export async function clearAdminToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ADMIN_TOKEN_KEY);
  } catch (e) {
    console.error('Failed to clear admin token', e);
  }
}
