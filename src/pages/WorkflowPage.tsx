import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Package, Database, Server, Cloud, Box, Layers, Cpu, Globe, Layout, Terminal } from 'lucide-react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import FlowCanvas from '../components/FlowCanvas';
import Sidebar from '../components/Sidebar';
import PropertyPanel from '../components/PropertyPanel';
import TasksPanel from '../components/workflow/TasksPanel';
import { APIDocsModal } from '../components/workflow/APIDocsModal';
import { fetchApp, fetchAppComponents } from '../api/apps';
import { useFlowStore } from '../stores/flowStore';
import { componentsToNodes } from '../utils/componentToNode';
import GameIcon from '../assets/game.svg';

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

const WorkflowPage: React.FC = () => {
    const t = useTranslations('Workflow');
    const { appId } = useParams<{ appId: string }>();
    const navigate = useNavigate();
    const [showArrow, setShowArrow] = useState(false);
    const { setNodes, clearNodes } = useFlowStore();
    const [refreshKey, setRefreshKey] = useState(0);
    const [activeMenu, setActiveMenu] = useState<'arrangement' | 'tasks'>('arrangement');
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showApiDocs, setShowApiDocs] = useState(false);

    // Fetch app details
    const { data: app, isLoading, mutate: mutateApp } = useSWR(
        appId ? ['app', appId] : null,
        ([, id]) => fetchApp(id)
    );

    // Fetch app components
    const { data: components, mutate: mutateComponents } = useSWR(
        appId ? ['components', appId] : null,
        ([, id]) => fetchAppComponents(id),
        { refreshInterval: 5000 }
    );

    // Initialize nodes when components are loaded
    // Initialize nodes when components are loaded
    useEffect(() => {
        if (!components || components.length === 0) return;

        // Get current nodes from store
        const currentNodes = useFlowStore.getState().nodes;

        // If no nodes exist yet, initialize from components
        if (currentNodes.length === 0) {
            const nodes = componentsToNodes(components);
            setNodes(nodes);
        } else {
            // Nodes already exist - update only data that might have changed from API
            // but preserve positions and user modifications
            const updatedNodes = currentNodes.map(node => {
                // Find matching component by name
                const component = components.find(c => c.name === node.data.name);
                if (!component) return node;

                // Update only API-sourced fields while preserving position and user edits
                return {
                    ...node,
                    data: {
                        ...node.data,
                        // Update all relevant fields from component
                        namespace: component.namespace || node.data.namespace,
                        replicas: component.replicas,
                        image: component.image || component.properties?.image || node.data.image,
                        // Update status if available (even if CustomNode uses store, keeping data synced is good)
                        status: component.status,
                        // Sync traits including share, etc.
                        traits: component.traits ? {
                            ...node.data.traits, // Keep existing traits to avoid losing UI state if any
                            ...componentsToNodes([component])[0].data.traits // Merge latest traits from API
                        } : node.data.traits,
                    }
                };
            });

            // Check if any new components were added
            const existingNames = new Set(currentNodes.map(n => n.data.name));
            const newComponents = components.filter(c => !existingNames.has(c.name));

            if (newComponents.length > 0) {
                // Add new components as nodes with default positions
                const newNodes = componentsToNodes(newComponents);
                setNodes([...updatedNodes, ...newNodes]);
            } else if (currentNodes.length !== updatedNodes.length ||
                currentNodes.some((n, i) => JSON.stringify(n.data) !== JSON.stringify(updatedNodes[i].data))) {
                // Only update if there are actual changes in data
                setNodes(updatedNodes);
            }
        }
    }, [components, setNodes]);

    // Cleanup nodes and log panel state when leaving the page
    useEffect(() => {
        const { resetLogPanelState } = useFlowStore.getState();
        return () => {
            clearNodes();
            resetLogPanelState();
        };
    }, [clearNodes]);

    const refreshWorkflowData = async () => {
        if (!appId) return;
        await Promise.all([mutateApp(), mutateComponents()]);
        setRefreshKey((k) => k + 1);
    };

    // Use app icon or default game.svg icon
    const displayIcon = app?.icon || GameIcon;

    const handleArrowClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate('/dashboard1?section=apps');
    };

    const renderIcon = () => {
        if (showArrow) {
            return (
                <div
                    onClick={handleArrowClick}
                    aria-label={t('backToApplications')}
                    title={t('backToApplications')}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                    <ArrowLeft style={{ width: '16px', height: '16px', color: '#155EEF' }} />
                </div>
            );
        }

        if (app?.icon && AVAILABLE_ICONS[app.icon]) {
            const IconComponent = AVAILABLE_ICONS[app.icon];
            return <IconComponent size={16} color="#155EEF" />;
        }

        if (typeof displayIcon === 'string') {
            return <img src={displayIcon} alt={t('appIcon')} style={{ width: '16px', height: '16px', objectFit: 'contain' }} />;
        }

        return <img src={GameIcon} alt={t('appIcon')} style={{ width: '16px', height: '16px', objectFit: 'contain' }} />;
    };

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <header
                style={{
                    height: '60px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 24px',
                    background: '#fff',
                    zIndex: 10,
                    position: 'relative', // Added for absolute positioning of children
                }}
            >
                {/* Center: App name */}
                {isLoading ? (
                    <div className="animate-pulse h-8 w-48 bg-gray-200 rounded-lg" />
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            background: '#fff',
                            borderRadius: '8px',
                            boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
                            transition: 'all 0.2s',
                            position: 'absolute',
                            left: '50%',
                            transform: 'translateX(-50%)',
                        }}
                        onMouseEnter={() => {
                            setShowArrow(true);
                        }}
                        onMouseLeave={() => {
                            setShowArrow(false);
                        }}
                    >
                        {renderIcon()}
                        <span style={{ fontSize: '14px', color: '#64748b' }}>/</span>
                        <span style={{ fontSize: '14px', fontWeight: 400, color: '#155EEF' }}>
                            {app?.name || 'Eruun Console'}
                        </span>
                        <ChevronDown style={{ width: '16px', height: '16px', color: '#155EEF' }} />
                    </div>
                )}

                {/* Right: Status indicator based on components */}
                {(() => {
                    // Calculate app status based on component statuses
                    let statusConfig = {
                        label: t('running'),
                        color: '#22c55e',
                        shadowColor: 'rgba(34, 197, 94, 0.2)',
                    };

                    if (components && components.length > 0) {
                        // Exclude shared components from status calculation
                        const deployableComponents = components.filter(c => !c.traits?.share);
                        const hasNotDeployed = deployableComponents.some(c => c.status === 'Not Deploy');
                        const allRunning = deployableComponents.every(c => c.status === 'Running');

                        const hasPending = deployableComponents.some(c => c.status === 'Pending');
                        const hasCleaning = deployableComponents.some(c => c.status === 'Cleaning');

                        if (hasNotDeployed) {
                            statusConfig = {
                                label: t('notDeployed'),
                                color: '#6b7280',
                                shadowColor: 'rgba(107, 114, 128, 0.2)',
                            };
                        } else if (hasCleaning) {
                            statusConfig = {
                                label: t('cleaning'),
                                color: '#14b8a6',
                                shadowColor: 'rgba(20, 184, 166, 0.2)',
                            };
                        } else if (hasPending) {
                            statusConfig = {
                                label: t('pending'),
                                color: '#f59e0b',
                                shadowColor: 'rgba(245, 158, 11, 0.2)',
                            };
                        } else if (!allRunning) {
                            statusConfig = {
                                label: t('error'),
                                color: '#ef4444',
                                shadowColor: 'rgba(239, 68, 68, 0.2)',
                            };
                        }
                    } else if (!components || components.length === 0) {
                        statusConfig = {
                            label: t('notDeployed'),
                            color: '#6b7280',
                            shadowColor: 'rgba(107, 114, 128, 0.2)',
                        };
                    }

                    const getComponentStatusColor = (status?: string) => {
                        switch (status) {
                            case 'Running': return '#22c55e';
                            case 'Pending': return '#f59e0b';
                            case 'Cleaning': return '#14b8a6';
                            case 'Not Deploy': return '#6b7280';
                            default: return '#ef4444';
                        }
                    };

                    return (
                        <div style={{ position: 'absolute', right: '24px' }}>
                            <div
                                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        setShowStatusDropdown(!showStatusDropdown);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                                aria-label={t('statusDetails')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 14px',
                                    background: '#fff',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb',
                                    boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
                                    cursor: 'pointer',
                                }}
                            >
                                <div
                                    style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: statusConfig.color,
                                        boxShadow: `0 0 0 3px ${statusConfig.shadowColor}`,
                                    }}
                                />
                                <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>{statusConfig.label}</span>
                                <ChevronDown style={{ width: '14px', height: '14px', color: '#6b7280', transform: showStatusDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                            </div>

                            {/* Status Dropdown */}
                            {showStatusDropdown && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        marginTop: '8px',
                                        width: '360px',
                                        background: '#fff',
                                        borderRadius: '12px',
                                        border: '1px solid #e5e7eb',
                                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                                        zIndex: 50,
                                    }}
                                >

                                    {/* Components List */}
                                    <div style={{ maxHeight: '320px', overflow: 'auto', padding: '12px' }}>
                                        {components && components.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {components.map((component) => (
                                                    <div
                                                        key={component.id}
                                                        style={{
                                                            padding: '12px',
                                                            background: component.lastAbnormal ? '#fef2f2' : '#f9fafb',
                                                            borderRadius: '8px',
                                                            border: component.lastAbnormal ? '1px solid #fecaca' : '1px solid #e5e7eb',
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ fontSize: '14px', fontWeight: 500, color: '#1f2937' }}>{component.name}</span>
                                                            </div>
                                                            <span
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '9999px',
                                                                    fontSize: '11px',
                                                                    fontWeight: 500,
                                                                    color: getComponentStatusColor(component.status),
                                                                    backgroundColor: `${getComponentStatusColor(component.status)}15`,
                                                                }}
                                                            >
                                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getComponentStatusColor(component.status) }} />
                                                                {component.status === 'Running'
                                                                    ? t('running')
                                                                    : component.status === 'Not Deploy'
                                                                        ? t('notDeployed')
                                                                        : component.status === 'Cleaning'
                                                                            ? t('cleaning')
                                                                            : component.status === 'Pending'
                                                                                ? t('pending')
                                                                                : component.status || t('unknown')}
                                                            </span>
                                                        </div>

                                                        {/* External Links */}
                                                        {component.externalLinks && component.externalLinks.length > 0 && (
                                                            <div style={{ marginBottom: '8px' }}>
                                                                {component.externalLinks.map((link, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        title={link.value}
                                                                        style={{
                                                                            fontSize: '12px',
                                                                            color: '#3b82f6',
                                                                            fontFamily: 'ui-monospace, monospace',
                                                                            wordBreak: 'break-all',
                                                                        }}
                                                                    >
                                                                        {(() => {
                                                                            let display = link.value;
                                                                            // Replace * host with actual ingress host
                                                                            const ingressHost = component.traits?.ingress?.[0]?.routes?.[0]?.host
                                                                                || component.traits?.ingress?.[0]?.hosts?.[0]
                                                                                || '';
                                                                            display = display.replace(/^\*/, ingressHost);
                                                                            // Strip regex patterns like (.*), (/.*) 
                                                                            display = display.replace(/\(.*?\)/g, '');
                                                                            return display;
                                                                        })()}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Error Info */}
                                                        {component.lastAbnormal && (
                                                            <div
                                                                style={{
                                                                    padding: '8px',
                                                                    background: '#fee2e2',
                                                                    borderRadius: '6px',
                                                                    fontSize: '11px',
                                                                    color: '#991b1b',
                                                                    lineHeight: '1.4',
                                                                }}
                                                            >
                                                                ⚠️ {component.lastAbnormal}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                                                {t('noComponents')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </header>
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <Sidebar onSaved={refreshWorkflowData} activeMenu={activeMenu} onMenuSelect={setActiveMenu} />
                <main style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                    {activeMenu === 'arrangement' ? (
                        <>
                            <FlowCanvas appId={appId} app={app} components={components} refreshKey={refreshKey} onSaved={refreshWorkflowData} onShowApiDocs={() => setShowApiDocs(true)} />
                            <PropertyPanel />
                        </>
                    ) : (
                        appId && <TasksPanel appId={appId} />
                    )}
                </main>
            </div>

            {/* API Docs Modal */}
            <APIDocsModal isOpen={showApiDocs} onClose={() => setShowApiDocs(false)} />
        </div>
    );
};

export default WorkflowPage;
