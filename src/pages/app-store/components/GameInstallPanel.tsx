import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, Gamepad2, LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import useSWR, { useSWRConfig } from 'swr';
import type {
    GameStoreDetail,
    GameStoreItem,
    GameStoreVersionSummary,
} from '../../../api/games';
import {
    getPurchaserProfile,
    installPurchaserGame,
    type PurchaserProduct,
    type PurchaserProfile,
} from '../../../api/paasBilling';
import {
    formatTimeZoneOffset,
    TIME_ZONE_OPTIONS,
    useSettingsStore,
} from '../../../stores/settingsStore';
import { useAuthStore } from '../../../stores/authStore';

type ProductOption = Pick<PurchaserProduct, 'id' | 'name' | 'currency' | 'env'>;
type PurchaserProductsKey = readonly [
    'purchaser-products',
    string,
    string,
    number,
];

interface ProductCache {
    cachedAt: number;
    products: ProductOption[];
}

const PRODUCT_CACHE_KEY_PREFIX = 'eruun_game_install_products';
const PRODUCT_CACHE_MAX_AGE_MS = 5 * 60 * 1000;

const isProductOption = (value: unknown): value is ProductOption => (
    typeof value === 'object'
    && value !== null
    && 'id' in value
    && typeof value.id === 'number'
    && Number.isFinite(value.id)
    && 'name' in value
    && typeof value.name === 'string'
    && 'currency' in value
    && typeof value.currency === 'string'
    && 'env' in value
    && typeof value.env === 'string'
);

const readCachedProducts = (cacheKey: string): ProductOption[] => {
    if (typeof window === 'undefined') return [];

    try {
        const cachedValue = window.sessionStorage.getItem(cacheKey);
        if (!cachedValue) return [];

        const parsed = JSON.parse(cachedValue) as Partial<ProductCache>;
        const isFresh = typeof parsed.cachedAt === 'number'
            && Date.now() - parsed.cachedAt < PRODUCT_CACHE_MAX_AGE_MS;
        const products = Array.isArray(parsed.products)
            ? parsed.products.filter(isProductOption)
            : [];

        if (isFresh && products.length > 0) return products;
        window.sessionStorage.removeItem(cacheKey);
    } catch {
        // Ignore unavailable storage or malformed cache values.
    }

    return [];
};

const writeCachedProducts = (cacheKey: string, products: ProductOption[]) => {
    if (typeof window === 'undefined' || products.length === 0) return;

    try {
        const value: ProductCache = {
            cachedAt: Date.now(),
            products,
        };
        window.sessionStorage.setItem(cacheKey, JSON.stringify(value));
    } catch {
        // Keep the in-memory SWR cache when session storage is unavailable.
    }
};

interface GameInstallPanelProps {
    game: GameStoreItem;
    detail?: GameStoreDetail;
    isActive: boolean;
}

const getAvailableVersions = (
    game: GameStoreItem,
    detail?: GameStoreDetail,
): GameStoreVersionSummary[] => {
    const versions = detail?.gameVersions ?? game.gameVersions ?? [];
    const uniqueVersions = new Map<string, GameStoreVersionSummary>();

    versions.forEach((version) => {
        if (version.version) uniqueVersions.set(version.version, version);
    });

    if (game.deployedVersion && !uniqueVersions.has(game.deployedVersion)) {
        uniqueVersions.set(game.deployedVersion, { version: game.deployedVersion });
    }

    return [...uniqueVersions.values()].sort((left, right) => {
        if (left.version === game.deployedVersion) return -1;
        if (right.version === game.deployedVersion) return 1;
        return right.version.localeCompare(left.version, undefined, { numeric: true });
    });
};

const selectClassName = [
    'h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white',
    'px-3.5 pr-10 text-sm text-gray-900 shadow-sm transition',
    'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100',
    'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
].join(' ');

export const GameInstallPanel: React.FC<GameInstallPanelProps> = ({
    game,
    detail,
    isActive,
}) => {
    const t = useTranslations('GameStore');
    const { mutate } = useSWRConfig();
    const defaultTimeZone = useSettingsStore((state) => state.timeZone);
    const environment = useSettingsStore((state) => state.environment);
    const authSession = useAuthStore((state) => state.session);
    const accessToken = authSession?.accessToken;
    const accountIdentifier = authSession?.identifier;
    const headingRef = useRef<HTMLHeadingElement>(null);
    const versions = useMemo(() => getAvailableVersions(game, detail), [detail, game]);
    const installableVersions = useMemo(
        () => versions.filter(
            (version): version is GameStoreVersionSummary & { uri: string } => Boolean(version.uri),
        ),
        [versions],
    );
    const defaultVersionUri = installableVersions.find(
        (version) => version.version === game.deployedVersion,
    )?.uri ?? installableVersions[0]?.uri ?? '';
    const productCacheKey = [
        PRODUCT_CACHE_KEY_PREFIX,
        accountIdentifier ?? 'current',
        environment,
        defaultTimeZone,
    ].join(':');
    const cachedProducts = useMemo(
        () => readCachedProducts(productCacheKey),
        [productCacheKey],
    );
    const [selection, setSelection] = useState({
        gameUri: game.uri,
        environment,
        productId: '',
        versionUri: '',
        timeZone: defaultTimeZone,
    });
    const [submission, setSubmission] = useState<{
        gameUri: string;
        status: 'idle' | 'submitting' | 'success' | 'error';
        error?: string;
    }>({
        gameUri: game.uri,
        status: 'idle',
    });
    const isCurrentSelection = selection.gameUri === game.uri
        && selection.environment === environment;
    const selectedProductId = isCurrentSelection ? selection.productId : '';
    const selectedVersionUri = isCurrentSelection
        ? selection.versionUri || defaultVersionUri
        : defaultVersionUri;
    const selectedTimeZone = isCurrentSelection
        ? selection.timeZone
        : defaultTimeZone;
    const submissionStatus = submission.gameUri === game.uri
        ? submission.status
        : 'idle';
    const submissionError = submission.gameUri === game.uri
        ? submission.error
        : undefined;

    const {
        data: purchaser,
        error: productsError,
        isLoading: isLoadingProducts,
    } = useSWR<PurchaserProfile>(
        isActive && accessToken
            ? ['purchaser-products', accessToken, environment, defaultTimeZone] as const
            : null,
        (key) => {
            const [, token, productEnvironment, productTimeZone] = (
                key as PurchaserProductsKey
            );
            return getPurchaserProfile(token, {
                env: productEnvironment,
                timeZone: productTimeZone,
            });
        },
        {
            fallbackData: cachedProducts.length > 0
                ? { products: cachedProducts }
                : undefined,
            revalidateOnFocus: false,
            shouldRetryOnError: false,
        },
    );
    const products = useMemo(() => (
        Array.isArray(purchaser?.products)
            ? purchaser.products.filter((product): product is ProductOption => (
                product.env === environment
                && Number.isFinite(product.id)
                && Boolean(product.name?.trim())
            ))
            : []
    ), [environment, purchaser]);
    const normalizedSelectedProductId = products.some(
        (product) => String(product.id) === selectedProductId,
    )
        ? selectedProductId
        : '';

    useEffect(() => {
        if (!isActive) return;

        const focusTimer = window.setTimeout(() => headingRef.current?.focus(), 350);
        return () => window.clearTimeout(focusTimer);
    }, [isActive]);

    useEffect(() => {
        if (products.length > 0) {
            writeCachedProducts(productCacheKey, products);
        }
    }, [productCacheKey, products]);

    const updateSelection = (
        updates: Partial<Pick<
            typeof selection,
            'productId' | 'versionUri' | 'timeZone'
        >>,
    ) => {
        setSelection((current) => ({
            gameUri: game.uri,
            environment,
            productId: current.gameUri === game.uri
                && current.environment === environment
                ? current.productId
                : '',
            versionUri: current.gameUri === game.uri
                && current.environment === environment
                ? current.versionUri || defaultVersionUri
                : defaultVersionUri,
            timeZone: current.gameUri === game.uri
                && current.environment === environment
                ? current.timeZone
                : defaultTimeZone,
            ...updates,
        }));
        setSubmission({ gameUri: game.uri, status: 'idle' });
    };

    const canSubmit = Boolean(
        accessToken
        && normalizedSelectedProductId
        && selectedVersionUri
        && submissionStatus !== 'submitting'
        && submissionStatus !== 'success',
    );

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canSubmit || !accessToken) return;

        const productId = Number(normalizedSelectedProductId);
        if (!Number.isFinite(productId)) return;

        setSubmission({ gameUri: game.uri, status: 'submitting' });
        try {
            await installPurchaserGame(accessToken, {
                gameUri: game.uri,
                versionUri: selectedVersionUri,
                productId,
                env: environment,
                timeZone: selectedTimeZone,
            });
            setSubmission({ gameUri: game.uri, status: 'success' });
            void mutate((key) => (
                Array.isArray(key)
                && key[0] === 'purchaser-games'
                && key[1] === accessToken
                && key[2] === productId
                && key[3] === environment
            ));
        } catch (error) {
            setSubmission({
                gameUri: game.uri,
                status: 'error',
                error: error instanceof Error ? error.message : t('installFailed'),
            });
        }
    };

    return (
        <div className="mx-auto max-w-3xl pb-2">
            <div className="mb-6 flex items-start gap-3">
                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                    <Gamepad2 className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                    <h3
                        ref={headingRef}
                        tabIndex={-1}
                        className="text-base font-semibold text-gray-900 focus:outline-none"
                    >
                        {t('installConfiguration')}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-gray-500">
                        {t('installConfigurationDescription', { name: game.name })}
                    </p>
                </div>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-6 rounded-2xl border border-gray-100 bg-gray-50/60 p-4 sm:p-6"
            >
                <div className="grid gap-2 sm:grid-cols-[170px_minmax(0,1fr)] sm:items-center sm:gap-5">
                    <label
                        htmlFor="game-install-product"
                        className="text-sm font-medium text-gray-700"
                    >
                        <span className="mr-1 text-red-500" aria-hidden="true">*</span>
                        {t('selectProduct')}
                    </label>
                    <div className="relative">
                        <select
                            id="game-install-product"
                            value={normalizedSelectedProductId}
                            onChange={(event) => updateSelection({
                                productId: event.target.value,
                            })}
                            disabled={isLoadingProducts && products.length === 0}
                            required
                            className={selectClassName}
                        >
                            <option value="">
                                {isLoadingProducts && products.length === 0
                                    ? t('loadingProducts')
                                    : productsError && products.length === 0
                                        ? t('productsUnavailable')
                                        : t('selectProductPlaceholder')}
                            </option>
                            {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.name.trim()}
                                </option>
                            ))}
                        </select>
                        {isLoadingProducts && products.length === 0 ? (
                            <LoaderCircle
                                className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 animate-spin text-gray-400"
                                aria-hidden="true"
                            />
                        ) : (
                            <ChevronDown
                                className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 text-gray-400"
                                aria-hidden="true"
                            />
                        )}
                    </div>
                </div>

                <div className="sm:ml-[190px]">
                    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                        {t('callbackReminder')}
                    </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-[170px_minmax(0,1fr)] sm:items-center sm:gap-5">
                    <label
                        htmlFor="game-install-version"
                        className="text-sm font-medium text-gray-700"
                    >
                        <span className="mr-1 text-red-500" aria-hidden="true">*</span>
                        {t('selectGameVersion')}
                    </label>
                    <div className="relative">
                        <select
                            id="game-install-version"
                            value={selectedVersionUri}
                            onChange={(event) => updateSelection({
                                versionUri: event.target.value,
                            })}
                            disabled={installableVersions.length === 0}
                            required
                            className={selectClassName}
                        >
                            {installableVersions.length === 0 && (
                                <option value="">{t('selectGameVersionPlaceholder')}</option>
                            )}
                            {installableVersions.map((version) => (
                                <option key={version.uri} value={version.uri}>
                                    {t('version', { version: version.version })}
                                    {version.version === game.deployedVersion
                                        ? ` · ${t('recommended')}`
                                        : ''}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 text-gray-400"
                            aria-hidden="true"
                        />
                    </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-[170px_minmax(0,1fr)] sm:items-center sm:gap-5">
                    <label
                        htmlFor="game-install-time-zone"
                        className="text-sm font-medium text-gray-700"
                    >
                        <span className="mr-1 text-red-500" aria-hidden="true">*</span>
                        {t('statisticsTimeZone')}
                    </label>
                    <div className="relative">
                        <select
                            id="game-install-time-zone"
                            value={selectedTimeZone}
                            onChange={(event) => updateSelection({
                                timeZone: Number(event.target.value),
                            })}
                            required
                            className={selectClassName}
                        >
                            {TIME_ZONE_OPTIONS.map((timeZone) => (
                                <option key={timeZone} value={timeZone}>
                                    {formatTimeZoneOffset(timeZone)}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 text-gray-400"
                            aria-hidden="true"
                        />
                    </div>
                </div>

                <p className="rounded-xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700 sm:ml-[190px]">
                    {t('statisticsTimeZoneHint')}
                </p>

                {submissionStatus === 'success' && (
                    <div
                        role="status"
                        className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 sm:ml-[190px]"
                    >
                        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {t('installationStarted')}
                    </div>
                )}

                {submissionStatus === 'error' && (
                    <div
                        role="alert"
                        className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700 sm:ml-[190px]"
                    >
                        {submissionError || t('installFailed')}
                    </div>
                )}

                <div className="flex justify-end border-t border-gray-200 pt-5">
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="inline-flex h-10 min-w-32 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-200 disabled:shadow-none"
                    >
                        {submissionStatus === 'submitting' && (
                            <LoaderCircle
                                className="h-4 w-4 animate-spin"
                                aria-hidden="true"
                            />
                        )}
                        {submissionStatus === 'submitting'
                            ? t('installing')
                            : submissionStatus === 'success'
                                ? t('installationStartedButton')
                                : t('confirmInstall')}
                    </button>
                </div>
            </form>
        </div>
    );
};
