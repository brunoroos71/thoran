import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { env } from '@/lib/env';
import Home from '@/pages/Home';

// Tudo fora da landing é carregado sob demanda (performance mobile).
const Thanks = lazy(() => import('@/pages/Thanks'));
const About = lazy(() => import('@/pages/About'));
const PlansPublic = lazy(() => import('@/pages/PlansPublic'));
const LegalPage = lazy(() => import('@/pages/legal/LegalPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const AdminWaitlist = lazy(() => import('@/pages/admin/AdminWaitlist'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const Auth = {
  Login: lazy(() => import('@/pages/auth/AuthPages').then((m) => ({ default: m.LoginPage }))),
  Signup: lazy(() => import('@/pages/auth/AuthPages').then((m) => ({ default: m.SignupPage }))),
  Reset: lazy(() => import('@/pages/auth/AuthPages').then((m) => ({ default: m.ResetPage }))),
  Update: lazy(() => import('@/pages/auth/AuthPages').then((m) => ({ default: m.UpdatePasswordPage }))),
};
const AppLayout = lazy(() => import('@/components/app/AppLayout').then((m) => ({ default: m.AppLayout })));
const RequireAuth = lazy(() => import('@/components/app/RequireAuth').then((m) => ({ default: m.RequireAuth })));
const Onboarding = lazy(() => import('@/pages/app/Onboarding'));
const Chat = lazy(() => import('@/pages/app/Chat'));
const Analysis = lazy(() => import('@/pages/app/Analysis'));
const History = lazy(() => import('@/pages/app/History'));
const Alerts = lazy(() => import('@/pages/app/Alerts'));
const Account = lazy(() => import('@/pages/app/Account'));
const Plans = lazy(() => import('@/pages/app/Plans'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen bg-carbono" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sobre" element={<About />} />
          <Route path="/planos" element={<PlansPublic />} />
          <Route path="/obrigado" element={<Thanks />} />
          <Route path="/privacidade" element={<LegalPage kind="privacy" />} />
          <Route path="/termos" element={<LegalPage kind="terms" />} />
          <Route path="/aviso-de-risco" element={<LegalPage kind="risk" />} />

          {/* Login existe mesmo em WAITLIST_MODE para o admin entrar */}
          <Route path="/entrar" element={<Auth.Login />} />
          <Route path="/recuperar-senha" element={<Auth.Reset />} />
          <Route path="/nova-senha" element={<Auth.Update />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/lista" element={<AdminWaitlist />} />

          {env.waitlistMode ? (
            <>
              <Route path="/cadastro" element={<Navigate to="/" replace />} />
              <Route path="/app/*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/cadastro" element={<Auth.Signup />} />
              <Route
                path="/app/onboarding"
                element={
                  <RequireAuth allowNoOnboarding>
                    <Onboarding />
                  </RequireAuth>
                }
              />
              <Route
                path="/app"
                element={
                  <RequireAuth>
                    <AppLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<Chat />} />
                <Route path="analise/:id" element={<Analysis />} />
                <Route path="historico" element={<History />} />
                <Route path="alertas" element={<Alerts />} />
                <Route path="conta" element={<Account />} />
                <Route path="planos" element={<Plans />} />
              </Route>
            </>
          )}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
