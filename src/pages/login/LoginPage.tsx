import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslations } from 'next-intl'
import { getSafeRedirect, useAuthStore } from '../../stores/authStore'

const LoginPage: React.FC = () => {
  const t = useTranslations('Login')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const signIn = useAuthStore(state => state.signIn)

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setError(null)
    try {
      await signIn({ identifier, password }, remember)
      navigate(getSafeRedirect(searchParams.get('redirect')), { replace: true })
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t('failed'))
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full rounded-md border border-divider-regular bg-components-panel-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-components-button-primary-border'

  return (
    <div className="flex h-full items-center justify-center bg-background-body">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-xl border border-components-panel-border bg-components-panel-bg p-8 shadow-md"
      >
        <div className="space-y-1 text-center">
          <img src="/logo.svg" alt="" className="mx-auto h-10 w-10" />
          <h1 className="text-lg font-semibold text-text-primary">{t('title')}</h1>
          <p className="text-xs text-text-tertiary">{t('subtitle')}</p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm text-text-secondary">{t('identifier')}</span>
          <input
            className={inputClass}
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            placeholder={t('identifierPlaceholder')}
            autoComplete="username"
            required
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm text-text-secondary">{t('password')}</span>
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t('passwordPlaceholder')}
            autoComplete="current-password"
            required
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
            className="h-4 w-4 accent-primary-600"
          />
          {t('remember')}
        </label>

        {error && (
          <p className="rounded-md bg-components-button-warning-bg-hover px-3 py-2 text-sm text-components-button-destructive-bg">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-components-button-primary-bg py-2 text-sm font-medium text-components-button-primary-text hover:bg-components-button-primary-bg-hover disabled:bg-components-button-primary-bg-disabled"
        >
          {submitting ? t('submitting') : t('submit')}
        </button>
      </form>
    </div>
  )
}

export default LoginPage
