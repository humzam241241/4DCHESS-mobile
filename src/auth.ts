import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from './constants';

let supabase: SupabaseClient | null = null;

// navigatorLock polyfill for React Native (Supabase expects navigator.locks.request signature)
const navigatorLockPolyfill = async (_name: string, _opts: any, fn: (() => Promise<any>) | undefined) => {
  // Supabase calls lock(name, opts, fn) or lock(name, fn)
  const callback = fn ?? _opts;
  return await callback();
};

export async function initSupabase() {
  if (supabase) return supabase;

  const res = await fetch(`${SERVER_URL}/api/config`);
  const config = await res.json();

  supabase = createClient(config.supabaseUrl, config.supabaseKey, {
    auth: {
      storage: {
        getItem: (key: string) => AsyncStorage.getItem(key),
        setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
        removeItem: (key: string) => AsyncStorage.removeItem(key),
      },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: navigatorLockPolyfill as any,
    },
  });

  return supabase;
}

export function getSupabase() {
  return supabase;
}

export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export async function fetchProfile(token: string) {
  const res = await fetch(`${SERVER_URL}/api/my-profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}
