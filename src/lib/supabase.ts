import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('Supabase URL or Anon Key is missing.');
    // Alerting in browser only
    if (typeof window !== 'undefined') {
        // window.alert('Supabaseの環境変数が設定されていません。.env.localを確認してください。');
    }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
