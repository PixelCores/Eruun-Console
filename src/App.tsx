import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import AppsPage from './pages/apps/page';
import WorkflowPage from './pages/WorkflowPage';
import Dashboard1Page from './pages/dashboard/Dashboard1Page';
import ApiDocsPage from './pages/ApiDocsPage';
import { ButtonPopupExample } from './examples/ButtonPopupExample';
import { CommandPalette } from './components/CommandPalette/CommandPalette';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { AuthenticatedShell } from './components/Layout/AuthenticatedShell';
import LoginPage from './pages/login/LoginPage';
import { isSessionActive, useAuthStore } from './stores/authStore';

const AuthSessionExpiry: React.FC = () => {
  const session = useAuthStore((state) => state.session);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    if (!session) return;

    let timer: number | undefined;
    const scheduleExpiryCheck = () => {
      const remaining = session.expiresAt * 1000 - Date.now();
      if (remaining <= 0) {
        clearSession();
        return;
      }

      timer = window.setTimeout(scheduleExpiryCheck, Math.min(remaining, 2_147_483_647));
    };

    scheduleExpiryCheck();
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [clearSession, session]);

  return null;
};

/**
 * 登录守卫由 VITE_AUTH_ENABLED 控制：
 * 开发默认 false（Eruun 后端认证接口就绪后置 true），生产默认 true。
 */
const AUTH_ENABLED = import.meta.env.VITE_AUTH_ENABLED === 'true';

const RequireAuth: React.FC = () => {
  const location = useLocation();
  const session = useAuthStore((state) => state.session);

  if (!AUTH_ENABLED) return <Outlet />;
  if (isSessionActive(session)) return <Outlet />;

  const redirect = `${location.pathname}${location.search}${location.hash}`;
  return <Navigate to={`/login?${new URLSearchParams({ redirect }).toString()}`} replace />;
};

const Dashboard1Route: React.FC = () => {
  const t = useTranslations('Roles');
  const session = useAuthStore((state) => state.session);
  const roleLabel = session
    ? session.role === 1
      ? t('purchaser')
      : session.role === 2
        ? t('developer')
        : session.role === 3
          ? t('businessDevelopment')
          : t('administrator')
    : undefined;

  return <Dashboard1Page roleLabel={roleLabel} />;
};

const App: React.FC = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login' || location.pathname === '/login/';
  const session = useAuthStore((state) => state.session);

  return (
    <>
      <AuthSessionExpiry />
      {!isLoginPage && (!AUTH_ENABLED || isSessionActive(session)) && <CommandPalette />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AuthenticatedShell />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Navigate to="/dashboard1" replace />} />
              <Route path="/dashboard1" element={<Dashboard1Route />} />
              <Route path="/apps" element={<AppsPage />} />
            </Route>
            <Route path="/workflow/:appId" element={<WorkflowPage />} />
            <Route path="/button-popup-example" element={<ButtonPopupExample />} />
            <Route path="/api-docs" element={<ApiDocsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
