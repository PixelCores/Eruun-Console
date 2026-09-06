import { useMemo, useState } from 'react';
import { AlertCircle, CheckCheck, CircleAlert, Inbox, Info, OctagonAlert } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import useSWR, { useSWRConfig } from 'swr';
import {
  getMessageDateWindow,
  listMessages,
  markAllMessagesRead,
  markMessageRead,
  MESSAGE_PAGE_SIZE,
  type MessageInfo,
  type MessageLevel,
} from '../../api/messages';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';

const LEVEL_STYLES: Record<MessageLevel, string> = {
  1: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  2: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  3: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  4: 'bg-red-50 text-red-700 ring-red-600/20',
};

const LevelIcon = ({ level }: { level: MessageLevel }) => {
  const className = 'h-4 w-4';
  if (level === 1) return <CheckCheck className={className} aria-hidden="true" />;
  if (level === 2) return <Info className={className} aria-hidden="true" />;
  if (level === 3) return <CircleAlert className={className} aria-hidden="true" />;
  return <OctagonAlert className={className} aria-hidden="true" />;
};

const MessagesPage = () => {
  const t = useTranslations('Messages');
  const commonT = useTranslations('Common');
  const headerT = useTranslations('Header');
  const format = useFormatter();
  const { mutate: mutateGlobal } = useSWRConfig();
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const environment = useSettingsStore((state) => state.environment);
  const timeZone = useSettingsStore((state) => state.timeZone);
  const [pageState, setPageState] = useState({ environment, timeZone, page: 1 });
  const [updatingMessageId, setUpdatingMessageId] = useState<number | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const page = pageState.environment === environment && pageState.timeZone === timeZone ? pageState.page : 1;
  const dateWindow = useMemo(() => getMessageDateWindow(new Date(), timeZone), [timeZone]);

  const query = useMemo(() => ({
    ...dateWindow,
    page,
    pageSize: MESSAGE_PAGE_SIZE,
    env: environment,
    timeZone,
  }), [dateWindow, environment, page, timeZone]);

  const { data, error, isLoading, mutate } = useSWR(
    accessToken ? ['messages', accessToken, query] : null,
    ([, token, messageQuery]) => listMessages(token, messageQuery),
    { keepPreviousData: true, revalidateOnFocus: true },
  );

  const refreshUnreadCount = () => {
    if (accessToken) void mutateGlobal(['message-unread-count', accessToken]);
  };

  const handleRead = async (message: MessageInfo) => {
    if (!accessToken || message.readed || updatingMessageId !== null) return;
    setActionError(null);
    setUpdatingMessageId(message.id);
    try {
      await markMessageRead(accessToken, message.id);
      await mutate((current) => current ? {
        ...current,
        data: current.data.map((item) => item.id === message.id ? { ...item, readed: true } : item),
      } : current, { revalidate: false });
      refreshUnreadCount();
    } catch {
      setActionError(t('actionError'));
    } finally {
      setUpdatingMessageId(null);
    }
  };

  const handleMarkAll = async () => {
    if (!accessToken || isMarkingAll) return;
    setActionError(null);
    setIsMarkingAll(true);
    try {
      await markAllMessagesRead(accessToken);
      await mutate((current) => current ? {
        ...current,
        data: current.data.map((item) => ({ ...item, readed: true })),
      } : current, { revalidate: false });
      refreshUnreadCount();
    } catch {
      setActionError(t('actionError'));
    } finally {
      setIsMarkingAll(false);
    }
  };

  const levelLabel = (level: MessageLevel) => {
    if (level === 1) return t('success');
    if (level === 2) return t('notice');
    if (level === 3) return t('warning');
    return t('error');
  };

  const environmentLabel = environment === 'production' ? headerT('production') : headerT('test');
  const totalPages = Math.max(data?.totalPages ?? 1, 1);

  return (
    <div className="min-h-full bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-gray-950">{t('title')}</h1>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                {t('currentEnvironment', { environment: environmentLabel })}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => void handleMarkAll()}
            disabled={isMarkingAll || !data?.data.length}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            {isMarkingAll ? t('markingAll') : t('markAll')}
          </button>
        </div>

        {actionError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {actionError}
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" aria-busy={isLoading}>
          {isLoading && !data ? (
            <div className="space-y-3 p-5" aria-label={commonT('loading')}>
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-24 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : error ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <AlertCircle className="mb-3 h-9 w-9 text-red-400" aria-hidden="true" />
              <h2 className="font-medium text-gray-900">{t('loadError')}</h2>
              <button
                type="button"
                onClick={() => void mutate()}
                className="mt-4 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                {commonT('retry')}
              </button>
            </div>
          ) : !data?.data.length ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <span className="mb-3 rounded-full bg-gray-100 p-3 text-gray-400">
                <Inbox className="h-8 w-8" aria-hidden="true" />
              </span>
              <h2 className="font-medium text-gray-900">{t('empty')}</h2>
              <p className="mt-1 text-sm text-gray-500">{t('emptyDescription')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.data.map((message) => (
                <li key={message.id} className={message.readed ? 'bg-white' : 'bg-blue-50/35'}>
                  <button
                    type="button"
                    onClick={() => void handleRead(message)}
                    disabled={message.readed || updatingMessageId !== null}
                    aria-label={message.readed ? undefined : t('markRead')}
                    className="w-full p-4 text-left transition-colors hover:bg-gray-50 disabled:cursor-default sm:p-5"
                  >
                    <span className="flex items-start gap-3">
                      <span className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${LEVEL_STYLES[message.level]}`}>
                        <LevelIcon level={message.level} />
                        {levelLabel(message.level)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                          <span className={`block text-sm text-gray-950 ${message.readed ? 'font-medium' : 'font-semibold'}`}>
                            {message.title}
                          </span>
                          <span className="shrink-0 text-xs text-gray-500">
                            {format.dateTime(new Date(message.createdAt * 1000), {
                              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </span>
                        <span className="mt-2 block whitespace-pre-wrap text-sm leading-6 text-gray-600">{message.content}</span>
                        <span className={`mt-2 inline-flex items-center gap-1 text-xs ${message.readed ? 'text-gray-400' : 'font-medium text-blue-700'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${message.readed ? 'bg-gray-300' : 'bg-blue-600'}`} />
                          {message.readed ? t('read') : t('unread')}
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {data && data.totalCount > 0 && (
          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-gray-500 sm:flex-row">
            <span>{commonT('totalCount', { count: data.totalCount })}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={page <= 1 || isLoading}
                onClick={() => setPageState({ environment, timeZone, page: page - 1 })}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                {commonT('previous')}
              </button>
              <span>{commonT('pageOf', { page, total: totalPages })}</span>
              <button
                type="button"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPageState({ environment, timeZone, page: page + 1 })}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                {commonT('next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
