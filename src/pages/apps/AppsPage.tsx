import React from 'react'
import useSWR from 'swr'
import { useFormatter, useTranslations } from 'next-intl'
import { APPLICATIONS_KEY, fetchApplications } from '../../api/apps'

const AppsPage: React.FC = () => {
  const t = useTranslations('Apps')
  const tCommon = useTranslations('Common')
  const format = useFormatter()
  const { data, error, isLoading, mutate } = useSWR(APPLICATIONS_KEY, () =>
    fetchApplications()
  )

  const applications = data?.applications ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t('title')}</h1>

      {isLoading && (
        <div className="py-16 text-center text-sm text-text-tertiary">
          {tCommon('loading')}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-components-button-warning-border bg-components-button-warning-bg-hover p-4 text-sm text-components-button-warning-text">
          <p>{t('loadError')}</p>
          <button
            type="button"
            onClick={() => mutate()}
            className="mt-2 font-medium underline"
          >
            {tCommon('retry')}
          </button>
        </div>
      )}

      {!isLoading && !error && applications.length === 0 && (
        <div className="py-16 text-center text-sm text-text-tertiary">
          {tCommon('empty')}
        </div>
      )}

      {applications.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-components-panel-border bg-components-panel-bg shadow-xs">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-divider-regular text-xs text-text-tertiary">
                <th className="px-4 py-3 font-medium">{t('name')}</th>
                <th className="px-4 py-3 font-medium">{t('namespace')}</th>
                <th className="px-4 py-3 font-medium">{t('alias')}</th>
                <th className="px-4 py-3 font-medium">{t('project')}</th>
                <th className="px-4 py-3 font-medium">{t('replicas')}</th>
                <th className="px-4 py-3 font-medium">{t('createTime')}</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app => (
                <tr
                  key={app.id}
                  className="border-b border-divider-subtle last:border-0 hover:bg-state-base-hover"
                >
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {app.name}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{app.namespace}</td>
                  <td className="px-4 py-3 text-text-secondary">{app.alias || '-'}</td>
                  <td className="px-4 py-3 text-text-secondary">{app.project || '-'}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {app.resources?.replicas ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {app.createTime
                      ? format.dateTime(new Date(app.createTime), {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AppsPage
