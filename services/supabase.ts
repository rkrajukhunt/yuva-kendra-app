import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Get environment variables - Expo automatically loads EXPO_PUBLIC_* from .env file
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qdwztkhlqzlwthosgbia.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkd3p0a2hscXpsd3Rob3NnYmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NzMzMTYsImV4cCI6MjA4MTM0OTMxNn0.pZjyulyZ2DSFonSbx5r1SqLtASEd01x5kwU78ytBd7g';

if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  
  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}\n\n` +
    'Please create a .env file in the root directory with:\n' +
    'EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url\n' +
    'EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key\n\n' +
    'You can find these values in your Supabase project settings.\n' +
    'After adding them, restart the Expo dev server (stop and run npm start again).'
  );
}

// Storage adapter that works on both web and native platforms
const getStorageAdapter = () => {
  // On web, use localStorage
  if (Platform.OS === 'web') {
    return {
      getItem: (key: string) => {
        return Promise.resolve(localStorage.getItem(key));
      },
      setItem: (key: string, value: string) => {
        localStorage.setItem(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        localStorage.removeItem(key);
        return Promise.resolve();
      },
    };
  }
  
  // On native platforms, use SecureStore
  return {
    getItem: (key: string) => {
      return SecureStore.getItemAsync(key);
    },
    setItem: (key: string, value: string) => {
      return SecureStore.setItemAsync(key, value);
    },
    removeItem: (key: string) => {
      return SecureStore.deleteItemAsync(key);
    },
  };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

