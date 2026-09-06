import React, {
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { Gamepad2, Languages, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import GameIcon from '../../assets/game.svg';
import {
    getGameStorePage,
    getGameStoreTags,
    type GameStoreItem,
    type GameStorePage,
    type GameStoreQuery,
    type GameStoreTags,
} from '../../api/games';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useAuthStore } from '../../stores/authStore';
import { GameDetailModal } from './components/GameDetailModal';

const PAGE_SIZE = 12;
const DEFAULT_GAME_CATEGORY_ID = 16;
const PRODUCTION_ENVIRONMENT = 'production';
const TIME_ZONE = 8;
const USD_PRICE_FORMATTER = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});

type GameStoreKey = readonly ['game-store', string, number, string, number];
type GameStoreTagsKey = readonly ['game-store-tags', string];

const buildQuery = (page: number, kwd: string, categoryId: number): GameStoreQuery => ({
    page,
    pageSize: PAGE_SIZE,
    kwd,
    categoryIds: categoryId,
    env: PRODUCTION_ENVIRONMENT,
    timeZone: TIME_ZONE,
});

interface GameCardProps {
    game: GameStoreItem;
    onOpen: (game: GameStoreItem) => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onOpen }) => {
    const t = useTranslations('GameStore');
    const [imageFailed, setImageFailed] = useState(false);
    const languageLabel = game.languages
        ?.filter(Boolean)
        .map((language) => language.toUpperCase())
        .join(' · ') || t('languageUnavailable');
    const versionLabel = game.deployedVersion
        ? t('version', { version: game.deployedVersion })
        : t('versionUnavailable');
    const showFallbackImage = imageFailed || !game.logo;
    const description = game.description || t('noDescription');
    const deployedVersionFee = game.gameVersions
        ?.find((version) => version.version === game.deployedVersion)
        ?.tmpResourceFee;
    const priceLabel = typeof deployedVersionFee === 'number'
        && Number.isFinite(deployedVersionFee)
        && deployedVersionFee >= 0
        ? USD_PRICE_FORMATTER.format(deployedVersionFee === 0 ? 0 : deployedVersionFee)
        : null;

    return (
        <article className="h-full min-w-0">
            <button
                type="button"
                onClick={() => onOpen(game)}
                aria-label={t('viewDetails', { name: game.name })}
                className="group flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
                <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                    {showFallbackImage ? (
                        <div className="flex h-full w-full items-center justify-center">
                            <img
                                src={GameIcon}
                                alt=""
                                className="h-16 w-16 max-w-[40%] object-contain"
                            />
                        </div>
                    ) : (
                        <img
                            src={game.logo}
                            alt=""
                            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
                            loading="lazy"
                            onError={() => setImageFailed(true)}
                        />
                    )}
                    {priceLabel && (
                        <span className="absolute right-2 top-2 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                            {priceLabel}
                        </span>
                    )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                    <div className="min-w-0">
                        <h2 className="mb-0.5 truncate text-sm font-semibold text-gray-900">
                            {game.name}
                        </h2>
                        <p className="truncate text-xs text-gray-500">{versionLabel}</p>
                    </div>

                    <div className="my-3 min-h-9 flex-1">
                        <p className="min-h-9 line-clamp-2 text-xs text-gray-600">
                            {description}
                        </p>
                    </div>

                    <div className="mt-auto flex items-center gap-1 border-t border-gray-100 pt-3 text-xs text-gray-400">
                        <Languages className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span className="truncate">{languageLabel}</span>
                    </div>
                </div>
            </button>
        </article>
    );
};

export const GameAppStoreList: React.FC = () => {
    const t = useTranslations('GameStore');
    const accessToken = useAuthStore((state) => state.session?.accessToken);
    const [searchInput, setSearchInput] = useState('');
    const [submittedSearch, setSubmittedSearch] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState(DEFAULT_GAME_CATEGORY_ID);
    const [selectedGame, setSelectedGame] = useState<GameStoreItem | null>(null);
    const categoryScrollerRef = useRef<HTMLDivElement>(null);
    const previousQueryRef = useRef({ submittedSearch, selectedCategoryId });

    const {
        data: tagsData,
        error: tagsError,
        isLoading: isLoadingTags,
    } = useSWR<GameStoreTags>(
        accessToken ? ['game-store-tags', accessToken] as const : null,
        (key) => {
            const [, token] = key as GameStoreTagsKey;
            return getGameStoreTags(token, {
                env: PRODUCTION_ENVIRONMENT,
                timeZone: TIME_ZONE,
            });
        },
        {
            revalidateOnFocus: true,
            shouldRetryOnError: true,
            errorRetryCount: 3,
            errorRetryInterval: 2_000,
        },
    );

    const getKey = (
        pageIndex: number,
        previousPageData: GameStorePage | null,
    ): GameStoreKey | null => {
        if (!accessToken) return null;
        if (previousPageData && previousPageData.page >= previousPageData.totalPages) return null;

        return [
            'game-store',
            accessToken,
            pageIndex + 1,
            submittedSearch,
            selectedCategoryId,
        ] as const;
    };

    const {
        data,
        error,
        setSize,
        size,
        isLoading,
        isValidating,
        mutate,
    } = useSWRInfinite<GameStorePage>(
        getKey,
        (key) => {
            const [, token, page, kwd, categoryId] = key as GameStoreKey;
            return getGameStorePage(token, buildQuery(page, kwd, categoryId));
        },
        {
            revalidateFirstPage: false,
            revalidateOnFocus: false,
            shouldRetryOnError: false,
        },
    );

    useLayoutEffect(() => {
        const previousQuery = previousQueryRef.current;
        const queryChanged = previousQuery.submittedSearch !== submittedSearch
            || previousQuery.selectedCategoryId !== selectedCategoryId;

        previousQueryRef.current = { submittedSearch, selectedCategoryId };

        if (queryChanged && size > 1) {
            void setSize(1);
        }
    }, [selectedCategoryId, setSize, size, submittedSearch]);

    const games = Array.from(
        new Map(
            (data?.flatMap((page) => page.data) ?? []).map((game) => [game.uri, game]),
        ).values(),
    );
    const lastPage = data?.[data.length - 1];
    const totalCount = data?.[0]?.totalCount ?? 0;
    const hasMore = Boolean(lastPage && lastPage.page < lastPage.totalPages);
    const hasLoadedData = Boolean(data?.length);
    const isEmpty = hasLoadedData && games.length === 0 && !error;
    const isInitialError = Boolean(error && !hasLoadedData);
    const apiCategories = tagsData?.categories ?? [];
    const allGamesCategory = apiCategories.find(
        (category) => category.id === DEFAULT_GAME_CATEGORY_ID,
    );
    const categories = allGamesCategory
        ? [
            allGamesCategory,
            ...apiCategories.filter((category) => category.id !== DEFAULT_GAME_CATEGORY_ID),
        ]
        : apiCategories;
    const hasCategoryError = Boolean(tagsError);
    const hasCategoryTabs = !hasCategoryError && categories.length > 0;
    const categoryLayoutKey = categories
        .map((category) => `${category.id}:${category.name}`)
        .join('|');
    const categoryStatusLabel = isLoadingTags
        ? t('loadingCategories')
        : t('categoriesUnavailable');

    useLayoutEffect(() => {
        const scroller = categoryScrollerRef.current;
        const activeCategory = scroller?.querySelector<HTMLButtonElement>(
            '[role="tab"][aria-selected="true"]',
        );
        if (!scroller || !activeCategory) return;

        const ensureActiveCategoryIsVisible = () => {
            const scrollerRect = scroller.getBoundingClientRect();
            const categoryRect = activeCategory.getBoundingClientRect();

            if (categoryRect.left < scrollerRect.left) {
                scroller.scrollTo({
                    left: Math.max(
                        0,
                        scroller.scrollLeft + categoryRect.left - scrollerRect.left - 4,
                    ),
                });
            } else if (categoryRect.right > scrollerRect.right) {
                scroller.scrollTo({
                    left: scroller.scrollLeft + categoryRect.right - scrollerRect.right + 4,
                });
            }
        };

        ensureActiveCategoryIsVisible();
        window.addEventListener('resize', ensureActiveCategoryIsVisible);

        return () => window.removeEventListener('resize', ensureActiveCategoryIsVisible);
    }, [categoryLayoutKey, hasCategoryTabs, selectedCategoryId]);

    const observerTarget = useInfiniteScroll({
        onLoadMore: () => setSize((currentSize) => currentSize + 1),
        hasMore: hasMore && !error,
        isLoading: isValidating,
    });

    const submitSearch = () => {
        const nextSearch = searchInput.trim();
        if (nextSearch === submittedSearch) {
            if (size > 1) void setSize(1);
            return;
        }

        setSubmittedSearch(nextSearch);
    };

    const handleCategoryChange = (nextCategoryId: number) => {
        if (nextCategoryId === selectedCategoryId) return;

        setSelectedCategoryId(nextCategoryId);
    };

    const handleCategoryKeyDown = (
        event: React.KeyboardEvent<HTMLButtonElement>,
        categoryIndex: number,
    ) => {
        let nextCategoryIndex: number | null = null;

        if (event.key === 'ArrowRight') {
            nextCategoryIndex = (categoryIndex + 1) % categories.length;
        } else if (event.key === 'ArrowLeft') {
            nextCategoryIndex = (categoryIndex - 1 + categories.length) % categories.length;
        } else if (event.key === 'Home') {
            nextCategoryIndex = 0;
        } else if (event.key === 'End') {
            nextCategoryIndex = categories.length - 1;
        }

        if (nextCategoryIndex === null) return;

        event.preventDefault();
        const nextCategory = categories[nextCategoryIndex];
        const categoryTabs = categoryScrollerRef.current?.querySelectorAll<HTMLButtonElement>(
            '[role="tab"]',
        );
        categoryTabs?.[nextCategoryIndex]?.focus();
        handleCategoryChange(nextCategory.id);
    };

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        submitSearch();
    };

    const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        submitSearch();
    };

    const handleRetry = () => {
        void mutate();
    };

    return (
        <section className="relative h-full" aria-labelledby="game-store-title">
            <div className="mb-8 flex w-full min-w-0 flex-col items-stretch gap-3 lg:flex-row lg:items-center lg:gap-2">
                <div className="order-1 flex shrink-0 items-center gap-2">
                    <h1 id="game-store-title" className="text-sm font-medium text-gray-900">
                        {t('title')}
                    </h1>
                    <span className="text-xs text-gray-400">
                        {t('available', { count: totalCount }).toUpperCase()}
                    </span>
                </div>

                <div
                    ref={categoryScrollerRef}
                    className="order-3 w-full min-w-0 overflow-x-auto [scrollbar-width:none] lg:order-2 lg:flex lg:flex-1 [&::-webkit-scrollbar]:hidden"
                >
                    <div
                        role={hasCategoryTabs ? 'tablist' : undefined}
                        aria-label={hasCategoryTabs ? t('categoryLabel') : undefined}
                        aria-orientation={hasCategoryTabs ? 'horizontal' : undefined}
                        aria-busy={isLoadingTags}
                        className="inline-flex min-w-max items-center gap-2 rounded-lg bg-gray-100 p-1 lg:ml-auto"
                    >
                        {!hasCategoryTabs ? (
                            <span
                                role={tagsError ? 'alert' : 'status'}
                                className="shrink-0 whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium text-gray-400"
                            >
                                {categoryStatusLabel}
                            </span>
                        ) : (
                            categories.map((category, categoryIndex) => {
                                const isSelected = category.id === selectedCategoryId;

                                return (
                                    <button
                                        key={category.uri}
                                        id={`game-store-category-${category.id}`}
                                        type="button"
                                        role="tab"
                                        aria-selected={isSelected}
                                        aria-controls="game-store-results"
                                        tabIndex={isSelected ? 0 : -1}
                                        onClick={() => handleCategoryChange(category.id)}
                                        onKeyDown={(event) => handleCategoryKeyDown(
                                            event,
                                            categoryIndex,
                                        )}
                                        className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                                            isSelected
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        {category.name}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                <form
                    className="relative order-2 w-full shrink-0 lg:order-3 lg:w-64"
                    role="search"
                    onSubmit={handleSearch}
                >
                    <button
                        type="submit"
                        aria-label={t('searchLabel')}
                        className="absolute left-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                        <Search className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <input
                        type="search"
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        placeholder={t('searchPlaceholder')}
                        aria-label={t('searchLabel')}
                        className="w-full rounded-md border border-gray-200 bg-white py-1.5 pl-9 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                </form>
            </div>

            <div
                id="game-store-results"
                role={hasCategoryTabs ? 'tabpanel' : 'region'}
                aria-labelledby={hasCategoryTabs
                    ? `game-store-category-${selectedCategoryId}`
                    : undefined}
                aria-label={hasCategoryTabs ? undefined : t('title')}
                tabIndex={0}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
            >
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center" aria-label={t('loading')}>
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                    </div>
                ) : isInitialError ? (
                    <div className="flex h-64 flex-col items-center justify-center text-center">
                        <Gamepad2 className="mb-3 h-8 w-8 text-gray-300" aria-hidden="true" />
                        <p className="text-sm font-medium text-gray-700">{t('loadError')}</p>
                        <button
                            type="button"
                            onClick={handleRetry}
                            className="mt-3 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                            {t('retry')}
                        </button>
                    </div>
                ) : isEmpty ? (
                    <div className="flex h-64 flex-col items-center justify-center text-center">
                        <Gamepad2 className="mb-3 h-8 w-8 text-gray-300" aria-hidden="true" />
                        <p className="text-sm font-medium text-gray-700">{t('empty')}</p>
                        <p className="mt-1 text-xs text-gray-500">{t('emptyDescription')}</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {games.map((game) => (
                                <GameCard
                                    key={game.uri}
                                    game={game}
                                    onOpen={setSelectedGame}
                                />
                            ))}
                        </div>

                        {error && hasLoadedData && (
                            <div className="mt-6 text-center">
                                <p className="text-xs text-red-600">{t('loadMoreError')}</p>
                                <button
                                    type="button"
                                    onClick={handleRetry}
                                    className="mt-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    {t('retry')}
                                </button>
                            </div>
                        )}

                        {isValidating && (
                            <div className="mt-6 flex justify-center" aria-label={t('loadingMore')}>
                                <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                            </div>
                        )}

                        <div ref={observerTarget} className="h-4" aria-hidden="true" />
                    </>
                )}
            </div>

            <GameDetailModal
                accessToken={accessToken}
                game={selectedGame}
                onClose={() => setSelectedGame(null)}
            />
        </section>
    );
};
