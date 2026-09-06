import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Key, File, CheckCircle2, Clock, Loader2, XCircle, Play, Logs } from 'lucide-react';

import { cn } from '../utils/cn';
import componentIcon from '../assets/component.svg';
import configIcon from '../assets/config.svg';
import type { ConfigDataItem, SecretDataItem, ComponentDeployStatus } from '../types/flow';
import { useFlowStore } from '../stores/flowStore';
import { useShortcutsStore, getShortcutDisplay } from '../stores/shortcutsStore';
import { pickShortcutForPlatform } from './base/ShortcutTooltip';

const NODE_WIDTH = 'w-[240px]';
const NODE_CONTAINER_STYLES = 'relative rounded-[15px] bg-workflow-block-bg border-2 shadow-xs hover:shadow-lg transition-all duration-200';
const NODE_SELECTED_STYLES = 'border-components-option-card-option-selected-border! ring-1 ring-components-option-card-option-selected-border';
const NODE_HEADER_STYLES = 'flex h-8 items-center justify-between rounded-lg bg-components-input-bg-normal pl-3 pr-2 mb-2';
const NODE_BODY_STYLES = 'px-3 pb-2 pt-3';
const NODE_ICON_CONTAINER_STYLES = 'flex items-center gap-2';
const NODE_BADGE_STYLES = 'flex h-[18px] items-center rounded-[5px] border border-divider-deep bg-components-badge-bg-dimm px-1 text-xs font-semibold uppercase text-text-tertiary';
const NODE_DATA_LIST_STYLES = 'mt-2 space-y-1';
const NODE_DATA_ITEM_STYLES = 'flex items-center gap-1.5 text-xs text-text-secondary truncate';

// Status-based border colors (using inline styles for reliability)
const STATUS_BORDER_COLORS: Record<ComponentDeployStatus, string> = {
    waiting: '#9ca3af',   // gray-400 - waiting
    queued: '#a78bfa',    // violet-400 - queued
    running: '#06b6d4',   // cyan-500 - running
    completed: '#22c55e', // green-500 - completed
    failed: '#ef4444',    // red-500 - failed
    cancelled: '#6b7280', // gray-500 - cancelled
    timeout: '#f97316',   // orange-500 - timeout
    reject: '#ec4899',    // pink-500 - reject
    prepare: '#3b82f6',   // blue-500 - prepare
    pending: '#f59e0b',   // amber-500 - pending
    cleaning: '#14b8a6',  // teal-500 - cleaning
};

// Status-based background colors (subtle)
const STATUS_BG_COLORS: Record<ComponentDeployStatus, string> = {
    waiting: '#f9fafb',   // gray-50
    queued: '#f5f3ff',    // violet-50
    running: '#ecfeff',   // cyan-50
    completed: '#f0fdf4', // green-50
    failed: '#fef2f2',    // red-50
    cancelled: '#f9fafb', // gray-50
    timeout: '#fff7ed',   // orange-50
    reject: '#fdf2f8',    // pink-50
    prepare: '#eff6ff',   // blue-50
    pending: '#fffbeb',   // amber-50
    cleaning: '#f0fdfa',  // teal-50
};

// Status icons
const StatusIcon: React.FC<{ status: ComponentDeployStatus }> = ({ status }) => {
    switch (status) {
        case 'completed':
            return <CheckCircle2 size={14} style={{ color: '#22c55e' }} />;
        case 'waiting':
            return <Clock size={14} style={{ color: '#6b7280' }} />;
        case 'queued':
            return <Clock size={14} style={{ color: '#a78bfa' }} />;
        case 'running':
            return <Loader2 size={14} style={{ color: '#06b6d4' }} className="animate-spin" />;
        case 'failed':
            return <XCircle size={14} style={{ color: '#ef4444' }} />;
        case 'cancelled':
            return <XCircle size={14} style={{ color: '#6b7280' }} />;
        case 'timeout':
            return <Clock size={14} style={{ color: '#f97316' }} />;
        case 'reject':
            return <XCircle size={14} style={{ color: '#ec4899' }} />;
        case 'prepare':
            return <Loader2 size={14} style={{ color: '#3b82f6' }} className="animate-spin" />;
        case 'pending':
            return <Clock size={14} style={{ color: '#f59e0b' }} />;
        case 'cleaning':
            return <Loader2 size={14} style={{ color: '#14b8a6' }} className="animate-spin" />;
        default:
            return null;
    }
};

const mapApiStatus = (apiStatus: string): ComponentDeployStatus => {
    const s = apiStatus.toLowerCase();
    if (s === 'not deploy') return 'waiting';
    if (s === 'pending') return 'pending';
    if (s === 'cleaning') return 'cleaning';
    if (s === 'running') return 'completed'; // Show as completed (green check) for Running (steady state)
    if (s === 'succeeded' || s === 'completed') return 'completed';
    if (s === 'failed' || s === 'error') return 'failed';
    return 'waiting';
};

const CustomNode = ({ data, selected }: NodeProps) => {
    const isConfigSecret = (data.componentType as string) === 'config-secret';
    const { shortcuts } = useShortcutsStore();
    const copyShortcut = shortcuts.find(s => s.id === 'copy-node');
    const pasteShortcut = shortcuts.find(s => s.id === 'paste-node');
    const deleteShortcut = shortcuts.find(s => s.id === 'delete-element');

    const copyShortcutStr = copyShortcut ? pickShortcutForPlatform(copyShortcut.keys) : undefined;
    const copyKeysDisplay = copyShortcutStr ? getShortcutDisplay(copyShortcutStr) : [];

    const pasteShortcutStr = pasteShortcut ? pickShortcutForPlatform(pasteShortcut.keys) : undefined;
    const pasteKeysDisplay = pasteShortcutStr ? getShortcutDisplay(pasteShortcutStr) : [];

    const deleteShortcutStr = deleteShortcut ? pickShortcutForPlatform(deleteShortcut.keys) : undefined;
    const deleteKeysDisplay = deleteShortcutStr ? getShortcutDisplay(deleteShortcutStr) : [];
    const originalType = data.originalType as string;
    const configData = data.configData as ConfigDataItem[] | undefined;
    const secretData = data.secretData as SecretDataItem[] | undefined;

    // Get component status from store
    const {
        componentStatuses,
        isPreviewMode,
        setShowLogPanel,
        setLogComponentName,
        clearLogs
    } = useFlowStore();
    const nodeName = data.name ? (data.name as string).trim() : undefined;
    const componentStatus = nodeName ? componentStatuses[nodeName] : undefined;

    // Fallback to data.status from API if we are not in preview polling mode
    const rawDataStatus = data.status as string | undefined;
    const deployStatus: ComponentDeployStatus | undefined = (isPreviewMode && componentStatus?.status)
        ? componentStatus.status
        : (rawDataStatus ? mapApiStatus(rawDataStatus) : undefined);

    // Only show log icon for deployed/running components
    const isDeployed = deployStatus && !['waiting', 'queued', 'reject'].includes(deployStatus);
    const hasStatus = !!deployStatus;

    // Render config files list
    const renderConfigData = () => {
        if (!configData || configData.length === 0) return null;
        return (
            <div className={NODE_DATA_LIST_STYLES}>
                {configData.map((item) => (
                    <div key={item.id} className={NODE_DATA_ITEM_STYLES}>
                        <File size={12} className="text-text-tertiary flex-shrink-0" />
                        <span className="truncate">{item.key}</span>
                    </div>
                ))}
            </div>
        );
    };

    // Render secret keys list
    const renderSecretData = () => {
        if (!secretData || secretData.length === 0) return null;
        return (
            <div className={NODE_DATA_LIST_STYLES}>
                {secretData.map((item) => (
                    <div key={item.id} className={NODE_DATA_ITEM_STYLES}>
                        <Key size={12} className="text-text-tertiary flex-shrink-0" />
                        <span className="truncate">{item.key}</span>
                    </div>
                ))}
            </div>
        );
    };

    // Get status-based styles
    const statusBorderColor = isPreviewMode && deployStatus ? STATUS_BORDER_COLORS[deployStatus] : undefined;
    const statusBgColor = isPreviewMode && deployStatus ? STATUS_BG_COLORS[deployStatus] : undefined;

    return (
        <div
            data-tour="canvas-node"
            className={cn(
                NODE_WIDTH,
                NODE_CONTAINER_STYLES,
                selected && NODE_SELECTED_STYLES,
                // Default border when not in preview mode or no status
                !isPreviewMode && 'border-transparent'
            )}
            style={{
                ...(statusBorderColor && { borderColor: statusBorderColor }),
                ...(statusBgColor && { backgroundColor: statusBgColor }),
            }}
        >
            {selected && (copyKeysDisplay.length > 0 || pasteKeysDisplay.length > 0 || deleteKeysDisplay.length > 0) && (
                <div className="absolute -top-[92px] left-0 flex flex-col gap-1.5 rounded-lg bg-white px-2.5 py-2 text-xs text-gray-700 shadow-lg border border-gray-200 z-10 pointer-events-none transition-all duration-200 animate-fade-in">
                    {copyKeysDisplay.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 whitespace-nowrap w-8">复制</span>
                            <div className="flex gap-0.5">
                                {copyKeysDisplay.map((k, idx) => (
                                    <kbd key={idx} className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded bg-gray-100 px-1 text-[10px] font-medium text-gray-500 border border-gray-200">{k}</kbd>
                                ))}
                            </div>
                        </div>
                    )}
                    {pasteKeysDisplay.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 whitespace-nowrap w-8">粘贴</span>
                            <div className="flex gap-0.5">
                                {pasteKeysDisplay.map((k, idx) => (
                                    <kbd key={idx} className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded bg-gray-100 px-1 text-[10px] font-medium text-gray-500 border border-gray-200">{k}</kbd>
                                ))}
                            </div>
                        </div>
                    )}
                    {deleteKeysDisplay.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 whitespace-nowrap w-8">删除</span>
                            <div className="flex gap-0.5">
                                {deleteKeysDisplay.map((k, idx) => (
                                    <kbd key={idx} className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded bg-gray-100 px-1 text-[10px] font-medium text-gray-500 border border-gray-200">{k}</kbd>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            <div className={NODE_BODY_STYLES}>
                {/* Node Name - Displayed prominently */}
                {nodeName && (
                    <div className="text-sm font-bold text-text-primary mb-1 truncate flex items-center gap-1">
                        {data.componentType === 'job' ? (
                            <Play size={18} className="text-blue-500" />
                        ) : (
                            <img
                                src={isConfigSecret ? configIcon : componentIcon}
                                alt="icon"
                                className="w-5 h-5"
                            />
                        )}
                        {nodeName}
                        {/* Status icon and Log button (Reverted to Iteration 2 layout) */}
                        {(isPreviewMode || hasStatus) && deployStatus && (
                            <div className="flex items-center gap-1.5 ml-auto">
                                <StatusIcon status={deployStatus} />
                                {isDeployed && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            clearLogs();
                                            setLogComponentName(nodeName || '');
                                            setShowLogPanel(true);
                                        }}
                                        className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors pointer-events-auto"
                                        title="View Logs"
                                    >
                                        <Logs size={14} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Header */}
                <div className={NODE_HEADER_STYLES}>
                    <div className={NODE_ICON_CONTAINER_STYLES}>
                        <span className="text-xs font-semibold text-text-primary truncate max-w-[120px]">
                            {data.label as string}
                        </span>
                    </div>
                    <div className={NODE_BADGE_STYLES}>
                        {(data.componentType as string) === 'webservice' ? 'Web Service' :
                            (data.componentType as string) === 'store' ? 'Store' :
                                (data.componentType as string) === 'config-secret' ? (
                                    originalType === 'config' ? 'Config' : 'Secret'
                                ) :
                                    (data.componentType as string) === 'config' ? 'Config' :
                                        (data.componentType as string) === 'secret' ? 'Secret' :
                                            (data.componentType as string) === 'job' ? 'Job' :
                                                'Web Service'}
                    </div>
                </div>

                {/* Config/Secret Data List */}
                {isConfigSecret && originalType === 'config' && renderConfigData()}
                {isConfigSecret && originalType === 'secret' && renderSecretData()}
            </div>

            {/* Handles */}
            <Handle
                type="target"
                position={Position.Left}
                className="h-3! w-3! border-2! border-white! bg-blue-500!"
                style={{ top: '50%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                className="h-3! w-3! border-2! border-white! bg-blue-500!"
                style={{ top: '50%' }}
            />
        </div>
    );
};

export default memo(CustomNode);
