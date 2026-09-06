import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslations } from 'next-intl';
import { useUIStore } from '../../../stores/uiStore';
import { SidebarAccountPanel } from '../../../components/SidebarAccountPanel';
import {
    Search,
    LayoutGrid,
    Layout,
    AppWindow,
    Settings,
    Settings2,
    Code,
    Keyboard,
    Box,
    Bot,
    Server,
    GraduationCap,
    ShoppingBag,
    Layers,
    Disc,
} from 'lucide-react';

interface SidebarProps {
    activeSection?: string;
    onSectionChange?: (section: string) => void;
}

const MOBILE_SIDEBAR_QUERY = '(max-width: 720px)';

const Sidebar: React.FC<SidebarProps> = ({ activeSection = 'dashboard', onSectionChange }) => {
    const t = useTranslations('Sidebar');
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() =>
        typeof window !== 'undefined' && window.matchMedia(MOBILE_SIDEBAR_QUERY).matches
    );
    const { setSearchOpen } = useUIStore();

    useEffect(() => {
        const mediaQuery = window.matchMedia(MOBILE_SIDEBAR_QUERY);
        const handleViewportChange = (event: MediaQueryListEvent) => setIsCollapsed(event.matches);

        mediaQuery.addEventListener('change', handleViewportChange);
        return () => mediaQuery.removeEventListener('change', handleViewportChange);
    }, []);

    const handleSectionClick = (section: string, path?: string) => {
        if (path) {
            navigate(path);
        }

        if (onSectionChange) {
            onSectionChange(section);
        }
    };

    return (
        <div className={`${isCollapsed ? 'w-16' : 'w-64'} h-full bg-[#F9FAFB] border-r border-gray-200 flex flex-col p-4 transition-all duration-300`}>
            <div className={`mb-5 flex shrink-0 items-center gap-2 ${isCollapsed ? 'flex-col' : 'h-8 px-1'}`}>
                <button
                    type="button"
                    aria-label={t('toggle')}
                    title={t('toggle')}
                    className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    onClick={() => setIsCollapsed((collapsed) => !collapsed)}
                >
                    <img src="/logo_icon.svg" alt="" className="h-8 w-8 rounded-lg" />
                </button>
                {!isCollapsed && <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">Eruun</span>}
            </div>

            <div className="-mx-2 min-h-0 flex-1 overflow-y-auto px-2">
              {/* Navigation */}
              <div className="space-y-1 mb-8">
                <div
                    className="flex items-center justify-between px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer group"
                    onClick={() => setSearchOpen(true)}
                    role="button"
                    aria-label={t('openSearch')}
                >
                    <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
                        <Search className="w-4 h-4 shrink-0" />
                        {!isCollapsed && <span>{t('openSearch')}</span>}
                    </div>
                    {!isCollapsed && <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 group-hover:border-gray-300">⌘ K</span>
                    </div>}
                </div>
                {[
                    { icon: LayoutGrid, label: t('dashboard'), section: 'dashboard', path: '/' },
                    { icon: Layout, label: t('dashboardLegacy'), section: 'dashboard1', path: '/dashboard1' },
                    { icon: ShoppingBag, label: t('appStore'), section: 'app-store' },
                    { icon: Settings2, label: t('applicationManagement'), section: 'application-management', path: '/application-management' },
                    { icon: Layers, label: t('applications'), section: 'applications', path: '/applications' },
                    { icon: AppWindow, label: t('applicationsLegacy'), section: 'apps', path: '/apps' },
                    { icon: Box, label: t('modelStore'), section: 'model-store' },
                    { icon: Server, label: t('inferenceServices'), section: 'inference' },
                    { icon: GraduationCap, label: t('trainingJobs'), section: 'training' },
                    { icon: Bot, label: t('agentTools'), section: 'tools' },
                ].map((item, index) => (
                    <div
                        key={index}
                        className={`flex items-center gap-3 px-2 py-1.5 text-sm rounded-md cursor-pointer ${activeSection === item.section
                            ? 'text-gray-900 bg-gray-100 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        onClick={() => handleSectionClick(item.section, item.path)}
                    >
                        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
                            <item.icon className="w-4 h-4 shrink-0" />
                            {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                        </div>
                    </div>
                ))}

              </div>

              {/* Searches */}
              <div>
                {!isCollapsed && <div className="text-xs font-medium text-gray-400 px-2 mb-2">{t('searches').toUpperCase()}</div>}
                <div className="space-y-1">
                    {[
                        { icon: Disc, color: 'text-orange-600', bg: 'bg-orange-100', label: t('customerSuccess'), section: 'customer-success' },
                        { icon: Keyboard, color: 'text-green-600', bg: 'bg-green-100', label: t('shortcuts'), section: 'shortcuts' },
                        { icon: Code, color: 'text-pink-600', bg: 'bg-pink-100', label: t('language'), section: 'language' },
                        { icon: Settings, color: 'text-blue-600', bg: 'bg-blue-100', label: t('settings'), section: 'settings' },
                    ].map((item, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-3 px-2 py-1.5 text-sm rounded-md cursor-pointer ${activeSection === item.section
                                ? 'text-gray-900 bg-gray-100 font-medium'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            onClick={() => handleSectionClick(item.section)}
                        >
                            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
                                <div className={`p-0.5 ${item.bg} rounded shrink-0`}>
                                    <item.icon className={`w-3 h-3 ${item.color}`} />
                                </div>
                                {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                            </div>
                        </div>
                    ))}
                </div>
              </div>
            </div>

            <SidebarAccountPanel collapsed={isCollapsed} />
        </div>
    );
};

export default Sidebar;
