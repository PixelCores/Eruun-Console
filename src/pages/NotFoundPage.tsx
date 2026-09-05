import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslations } from 'next-intl'

const NotFoundPage: React.FC = () => {
  const t = useTranslations('NotFound')

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <p className="text-lg font-medium text-text-secondary">{t('title')}</p>
      <Link
        to="/"
        className="rounded-md bg-components-button-primary-bg px-4 py-2 text-sm font-medium text-components-button-primary-text hover:bg-components-button-primary-bg-hover"
      >
        {t('backHome')}
      </Link>
    </div>
  )
}

export default NotFoundPage
