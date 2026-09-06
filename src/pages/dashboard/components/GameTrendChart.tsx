import { useId, useMemo, useState, type FC } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { PurchaserGameBillTrend, PurchaserTrendPoint } from '../../../api/paasBilling';

export type TrendMetricKey = 'newPlayers' | 'players' | 'investedGold' | 'goldFlow';

interface GameTrendChartProps {
  data?: PurchaserGameBillTrend;
  startDate: string;
  endDate: string;
  timeZone: number;
  currency: string;
  isLoading: boolean;
  hasError: boolean;
  hasProduct: boolean;
}

const METRICS: Array<{ key: TrendMetricKey; source: keyof PurchaserGameBillTrend; money: boolean }> = [
  { key: 'newPlayers', source: 'add_game_people_list', money: false },
  { key: 'players', source: 'game_people_list', money: false },
  { key: 'investedGold', source: 'invest_gold_total_list', money: true },
  { key: 'goldFlow', source: 'gold_coin_flow_list', money: true },
];

const DAY_SECONDS = 86_400;
const CHART_WIDTH = 960;
const CHART_HEIGHT = 272;
const PADDING = { top: 20, right: 24, bottom: 36, left: 68 };

const dateToDayNumber = (value: string) => Math.floor(Date.parse(`${value}T00:00:00Z`) / 1000 / DAY_SECONDS);
const dayNumberToDate = (day: number) => new Date(day * DAY_SECONDS * 1000).toISOString().slice(0, 10);
const timestampToDayNumber = (timestamp: number, timeZone: number) =>
  Math.floor((timestamp + timeZone * 3600) / DAY_SECONDS);

const buildSeries = (
  source: PurchaserTrendPoint[],
  startDate: string,
  endDate: string,
  timeZone: number,
) => {
  const start = dateToDayNumber(startDate);
  const end = dateToDayNumber(endDate);
  const totals = new Map<number, number>();

  source.forEach((point) => {
    const day = timestampToDayNumber(point.createTime, timeZone);
    if (day < start || day > end) return;
    totals.set(day, (totals.get(day) ?? 0) + (Number.isFinite(point.value) ? point.value : 0));
  });

  return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => {
    const day = start + index;
    return { date: dayNumberToDate(day), value: totals.get(day) ?? 0 };
  });
};

const buildSmoothPath = (points: Array<{ x: number; y: number }>) => {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const midX = (previous.x + point.x) / 2;
    return `${path} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
  }, '');
};

const getNiceStep = (roughStep: number) => {
  if (!Number.isFinite(roughStep) || roughStep <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const fraction = roughStep / magnitude;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * magnitude;
};

const buildYAxis = (values: number[]) => {
  const dataMin = Math.min(0, ...values);
  const dataMax = Math.max(0, ...values);

  if (dataMin === 0 && dataMax === 0) {
    return { min: 0, max: 4, ticks: [0, 1, 2, 3, 4] };
  }

  const step = getNiceStep((dataMax - dataMin) / 4);
  const min = Math.floor(dataMin / step) * step;
  const max = Math.ceil(dataMax / step) * step;
  const tickCount = Math.round((max - min) / step);
  const ticks = Array.from(
    { length: tickCount + 1 },
    (_, index) => Number((min + index * step).toPrecision(12)),
  );

  return { min, max, ticks };
};

export const GameTrendChart: FC<GameTrendChartProps> = ({
  data,
  startDate,
  endDate,
  timeZone,
  currency,
  isLoading,
  hasError,
  hasProduct,
}) => {
  const t = useTranslations('Dashboard');
  const locale = useLocale();
  const gradientId = useId().replace(/:/g, '');
  const [activeMetric, setActiveMetric] = useState<TrendMetricKey>('newPlayers');
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const metric = METRICS.find((item) => item.key === activeMetric) ?? METRICS[0];
  const series = useMemo(() => {
    const source = (data?.[metric.source] ?? []) as PurchaserTrendPoint[];
    return buildSeries(source, startDate, endDate, timeZone);
  }, [data, endDate, metric.source, startDate, timeZone]);
  const hasMetricData = ((data?.[metric.source] ?? []) as PurchaserTrendPoint[]).length > 0;
  const yAxis = useMemo(() => buildYAxis(series.map((point) => point.value)), [series]);
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const valueToY = (value: number) =>
    PADDING.top + (yAxis.max - value) / (yAxis.max - yAxis.min) * plotHeight;
  const zeroY = valueToY(0);
  const points = series.map((point, index) => ({
    ...point,
    x: PADDING.left + (series.length <= 1 ? plotWidth / 2 : index * plotWidth / (series.length - 1)),
    y: valueToY(point.value),
  }));
  const formatter = useMemo(() => {
    if (!metric.money) return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency.trim().toUpperCase(),
        maximumFractionDigits: 0,
      });
    } catch {
      return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
    }
  }, [currency, locale, metric.money]);
  const axisFormatter = useMemo(() => {
    const compactOptions: Intl.NumberFormatOptions = {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    };
    if (!metric.money) return new Intl.NumberFormat(locale, compactOptions);
    try {
      return new Intl.NumberFormat(locale, {
        ...compactOptions,
        style: 'currency',
        currency: currency.trim().toUpperCase(),
        currencyDisplay: 'narrowSymbol',
      });
    } catch {
      return new Intl.NumberFormat(locale, compactOptions);
    }
  }, [currency, locale, metric.money]);
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    [locale],
  );
  const tooltipDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }),
    [locale],
  );
  const stateMessage = !hasProduct
    ? t('noApplications')
    : hasError
      ? t('trendUnavailable')
      : t('noTrendData');

  return (
    <section className="game-trend" aria-label={t('trendAnalysis')} aria-busy={isLoading}>
      <div className="game-trend__header">
        <div className="game-trend__tabs" role="tablist" aria-label={t('trendMetric')}>
          {METRICS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={item.key === activeMetric}
              className={item.key === activeMetric ? 'is-active' : ''}
              onClick={() => {
                setActiveMetric(item.key);
                setFocusedIndex(null);
              }}
            >
              {t(item.key)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="game-trend__skeleton" aria-label={t('loadingTrend')}><span /><span /><span /><span /></div>
      ) : !data || hasError || !hasProduct || !hasMetricData ? (
        <div className="game-trend__state"><strong>—</strong><span>{stateMessage}</span></div>
      ) : (
        <div className="game-trend__viewport" onPointerLeave={() => setFocusedIndex(null)}>
          <div className="game-trend__stage">
          <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label={`${t(metric.key)} · ${t('trendChart')}`}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--game-trend-series-color)" stopOpacity="0.16" />
                <stop offset="100%" stopColor="var(--game-trend-series-color)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {yAxis.ticks.map((tick) => {
              const y = valueToY(tick);
              return (
                <g key={tick}>
                  <line className={`game-trend__grid ${tick === 0 ? 'is-zero' : ''}`} x1={PADDING.left} x2={CHART_WIDTH - PADDING.right} y1={y} y2={y} />
                  <text className="game-trend__axis-label" x={PADDING.left - 12} y={y + 4} textAnchor="end">
                    {axisFormatter.format(tick)}
                  </text>
                </g>
              );
            })}
            <line className="game-trend__axis" x1={PADDING.left} x2={PADDING.left} y1={PADDING.top} y2={PADDING.top + plotHeight} />
            <path
              className="game-trend__area"
              d={`${buildSmoothPath(points)} L ${points.at(-1)?.x ?? PADDING.left} ${zeroY} L ${points[0]?.x ?? PADDING.left} ${zeroY} Z`}
              fill={`url(#${gradientId})`}
            />
            <path className="game-trend__line" d={buildSmoothPath(points)} />
            {focusedIndex !== null && points[focusedIndex] && (
              <line
                className="game-trend__focus-line"
                x1={points[focusedIndex].x}
                x2={points[focusedIndex].x}
                y1={PADDING.top}
                y2={PADDING.top + plotHeight}
              />
            )}
            {points.map((point, index) => {
              const showLabel = series.length <= 8 || index === 0 || index === series.length - 1 || index % Math.ceil(series.length / 7) === 0;
              const isFocused = focusedIndex === index;
              return (
                <g key={point.date}>
                  {showLabel && (
                    <text className="game-trend__axis-label" x={point.x} y={CHART_HEIGHT - 14} textAnchor="middle">
                      {dateFormatter.format(new Date(`${point.date}T00:00:00Z`))}
                    </text>
                  )}
                  <circle
                    className="game-trend__point-hit"
                    cx={point.x}
                    cy={point.y}
                    r="12"
                    tabIndex={0}
                    aria-label={`${point.date}: ${formatter.format(point.value)}`}
                    onFocus={() => setFocusedIndex(index)}
                    onBlur={() => setFocusedIndex(null)}
                  />
                  <circle className={`game-trend__point ${isFocused ? 'is-focused' : ''}`} cx={point.x} cy={point.y} r={isFocused ? 5 : 3} />
                </g>
              );
            })}
            <rect
              className="game-trend__interaction"
              x={PADDING.left}
              y={PADDING.top}
              width={plotWidth}
              height={plotHeight}
              onPointerMove={(event) => {
                const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
                if (!bounds || points.length === 0) return;
                const svgX = (event.clientX - bounds.left) / bounds.width * CHART_WIDTH;
                const ratio = Math.max(0, Math.min(1, (svgX - PADDING.left) / plotWidth));
                setFocusedIndex(Math.round(ratio * (points.length - 1)));
              }}
            />
          </svg>
          {focusedIndex !== null && points[focusedIndex] && (
            <div
              className={`game-trend__tooltip ${points[focusedIndex].x < CHART_WIDTH * 0.2 ? 'is-start' : points[focusedIndex].x > CHART_WIDTH * 0.8 ? 'is-end' : ''}`}
              style={{
                left: `${points[focusedIndex].x / CHART_WIDTH * 100}%`,
                top: `${Math.max(68, points[focusedIndex].y) / CHART_HEIGHT * 100}%`,
              }}
              role="status"
            >
              <span>{tooltipDateFormatter.format(new Date(`${points[focusedIndex].date}T00:00:00Z`))}</span>
              <strong>{formatter.format(points[focusedIndex].value)}</strong>
            </div>
          )}
          </div>
        </div>
      )}
    </section>
  );
};
