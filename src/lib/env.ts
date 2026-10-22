const e = import.meta.env;

export const env = {
  /** Produto no ar por padrão. true reativa o modo lista de espera (só landing + formulário). */
  waitlistMode: (e.WAITLIST_MODE ?? 'false').trim() === 'true',
  agentMode: ((e.AGENT_MODE ?? 'mock').trim() === 'live' ? 'live' : 'mock') as 'mock' | 'live',
  billingMode: ((e.BILLING_MODE ?? 'mock').trim() === 'live' ? 'live' : 'mock') as 'mock' | 'live',
  supabaseUrl: e.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: e.VITE_SUPABASE_ANON_KEY ?? '',
  pixelId: e.VITE_ANALYTICS_PIXEL_ID ?? '',
  siteUrl: e.VITE_SITE_URL ?? 'https://thoran.com.br',
};

export const hasSupabase = Boolean(env.supabaseUrl && env.supabaseAnonKey);
