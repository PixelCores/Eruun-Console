import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslations } from 'next-intl'
import { Boxes, LayoutDashboard, LogOut } from 'lucide-react'
import { cn } from '../../utils/cn'
import { config } from '../../config'
import { useSettingsStore, type Locale } from '../../stores/settingsStore'
import { useAuthStore } from '../../stores/authStore'

const navItems = [
  { to: '/', key: 'dashboard', icon: LayoutDashboard, end: true },
  { to: '/apps', key: 'apps', icon: Boxes, end: false },
] as const

const LanguageSwitch: React.FC = () => {
  const t = useTranslations('Header')
  const locale = useSettingsStore(state => state.locale)
  const setLocale = useSettingsStore(state => state.setLocale)

  return (
    <select
      aria-label={t('language')}
      value={locale}
      onChange={e => setLocale(e.target.value as Locale)}
      className="h-8 rounded-md border border-divider-regular bg-components-panel-bg px-2 text-sm text-text-secondary outline-none"
    >
      <option value="zh-CN">{t('chinese')}</option>
      <option value="en">{t('english')}</option>
    </select>
  )
}

const AccountMenu: React.FC = () => {
  const t = useTranslations('Header')
  const navigate = useNavigate()
  const session = useAuthStore(state => state.session)
  const signOut = useAuthStore(state => state.signOut)
  const [pending, setPending] = React.useState(false)

  if (!config.authEnabled) return null

  const handleSignOut = async () => {
    setPending(true)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-text-secondary">{session?.identifier}</span>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={pending}
        className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-components-button-ghost-text hover:bg-components-button-ghost-bg-hover disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
        {pending ? t('signingOut') : t('signOut')}
      </button>
    </div>
  )
}

export const DashboardLayout: React.FC = () => {
  const tHeader = useTranslations('Header')
  const tSidebar = useTranslations('Sidebar')

  return (
    <div className="flex h-full bg-background-body text-text-primary">
      <aside className="flex w-56 shrink-0 flex-col border-r border-divider-regular bg-components-panel-bg">
        <div className="flex h-14 items-center gap-2 border-b border-divider-subtle px-4">
          <img src="/logo.svg" alt="" className="h-7 w-7" />
          <span className="text-sm font-semibold">{tHeader('brand')}</span>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-state-accent-hover font-medium text-text-accent'
                    : 'text-text-secondary hover:bg-state-base-hover'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {tSidebar(item.key)}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-end gap-3 border-b border-divider-regular bg-components-panel-bg px-6">
          <LanguageSwitch />
          <AccountMenu />
        </header>
        <main className="min-h-0 flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
