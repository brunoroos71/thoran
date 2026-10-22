import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/services/authService';

export function RequireAuth({ children, allowNoOnboarding }: { children: ReactNode; allowNoOnboarding?: boolean }) {
  const { user, profile, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-meta">…</div>;
  if (!user) return <Navigate to={`/entrar?next=${encodeURIComponent(loc.pathname)}`} replace />;
  // onboarding é opcional: quem chega pelo chat vai direto para a resposta
  void allowNoOnboarding;
  void profile;
  return <>{children}</>;
}
