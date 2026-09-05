import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Combobox,
    ComboboxInput,
    ComboboxOptions,
    ComboboxOption,
    Dialog,
    DialogPanel,
    Transition,
    TransitionChild,
} from '@headlessui/react';
import { Search } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useShortcutsStore, matchesShortcut } from '../../stores/shortcutsStore';
import clsx from 'clsx';
import { useTranslations } from 'next-intl';

interface NavigationItem {
    id: string;
    name: string;
    description?: string;
    category: string;
    path?: string;
    section?: string;
    keywords?: string[];
}

export const CommandPalette: React.FC = () => {
    const t = useTranslations('Search');
    const navigate = useNavigate();
    const { isSearchOpen, setSearchOpen } = useUIStore();
    const [query, setQuery] = useState('');

    const { shortcuts, shortcutsEnabled } = useShortcutsStore();
    const navigationItems: NavigationItem[] = [
        { id: 'dash-widgets', name: t('dashboard'), category: t('dashboard'), path: '/dashboard1', section: 'widgets', keywords: ['home', 'main', 'widgets', '首页'] },
        { id: 'dash-apps', name: t('applications'), category: t('dashboard'), path: '/apps', section: 'apps', keywords: ['deployments', 'services', '应用'] },
        { id: 'dash-schedule', name: t('schedule'), category: t('applications'), path: '/apps', section: 'schedule', keywords: ['calendar', 'events', '计划'] },
        { id: 'dash-model-store', name: t('modelStore'), category: t('dashboard'), path: '/dashboard1', section: 'model-store', keywords: ['model', 'llm', 'catalog', '模型商店'] },
        { id: 'dash-inference', name: t('inferenceServices'), category: t('dashboard'), path: '/dashboard1', section: 'inference', keywords: ['inference', 'deploy', 'endpoint', '推理'] },
        { id: 'dash-training', name: t('trainingJobs'), category: t('dashboard'), path: '/dashboard1', section: 'training', keywords: ['training', 'fine-tune', 'job', '训练'] },
        { id: 'dash-tools', name: t('agentTools'), category: t('dashboard'), path: '/dashboard1', section: 'tools', keywords: ['agent', 'tools', 'mcp', '工具'] },
        { id: 'page-apps', name: t('allApplications'), category: t('pages'), path: '/apps', keywords: ['list', '列表'] },
    ];

    useEffect(() => {
        const onKeydown = (event: KeyboardEvent) => {
            if (!shortcutsEnabled) return;

            const searchShortcut = shortcuts.find(s => s.id === 'open-search');
            if (searchShortcut && searchShortcut.enabled) {
                if (matchesShortcut(event, searchShortcut.keys)) {
                    event.preventDefault();
                    setSearchOpen(true);
                }
            }
        };

        window.addEventListener('keydown', onKeydown);
        return () => {
            window.removeEventListener('keydown', onKeydown);
        };
    }, [setSearchOpen, shortcuts, shortcutsEnabled]);

    const filteredItems =
        query === ''
            ? navigationItems
            : navigationItems.filter((item) => {
                const searchStr = `${item.name} ${item.category} ${item.keywords?.join(' ') || ''}`.toLowerCase();
                return searchStr.includes(query.toLowerCase());
            });

    const handleSelect = (item: NavigationItem | null) => {
        if (!item) return;

        setSearchOpen(false);
        setQuery('');

        if (item.path) {
            navigate(item.path + (item.section ? `?section=${item.section}` : ''));
        }
    };

    // Calculate dynamic height based on results, maxing out at a certain height
    // 48px is roughly the height of one item.
    // Base height for empty state or few items, max-h-[50vh] or similar handled by CSS

    return (
        <Transition show={isSearchOpen} as={React.Fragment} afterLeave={() => setQuery('')} appear>
            <Dialog
                as="div"
                className="relative z-[100]"
                onClose={() => setSearchOpen(false)}
            >
                <TransitionChild
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500/25 backdrop-blur-sm transition-opacity" />
                </TransitionChild>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 md:p-20">
                    <TransitionChild
                        as={React.Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <DialogPanel className="mx-auto max-w-xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 transition-all">
                            <Combobox onChange={handleSelect}>
                                <div className="relative">
                                    <Search
                                        className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-gray-400"
                                        aria-hidden="true"
                                    />
                                    <ComboboxInput
                                        className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                                        placeholder={t('placeholder')}
                                        onChange={(event) => setQuery(event.target.value)}
                                        displayValue={(item: NavigationItem) => item?.name}
                                        autoComplete="off"
                                    />
                                </div>

                                {filteredItems.length > 0 && (
                                    <ComboboxOptions static className="max-h-96 scroll-py-3 overflow-y-auto p-3">
                                        {filteredItems.map((item) => (
                                            <ComboboxOption
                                                key={item.id}
                                                value={item}
                                                className={({ focus }) =>
                                                    clsx(
                                                        'flex cursor-default select-none rounded-xl p-3',
                                                        focus && 'bg-gray-100'
                                                    )
                                                }
                                            >
                                                {({ focus }) => (
                                                    <>
                                                        <div className={clsx(
                                                            'flex h-10 w-10 flex-none items-center justify-center rounded-lg',
                                                            item.category === 'Dashboard' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'
                                                        )}>
                                                            <Search className="h-6 w-6" aria-hidden="true" />
                                                        </div>
                                                        <div className="ml-4 flex-auto">
                                                            <p className={clsx('text-sm font-medium', focus ? 'text-gray-900' : 'text-gray-700')}>
                                                                {item.name}
                                                            </p>
                                                            <p className={clsx('text-xs', focus ? 'text-gray-700' : 'text-gray-500')}>
                                                                {item.category}
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                            </ComboboxOption>
                                        ))}
                                    </ComboboxOptions>
                                )}

                                {query !== '' && filteredItems.length === 0 && (
                                    <div className="py-14 px-6 text-center text-sm sm:px-14">
                                        <Search className="mx-auto h-6 w-6 text-gray-400" aria-hidden="true" />
                                        <p className="mt-4 font-semibold text-gray-900">{t('noResults')}</p>
                                        <p className="mt-2 text-gray-500">
                                            {t('noResultsDescription')}
                                        </p>
                                    </div>
                                )}
                            </Combobox>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>
        </Transition>
    );
};
