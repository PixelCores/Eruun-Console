import { useEffect, useMemo, useRef, useState } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import {
  AlertCircle,
  ChevronDown,
  Inbox,
  Monitor,
  Search,
  Smartphone,
} from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import {
  getOrderRuntimeState,
  listPurchaserOrders,
  ORDER_PAGE_SIZE,
  runPurchaserOrderAction,
  type OrderRuntimeState,
  type PaginatedPurchaserOrders,
  type PurchaserOrder,
  type PurchaserOrderAction,
  type PurchaserOrderListState,
} from '../../api/orders';
import { getPurchaserProfile } from '../../api/paasBilling';
import ConfirmDialog from '../../components/base/ConfirmDialog';
import { useAuthStore } from '../../stores/authStore';
import {
  useSettingsStore,
  type RuntimeEnvironment,
  type TimeZoneOffset,
} from '../../stores/settingsStore';
import OrderDetailModal from './OrderDetailModal';
import AdminConsoleModal from './AdminConsoleModal';

type OrdersKey = readonly ['purchaser-orders', string, number, string, RuntimeEnvironment, StateFilter];

type StateFilter = 'all' | OrderRuntimeState;

interface PendingAction {
  action: PurchaserOrderAction;
  uris: string[];
}

const toStateQueryParam = (filter: StateFilter): PurchaserOrderListState | undefined => {
  if (filter === 'running') return 'running';
  if (filter === 'exception') return 'exception';
  if (filter === 'stopped') return 'stoped';
  return undefined;
};

const STATE_BADGE_STYLES: Record<OrderRuntimeState, string> = {
  running: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  exception: 'bg-red-50 text-red-700 ring-red-600/20',
  stopped: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  unknown: 'bg-amber-50 text-amber-700 ring-amber-600/20',
};

const STATE_ACTIONS: Record<OrderRuntimeState, PurchaserOrderAction[]> = {
  running: ['stop', 'restart'],
  exception: ['restart', 'destroy', 'reset'],
  stopped: ['start', 'destroy', 'reset'],
  unknown: [],
};

const DESTRUCTIVE_ACTIONS: ReadonlySet<PurchaserOrderAction> = new Set(['destroy', 'reset']);

const formatTimestamp = (
  timestamp: number,
  format: ReturnType<typeof useFormatter>,
) => (timestamp > 0
  ? format.dateTime(new Date(timestamp * 1000), {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  : '—');

const dateToTimestamp = (value: string, endOfDay: boolean) => {
  const time = new Date(`${value}T${endOfDay ? '23:59:59' : '00:00:00'}`).getTime();
  return Number.isNaN(time) ? null : Math.floor(time / 1000);
};

const ApplicationsPage = () => {
  const t = useTranslations('Applications');
  const commonT = useTranslations('Common');
  const headerT = useTranslations('Header');
  const format = useFormatter();
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const environment = useSettingsStore((state) => state.environment);
  const timeZone = useSettingsStore((state) => state.timeZone);

  const [kwdInput, setKwdInput] = useState('');
  const [kwd, setKwd] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [stateFilter, setStateFilter] = useState<StateFilter>('all');
  const [pendingUpdateOnly, setPendingUpdateOnly] = useState(false);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionRunning, setActionRunning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<PurchaserOrder | null>(null);
  const [adminOrder, setAdminOrder] = useState<PurchaserOrder | null>(null);

  const getOrdersKey = (
    pageIndex: number,
    previousPage: PaginatedPurchaserOrders | null,
  ): OrdersKey | null => {
    if (!accessToken) return null;
    if (previousPage && pageIndex + 1 > previousPage.totalPages) return null;
    return ['purchaser-orders', accessToken, pageIndex + 1, kwd, environment, stateFilter] as const;
  };

  const {
    data: pages,
    error,
    isLoading,
    size,
    setSize,
    mutate,
  } = useSWRInfinite(
    getOrdersKey,
    ([, token, page, keyword, env, state]: OrdersKey) => listPurchaserOrders(token, {
      page,
      pageSize: ORDER_PAGE_SIZE,
      kwd: keyword,
      env,
      state: toStateQueryParam(state),
    }),
    { keepPreviousData: true },
  );

  const { data: profile } = useSWR(
    accessToken ? ['purchaser-profile-products', accessToken, environment, timeZone] : null,
    ([, token, env, tz]: readonly [string, string, RuntimeEnvironment, TimeZoneOffset]) =>
      getPurchaserProfile(token, { env, timeZone: tz }),
    { keepPreviousData: true },
  );

  const orders = useMemo(() => (pages ? pages.flatMap((pageData) => pageData.data) : []), [pages]);
  const totalCount = pages?.[0]?.totalCount ?? 0;
  const lastLoadedPage = pages?.[pages.length - 1];
  const hasMore = lastLoadedPage !== undefined && (pages?.length ?? 0) < lastLoadedPage.totalPages;
  const isLoadingMore = pages !== undefined && size > pages.length;

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting) && hasMore && !isLoadingMore) {
        void setSize(size + 1);
      }
    }, { rootMargin: '240px' });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, setSize, size]);

  const filteredOrders = useMemo(() => {
    const startTimestamp = dateStart ? dateToTimestamp(dateStart, false) : null;
    const endTimestamp = dateEnd ? dateToTimestamp(dateEnd, true) : null;

    return orders.filter((order) => {
      if (productFilter && order.productId !== Number(productFilter)) return false;
      if (stateFilter !== 'all' && getOrderRuntimeState(order.deployState) !== stateFilter) return false;
      if (pendingUpdateOnly && order.hasNewVersion !== 1) return false;
      if (startTimestamp !== null && order.createdAt < startTimestamp) return false;
      if (endTimestamp !== null && order.createdAt > endTimestamp) return false;
      return true;
    });
  }, [orders, productFilter, stateFilter, pendingUpdateOnly, dateStart, dateEnd]);

  const selectedOrders = useMemo(
    () => orders.filter((order) => selected.has(order.uri)),
    [orders, selected],
  );
  const allRunning = selectedOrders.length > 0
    && selectedOrders.every((order) => getOrderRuntimeState(order.deployState) === 'running');
  const allStopped = selectedOrders.length > 0
    && selectedOrders.every((order) => getOrderRuntimeState(order.deployState) === 'stopped');
  const allFilteredSelected = filteredOrders.length > 0
    && filteredOrders.every((order) => selected.has(order.uri));

  const toggleSelected = (uri: string) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(uri)) next.delete(uri);
      else next.add(uri);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (allFilteredSelected) filteredOrders.forEach((order) => next.delete(order.uri));
      else filteredOrders.forEach((order) => next.add(order.uri));
      return next;
    });
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setKwd(kwdInput.trim());
  };

  const requestAction = (action: PurchaserOrderAction, uris: string[]) => {
    if (uris.length === 0) return;
    setActionError(null);
    setPendingAction({ action, uris });
  };

  const handleConfirmAction = async () => {
    if (!pendingAction || !accessToken) return;
    setActionRunning(true);
    setActionError(null);
    try {
      await runPurchaserOrderAction(accessToken, pendingAction.action, {
        uris: pendingAction.uris,
        env: environment,
        timeZone,
      });
      setPendingAction(null);
      setSelected(new Set());
      await mutate();
    } catch (mutationError) {
      setActionError(mutationError instanceof Error ? mutationError.message : t('actionError'));
    } finally {
      setActionRunning(false);
    }
  };

  const actionLabels: Record<PurchaserOrderAction, string> = {
    start: t('actionStart'),
    stop: t('actionStop'),
    restart: t('actionRestart'),
    destroy: t('actionDestroy'),
    reset: t('actionReset'),
  };

  const stateLabel = (order: PurchaserOrder) => {
    const runtimeState = getOrderRuntimeState(order.deployState);
    if (runtimeState === 'running') return t('stateRunning');
    if (runtimeState === 'exception') return t('stateException');
    if (runtimeState === 'stopped') return t('stateStopped');
    return t('stateUnknown', { code: order.deployState });
  };

  const environmentLabel = environment === 'production' ? headerT('production') : headerT('test');
  const products = profile?.products ?? [];

  const batchActions: { action: PurchaserOrderAction; enabled: boolean }[] = [
    { action: 'start', enabled: allStopped },
    { action: 'stop', enabled: allRunning },
    { action: 'restart', enabled: allRunning },
    { action: 'destroy', enabled: allStopped },
    { action: 'reset', enabled: allStopped },
  ];

  return (
    <div className="min-h-full bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div>
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
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                type="search"
                value={kwdInput}
                onChange={(event) => setKwdInput(event.target.value)}
                placeholder={t('searchPlaceholder')}
                className="h-9 w-56 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              {commonT('search')}
            </button>
          </form>
        </div>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" aria-busy={isLoading}>
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-3">
            <select
              value={productFilter}
              onChange={(event) => setProductFilter(event.target.value)}
              aria-label={t('filterProduct')}
              className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">{t('filterProduct')}</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
            <select
              value={stateFilter}
              onChange={(event) => setStateFilter(event.target.value as StateFilter)}
              aria-label={t('filterState')}
              className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">{t('filterState')}</option>
              <option value="running">{t('stateRunning')}</option>
              <option value="exception">{t('stateException')}</option>
              <option value="stopped">{t('stateStopped')}</option>
            </select>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={dateStart}
                onChange={(event) => setDateStart(event.target.value)}
                aria-label={t('dateStart')}
                className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="text-gray-400">–</span>
              <input
                type="date"
                value={dateEnd}
                onChange={(event) => setDateEnd(event.target.value)}
                aria-label={t('dateEnd')}
                className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={pendingUpdateOnly}
                onChange={(event) => setPendingUpdateOnly(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {t('filterPendingUpdate')}
            </label>
          </div>

          {/* Batch action bar */}
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-blue-100 bg-blue-50/60 px-4 py-2.5">
              <span className="text-sm font-medium text-blue-900">
                {t('selectedCount', { count: selected.size })}
              </span>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                {batchActions.map(({ action, enabled }) => (
                  <button
                    key={action}
                    type="button"
                    disabled={!enabled || actionRunning}
                    onClick={() => requestAction(action, Array.from(selected))}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      DESTRUCTIVE_ACTIONS.has(action)
                        ? 'border-red-200 bg-white text-red-600 hover:bg-red-50'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {actionLabels[action]}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100"
                >
                  {t('clearSelection')}
                </button>
              </div>
            </div>
          )}

          {isLoading && !pages ? (
            <div className="space-y-3 p-5" aria-label={commonT('loading')}>
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-12 animate-pulse rounded-lg bg-gray-100" />
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
          ) : orders.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <span className="mb-3 rounded-full bg-gray-100 p-3 text-gray-400">
                <Inbox className="h-8 w-8" aria-hidden="true" />
              </span>
              <h2 className="font-medium text-gray-900">{t('empty')}</h2>
              <p className="mt-1 text-sm text-gray-500">{t('emptyDescription')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th scope="col" className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={toggleSelectAll}
                          aria-label={t('selectedCount', { count: filteredOrders.length })}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">{t('columnInstanceId')}</th>
                      <th scope="col" className="px-4 py-3 font-medium">{t('columnLogo')}</th>
                      <th scope="col" className="px-4 py-3 font-medium">{t('columnGameName')}</th>
                      <th scope="col" className="px-4 py-3 font-medium">{t('columnState')}</th>
                      <th scope="col" className="px-4 py-3 font-medium">{t('columnProduct')}</th>
                      <th scope="col" className="px-4 py-3 font-medium">{t('columnCreatedAt')}</th>
                      <th scope="col" className="px-4 py-3 font-medium">{t('columnVersion')}</th>
                      <th scope="col" className="px-4 py-3 font-medium">{t('columnScreen')}</th>
                      <th scope="col" className="px-4 py-3 font-medium">{t('columnActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-500">
                          {t('noMatchFilter')}
                        </td>
                      </tr>
                    ) : filteredOrders.map((order) => {
                      const runtimeState = getOrderRuntimeState(order.deployState);
                      const logo = order.icon || order.game?.logo;
                      const screenType = order.latestScreenConfig?.screenType;
                      return (
                        <tr
                          key={order.uri}
                          onClick={() => setDetailOrder(order)}
                          className="cursor-pointer transition-colors hover:bg-gray-50"
                        >
                          <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selected.has(order.uri)}
                              onChange={() => toggleSelected(order.uri)}
                              aria-label={order.uri}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs text-gray-700">{order.uri}</span>
                          </td>
                          <td className="px-4 py-3">
                            {logo ? (
                              <img src={logo} alt="" className="h-9 w-9 rounded-lg object-cover" />
                            ) : (
                              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-sm font-semibold text-gray-500">
                                {(order.game?.name || order.productName).trim().charAt(0).toUpperCase() || '?'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-950">{order.game?.name || '—'}</span>
                          </td>
                          <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                            {STATE_ACTIONS[runtimeState].length > 0 ? (
                              <Menu as="div" className="relative inline-block text-left">
                                <MenuButton
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATE_BADGE_STYLES[runtimeState]}`}
                                >
                                  {stateLabel(order)}
                                  <ChevronDown className="h-3 w-3" aria-hidden="true" />
                                </MenuButton>
                                <MenuItems
                                  transition
                                  modal={false}
                                  anchor={{ to: 'bottom start', gap: 4 }}
                                  className="z-20 w-32 origin-top-left rounded-lg border border-gray-200 bg-white py-1 shadow-lg transition focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0"
                                >
                                  {STATE_ACTIONS[runtimeState].map((action) => (
                                    <MenuItem key={action}>
                                      <button
                                        type="button"
                                        onClick={() => requestAction(action, [order.uri])}
                                        className={`block w-full px-3 py-1.5 text-left text-sm transition-colors data-[focus]:bg-gray-50 ${
                                          DESTRUCTIVE_ACTIONS.has(action) ? 'text-red-600' : 'text-gray-700'
                                        }`}
                                      >
                                        {actionLabels[action]}
                                      </button>
                                    </MenuItem>
                                  ))}
                                </MenuItems>
                              </Menu>
                            ) : (
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATE_BADGE_STYLES[runtimeState]}`}>
                                {stateLabel(order)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-700">{order.productName}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                            {formatTimestamp(order.createdAt, format)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-2">
                              <span className="text-blue-600">{order.deployedVersion || '—'}</span>
                              {order.hasNewVersion === 1 && (
                                <span className="rounded bg-red-500 px-1 py-0.5 text-[10px] font-semibold leading-3 text-white">
                                  {t('newVersion')}
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {screenType === 1 || screenType === 2 ? (
                              <span className="inline-flex items-center gap-1.5">
                                {screenType === 1
                                  ? <Smartphone className="h-4 w-4" aria-hidden="true" />
                                  : <Monitor className="h-4 w-4" aria-hidden="true" />}
                                {screenType === 1 ? t('portrait') : t('landscape')}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={!order.adminUrl}
                                title={order.adminUrl ? undefined : t('adminConsoleUnavailable')}
                                onClick={() => setAdminOrder(order)}
                                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {t('adminConsole')}
                              </button>
                              <button
                                type="button"
                                onClick={() => setDetailOrder(order)}
                                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-500"
                              >
                                {t('viewDetail')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Infinite scroll sentinel + status */}
              <div ref={sentinelRef} />
              {isLoadingMore && hasMore && (
                <div className="space-y-3 p-5" aria-label={t('loadingMore')}>
                  {[1, 2].map((item) => (
                    <div key={item} className="h-12 animate-pulse rounded-lg bg-gray-100" />
                  ))}
                </div>
              )}
              {!hasMore && orders.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-3 text-center text-xs text-gray-400">
                  {t('endOfList', { count: totalCount })}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <OrderDetailModal
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
        onUpdated={() => void mutate()}
        onOpenAdminConsole={setAdminOrder}
      />

      <AdminConsoleModal
        order={adminOrder}
        onClose={() => setAdminOrder(null)}
      />

      <ConfirmDialog
        isOpen={pendingAction !== null}
        title={pendingAction ? t('confirmActionTitle', { action: actionLabels[pendingAction.action] }) : ''}
        description={pendingAction
          ? t('confirmActionDescription', {
            action: actionLabels[pendingAction.action],
            count: pendingAction.uris.length,
          })
          : ''}
        confirmLabel={pendingAction ? actionLabels[pendingAction.action] : commonT('save')}
        cancelLabel={commonT('cancel')}
        tone={pendingAction && DESTRUCTIVE_ACTIONS.has(pendingAction.action) ? 'destructive' : 'warning'}
        loading={actionRunning}
        error={actionError ?? undefined}
        onConfirm={() => void handleConfirmAction()}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
};

export default ApplicationsPage;
