import React from 'react'
import useSWR from 'swr'
import { useTranslations } from 'next-intl'
import { APPLICATIONS_KEY, fetchApplications } from '../../api/apps'
import { config } from '../../config'

const StatCard: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="rounded-lg border border-components-panel-border bg-components-panel-bg p-4 shadow-xs">
    <div className="text-xs text-text-tertiary">{label}</div>
    <div className="mt-1 text-lg font-semibold text-text-primary">{value}</div>
  </div>
)

const DashboardPage: React.FC = () => {
  const t = useTranslations('Dashboard')
  const tCommon = useTranslations('Common')
  const { data, isLoading } = useSWR(APPLICATIONS_KEY, () => fetchApplications())

  const appCount = isLoading
    ? tCommon('loading')
    : String(data?.applications?.length ?? 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t('welcome')}</h1>
        <p className="mt-1 text-sm text-text-tertiary">{t('description')}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('appCount')} value={appCount} />
        <StatCard label={t('apiBaseUrl')} value={config.apiBaseUrl} />
        <StatCard label={t('version')} value={config.appVersion} />
        <StatCard
          label={t('authStatus')}
          value={config.authEnabled ? t('authOn') : t('authOff')}
        />
      </div>
    </div>
  )
}

export default DashboardPage
