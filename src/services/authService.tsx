import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { readLS, writeLS } from '@/lib/storage';
import { getProfile, upsertProfile, type Profile } from './profileService';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthValue {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  demo: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(name: string, email: string, password: string): Promise<{ needsConfirmation: boolean }>;
  signInWithGoogle(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  signOut(): Promise<void>;
  refreshProfile(): Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);
const DEMO_KEY = 'thoran.demo.user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const demo = !supabase;
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (u: AuthUser | null) => {
    setProfile(u ? await getProfile(u.id) : null);
  }, []);

  useEffect(() => {
    if (!supabase) {
      const u = readLS<AuthUser | null>(DEMO_KEY, null);
      setUser(u);
      loadProfile(u).finally(() => setLoading(false));
      return;
    }
    const map = (s: { user: { id: string; email?: string; user_metadata?: { name?: string } } } | null) =>
      s ? { id: s.user.id, email: s.user.email ?? '', name: s.user.user_metadata?.name } : null;
    supabase.auth.getSession().then(async ({ data }) => {
      const u = map(data.session);
      setUser(u);
      await loadProfile(u);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      const u = map(s);
      setUser(u);
      loadProfile(u);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      profile,
      loading,
      demo,
      async signIn(email, password) {
        if (!supabase) {
          const u = { id: 'demo-user', email };
          writeLS(DEMO_KEY, u);
          setUser(u);
          await loadProfile(u);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signUp(name, email, password) {
        if (!supabase) {
          const u = { id: 'demo-user', email, name };
          writeLS(DEMO_KEY, u);
          await upsertProfile({ id: u.id, name, onboarded: false });
          setUser(u);
          await loadProfile(u);
          return { needsConfirmation: false };
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name }, emailRedirectTo: `${location.origin}/app` },
        });
        if (error) throw error;
        return { needsConfirmation: !data.session };
      },
      async signInWithGoogle(): Promise<void> {
        if (!supabase) {
          const u = { id: 'demo-user', email: 'demo@google.com' };
          writeLS(DEMO_KEY, u);
          setUser(u);
          await loadProfile(u);
          return;
        }
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/app` } });
        if (error) throw error;
      },
      async resetPassword(email) {
        if (!supabase) return;
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/nova-senha` });
        if (error) throw error;
      },
      async updatePassword(password) {
        if (!supabase) return;
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      },
      async signOut() {
        if (!supabase) {
          writeLS(DEMO_KEY, null);
          setUser(null);
          setProfile(null);
          return;
        }
        await supabase.auth.signOut();
      },
      async refreshProfile() {
        await loadProfile(user);
      },
    }),
    [user, profile, loading, demo, loadProfile],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth fora do AuthProvider');
  return v;
}
