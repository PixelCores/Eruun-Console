import { useMemo, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  AppWindow,
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  Download,
  ExternalLink,
  Globe2,
  Info,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import useSWR from 'swr';
import {
  getPaaSApplicationTypes,
  getPurchaserProfile,
  type PurchaserProduct,
  type PurchaserProfile,
} from '../../api/paasBilling';
import ConfirmDialog from '../../components/base/ConfirmDialog';
import { useAuthStore } from '../../stores/authStore';
import { getSafeExternalUrl } from '../../utils/url';
import ApplicationConfigurationPanel from './ApplicationConfigurationPanel';

const PRODUCTION_ENVIRONMENT = 'production';
const PRODUCTION_TIME_ZONE = 8;

type ApplicationManagementKey = readonly [
  'application-management-products',
  string,
];

type ApplicationTypeKey = readonly [
  'application-management-app-types',
  string,
];

interface DetailItemProps {
  label: string;
  children: ReactNode;
}

const DetailItem = ({ label, children }: DetailItemProps) => (
  <div className="min-w-0">
    <dt className="text-xs font-medium leading-5 text-gray-500">{label}</dt>
    <dd className="mt-1 min-w-0 text-[15px] font-medium leading-6 text-gray-950 [overflow-wrap:anywhere]">
      {children}
    </dd>
  </div>
);

interface DetailFieldsProps {
  children: ReactNode;
}

const DetailFields = ({ children }: DetailFieldsProps) => (
  <dl className="grid min-w-0 grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
    {children}
  </dl>
);

interface DetailSectionProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}

const DetailSection = ({ title, icon: Icon, children }: DetailSectionProps) => (
  <section className="mx-5 border-b border-gray-100 py-6 last:border-b-0 lg:mx-7 lg:py-7">
    <div className="mb-5 flex items-center gap-2.5">
      <Icon className="h-4 w-4 text-gray-400" strokeWidth={1.75} aria-hidden="true" />
      <h2 className="text-sm font-semibold tracking-[-0.01em] text-gray-900">{title}</h2>
    </div>
    {children}
  </section>
);

interface StatePanelProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const StatePanel = ({
  title,
  description,
  actionLabel,
  onAction,
}: StatePanelProps) => (
  <div className="flex h-full min-h-64 items-center justify-center px-6 py-12 text-center">
    <div className="max-w-sm">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <AppWindow className="h-6 w-6" aria-hidden="true" />
      </span>
      <h2 className="mt-3 text-sm font-semibold text-gray-900">{title}</h2>
      {description && <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          {actionLabel}
        </button>
      )}
    </div>
  </div>
);

const formatNumber = (value: number | undefined, locale: string, fallback: string) => (
  typeof value === 'number' && Number.isFinite(value)
    ? new Intl.NumberFormat(locale).format(value)
    : fallback
);

const formatPercentage = (value: number | undefined, locale: string, fallback: string) => (
  typeof value === 'number' && Number.isFinite(value)
    ? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)}%`
    : fallback
);

interface CommercialSummaryProps {
  exchange: {
    amount: string;
    currency: string;
    coins: string;
  } | null;
  partyAShare: number | undefined;
  partyBShare: number | undefined;
  locale: string;
  fallback: string;
  labels: {
    exchangeRate: string;
    rechargeAmount: string;
    coins: string;
    partyAShare: string;
    partyBShare: string;
  };
}

const CommercialSummary = ({
  exchange,
  partyAShare,
  partyBShare,
  locale,
  fallback,
  labels,
}: CommercialSummaryProps) => {
  const partyADisplay = formatPercentage(partyAShare, locale, fallback);
  const partyBDisplay = formatPercentage(partyBShare, locale, fallback);
  const hasValidRatio = (
    typeof partyBShare === 'number'
    && Number.isFinite(partyBShare)
    && partyBShare >= 0
    && partyBShare <= 100
  );

  return (
    <div className="grid min-w-0 lg:grid-cols-2">
      <div className="min-w-0 pb-6 lg:pb-0 lg:pr-10">
        <p className="text-xs font-medium leading-5 text-gray-500">{labels.exchangeRate}</p>
        {exchange ? (
          <div className="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
            <div className="min-w-0">
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="min-w-0 [overflow-wrap:anywhere] text-[15px] font-medium leading-6 text-gray-950 tabular-nums">
                  {exchange.amount}
                </span>
                <span className="break-all text-[15px] font-medium leading-6 text-gray-500">
                  {exchange.currency}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400">{labels.rechargeAmount}</p>
            </div>

            <ArrowRight
              className="h-5 w-5 shrink-0 text-gray-300"
              strokeWidth={1.75}
              aria-hidden="true"
            />

            <div className="min-w-0">
              <p className="[overflow-wrap:anywhere] text-[15px] font-medium leading-6 text-gray-950 tabular-nums">
                {exchange.coins}
              </p>
              <p className="mt-1 text-xs text-gray-400">{labels.coins}</p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm leading-6 text-gray-400">{fallback}</p>
        )}
      </div>

      <div className="min-w-0 border-t border-gray-100 pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
        <div className="grid grid-cols-2 gap-6">
          <div className="min-w-0">
            <p className="text-xs font-medium leading-5 text-gray-500">{labels.partyAShare}</p>
            <p className="mt-1 text-[15px] font-medium leading-6 text-gray-950 tabular-nums">
              {partyADisplay}
            </p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-xs font-medium leading-5 text-gray-500">{labels.partyBShare}</p>
            <p className="mt-1 text-[15px] font-medium leading-6 text-gray-950 tabular-nums">
              {partyBDisplay}
            </p>
          </div>
        </div>

        {hasValidRatio ? (
          <div
            className="mt-5 flex h-2 overflow-hidden rounded-full bg-blue-50"
            aria-hidden="true"
          >
            <span
              className="h-full bg-[#93C5FD]"
              style={{ width: `${100 - partyBShare}%` }}
              aria-hidden="true"
            />
            <span
              className="h-full bg-blue-100"
              style={{ width: `${partyBShare}%` }}
              aria-hidden="true"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

interface PublicLinkValueProps {
  label: string;
  value: string;
  openLabel: string;
}

const PublicLinkValue = ({
  label,
  value,
  openLabel,
}: PublicLinkValueProps) => {
  const displayValue = value.trim();
  const safeUrl = getSafeExternalUrl(value);

  if (!safeUrl) return displayValue;

  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={openLabel}
      className="inline-flex max-w-full items-start gap-1.5 text-[15px] text-blue-600 hover:text-blue-700 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <span className="break-all">{displayValue}</span>
      <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </a>
  );
};

interface ApplicationDetailsProps {
  accessToken: string;
  product: PurchaserProduct;
  purchaserUri: string;
  onDirtyChange: (dirty: boolean) => void;
  onProductUpdated: () => Promise<unknown>;
}

const ApplicationDetails = ({
  accessToken,
  product,
  purchaserUri,
  onDirtyChange,
  onProductUpdated,
}: ApplicationDetailsProps) => {
  const t = useTranslations('ApplicationManagement');
  const locale = useLocale();
  const fallback = t('unavailable');
  const { data: applicationTypeSetting } = useSWR(
    ['application-management-app-types', accessToken] as const,
    (key) => {
      const [, token] = key as ApplicationTypeKey;
      return getPaaSApplicationTypes(token);
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );
  const applicationTypeLabels = useMemo(() => {
    const labels = new Map<string, string>();
    if (!Array.isArray(applicationTypeSetting?.value)) return labels;

    applicationTypeSetting.value.forEach((option) => {
      const appType = typeof option?.appType === 'string' ? option.appType.trim() : '';
      const label = typeof option?.label === 'string' ? option.label.trim() : '';
      if (appType && label && !labels.has(appType)) labels.set(appType, label);
    });

    return labels;
  }, [applicationTypeSetting]);
  const applicationType = product.appType?.trim();
  const applicationTypeLabel = (
    applicationType ? applicationTypeLabels.get(applicationType) || applicationType : fallback
  );
  const businessRegions = Array.from(new Set(
    (product.businessRegion ?? '')
      .split(',')
      .map((region) => region.trim())
      .filter(Boolean),
  )).map((region) => {
    if (region === '1') return t('businessRegionApac');
    if (region === '2') return t('businessRegionSouthApac');
    if (region === '3') return t('businessRegionEuropeAmericasMiddleEast');
    return region;
  });
  const statusPresentation = (() => {
    if (product.state === 1) {
      return {
        label: t('reviewPending'),
        className: 'bg-amber-50 text-amber-700 ring-amber-200',
        dotClassName: 'bg-amber-500',
      };
    }
    if (product.state === 2) {
      return {
        label: t('reviewApproved'),
        className: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        dotClassName: 'bg-emerald-500',
      };
    }
    if (product.state === 3) {
      return {
        label: t('reviewRejected'),
        className: 'bg-red-50 text-red-700 ring-red-200',
        dotClassName: 'bg-red-500',
      };
    }

    const hasCode = typeof product.state === 'number' && Number.isFinite(product.state);
    return {
      label: hasCode
        ? t('reviewUnknownWithCode', { code: formatNumber(product.state, locale, fallback) })
        : t('reviewUnknown'),
      className: 'bg-gray-100 text-gray-600 ring-gray-200',
      dotClassName: 'bg-gray-400',
    };
  })();
  const exchange = (
    typeof product.rechargeAmount === 'number'
    && Number.isFinite(product.rechargeAmount)
    && typeof product.coinNum === 'number'
    && Number.isFinite(product.coinNum)
    && Boolean(product.currency?.trim())
  )
    ? {
      amount: formatNumber(product.rechargeAmount, locale, fallback),
      currency: product.currency.trim(),
      coins: formatNumber(product.coinNum, locale, fallback),
    }
    : null;
  const partyBShare = (
    typeof product.commissionRate === 'number' && Number.isFinite(product.commissionRate)
      ? product.commissionRate
      : undefined
  );
  const partyAShare = typeof partyBShare === 'number' ? 100 - partyBShare : undefined;
  const addresses = product.appStoreAddresses;
  const downloadLinks = [
    { key: 'app-store', label: t('iosStore'), value: addresses?.ios?.trim() },
    { key: 'google-play', label: t('androidStore'), value: addresses?.android?.trim() },
    { key: 'apk', label: t('webStore'), value: addresses?.web?.trim() },
  ].filter((link): link is { key: string; label: string; value: string } => Boolean(link.value));
  const officialWebsite = product.appOfficialWebsite?.trim();

  return (
    <div className="w-full p-4 lg:p-6">
      <header className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <AppWindow className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h1 className="break-words text-xl font-semibold text-gray-950">{product.name.trim()}</h1>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            {product.description?.trim() || t('noDescription')}
          </p>
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
        <DetailSection title={t('basicInformation')} icon={Info}>
          <DetailFields>
            <DetailItem label={t('appType')}>{applicationTypeLabel}</DetailItem>
            <DetailItem label={t('businessRegion')}>
              {businessRegions.length > 0 ? (
                <ul className="flex flex-wrap gap-x-5 gap-y-2">
                  {businessRegions.map((region) => (
                    <li key={region} className="inline-flex min-w-0 items-start gap-1.5">
                      <CheckCircle2
                        className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-500"
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      <span className="break-words">{region}</span>
                    </li>
                  ))}
                </ul>
              ) : fallback}
            </DetailItem>
            <DetailItem label={t('state')}>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusPresentation.className}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusPresentation.dotClassName}`} />
                {statusPresentation.label}
              </span>
            </DetailItem>
          </DetailFields>
        </DetailSection>

        <DetailSection title={t('commercialInformation')} icon={CircleDollarSign}>
          <CommercialSummary
            exchange={exchange}
            partyAShare={partyAShare}
            partyBShare={partyBShare}
            locale={locale}
            fallback={fallback}
            labels={{
              exchangeRate: t('exchangeRate'),
              rechargeAmount: t('rechargeAmount'),
              coins: t('coinNum'),
              partyAShare: t('partyAShareRate'),
              partyBShare: t('partyBShareRate'),
            }}
          />
        </DetailSection>

        <DetailSection title={t('downloadAddresses')} icon={Download}>
          {downloadLinks.length > 0 ? (
            <DetailFields>
              {downloadLinks.map((link) => (
                <DetailItem key={link.key} label={link.label}>
                  <PublicLinkValue
                    label={link.label}
                    value={link.value}
                    openLabel={t('openLink', { label: link.label })}
                  />
                </DetailItem>
              ))}
            </DetailFields>
          ) : (
            <p className="text-sm leading-6 text-gray-400">
              {t('noDownloadAddresses')}
            </p>
          )}
        </DetailSection>

        <DetailSection title={t('officialWebsite')} icon={Globe2}>
          {officialWebsite ? (
            <DetailFields>
              <DetailItem label={t('officialWebsiteAddress')}>
                <PublicLinkValue
                  label={t('officialWebsite')}
                  value={officialWebsite}
                  openLabel={t('openLink', { label: t('officialWebsite') })}
                />
              </DetailItem>
            </DetailFields>
          ) : (
            <p className="text-sm leading-6 text-gray-400">
              {t('noOfficialWebsite')}
            </p>
          )}
        </DetailSection>
      </div>

      <div className="mt-6">
        <ApplicationConfigurationPanel
          key={product.id}
          accessToken={accessToken}
          product={product}
          purchaserUri={purchaserUri}
          onDirtyChange={onDirtyChange}
          onProductUpdated={onProductUpdated}
        />
      </div>
    </div>
  );
};

const ApplicationManagementPage = () => {
  const t = useTranslations('ApplicationManagement');
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isConfigurationDirty, setConfigurationDirty] = useState(false);
  const [pendingProductId, setPendingProductId] = useState<number | null>(null);
  const {
    data: purchaser,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<PurchaserProfile>(
    accessToken
      ? ['application-management-products', accessToken] as const
      : null,
    (key) => {
      const [, token] = key as ApplicationManagementKey;
      return getPurchaserProfile(token, {
        env: PRODUCTION_ENVIRONMENT,
        timeZone: PRODUCTION_TIME_ZONE,
      });
    },
    {
      revalidateOnFocus: true,
      shouldRetryOnError: false,
    },
  );

  const products = useMemo(() => {
    if (!Array.isArray(purchaser?.products)) return [];

    const seenProductIds = new Set<number>();
    return purchaser.products.filter((product) => {
      if (
        product.env !== PRODUCTION_ENVIRONMENT
        || !Number.isFinite(product.id)
        || typeof product.name !== 'string'
        || !product.name.trim()
        || seenProductIds.has(product.id)
      ) {
        return false;
      }

      seenProductIds.add(product.id);
      return true;
    });
  }, [purchaser]);

  const selectedProduct = products.find((product) => product.id === selectedProductId)
    ?? products[0];
  const hasProducts = products.length > 0;
  const hasBlockingError = Boolean(error) && !hasProducts;
  const selectProduct = (productId: number) => {
    if (selectedProduct?.id === productId) return;
    if (isConfigurationDirty) {
      setPendingProductId(productId);
      return;
    }
    setConfigurationDirty(false);
    setSelectedProductId(productId);
  };

  const confirmProductChange = () => {
    if (pendingProductId === null) return;
    setConfigurationDirty(false);
    setSelectedProductId(pendingProductId);
    setPendingProductId(null);
  };

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-white">
      <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-[#F9FAFB] md:w-64">
        <div className="flex min-h-16 shrink-0 items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-gray-900">{t('title')}</h1>
            <p className="mt-0.5 text-xs text-gray-500">{t('count', { count: products.length })}</p>
          </div>
          {isValidating && (
            <RefreshCw
              className="h-4 w-4 shrink-0 animate-spin text-blue-500"
              aria-label={t('loading')}
            />
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="space-y-2" aria-label={t('loading')}>
              {[0, 1, 2].map((item) => (
                <div key={item} className="animate-pulse rounded-lg border border-gray-100 bg-white p-3">
                  <div className="h-3 w-2/3 rounded bg-gray-200" />
                  <div className="mt-2 h-2 w-full rounded bg-gray-100" />
                  <div className="mt-1.5 h-2 w-4/5 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : hasBlockingError ? (
            <StatePanel
              title={t('loadError')}
              description={t('loadErrorDescription')}
              actionLabel={t('retry')}
              onAction={() => void mutate()}
            />
          ) : !hasProducts ? (
            <StatePanel title={t('empty')} description={t('emptyDescription')} />
          ) : (
            <div className="space-y-2">
              {Boolean(error) && (
                <button
                  type="button"
                  onClick={() => void mutate()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('retry')}
                </button>
              )}
              {products.map((product) => {
                const isActive = selectedProduct?.id === product.id;

                return (
                  <button
                    key={product.id}
                    type="button"
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={t('selectApplication', { name: product.name.trim() })}
                    onClick={() => selectProduct(product.id)}
                    className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isActive
                        ? 'border-blue-200 bg-white shadow-sm'
                        : 'border-transparent text-gray-600 hover:border-gray-200 hover:bg-white'
                    }`}
                  >
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                      isActive ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <AppWindow className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className={`block truncate text-sm font-semibold ${
                        isActive ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        {product.name.trim()}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-xs leading-4 text-gray-400">
                        {product.description?.trim() || t('noDescription')}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto bg-gray-50">
        {isLoading ? (
          <StatePanel title={t('loading')} />
        ) : hasBlockingError ? (
          <StatePanel
            title={t('loadError')}
            description={t('loadErrorDescription')}
            actionLabel={t('retry')}
            onAction={() => void mutate()}
          />
        ) : selectedProduct && accessToken ? (
          <ApplicationDetails
            accessToken={accessToken}
            product={selectedProduct}
            purchaserUri={purchaser?.uri?.trim() ?? ''}
            onDirtyChange={setConfigurationDirty}
            onProductUpdated={() => mutate()}
          />
        ) : (
          <StatePanel title={t('empty')} description={t('emptyDescription')} />
        )}
      </main>
      <ConfirmDialog
        isOpen={pendingProductId !== null}
        title={t('discardChangesTitle')}
        description={t('confirmDiscardChanges')}
        confirmLabel={t('discardChanges')}
        cancelLabel={t('cancel')}
        tone="warning"
        onConfirm={confirmProductChange}
        onCancel={() => setPendingProductId(null)}
      />
    </div>
  );
};

export default ApplicationManagementPage;
