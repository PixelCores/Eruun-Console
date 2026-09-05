import React, { useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { config } from './config'
import { DashboardLayout } from './components/Layout/DashboardLayout'
import DashboardPage from './pages/dashboard/DashboardPage'
import AppsPage from './pages/apps/AppsPage'
import LoginPage from './pages/login/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import { isSessionActive, useAuthStore } from './stores/authStore'

/** 会话到期后自动清除 */
const AuthSessionExpiry: React.FC = () => {
  const session = useAuthStore(state => state.session)
  const clearSession = useAuthStore(state => state.clearSession)

  useEffect(() => {
    if (!session) return

    let timer: number | undefined
    const scheduleExpiryCheck = () => {
      const remaining = session.expiresAt * 1000 - Date.now()
      if (remaining <= 0) {
        clearSession()
        return
      }

      timer = window.setTimeout(scheduleExpiryCheck, Math.min(remaining, 2_147_483_647))
    }

    scheduleExpiryCheck()
    return () => {
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [clearSession, session])

  return null
}

/**
 * 登录守卫由 VITE_AUTH_ENABLED 控制：
 * 开发环境默认关闭（Eruun 后端认证接口尚未就绪），生产默认开启。
 */
const RequireAuth: React.FC = () => {
  const location = useLocation()
  const session = useAuthStore(state => state.session)

  if (!config.authEnabled) return <Outlet />
  if (isSessionActive(session)) return <Outlet />

  const redirect = `${location.pathname}${location.search}${location.hash}`
  return <Navigate to={`/login?${new URLSearchParams({ redirect }).toString()}`} replace />
}

const App: React.FC = () => {
  return (
    <>
      <AuthSessionExpiry />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="/apps" element={<AppsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}

export default App
