import { useEffect, type ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getIntlTimeZone, useSettingsStore } from '../stores/settingsStore'
import { messages } from './messages'

const AppInternationalization = ({ children }: { children: ReactNode }) => {
  const locale = useSettingsStore(state => state.locale)
  const timeZone = useSettingsStore(state => state.timeZone)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages[locale]}
      timeZone={getIntlTimeZone(timeZone)}
    >
      {children}
    </NextIntlClientProvider>
  )
}

export default AppInternationalization
