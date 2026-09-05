import React, { useEffect, useState } from 'react';
import {
    Package,
    Database,
    Server,
    Cloud,
    Box,
    Layers,
    Cpu,
    Globe,
    Layout,
    Terminal
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import useSWR from 'swr';
import Modal from './base/Modal';
import Switch from './base/switch';
import { extractTryErrorMessage, fetchApp, saveApplication, tryApplication } from '../api/apps';
import GameIcon from '../assets/game.svg';
import ArrangementIcon from '../assets/arrangement.svg';
import SetIcon from '../assets/set.svg';
import { useFlowStore } from '../stores/flowStore';
import { nodesToDSL } from '../utils/nodeToComponent';
import { useTranslations } from 'next-intl';

// Default icon background colors (matching AppCard)
const ICON_BACKGROUNDS = ['#dbeafe', '#fce7f3', '#fef3c7', '#ddd6fe', '#d1fae5', '#fecaca'];

const AVAILABLE_ICONS: Record<string, React.ElementType> = {
    Package,
    Database,
    Server,
    Cloud,
    Box,
    Layers,
    Cpu,
    Globe,
    Layout,
    Terminal
};

interface SidebarProps {
    onSaved?: () => void | Promise<void>;
    activeMenu?: 'arrangement' | 'tasks';
    onMenuSelect?: (menu: 'arrangement' | 'tasks') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onSaved, activeMenu = 'arrangement', onMenuSelect }) => {
    const t = useTranslations('Workflow');
    const commonT = useTranslations('Common');
    const { appId } = useParams<{ appId: string }>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIcon, setSelectedIcon] = useState<string>('');
    const [isHovering, setIsHovering] = useState(false);
    const { nodes } = useFlowStore();
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        alias: '',
        project: '',
        namespace: 'default',
        description: '',
        templateEnabled: false,
    });

    const { data: app, isLoading } = useSWR(
        appId ? ['app', appId] : null,
        ([, id]) => fetchApp(id)
    );

    useEffect(() => {
        if (!isModalOpen || !app) return;
        setFormData({
            name: app.name ?? '',
            alias: app.alias ?? '',
            project: app.project ?? '',
            namespace: app.namespace || 'default',
            description: app.description ?? '',
            templateEnabled: app.templateEnabled || false,
        });
        setSelectedIcon(app.icon || '');
        setSaveError(null);
        setIsSaving(false);
    }, [isModalOpen, app]);

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSaveError(null);
        setIsSaving(false);
    };

    const handleModalSave = async () => {
        if (!appId || !app) return;

        setIsSaving(true);
        setSaveError(null);

        try {
            const dsl = nodesToDSL(nodes, {
                name: formData.name,
                alias: formData.alias,
                version: app.version,
                project: formData.project,
                description: formData.description,
            });

            const payload = {
                id: app.id || appId,
                ...dsl,
                namespace: formData.namespace || 'default',
                icon: selectedIcon,
                templateEnabled: formData.templateEnabled,
            };

            const tryResult = await tryApplication(payload);
            const tryError = extractTryErrorMessage(tryResult);
            if (tryError) {
                setSaveError(tryError);
                return;
            }

            await saveApplication(payload);
            await onSaved?.();

            setIsModalOpen(false);
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : t('saveFailed'));
        } finally {
            setIsSaving(false);
        }
    };

    // Generate a consistent background color based on app id
    const iconBackground = app?.id ? ICON_BACKGROUNDS[
        Math.abs(app.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % ICON_BACKGROUNDS.length
    ] : ICON_BACKGROUNDS[0];

    // Use app icon or default game.svg icon
    const displayIcon = app?.icon || GameIcon;

    const renderDisplayIcon = () => {
        if (app?.icon && AVAILABLE_ICONS[app.icon]) {
            const IconComponent = AVAILABLE_ICONS[app.icon];
            return <IconComponent size={32} />;
        }
        if (typeof displayIcon === 'string' && displayIcon.startsWith('/')) {
            return <img src={displayIcon} alt={t('appIcon')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
        }
        return <img src={displayIcon} alt={t('appIcon')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
    };

    return (
        <div style={{
            width: '200px',
            height: '100%',
            borderRight: '1px solid #e5e5e5',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* App Icon and Name Area */}
            <div
                style={{
                    width: '200px',
                    padding: '10px 16px 12px 16px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    backgroundColor: isHovering ? '#f5f5f5' : 'transparent',
                    transition: 'background-color 0.2s ease'
                }}
                onClick={() => setIsModalOpen(true)}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                {isLoading ? (
                    <div className="space-y-2">
                        <div className="h-10 w-10 bg-gray-200 rounded-xl animate-pulse" />
                        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>
                ) : (
                    <>
                        {/* Icon and Settings Row */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '8px'
                        }}>
                            <span
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    background: iconBackground,
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '8px'
                                }}
                            >
                                {renderDisplayIcon()}
                            </span>

                            {/* Settings Icon */}
                            <img
                                src={SetIcon}
                                alt={t('settings')}
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    cursor: 'pointer'
                                }}
                            />
                        </div>

                        {/* App Name */}
                        <div style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            lineHeight: '20px',
                            color: '#354052',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {app?.name ?? ''}
                        </div>
                        {/* App Namespace */}
                        <div style={{
                            fontSize: '12px',
                            fontWeight: 400,
                            lineHeight: '16px',
                            color: '#94a3b8',
                            marginTop: '2px'
                        }}>
                            {app?.namespace || 'default'}
                        </div>
                        {/* App Version */}
                        {app?.version && (
                            <div style={{
                                fontSize: '12px',
                                fontWeight: 400,
                                lineHeight: '16px',
                                color: '#94a3b8',
                                marginTop: '2px'
                            }}>
                                v{app.version}
                            </div>
                        )}

                    </>
                )}
            </div>

            {/* Navigation Menu */}
            <div style={{ padding: '8px 0' }}>
                <div
                    onClick={() => onMenuSelect?.('arrangement')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 16px',
                        margin: '0 8px',
                        background: activeMenu === 'arrangement' ? '#dbeafe' : 'transparent',
                        color: activeMenu === 'arrangement' ? '#155eef' : '#64748b',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 400,
                        borderRadius: '8px',
                        transition: 'background-color 0.2s, color 0.2s'
                    }}
                >
                    <img src={ArrangementIcon} alt="" style={{ width: '16px', height: '16px' }} />
                    <span>{t('arrangement')}</span>
                </div>
                <div
                    onClick={() => onMenuSelect?.('tasks')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 16px',
                        margin: '4px 8px 0 8px',
                        background: activeMenu === 'tasks' ? '#dbeafe' : 'transparent',
                        color: activeMenu === 'tasks' ? '#155eef' : '#64748b',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 400,
                        borderRadius: '8px',
                        transition: 'background-color 0.2s, color 0.2s'
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    <span>{t('tasks')}</span>
                </div>
            </div>

            <Modal
                isShow={isModalOpen}
                onClose={handleModalClose}
                title={t('editApp')}
            >
                <div className="mt-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('appName')}</label>
                        <input
                            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder={t('appNamePlaceholder')}
                            value={formData.name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('alias')}</label>
                        <input
                            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder={t('aliasPlaceholder')}
                            value={formData.alias}
                            onChange={(e) => setFormData((prev) => ({ ...prev, alias: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('project')}</label>
                        <input
                            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder={t('projectPlaceholder')}
                            value={formData.project}
                            onChange={(e) => setFormData((prev) => ({ ...prev, project: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('namespace')}</label>
                        <input
                            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="default"
                            value={formData.namespace}
                            onChange={(e) => setFormData((prev) => ({ ...prev, namespace: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('icon')}</label>
                        <div className="grid grid-cols-6 gap-2">
                            {Object.entries(AVAILABLE_ICONS).map(([name, Icon]) => (
                                <button
                                    key={name}
                                    onClick={() => setSelectedIcon(name)}
                                    type="button"
                                    className={`
                                        p-2 rounded-lg flex items-center justify-center transition-all
                                        ${selectedIcon === name
                                            ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500 ring-offset-1'
                                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                        }
                                    `}
                                    title={name}
                                >
                                    <Icon size={20} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
                        <textarea
                            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder={t('descriptionPlaceholder')}
                            value={formData.description}
                            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                            rows={3}
                        />
                    </div>

                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <div>
                            <p className="text-sm font-medium text-gray-700">{t('temporaryEnable')}</p>
                            <p className="text-xs text-gray-500">{t('temporaryEnableDescription')}</p>
                        </div>
                        <Switch
                            checked={formData.templateEnabled}
                            onChange={(checked) => setFormData((prev) => ({ ...prev, templateEnabled: checked }))}
                            size="md"
                        />
                    </div>

                    {saveError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {saveError}
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                            onClick={handleModalClose}
                            disabled={isSaving}
                        >
                            {commonT('cancel')}
                        </button>
                        <button
                            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${isSaving ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            onClick={handleModalSave}
                            disabled={isSaving}
                        >
                            {isSaving ? t('saving') : commonT('save')}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Sidebar;
