/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly WAITLIST_MODE?: string;
  readonly AGENT_MODE?: 'mock' | 'live';
  readonly BILLING_MODE?: 'mock' | 'live';
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_ANALYTICS_PIXEL_ID?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_GOOGLE_AUTH?: string;
}
