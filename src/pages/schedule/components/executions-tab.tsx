import React from 'react';
import { CheckCircle, XCircle, Loader2, Clock, Play } from 'lucide-react';

export type JobExecutionStatus = 'running' | 'success' | 'failed' | 'pending';

export interface JobExecution {
    id: string;
    jobName: string;
    status: JobExecutionStatus;
    startedAt: string;
    completedAt?: string;
    duration?: number; // in seconds
    message?: string;
}

// Mock data for demonstration
const mockExecutions: JobExecution[] = [
    {
        id: '1',
        jobName: 'backup-database',
        status: 'success',
        startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        duration: 58,
    },
    {
        id: '2',
        jobName: 'sync-data',
        status: 'running',
        startedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
    {
        id: '3',
        jobName: 'cleanup-logs',
        status: 'failed',
        startedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 59 * 60 * 1000).toISOString(),
        duration: 45,
        message: 'Error: Permission denied',
    },
    {
        id: '4',
        jobName: 'generate-report',
        status: 'success',
        startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000 + 120 * 1000).toISOString(),
        duration: 120,
    },
    {
        id: '5',
        jobName: 'send-notifications',
        status: 'pending',
        startedAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    },
];

const StatusIcon: React.FC<{ status: JobExecutionStatus }> = ({ status }) => {
    switch (status) {
        case 'success':
            return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'failed':
            return <XCircle className="w-4 h-4 text-red-500" />;
        case 'running':
            return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
        case 'pending':
            return <Clock className="w-4 h-4 text-gray-400" />;
        default:
            return null;
    }
};

const StatusBadge: React.FC<{ status: JobExecutionStatus }> = ({ status }) => {
    const styles: Record<JobExecutionStatus, string> = {
        success: 'bg-green-50 text-green-700 border-green-200',
        failed: 'bg-red-50 text-red-700 border-red-200',
        running: 'bg-blue-50 text-blue-700 border-blue-200',
        pending: 'bg-gray-50 text-gray-600 border-gray-200',
    };

    const labels: Record<JobExecutionStatus, string> = {
        success: 'Success',
        failed: 'Failed',
        running: 'Running',
        pending: 'Pending',
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
            <StatusIcon status={status} />
            {labels[status]}
        </span>
    );
};

const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
};

const formatDuration = (seconds?: number): string => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

export const ExecutionsTab: React.FC = () => {
    const [executions] = React.useState<JobExecution[]>(mockExecutions);

    if (executions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <div className="bg-white p-3 rounded-full mb-4 shadow-sm">
                    <Play className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No job executions</h3>
                <p className="text-xs text-gray-500 max-w-xs text-center">
                    Job execution history will appear here once scheduled jobs start running.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Job Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Started
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Message
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {executions.map((execution) => (
                        <tr key={execution.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-sm font-medium text-gray-900">
                                    {execution.jobName}
                                </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                <StatusBadge status={execution.status} />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {formatTimeAgo(execution.startedAt)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                                {formatDuration(execution.duration)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                {execution.message ? (
                                    <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                        {execution.message}
                                    </span>
                                ) : (
                                    <span className="text-xs text-gray-400">-</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
