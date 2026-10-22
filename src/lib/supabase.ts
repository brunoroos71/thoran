import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, hasSupabase } from './env';

/** null quando o Supabase não está configurado (dev local sem backend). */
export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(env.supabaseUrl, env.supabaseAnonKey)
  : null;

export const functionsUrl = (name: string) => `${env.supabaseUrl}/functions/v1/${name}`;
