import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWRInfinite from 'swr/infinite';
import { Tab } from '@headlessui/react';
import { useTranslations } from 'next-intl';
import { Plus, CheckCircle2, XCircle, X } from 'lucide-react';
import { fetchApps, createApp } from '../../api/apps';
import type { AppFilters } from '../../types/app';
import { useDebounce } from '../../hooks/useDebounce';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { AppCard } from './components/app-card';
import { NewAppCard } from './components/new-app-card';
import { CreateBlankAppModal, type CreateBlankAppData } from './components/create-blank-app-modal';
import { ScheduleList } from '../schedule/list';

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

const ITEMS_PER_PAGE = 12;

export const List: React.FC = () => {
    const t = useTranslations('Apps');
    const navigate = useNavigate();
    const [searchInput] = useState('');
    const [myApps] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const debouncedSearch = useDebounce(searchInput, 500);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToastMessage({ type, message });
        setTimeout(() => setToastMessage(null), 3000);
    };

    const filters: AppFilters = {
        search: debouncedSearch,
        myApps,
    };

    const getKey = (pageIndex: number, previousPageData: unknown) => {
        const previous = previousPageData as { hasMore?: boolean } | null;
        if (previous && previous.hasMore === false) return null;
        return ['apps', pageIndex + 1, filters];
    };

    const { data, size, setSize, isLoading, mutate } = useSWRInfinite(
        getKey,
        ([, page, pageFilters]) => fetchApps(page as number, ITEMS_PER_PAGE, pageFilters as AppFilters),
        {
            revalidateFirstPage: false,
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
            dedupingInterval: 60000, // 1 minute deduplication
        }
    );

    const apps = data ? data.flatMap(page => page.data) : [];
    const hasMore = data ? data[data.length - 1]?.hasMore : false;
    const isEmpty = !isLoading && apps.length === 0;

    const observerTarget = useInfiniteScroll({
        onLoadMore: () => setSize(size + 1),
        hasMore,
        isLoading,
    });

    const handleCreateBlank = () => {
        setIsCreateModalOpen(true);
    };

    const handleCreateApp = async (data: CreateBlankAppData) => {
        const createdApp = await createApp({
            name: data.name,
            namespace: data.namespace,
            version: data.version,
            description: data.description,
            alias: data.alias || undefined,
            project: data.project || undefined,
            icon: data.icon || undefined,
            templateEnabled: data.templateEnabled,
            components: [],
            steps: [],
        });
        // Refresh the app list after creation
        mutate();
        // Navigate to the new app's workflow page using response id
        navigate(`/workflow/${createdApp.id}`);
    };

    const handleCreateFromTemplate = () => {
        // TODO: Open template selector modal
        console.log('Create from template');
    };

    const processDSLImport = async (dsl: Record<string, unknown>) => {
        // Validate required fields
        if (!dsl.name) {
            showToast('error', t('invalidDslName'));
            return;
        }
        
        const appData = {
            ...dsl,
            namespace: dsl.namespace || 'default',
            version: dsl.version || '1.0.0',
            description: dsl.description || '',
            component: dsl.component || [],
            workflow: dsl.workflow || [],
        };

        try {
            const createdApp = await createApp(appData as unknown as Parameters<typeof createApp>[0]);
            mutate();
            navigate(`/workflow/${createdApp.id}`);
        } catch (err) {
            console.error('Failed to import DSL:', err);
            showToast('error', t('importFailed'));
        }
    };

    const handleImportDSL = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const dsl = JSON.parse(event.target?.result as string);
                        processDSLImport(dsl);
                    } catch (err) {
                        console.error('Invalid DSL file:', err);
                        showToast('error', t('invalidJson'));
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget === e.target) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/json') {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const dsl = JSON.parse(event.target?.result as string);
                    processDSLImport(dsl);
                } catch (err) {
                    console.error('Invalid DSL file:', err);
                    showToast('error', t('invalidJson'));
                }
            };
            reader.readAsText(file);
        }
    };

    const tabs = [
        { name: t('title'), count: apps.length },
        { name: t('schedule'), count: null },
    ];

    return (
        <div className="relative">
            {/* Toast Notification */}
            {toastMessage && (
                <div
                    className={`fixed top-20 right-6 z-[100] max-w-sm rounded-lg shadow-lg border p-4 animate-in slide-in-from-right ${toastMessage.type === 'success'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                        }`}
                >
                    <div className="flex items-start gap-3">
                        {toastMessage.type === 'success' ? (
                            <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                            <XCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${toastMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
                                }`}>
                                {toastMessage.message}
                            </p>
                        </div>
                        <button
                            onClick={() => setToastMessage(null)}
                            aria-label={t('closeNotification')}
                            className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors cursor-pointer border-none bg-transparent"
                        >
                            <X size={14} className={toastMessage.type === 'success' ? 'text-green-500' : 'text-red-500'} />
                        </button>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <Tab.Group>
                <Tab.List className="flex space-x-1 border-b border-gray-200 mb-6">
                    {tabs.map((tab) => (
                        <Tab
                            key={tab.name}
                            className={({ selected }) =>
                                classNames(
                                    'px-4 py-2 text-sm font-medium leading-5 focus:outline-none transition-colors',
                                    selected
                                        ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
                                        : 'text-gray-500 hover:text-gray-700'
                                )
                            }
                        >
                            <span className="flex items-center gap-2">
                                {tab.name}
                                {tab.count !== null && (
                                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                                        {tab.count}
                                    </span>
                                )}
                            </span>
                        </Tab>
                    ))}
                </Tab.List>

                <Tab.Panels>
                    {/* Applications Tab */}
                    <Tab.Panel>
                        <div
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            {/* Apps Grid */}
                            <div className="flex flex-wrap gap-8">
                                {/* New App Card - Always visible */}
                                <NewAppCard
                                    onCreateBlank={handleCreateBlank}
                                    onCreateFromTemplate={handleCreateFromTemplate}
                                    onImportDSL={handleImportDSL}
                                />

                                {/* App Cards */}
                                {apps.map(app => (
                                    <AppCard key={app.id} app={app} onUpdate={() => mutate()} />
                                ))}
                            </div>

                            {/* Empty state message (only when no apps exist) */}
                            {isEmpty && (
                                <div className="mt-8 text-center text-gray-500">
                                    <p className="text-sm">{t('noApplicationsYet')}</p>
                                </div>
                            )}

                            {/* Loading indicator */}
                            {isLoading && (
                                <div className="mt-6 text-center">
                                    <div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                                </div>
                            )}

                            {/* Infinite scroll trigger */}
                            {!isEmpty && <div ref={observerTarget} className="h-4 mt-6" />}

                            {/* Drag & Drop Overlay */}
                            {isDragging && (
                                <div className="fixed inset-0 bg-primary-500/10 backdrop-blur-sm z-50 flex items-center justify-center">
                                    <div className="bg-white rounded-2xl shadow-2xl p-12 border-4 border-dashed border-primary-500">
                                        <div className="text-center">
                                            <Plus className="w-16 h-16 mx-auto mb-4 text-primary-600" />
                                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                                {t('dropDsl')}
                                            </h3>
                                            <p className="text-gray-600">
                                                {t('releaseImport')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Tab.Panel>

                    {/* Schedule Tab */}
                    <Tab.Panel>
                        <ScheduleList />
                    </Tab.Panel>
                </Tab.Panels>
            </Tab.Group>

            {/* Create Blank App Modal */}
            <CreateBlankAppModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateApp}
            />
        </div>
    );
};
