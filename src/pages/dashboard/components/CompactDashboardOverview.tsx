import type { FC, ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Eye, EyeOff } from 'lucide-react';
import DropdownButton from '../../../components/ui/DropdownButton';
import { useSettingsStore } from '../../../stores/settingsStore';
import { CompactDatePicker } from './CompactDatePicker';
import './CompactDashboardOverview.css';

export type CompactDashboardMetricState = 'loading' | 'ready' | 'error' | 'empty';

interface FilterOption {
  key: string;
  label: string;
}

interface CompactDashboardMetricBase {
  metricKey: string;
  label: string;
  state: CompactDashboardMetricState;
}

export type CompactDashboardMetric = CompactDashboardMetricBase & (
  | {
      kind: 'total';
      value?: string;
      currencySymbol?: string;
    }
  | {
      kind: 'period';
      today?: string;
      month?: string;
      todayScale?: number | string;
      monthScale?: number | string;
    }
);

interface CompactDashboardOverviewProps {
  productFilter: {
    options: FilterOption[];
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
  };
  gameFilter: {
    options: FilterOption[];
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    disabled: boolean;
  };
  dateFilter: {
    startDate: string;
    endDate: string;
    onStartDateChange: (value: string) => void;
    onEndDateChange: (value: string) => void;
  };
  metrics: CompactDashboardMetric[];
  trendChart: ReactNode;
  trendCompanion: ReactNode;
}

const ProductFilter: FC<CompactDashboardOverviewProps['productFilter']> = ({
  options,
  value,
  placeholder,
  onChange,
}) => {
  const t = useTranslations('Dashboard');
  const selectedOption = options.find((option) => option.key === value);
  const selectedLabel = selectedOption?.label ?? placeholder;

  return (
    <DropdownButton
      aria-label={t('filterProduct')}
      className="compact-dashboard-filter-button"
      items={options.map((option) => ({
        key: option.key,
        label: option.label,
        className: [
          'compact-dashboard-filter-option',
          option.key === value ? 'bg-state-accent-active font-medium text-text-primary' : '',
        ].filter(Boolean).join(' '),
      }))}
      renderItem={(item) => (
        <span className="compact-dashboard-filter-option__label" title={String(item.label)}>
          {item.label}
        </span>
      )}
      onSelect={onChange}
      placement="bottom-start"
      size="medium"
      variant="secondary"
      disabled={options.length === 0}
    >
      <span className="compact-dashboard-filter-button__label" title={selectedLabel}>
        {selectedLabel}
      </span>
    </DropdownButton>
  );
};

const GameFilter: FC<CompactDashboardOverviewProps['gameFilter']> = ({
  options,
  value,
  placeholder,
  onChange,
  disabled,
}) => {
  const t = useTranslations('Dashboard');
  const selectedLabel = disabled ? placeholder : options.find((option) => option.key === value)?.label ?? placeholder;

  return (
    <DropdownButton
      aria-label={t('filterGame')}
      className="compact-dashboard-filter-button"
      items={options.map((option) => ({
        key: option.key,
        label: option.label,
        className: [
          'compact-dashboard-filter-option',
          option.key === value ? 'bg-state-accent-active font-medium text-text-primary' : '',
        ].filter(Boolean).join(' '),
      }))}
      renderItem={(item) => (
        <span className="compact-dashboard-filter-option__label" title={String(item.label)}>{item.label}</span>
      )}
      onSelect={onChange}
      placement="bottom-start"
      size="medium"
      variant="secondary"
      disabled={disabled}
    >
      <span className="compact-dashboard-filter-button__label" title={selectedLabel}>{selectedLabel}</span>
    </DropdownButton>
  );
};

const normalizeScale = (value: number | string | undefined) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const formatScale = (value: number | string | undefined, locale: string) => {
  const numericValue = normalizeScale(value);
  const formattedValue = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(numericValue);
  return `${numericValue > 0 ? '+' : ''}${formattedValue}%`;
};

const MASKED_VALUE = '****';

const TrendIndicator: FC<{
  value: number | string | undefined;
  label: string;
  masked?: boolean;
}> = ({ value, label, masked = false }) => {
  const locale = useLocale();
  const numericValue = normalizeScale(value);
  const isNeutral = numericValue === 0;
  const isPositive = numericValue > 0;
  const tone = isNeutral ? 'neutral' : isPositive ? 'negative' : 'positive';

  return (
    <div className="compact-dashboard-comparison">
      {masked ? (
        <span className="compact-dashboard-trend compact-dashboard-trend--neutral">{MASKED_VALUE}</span>
      ) : (
        <span className={`compact-dashboard-trend compact-dashboard-trend--${tone}`}>
          <span aria-hidden="true">{isNeutral ? '→' : isPositive ? '↗' : '↘'}</span>
          {formatScale(value, locale)}
        </span>
      )}
      <span>{label}</span>
    </div>
  );
};

const MetricCard: FC<{ metric: CompactDashboardMetric }> = ({ metric }) => {
  const t = useTranslations('Dashboard');
  const hiddenMetrics = useSettingsStore((state) => state.hiddenDashboardMetrics);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const hidden = hiddenMetrics.includes(metric.metricKey);
  const stateLabel = metric.state === 'empty' ? t('noApplications') : t('dataUnavailable');

  const toggleHidden = () => {
    updateSettings({
      hiddenDashboardMetrics: hidden
        ? hiddenMetrics.filter((key) => key !== metric.metricKey)
        : [...hiddenMetrics, metric.metricKey],
    });
  };

  return (
    <article className="compact-dashboard-kpi" aria-busy={metric.state === 'loading'}>
      <p className="compact-dashboard-kpi__label">{metric.label}</p>
      {metric.state === 'ready' && (
        <button
          type="button"
          aria-label={hidden ? t('showMetricValue', { label: metric.label }) : t('hideMetricValue', { label: metric.label })}
          aria-pressed={!hidden}
          onClick={toggleHidden}
          className="compact-dashboard-kpi__visibility-toggle"
        >
          {hidden
            ? <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
        </button>
      )}
      {metric.state === 'loading' ? (
        <div className="compact-dashboard-kpi-skeleton" aria-label={t('loadingMetric', { label: metric.label })}>
          <span />
          <span />
          <span />
        </div>
      ) : metric.state !== 'ready' ? (
        <div className="compact-dashboard-kpi__state">
          <strong>—</strong>
          <span>{stateLabel}</span>
        </div>
      ) : metric.kind === 'total' ? (
        <div className="compact-dashboard-kpi__total">
          <span>{t('total')}</span>
          <strong>
            {metric.currencySymbol && (
              <span className="compact-dashboard-kpi__currency-symbol">{metric.currencySymbol}</span>
            )}
            <span className="compact-dashboard-kpi__total-value">
              {hidden ? MASKED_VALUE : metric.value ?? '—'}
            </span>
          </strong>
        </div>
      ) : (
        <>
          <div className="compact-dashboard-kpi__period-values">
            <div>
              <span>{t('today')}</span>
              <strong>{hidden ? MASKED_VALUE : metric.today ?? '—'}</strong>
            </div>
            <div>
              <span>{t('thisMonth')}</span>
              <strong>{hidden ? MASKED_VALUE : metric.month ?? '—'}</strong>
            </div>
          </div>
          <div className="compact-dashboard-comparisons">
            <TrendIndicator value={metric.todayScale} label={t('vsYesterday')} masked={hidden} />
            <TrendIndicator value={metric.monthScale} label={t('vsLastMonth')} masked={hidden} />
          </div>
        </>
      )}
    </article>
  );
};

export const CompactDashboardOverview: FC<CompactDashboardOverviewProps> = ({
  productFilter,
  gameFilter,
  dateFilter,
  metrics,
  trendChart,
  trendCompanion,
}) => {
  const t = useTranslations('Dashboard');
  const locale = useLocale();

  return (
  <section className="compact-dashboard-overview" aria-label={t('overview')}>
    <header className="compact-dashboard-toolbar">
      <div className="compact-dashboard-filters">
        <ProductFilter {...productFilter} />
        <GameFilter {...gameFilter} />
        <CompactDatePicker
          label={t('startDate')}
          value={dateFilter.startDate}
          max={dateFilter.endDate}
          locale={locale}
          todayLabel={t('today')}
          previousMonthLabel={t('previousMonth')}
          nextMonthLabel={t('nextMonth')}
          onChange={dateFilter.onStartDateChange}
        />
        <CompactDatePicker
          label={t('endDate')}
          value={dateFilter.endDate}
          min={dateFilter.startDate}
          locale={locale}
          todayLabel={t('today')}
          previousMonthLabel={t('previousMonth')}
          nextMonthLabel={t('nextMonth')}
          onChange={dateFilter.onEndDateChange}
        />
      </div>
    </header>
    <section className="compact-dashboard-kpi-grid" aria-label={t('performance')}>
      {metrics.map((metric) => <MetricCard key={metric.metricKey} metric={metric} />)}
    </section>
    <div className="compact-dashboard-trend-layout">
      {trendChart}
      {trendCompanion}
    </div>
  </section>
  );
};
