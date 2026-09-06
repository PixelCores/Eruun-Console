import React, { useId, useMemo, useRef, useState } from 'react';
import {
    Dialog,
    DialogPanel,
    DialogTitle,
    Transition,
    TransitionChild,
} from '@headlessui/react';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Download,
    ExternalLink,
    LoaderCircle,
    X,
} from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import useSWR from 'swr';
import {
    getGameStoreBanner,
    getGameStoreDetail,
    type GameStoreBanner,
    type GameStoreDetail,
    type GameStoreItem,
    type GameStoreVersion,
} from '../../../api/games';
import GameIcon from '../../../assets/game.svg';
import Modal from '../../../components/base/Modal';
import { GameInstallPanel } from './GameInstallPanel';

type GameStoreDetailKey = readonly ['game-store-detail', string, string];
type GameStoreBannerKey = readonly ['game-store-banner', string, string];

interface ArtworkSlide {
    src: string;
    alt: string;
}

interface GameDetailModalProps {
    accessToken?: string;
    game: GameStoreItem | null;
    onClose: () => void;
}

interface DetailFieldProps {
    label: string;
    children: React.ReactNode;
    wide?: boolean;
}

const DetailField: React.FC<DetailFieldProps> = ({ label, children, wide = false }) => (
    <div className={wide ? 'sm:col-span-2' : undefined}>
        <dt className="text-xs font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-gray-900">
            {children}
        </dd>
    </div>
);

const DetailSkeleton: React.FC = () => (
    <div className="grid animate-pulse grid-cols-1 gap-5 sm:grid-cols-2" aria-hidden="true">
        <div className="h-11 rounded-lg bg-gray-100" />
        <div className="h-11 rounded-lg bg-gray-100" />
        <div className="h-11 rounded-lg bg-gray-100" />
        <div className="h-11 rounded-lg bg-gray-100" />
    </div>
);

const isSafeHttpUrl = (value?: string | null) => {
    if (!value) return false;

    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

const getVersionTimestamp = (version: GameStoreVersion) => (
    version.updatedAt || version.createdAt || version.deployedAt
);

export const GameDetailModal: React.FC<GameDetailModalProps> = ({
    accessToken,
    game,
    onClose,
}) => {
    const t = useTranslations('GameStore');
    const format = useFormatter();
    const historyId = useId();
    const pointerStartX = useRef<number | null>(null);
    const didArtworkSwipe = useRef(false);
    const artworkPreviewTriggerRef = useRef<HTMLButtonElement | null>(null);
    const installTriggerRef = useRef<HTMLButtonElement | null>(null);
    const [failedArtwork, setFailedArtwork] = useState<{
        uri: string;
        urls: Set<string>;
    }>({ uri: '', urls: new Set() });
    const [carouselState, setCarouselState] = useState({ uri: '', index: 0 });
    const [historyState, setHistoryState] = useState({ uri: '', open: false });
    const [pageState, setPageState] = useState<{
        uri: string;
        page: 'details' | 'install';
    }>({ uri: '', page: 'details' });
    const [isArtworkPreviewOpen, setIsArtworkPreviewOpen] = useState(false);
    const gameUri = game?.uri ?? '';
    const historyOpen = historyState.uri === gameUri && historyState.open;
    const isInstallPage = pageState.uri === gameUri && pageState.page === 'install';

    const {
        data: detail,
        error,
        isLoading,
        mutate,
    } = useSWR<GameStoreDetail>(
        accessToken && gameUri
            ? ['game-store-detail', accessToken, gameUri] as const
            : null,
        (key) => {
            const [, token, uri] = key as GameStoreDetailKey;
            return getGameStoreDetail(token, uri);
        },
        {
            revalidateOnFocus: false,
            shouldRetryOnError: false,
        },
    );

    const {
        data: banner,
        error: bannerError,
        isLoading: isBannerLoading,
        mutate: mutateBanner,
    } = useSWR<GameStoreBanner>(
        accessToken && gameUri
            ? ['game-store-banner', accessToken, gameUri] as const
            : null,
        (key) => {
            const [, token, uri] = key as GameStoreBannerKey;
            return getGameStoreBanner(token, uri);
        },
        {
            revalidateOnFocus: false,
            shouldRetryOnError: false,
        },
    );

    const currentVersion = useMemo(
        () => detail?.gameVersions?.find(
            (version) => version.version === detail.deployedVersion,
        ) ?? null,
        [detail],
    );
    const historyVersions = useMemo(
        () => (detail?.gameVersions ?? [])
            .filter((version) => version.version !== detail?.deployedVersion)
            .sort((left, right) => getVersionTimestamp(right) - getVersionTimestamp(left)),
        [detail],
    );
    const name = detail?.name || game?.name || '';
    const logo = detail?.logo || game?.logo || '';
    const artworkSlides = useMemo(() => {
        const slides: ArtworkSlide[] = [];
        const seenUrls = new Set<string>();

        const addSlide = (src: string | null | undefined, alt: string) => {
            const normalizedSrc = src?.trim();
            if (!normalizedSrc || seenUrls.has(normalizedSrc)) return;

            seenUrls.add(normalizedSrc);
            slides.push({ src: normalizedSrc, alt });
        };

        addSlide(logo, t('gameArtwork', { name }));
        (banner?.items ?? []).forEach((item, index) => {
            addSlide(
                item.img,
                item.title?.trim() || t('gameScreenshot', { name, index: index + 1 }),
            );
        });

        return slides;
    }, [banner?.items, logo, name, t]);
    const artworkIndex = carouselState.uri === gameUri
        ? Math.min(carouselState.index, Math.max(artworkSlides.length - 1, 0))
        : 0;
    const currentArtwork = artworkSlides[artworkIndex] ?? null;
    const failedArtworkUrls = failedArtwork.uri === gameUri
        ? failedArtwork.urls
        : new Set<string>();
    const currentArtworkFailed = currentArtwork
        ? failedArtworkUrls.has(currentArtwork.src)
        : false;
    const showFallbackImage = !currentArtwork || currentArtworkFailed;

    if (!game) return null;

    const description = detail?.description || game.description || t('noDescription');
    const languages = detail?.languages ?? game.languages;
    const availableLanguages = languages?.filter(Boolean) ?? [];
    const languageLabel = availableLanguages
        .map((language) => language.toUpperCase())
        .join(' · ') || t('unavailable');
    const deployedVersion = detail?.deployedVersion || game.deployedVersion;
    const screenType = detail?.screenConfig?.screenType || detail?.screenType;
    const screenTypeLabel = screenType === 1
        ? t('portrait')
        : screenType === 2
            ? t('landscape')
            : t('unavailable');
    const halfRatioLabel = detail?.screenConfig
        ? detail.screenConfig.halfSupport === 2
            ? detail.screenConfig.halfRatio || t('unavailable')
            : t('halfScreenUnsupported')
        : t('unavailable');
    const hasMultipleArtwork = artworkSlides.length > 1;

    const formatTimestamp = (timestamp?: number) => timestamp
        ? format.dateTime(new Date(timestamp * 1000), {
            dateStyle: 'medium',
            timeStyle: 'short',
        })
        : t('unavailable');

    const renderPlayGuide = (url?: string | null) => isSafeHttpUrl(url) ? (
        <a
            href={url ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
            {t('viewPlayGuide')}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
    ) : t('unavailable');

    const goToArtwork = (index: number) => {
        if (!hasMultipleArtwork) return;

        const nextIndex = (index + artworkSlides.length) % artworkSlides.length;
        setCarouselState({ uri: gameUri, index: nextIndex });
    };

    const showPreviousArtwork = () => goToArtwork(artworkIndex - 1);
    const showNextArtwork = () => goToArtwork(artworkIndex + 1);

    const handleArtworkKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            showPreviousArtwork();
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            showNextArtwork();
        }
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        pointerStartX.current = event.clientX;
        didArtworkSwipe.current = false;
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        const startX = pointerStartX.current;
        pointerStartX.current = null;
        if (startX === null || !hasMultipleArtwork) return;

        if (Math.abs(event.clientX - startX) < 40) return;
        didArtworkSwipe.current = true;

        if (event.clientX > startX) {
            showPreviousArtwork();
        } else {
            showNextArtwork();
        }
    };

    const openArtworkPreview = () => {
        didArtworkSwipe.current = false;
        if (!currentArtwork || currentArtworkFailed) return;
        setIsArtworkPreviewOpen(true);
    };

    const handleOpenArtworkPreview = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (event.detail > 0 && didArtworkSwipe.current) {
            didArtworkSwipe.current = false;
            return;
        }

        openArtworkPreview();
    };

    const handleOpenArtworkPreviewKeyDown = (
        event: React.KeyboardEvent<HTMLButtonElement>,
    ) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;

        event.preventDefault();
        openArtworkPreview();
    };

    const handleCloseArtworkPreview = () => {
        pointerStartX.current = null;
        didArtworkSwipe.current = false;
        setIsArtworkPreviewOpen(false);
    };

    const markArtworkFailed = (src: string) => {
        setFailedArtwork((current) => {
            const urls = current.uri === gameUri
                ? new Set(current.urls)
                : new Set<string>();
            urls.add(src);
            return { uri: gameUri, urls };
        });
    };

    const handleClose = () => {
        setIsArtworkPreviewOpen(false);
        setCarouselState({ uri: '', index: 0 });
        setFailedArtwork({ uri: '', urls: new Set() });
        setHistoryState({ uri: '', open: false });
        setPageState({ uri: '', page: 'details' });
        onClose();
    };

    const showInstallPage = () => {
        setPageState({ uri: gameUri, page: 'install' });
    };

    const showDetailsPage = () => {
        setPageState({ uri: gameUri, page: 'details' });
        window.setTimeout(() => installTriggerRef.current?.focus(), 350);
    };

    const installButton = (
        <button
            ref={installTriggerRef}
            type="button"
            onClick={showInstallPage}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {t('install')}
        </button>
    );

    return (
        <>
        <Modal
            isShow
            onClose={handleClose}
            closeLabel={isInstallPage ? t('closeInstall') : t('closeDetails')}
            title={isInstallPage
                ? t('installTitle', { name })
                : t('detailTitle', { name })}
            headerContent={isInstallPage ? (
                <button
                    type="button"
                    onClick={showDetailsPage}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    {t('backToDetails')}
                </button>
            ) : undefined}
            headerActions={isInstallPage ? undefined : installButton}
            className="max-h-[calc(100dvh-2rem)] max-w-[880px] overflow-hidden"
        >
            <div className="h-[calc(100dvh-8rem)] min-h-[360px] max-h-[700px] overflow-hidden">
                <div
                    style={{
                        marginLeft: isInstallPage ? '-100%' : '0',
                        transitionProperty: 'margin-left',
                    }}
                    className="flex h-full w-[200%] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                >
                    <div
                        aria-hidden={isInstallPage}
                        inert={isInstallPage}
                        className="h-full w-1/2 shrink-0 overflow-y-auto pr-1"
                    >
            <div className="space-y-5" aria-busy={isLoading}>
                <div
                    role="region"
                    aria-label={t('artworkGallery', { name })}
                    aria-busy={isBannerLoading}
                    onKeyDown={handleArtworkKeyDown}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={() => {
                        pointerStartX.current = null;
                        didArtworkSwipe.current = false;
                    }}
                    className="relative h-36 touch-pan-y overflow-hidden rounded-xl bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:h-52"
                >
                    {showFallbackImage ? (
                        <div
                            role={currentArtwork ? 'img' : undefined}
                            aria-label={currentArtwork?.alt}
                            className="flex h-full items-center justify-center"
                        >
                            <img
                                src={GameIcon}
                                alt={currentArtwork ? '' : t('gameArtwork', { name })}
                                className="h-20 w-20 max-w-[30%] object-contain"
                            />
                        </div>
                    ) : (
                        <button
                            key={currentArtwork.src}
                            ref={artworkPreviewTriggerRef}
                            type="button"
                            aria-label={t('openArtworkPreview')}
                            onClick={handleOpenArtworkPreview}
                            onKeyDown={handleOpenArtworkPreviewKeyDown}
                            className="absolute inset-0 h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
                        >
                            <img
                                src={currentArtwork.src}
                                alt={currentArtwork.alt}
                                draggable={false}
                                className="h-full w-full object-cover object-center"
                                onError={() => markArtworkFailed(currentArtwork.src)}
                            />
                        </button>
                    )}

                    {isBannerLoading && (
                        <div
                            role="status"
                            aria-label={t('loadingArtwork')}
                            className="absolute right-3 top-3 z-20 rounded-full bg-black/35 p-2 text-white backdrop-blur-sm"
                        >
                            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                        </div>
                    )}

                    {hasMultipleArtwork && (
                        <>
                            <button
                                type="button"
                                aria-label={t('previousArtwork')}
                                onClick={showPreviousArtwork}
                                className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/35 p-2 text-white backdrop-blur-sm transition hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                            >
                                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                aria-label={t('nextArtwork')}
                                onClick={showNextArtwork}
                                className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/35 p-2 text-white backdrop-blur-sm transition hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                            >
                                <ChevronRight className="h-5 w-5" aria-hidden="true" />
                            </button>
                            <div className="absolute left-1/2 top-3 z-20 flex max-w-[calc(100%-6rem)] -translate-x-1/2 gap-1.5 overflow-x-auto rounded-full bg-black/30 px-2.5 py-2 backdrop-blur-sm">
                                {artworkSlides.map((slide, index) => (
                                    <button
                                        key={slide.src}
                                        type="button"
                                        aria-label={t('goToArtwork', { index: index + 1 })}
                                        aria-current={index === artworkIndex ? 'true' : undefined}
                                        onClick={() => goToArtwork(index)}
                                        className={`h-2 w-2 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-black/30 ${
                                            index === artworkIndex
                                                ? 'bg-white'
                                                : 'bg-white/45 hover:bg-white/75'
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className="sr-only" aria-live="polite">
                                {t('artworkPosition', {
                                    current: artworkIndex + 1,
                                    total: artworkSlides.length,
                                })}
                            </span>
                        </>
                    )}

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-10 sm:px-5">
                        <div className="flex flex-wrap items-end justify-between gap-2">
                            <div className="min-w-0">
                                <p className="truncate text-lg font-semibold text-white sm:text-xl">
                                    {name}
                                </p>
                                <p className="mt-0.5 text-xs text-white/75">
                                    {deployedVersion
                                        ? t('currentVersionValue', { version: deployedVersion })
                                        : t('versionUnavailable')}
                                </p>
                            </div>
                            {availableLanguages.length > 0 && (
                                <span className="max-w-full truncate rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                                    {languageLabel}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {bannerError && (
                    <div
                        role="alert"
                        className="flex flex-col gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <p className="text-sm text-amber-800">{t('artworkLoadError')}</p>
                        <button
                            type="button"
                            onClick={() => void mutateBanner()}
                            className="self-start rounded-md border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:self-auto"
                        >
                            {t('retry')}
                        </button>
                    </div>
                )}

                {error && (
                    <div
                        role="alert"
                        className="flex flex-col gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <p className="text-sm text-red-700">{t('detailLoadError')}</p>
                        <button
                            type="button"
                            onClick={() => void mutate()}
                            className="self-start rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 sm:self-auto"
                        >
                            {t('retry')}
                        </button>
                    </div>
                )}

                <section
                    aria-labelledby={`${historyId}-basic`}
                    className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 sm:p-5"
                >
                    <h3
                        id={`${historyId}-basic`}
                        className="mb-4 text-sm font-semibold text-gray-900"
                    >
                        {t('basicInformation')}
                    </h3>
                    <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                        <DetailField label={t('gameName')}>{name}</DetailField>
                        <DetailField label={t('businessRegion')}>
                            {detail?.businessRegion || t('unavailable')}
                        </DetailField>
                        <DetailField label={t('languages')}>{languageLabel}</DetailField>
                        <DetailField label={t('screenOrientation')}>{screenTypeLabel}</DetailField>
                        <DetailField label={t('halfScreenRatio')}>{halfRatioLabel}</DetailField>
                        <DetailField label={t('currentVersion')}>
                            {deployedVersion || t('unavailable')}
                        </DetailField>
                        <DetailField label={t('createdAt')}>
                            {formatTimestamp(detail?.createdAt)}
                        </DetailField>
                        <DetailField label={t('updatedAt')}>
                            {formatTimestamp(detail?.updatedAt)}
                        </DetailField>
                        <DetailField label={t('gameDescription')} wide>
                            {description}
                        </DetailField>
                    </dl>

                    {isLoading && (
                        <div className="mt-5 border-t border-gray-200 pt-5">
                            <DetailSkeleton />
                            <span className="sr-only">{t('loadingDetails')}</span>
                        </div>
                    )}
                </section>

                <section
                    aria-labelledby={`${historyId}-version`}
                    className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5"
                >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h3
                                id={`${historyId}-version`}
                                className="text-sm font-semibold text-gray-900"
                            >
                                {t('currentVersion')}
                            </h3>
                            <p className="mt-1 text-xs text-gray-500">
                                {currentVersion
                                    ? formatTimestamp(getVersionTimestamp(currentVersion))
                                    : t('versionUnavailable')}
                            </p>
                        </div>
                        {deployedVersion && (
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                {t('version', { version: deployedVersion })}
                            </span>
                        )}
                    </div>

                    <dl className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2">
                        <DetailField label={t('changeLog')}>
                            {currentVersion?.changeLog || t('noChangeLog')}
                        </DetailField>
                        <DetailField label={t('playGuide')}>
                            {renderPlayGuide(currentVersion?.playGuide)}
                        </DetailField>
                    </dl>
                </section>

                {historyVersions.length > 0 && (
                    <section className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                        <button
                            type="button"
                            aria-expanded={historyOpen}
                            aria-controls={historyId}
                            onClick={() => setHistoryState({
                                uri: gameUri,
                                open: !historyOpen,
                            })}
                            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 sm:px-5"
                        >
                            <span>
                                <span className="block text-sm font-semibold text-gray-900">
                                    {t('versionHistory')}
                                </span>
                                <span className="mt-0.5 block text-xs text-gray-500">
                                    {t('versionHistoryCount', { count: historyVersions.length })}
                                </span>
                            </span>
                            <ChevronDown
                                className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
                                    historyOpen ? 'rotate-180' : ''
                                }`}
                                aria-hidden="true"
                            />
                        </button>

                        {historyOpen && (
                            <div id={historyId} className="border-t border-gray-100 px-4 sm:px-5">
                                {historyVersions.map((version) => (
                                    <div
                                        key={version.uri || version.version}
                                        className="grid grid-cols-1 gap-3 border-b border-gray-100 py-4 last:border-b-0 sm:grid-cols-[140px_1fr_auto]"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {t('version', { version: version.version })}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {formatTimestamp(getVersionTimestamp(version))}
                                            </p>
                                        </div>
                                        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
                                            {version.changeLog || t('noChangeLog')}
                                        </p>
                                        <div className="text-sm sm:text-right">
                                            {renderPlayGuide(version.playGuide)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>
                    </div>
                    <div
                        aria-hidden={!isInstallPage}
                        inert={!isInstallPage}
                        className="h-full w-1/2 shrink-0 overflow-y-auto pl-1"
                    >
                        <GameInstallPanel
                            game={game}
                            detail={detail}
                            isActive={isInstallPage}
                        />
                    </div>
                </div>
            </div>
        </Modal>

        {currentArtwork && (
            <Transition
                appear
                show={isArtworkPreviewOpen}
                as={React.Fragment}
                afterLeave={() => artworkPreviewTriggerRef.current?.focus()}
            >
                <Dialog
                    as="div"
                    className="relative z-[80]"
                    onClose={handleCloseArtworkPreview}
                >
                    <TransitionChild
                        as={React.Fragment}
                        enter="ease-out duration-200"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" />
                    </TransitionChild>

                    <div className="fixed inset-0 overflow-hidden">
                        <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
                            <TransitionChild
                                as={React.Fragment}
                                enter="ease-out duration-200"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-150"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <DialogPanel
                                    onKeyDown={handleArtworkKeyDown}
                                    className="relative flex h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[1600px] flex-col overflow-hidden rounded-2xl bg-black/45 text-left shadow-2xl ring-1 ring-white/10 sm:h-[calc(100dvh-3rem)] sm:w-[calc(100vw-3rem)]"
                                >
                                    <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-5">
                                        <div className="min-w-0">
                                            <DialogTitle
                                                as="h3"
                                                className="truncate text-sm font-semibold text-white"
                                            >
                                                {t('artworkPreviewTitle', { name })}
                                            </DialogTitle>
                                            <p className="mt-0.5 truncate text-xs text-white/60">
                                                {currentArtwork.alt}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-3">
                                            <span
                                                className="text-xs font-medium text-white/70"
                                                aria-live="polite"
                                            >
                                                {t('artworkPosition', {
                                                    current: artworkIndex + 1,
                                                    total: artworkSlides.length,
                                                })}
                                            </span>
                                            <button
                                                type="button"
                                                aria-label={t('closeArtworkPreview')}
                                                onClick={handleCloseArtworkPreview}
                                                className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                            >
                                                <X className="h-5 w-5" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>

                                    <div
                                        onPointerDown={handlePointerDown}
                                        onPointerUp={handlePointerUp}
                                        onPointerCancel={() => {
                                            pointerStartX.current = null;
                                            didArtworkSwipe.current = false;
                                        }}
                                        className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center overflow-hidden p-4 sm:p-8"
                                    >
                                        {currentArtworkFailed ? (
                                            <div
                                                role="img"
                                                aria-label={currentArtwork.alt}
                                                className="flex h-full w-full items-center justify-center"
                                            >
                                                <img
                                                    src={GameIcon}
                                                    alt=""
                                                    className="h-24 w-24 max-h-[35%] max-w-[35%] object-contain"
                                                />
                                            </div>
                                        ) : (
                                            <img
                                                key={currentArtwork.src}
                                                src={currentArtwork.src}
                                                alt={currentArtwork.alt}
                                                draggable={false}
                                                className="h-auto w-auto max-h-full max-w-full select-none object-contain"
                                                onError={() => markArtworkFailed(currentArtwork.src)}
                                            />
                                        )}

                                        {hasMultipleArtwork && (
                                            <>
                                                <button
                                                    type="button"
                                                    aria-label={t('previousArtwork')}
                                                    onClick={showPreviousArtwork}
                                                    className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-4 sm:p-3"
                                                >
                                                    <ChevronLeft
                                                        className="h-6 w-6"
                                                        aria-hidden="true"
                                                    />
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label={t('nextArtwork')}
                                                    onClick={showNextArtwork}
                                                    className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-4 sm:p-3"
                                                >
                                                    <ChevronRight
                                                        className="h-6 w-6"
                                                        aria-hidden="true"
                                                    />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        )}
        </>
    );
};
