import axios from 'axios';
import { supabase } from '../lib/supabaseClient';

export const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject Supabase JWT into every outgoing request
apiClient.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    // Silently continue without token if session retrieval fails
    console.warn('[apiClient] Could not attach auth token:', err.message);
  }
  return config;
});
