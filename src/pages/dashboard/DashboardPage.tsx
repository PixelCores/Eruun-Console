import { useMemo, useState, type FC } from 'react';
import useSWR from 'swr';
import { useLocale, useTranslations } from 'next-intl';
import {
  exportPurchaserGameBillDetails,
  getPurchaserGameBillDetails,
  getPurchaserGameBillTrend,
  getPurchaserGameBillTotal,
  getPurchaserGames,
  getPurchaserProfile,
  getPurchaserRevenueDashboard,
} from '../../api/paasBilling';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import {
  CompactDashboardOverview,
  type CompactDashboardMetric,
  type CompactDashboardMetricState,
} from './components/CompactDashboardOverview';
import { GameTrendChart } from './components/GameTrendChart';
import {
  GameBillDetailsTable,
  type GameBillDetailsGranularity,
} from './components/GameBillDetailsTable';
import LeadsByStatusWidget from './components/LeadsByStatusWidget';

const ALL_GAMES = 'all';
const DAY_SECONDS = 86_400;

const getDateInTimeZone = (timestampMs: number, timeZone: number) =>
  new Date(timestampMs + timeZone * 3600 * 1000).toISOString().slice(0, 10);

const getDefaultDateRange = (timeZone: number) => {
  const endDate = getDateInTimeZone(Date.now(), timeZone);
  const endDay = Math.floor(Date.parse(`${endDate}T00:00:00Z`) / 1000 / DAY_SECONDS);
  return {
    timeZone,
    startDate: new Date((endDay - 6) * DAY_SECONDS * 1000).toISOString().slice(0, 10),
    endDate,
  };
};

const dateBoundaryToTimestamp = (date: string, timeZone: number, endOfDay = false) => {
  const utcSeconds = Math.floor(Date.parse(`${date}T00:00:00Z`) / 1000);
  return utcSeconds - timeZone * 3600 + (endOfDay ? DAY_SECONDS - 1 : 0);
};

const formatInteger = (value: number, locale: string) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);

const formatCurrency = (value: number, currency: string, locale: string) => {
  const normalizedCurrency = currency.trim().toUpperCase();

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: normalizedCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return formatInteger(value, locale);
  }
};

const formatCurrencyParts = (value: number, currency: string, locale: string) => {
  const normalizedCurrency = currency.trim().toUpperCase();

  try {
    const parts = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: normalizedCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(value);

    return {
      currencySymbol: parts.find((part) => part.type === 'currency')?.value,
      value: parts
        .filter((part) => part.type !== 'currency')
        .map((part) => part.value)
        .join('')
        .trim(),
    };
  } catch {
    return { value: formatInteger(value, locale) };
  }
};

const resolveMetricState = (
  hasProduct: boolean,
  productsLoading: boolean,
  productsError: unknown,
  metricLoading: boolean,
  metricError: unknown,
  hasData: boolean,
): CompactDashboardMetricState => {
  if (productsLoading || (hasProduct && metricLoading)) return 'loading';
  if ((!hasProduct && productsError) || metricError) return 'error';
  if (!hasProduct) return 'empty';
  return hasData ? 'ready' : 'error';
};

const DashboardPage: FC = () => {
  const t = useTranslations('Dashboard');
  const locale = useLocale();
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const environment = useSettingsStore((state) => state.environment);
  const timeZone = useSettingsStore((state) => state.timeZone);
  const [productSelection, setProductSelection] = useState({ environment, id: null as number | null });
  const [gameSelection, setGameSelection] = useState({ productId: null as number | null, gameUri: ALL_GAMES });
  const [dateSelection, setDateSelection] = useState(() => getDefaultDateRange(timeZone));
  const [detailsGranularity, setDetailsGranularity] = useState<GameBillDetailsGranularity>('day');
  const [detailsExporting, setDetailsExporting] = useState(false);
  const [detailsExportError, setDetailsExportError] = useState<string | null>(null);
  const selectedProductId = productSelection.environment === environment ? productSelection.id : null;
  const dateRange = dateSelection.timeZone === timeZone ? dateSelection : getDefaultDateRange(timeZone);
  const {
    data: purchaser,
    error: productsError,
    isLoading: productsLoading,
  } = useSWR(
    accessToken ? ['purchaser-products', accessToken, environment, timeZone] : null,
    ([, token]) => getPurchaserProfile(token, { env: environment, timeZone }),
  );

  const products = useMemo(() => (
    Array.isArray(purchaser?.products)
      ? purchaser.products.filter((product) => (
          product.env === environment
          && Number.isFinite(product.id)
          && product.name?.trim()
        ))
      : []
  ), [environment, purchaser]);

  const activeProduct = products.find((product) => product.id === selectedProductId) ?? products[0];
  const activeProductId = activeProduct?.id;
  const hasProduct = activeProduct !== undefined;
  const selectedGameUri = gameSelection.productId === activeProductId ? gameSelection.gameUri : ALL_GAMES;

  const {
    data: gameList,
    error: gamesError,
    isLoading: gamesLoading,
  } = useSWR(
    accessToken && activeProductId !== undefined
      ? ['purchaser-games', accessToken, activeProductId, environment, timeZone] as const
      : null,
    ([, token, productId]) => getPurchaserGames(token, {
      page: 1,
      pageSize: 9999,
      productId,
      env: environment,
      timeZone,
    }),
  );

  const games = useMemo(() => {
    const seen = new Set<string>();
    return (Array.isArray(gameList?.data) ? gameList.data : []).filter((game) => {
      const gameUri = game.gameUri?.trim();
      const gameName = game.gameName?.trim();
      if (!gameUri || !gameName || seen.has(gameUri)) return false;
      seen.add(gameUri);
      return true;
    });
  }, [gameList]);

  const trendRequest = activeProductId === undefined ? null : {
    starTime: dateBoundaryToTimestamp(dateRange.startDate, timeZone),
    endTime: dateBoundaryToTimestamp(dateRange.endDate, timeZone, true),
    productId: activeProductId,
    ...(selectedGameUri === ALL_GAMES ? {} : { gameUri: selectedGameUri }),
    env: environment,
    timeZone,
  };

  const {
    data: trendData,
    error: trendError,
    isLoading: trendLoading,
  } = useSWR(
    accessToken && trendRequest
      ? ['game-bill-trend', accessToken, trendRequest] as const
      : null,
    ([, token, query]) => getPurchaserGameBillTrend(token, query),
  );

  const detailsRequest = activeProductId === undefined ? null : {
    starTime: dateBoundaryToTimestamp(dateRange.startDate, timeZone),
    endTime: dateBoundaryToTimestamp(dateRange.endDate, timeZone, true),
    productId: activeProductId,
    group: 0,
    isDay: detailsGranularity === 'day',
    env: environment,
    timeZone,
  };

  const {
    data: detailsData,
    error: detailsError,
    isLoading: detailsLoading,
  } = useSWR(
    accessToken && detailsRequest
      ? ['game-bill-details', accessToken, detailsRequest] as const
      : null,
    ([, token, query]) => getPurchaserGameBillDetails(token, query),
  );

  const handleDetailsExport = async () => {
    if (!accessToken || !detailsRequest || detailsExporting) return;

    const downloadWindow = window.open('about:blank', '_blank');
    if (!downloadWindow) {
      setDetailsExportError(t('gameBillExportPopupBlocked'));
      return;
    }

    downloadWindow.opener = null;
    setDetailsExporting(true);
    setDetailsExportError(null);

    try {
      const result = await exportPurchaserGameBillDetails(accessToken, {
        ...detailsRequest,
        fileFormat: 1,
      });
      if (typeof result.url !== 'string' || !result.url.trim()) {
        throw new Error('The export URL is missing.');
      }
      const exportUrl = new URL(result.url, window.location.origin);
      if (exportUrl.protocol !== 'http:' && exportUrl.protocol !== 'https:') {
        throw new Error('Unsupported export URL protocol.');
      }

      downloadWindow.location.replace(exportUrl.href);
    } catch {
      downloadWindow.close();
      setDetailsExportError(t('gameBillExportFailed'));
    } finally {
      setDetailsExporting(false);
    }
  };

  const {
    data: revenueDashboard,
    error: revenueError,
    isLoading: revenueLoading,
  } = useSWR(
    accessToken && activeProductId !== undefined
      ? ['compact-game-bill-dashboard', accessToken, activeProductId, environment, timeZone] as const
      : null,
    ([, token, productId]) => getPurchaserRevenueDashboard(token, {
      productId,
      env: environment,
      timeZone,
    }),
  );

  const {
    data: gameBillTotal,
    error: totalError,
    isLoading: totalLoading,
  } = useSWR(
    accessToken && activeProductId !== undefined
      ? ['compact-game-bill-total', accessToken, activeProductId, environment, timeZone] as const
      : null,
    ([, token, productId]) => getPurchaserGameBillTotal(token, {
      product_id: productId,
      env: environment,
      timeZone,
    }),
  );

  const productOptions = useMemo(() => products.map((product) => ({
    key: String(product.id),
    label: product.name.trim(),
  })), [products]);

  const productPlaceholder = productsLoading
    ? t('loadingProducts')
    : productsError
      ? t('productsUnavailable')
      : t('noProducts');
  const gameOptions = useMemo(() => [
    { key: ALL_GAMES, label: t('allGames') },
    ...games.map((game) => ({ key: game.gameUri.trim(), label: game.gameName.trim() })),
  ], [games, t]);
  const gamePlaceholder = gamesLoading
    ? t('loadingGames')
    : gamesError
      ? t('gamesUnavailable')
      : t('allGames');

  const compactMetrics = useMemo<CompactDashboardMetric[]>(() => {
    const totalState = resolveMetricState(
      hasProduct,
      productsLoading,
      productsError,
      totalLoading,
      totalError,
      gameBillTotal !== undefined,
    );
    const revenueState = resolveMetricState(
      hasProduct,
      productsLoading,
      productsError,
      revenueLoading,
      revenueError,
      revenueDashboard !== undefined,
    );
    const currency = activeProduct?.currency ?? '';
    const accumulatedProfit = gameBillTotal
      ? formatCurrencyParts(gameBillTotal.accumulated_profit, currency, locale)
      : undefined;

    return [
      {
        kind: 'total',
        metricKey: 'accumulatedProfit',
        label: t('accumulatedProfit'),
        state: totalState,
        currencySymbol: accumulatedProfit?.currencySymbol,
        value: accumulatedProfit?.value,
      },
      {
        kind: 'period',
        metricKey: 'profit',
        label: t('profit'),
        state: revenueState,
        today: revenueDashboard ? formatCurrency(revenueDashboard.accumulated_profit_today, currency, locale) : undefined,
        month: revenueDashboard ? formatCurrency(revenueDashboard.accumulated_profit_month, currency, locale) : undefined,
        todayScale: revenueDashboard?.accumulated_profit_today_scale,
        monthScale: revenueDashboard?.accumulated_profit_month_scale,
      },
      {
        kind: 'period',
        metricKey: 'newPlayers',
        label: t('newPlayers'),
        state: revenueState,
        today: revenueDashboard ? formatInteger(revenueDashboard.add_game_people_today, locale) : undefined,
        month: revenueDashboard ? formatInteger(revenueDashboard.add_game_people_month, locale) : undefined,
        todayScale: revenueDashboard?.add_game_people_today_scale,
        monthScale: revenueDashboard?.add_game_people_month_scale,
      },
      {
        kind: 'period',
        metricKey: 'players',
        label: t('players'),
        state: revenueState,
        today: revenueDashboard ? formatInteger(revenueDashboard.game_people_today, locale) : undefined,
        month: revenueDashboard ? formatInteger(revenueDashboard.game_people_month, locale) : undefined,
        todayScale: revenueDashboard?.game_people_today_scale,
        monthScale: revenueDashboard?.game_people_month_scale,
      },
      {
        kind: 'period',
        metricKey: 'consumption',
        label: t('consumption'),
        state: revenueState,
        today: revenueDashboard ? formatInteger(revenueDashboard.gold_cost_total, locale) : undefined,
        month: revenueDashboard ? formatInteger(revenueDashboard.gold_cost_total_month, locale) : undefined,
        todayScale: revenueDashboard?.gold_cost_total_today_scale,
        monthScale: revenueDashboard?.gold_cost_total_month_scale,
      },
    ];
  }, [
    activeProduct?.currency,
    locale,
    gameBillTotal,
    hasProduct,
    productsError,
    productsLoading,
    revenueDashboard,
    revenueError,
    revenueLoading,
    totalError,
    totalLoading,
    t,
  ]);

  return (
    <main className="compact-dashboard">
      <CompactDashboardOverview
        productFilter={{
          options: productOptions,
          value: activeProductId === undefined ? '' : String(activeProductId),
          placeholder: productPlaceholder,
          onChange: (value) => {
            setProductSelection({ environment, id: Number(value) });
            setGameSelection({ productId: Number(value), gameUri: ALL_GAMES });
          },
        }}
        gameFilter={{
          options: gameOptions,
          value: selectedGameUri,
          placeholder: gamePlaceholder,
          onChange: (gameUri) => setGameSelection({ productId: activeProductId ?? null, gameUri }),
          disabled: !hasProduct || gamesLoading || Boolean(gamesError),
        }}
        dateFilter={{
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          onStartDateChange: (startDate) => setDateSelection({ ...dateRange, timeZone, startDate }),
          onEndDateChange: (endDate) => setDateSelection({ ...dateRange, timeZone, endDate }),
        }}
        metrics={compactMetrics}
        trendChart={(
          <GameTrendChart
            data={trendData}
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            timeZone={timeZone}
            currency={activeProduct?.currency ?? ''}
            isLoading={trendLoading}
            hasError={Boolean(trendError)}
            hasProduct={hasProduct}
          />
        )}
        trendCompanion={<LeadsByStatusWidget />}
      />
      <GameBillDetailsTable
        rows={detailsData?.details ?? []}
        isLoading={productsLoading || (hasProduct && detailsLoading)}
        hasError={Boolean(productsError || detailsError)}
        granularity={detailsGranularity}
        onGranularityChange={(granularity) => {
          setDetailsGranularity(granularity);
          setDetailsExportError(null);
        }}
        onExport={handleDetailsExport}
        isExporting={detailsExporting}
        exportDisabled={!accessToken || !detailsRequest}
        exportError={detailsExportError}
      />
    </main>
  );
};

export default DashboardPage;
