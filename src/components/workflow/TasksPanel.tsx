import React, { useState } from 'react';
import useSWR from 'swr';
import { fetchTaskHistory, fetchTaskStages } from '../../api/apps';
import type { TaskHistoryItem, TaskStagesResponse, TaskStage } from '../../api/apps';
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle, X, Info, AlertTriangle } from 'lucide-react';

interface TasksPanelProps {
    appId: string;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
    completed: { icon: CheckCircle2, color: '#16a34a', bgColor: '#dcfce7', label: 'Completed' },
    running: { icon: Loader2, color: '#2563eb', bgColor: '#dbeafe', label: 'Running' },
    failed: { icon: XCircle, color: '#dc2626', bgColor: '#fee2e2', label: 'Failed' },
    cancelled: { icon: XCircle, color: '#6b7280', bgColor: '#f3f4f6', label: 'Cancelled' },
    timeout: { icon: AlertCircle, color: '#ea580c', bgColor: '#ffedd5', label: 'Timeout' },
    waiting: { icon: Clock, color: '#6b7280', bgColor: '#f3f4f6', label: 'Waiting' },
    queued: { icon: Clock, color: '#6b7280', bgColor: '#f3f4f6', label: 'Queued' },
    prepare: { icon: Clock, color: '#6b7280', bgColor: '#f3f4f6', label: 'Preparing' },
    reject: { icon: XCircle, color: '#dc2626', bgColor: '#fee2e2', label: 'Rejected' },
    pending: { icon: Clock, color: '#f59e0b', bgColor: '#fffbeb', label: 'Pending' },
    cleaning: { icon: Loader2, color: '#14b8a6', bgColor: '#f0fdfa', label: 'Cleaning' },
};

const formatDuration = (startTime?: string | number, endTime?: string | number): string => {
    if (!startTime) return '-';
    const start = typeof startTime === 'number' ? startTime * 1000 : new Date(startTime).getTime();
    const end = endTime ? (typeof endTime === 'number' ? endTime * 1000 : new Date(endTime).getTime()) : Date.now();
    const durationMs = end - start;

    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
};

const formatTime = (time?: string | number): string => {
    if (!time) return '-';
    // Handle Unix timestamp (seconds)
    const timestamp = typeof time === 'number' ? time * 1000 : new Date(time).getTime();
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Task Details Modal Component
interface TaskDetailsModalProps {
    taskId: string;
    onClose: () => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ taskId, onClose }) => {
    const { data: taskDetails, isLoading, error } = useSWR<TaskStagesResponse | null>(
        ['taskStages', taskId],
        () => fetchTaskStages(taskId)
    );

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    width: '700px',
                    maxWidth: '90vw',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div
                    style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
                            Task Details
                        </h3>
                        {taskDetails && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                                {taskDetails.workflowName}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '8px',
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Content */}
                <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
                    {isLoading && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                            <Loader2 size={32} className="animate-spin" style={{ color: '#6b7280' }} />
                        </div>
                    )}

                    {error && (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#dc2626' }}>
                            Failed to load task details
                        </div>
                    )}

                    {!isLoading && !error && taskDetails && (
                        <div>
                            {/* Task Summary */}
                            <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                                    <div>
                                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Task ID</span>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: 500, color: '#1f2937' }}>
                                            {taskDetails.taskId}
                                        </p>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Status</span>
                                        <p style={{ margin: '4px 0 0 0' }}>
                                            {(() => {
                                                const config = statusConfig[taskDetails.status] || statusConfig.waiting;
                                                const StatusIcon = config.icon;
                                                return (
                                                    <span
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            padding: '4px 8px',
                                                            borderRadius: '9999px',
                                                            fontSize: '12px',
                                                            fontWeight: 500,
                                                            color: config.color,
                                                            backgroundColor: config.bgColor,
                                                        }}
                                                    >
                                                        <StatusIcon size={12} />
                                                        {config.label}
                                                    </span>
                                                );
                                            })()}
                                        </p>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Type</span>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: 500, color: '#1f2937' }}>
                                            {taskDetails.type}
                                        </p>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Workflow ID</span>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: 500, color: '#1f2937' }}>
                                            {taskDetails.workflowId}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Stages List */}
                            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
                                Stages ({taskDetails.stages?.length || 0})
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {taskDetails.stages?.map((stage: TaskStage) => {
                                    const stageConfig = statusConfig[stage.status] || statusConfig.waiting;
                                    const StageIcon = stageConfig.icon;

                                    return (
                                        <div
                                            key={stage.id}
                                            style={{
                                                padding: '16px',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                                background: '#ffffff',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            width: '24px',
                                                            height: '24px',
                                                            borderRadius: '50%',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            color: '#ffffff',
                                                            backgroundColor: stageConfig.color,
                                                        }}
                                                    >
                                                        {stage.id}
                                                    </span>
                                                    <div>
                                                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#1f2937' }}>
                                                            {stage.name}
                                                        </span>
                                                        <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>
                                                            ({stage.type})
                                                        </span>
                                                    </div>
                                                </div>
                                                <span
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        padding: '4px 8px',
                                                        borderRadius: '9999px',
                                                        fontSize: '12px',
                                                        fontWeight: 500,
                                                        color: stageConfig.color,
                                                        backgroundColor: stageConfig.bgColor,
                                                    }}
                                                >
                                                    <StageIcon size={12} className={stage.status === 'running' ? 'animate-spin' : ''} />
                                                    {stageConfig.label}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '24px', fontSize: '12px', color: '#6b7280' }}>
                                                <span>Start: {formatTime(stage.startTime)}</span>
                                                <span>Duration: {formatDuration(stage.startTime, stage.endTime)}</span>
                                            </div>

                                            {/* Info */}
                                            {stage.info && (
                                                <div style={{
                                                    marginTop: '12px',
                                                    padding: '12px',
                                                    background: '#eff6ff',
                                                    borderRadius: '6px',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                                        <Info size={14} style={{ color: '#3b82f6' }} />
                                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e40af' }}>Resources</span>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        {(() => {
                                                            // Helper to render a single info item
                                                            const renderItem = (text: string, index: number) => {
                                                                let displayText = '';

                                                                if (text.includes('deployment:') || text.includes('secret:') || text.includes('configmap:')) {
                                                                    displayText = text;
                                                                } else if (text.includes('service_deploy') || text.includes('svc:')) {
                                                                    const match = text.match(/svc:\s*([^;]+)/);
                                                                    displayText = match ? match[1].trim() : text;
                                                                } else if (typeof text === 'string') {
                                                                    displayText = text.replace(/^\w+_?deploy:\s*/, '').trim();
                                                                } else {
                                                                    displayText = JSON.stringify(text);
                                                                }

                                                                if (!displayText) return null;

                                                                return (
                                                                    <div key={index} style={{
                                                                        fontSize: '13px',
                                                                        color: '#1e40af',
                                                                        padding: '8px 10px',
                                                                        background: 'rgba(255,255,255,0.7)',
                                                                        borderRadius: '4px',
                                                                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '8px'
                                                                    }}>
                                                                        <span>{displayText}</span>
                                                                    </div>
                                                                );
                                                            };

                                                            // Handle Array
                                                            if (Array.isArray(stage.info)) {
                                                                return stage.info.map((item: any, index: number) => {
                                                                    const message = item.message || item.msg || JSON.stringify(item);
                                                                    return renderItem(message, index);
                                                                });
                                                            }

                                                            // Handle String (legacy logging format)
                                                            if (typeof stage.info === 'string') {
                                                                return stage.info.split('\n').filter(line => line.trim()).map((line, index) => renderItem(line, index));
                                                            }

                                                            // Handle Object (fallback)
                                                            return renderItem(JSON.stringify(stage.info), 0);
                                                        })()}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Error */}
                                            {stage.error && (
                                                <div style={{
                                                    marginTop: '12px',
                                                    padding: '12px',
                                                    background: '#fef2f2',
                                                    borderRadius: '6px',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                                        <AlertTriangle size={14} style={{ color: '#dc2626' }} />
                                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#991b1b' }}>Error</span>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        {(() => {
                                                            const renderErrorItem = (msg: string, component?: string, index?: number) => (
                                                                <div key={index} style={{
                                                                    fontSize: '12px',
                                                                    color: '#991b1b',
                                                                    padding: '6px 10px',
                                                                    background: 'rgba(255,255,255,0.6)',
                                                                    borderRadius: '4px',
                                                                    wordBreak: 'break-word'
                                                                }}>
                                                                    {component && <span style={{ fontWeight: 600, marginRight: '4px' }}>[{component}]</span>}
                                                                    {msg}
                                                                </div>
                                                            );

                                                            const errors = stage.error;
                                                            if (Array.isArray(errors)) {
                                                                return errors.map((err: any, idx: number) => {
                                                                    if (typeof err === 'string') return renderErrorItem(err, undefined, idx);
                                                                    if (typeof err === 'object' && err !== null) {
                                                                        return renderErrorItem(err.message || err.msg || JSON.stringify(err), err.component || err.name, idx);
                                                                    }
                                                                    return renderErrorItem(JSON.stringify(err), undefined, idx);
                                                                });
                                                            }
                                                            if (typeof errors === 'string') {
                                                                return errors.split('\n').filter(line => line.trim()).map((line, idx) => renderErrorItem(line, undefined, idx));
                                                            }
                                                            return renderErrorItem(JSON.stringify(errors));
                                                        })()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const TasksPanel: React.FC<TasksPanelProps> = ({ appId }) => {
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const { data: tasks, isLoading, error } = useSWR(
        ['taskHistory', appId],
        () => fetchTaskHistory(appId),
        { refreshInterval: 5000 }
    );

    const handleRowClick = (taskId: string) => {
        setSelectedTaskId(taskId);
    };

    return (
        <div
            style={{
                flex: 1,
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
                    Task History
                </h3>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
                {isLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
                        <Loader2 size={32} className="animate-spin" style={{ color: '#6b7280' }} />
                    </div>
                )}

                {error && (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>
                        Failed to load task history
                    </div>
                )}

                {!isLoading && !error && tasks && tasks.length === 0 && (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
                        No task history found
                    </div>
                )}

                {!isLoading && !error && tasks && tasks.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>
                                    Name
                                </th>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>
                                    Time
                                </th>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>
                                    Duration
                                </th>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map((task: TaskHistoryItem, index: number) => {
                                const config = statusConfig[task.status] || statusConfig.waiting;
                                const StatusIcon = config.icon;
                                const taskIdentifier = task.id || task.taskId;

                                return (
                                    <tr
                                        key={taskIdentifier || `task-${index}`}
                                        onClick={() => taskIdentifier && handleRowClick(taskIdentifier)}
                                        style={{
                                            borderBottom: '1px solid #f3f4f6',
                                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                                            transition: 'background-color 0.15s',
                                            cursor: 'pointer',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#f0f9ff';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
                                        }}
                                    >
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontSize: '14px', fontWeight: 500, color: '#1f2937' }}>
                                                {task.name || task.workflowName || 'Unnamed Task'}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                                                {task.workflowName}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                                            {formatTime(task.createTime || task.startTime || task.start_time)}
                                        </td>
                                        <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                                            {formatDuration(task.createTime || task.startTime || task.start_time, task.updateTime || task.endTime || task.end_time)}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '6px 12px',
                                                    borderRadius: '9999px',
                                                    fontSize: '13px',
                                                    fontWeight: 500,
                                                    color: config.color,
                                                    backgroundColor: config.bgColor,
                                                }}
                                            >
                                                <StatusIcon size={14} className={task.status === 'running' ? 'animate-spin' : ''} />
                                                {config.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Task Details Modal */}
            {selectedTaskId && (
                <TaskDetailsModal
                    taskId={selectedTaskId}
                    onClose={() => setSelectedTaskId(null)}
                />
            )}
        </div>
    );
};

export default TasksPanel;
