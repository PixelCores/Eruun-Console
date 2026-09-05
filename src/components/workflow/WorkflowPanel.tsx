import React, { useEffect, useState } from 'react';
import { X, GitBranch, Clock, Check, Loader2 } from 'lucide-react';
import type { Workflow } from '../../types/app';
import { fetchWorkflows } from '../../api/apps';

interface WorkflowPanelProps {
    isOpen: boolean;
    onClose: () => void;
    appId: string;
    onSelectWorkflow: (workflow: Workflow) => void;
    selectedWorkflowId?: string;
}

const WorkflowPanel: React.FC<WorkflowPanelProps> = ({
    isOpen,
    onClose,
    appId,
    onSelectWorkflow,
    selectedWorkflowId: externalSelectedId,
}) => {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

    // Use external selected id if provided, otherwise use internal state
    const selectedWorkflowId = externalSelectedId || internalSelectedId;

    useEffect(() => {
        if (isOpen && appId) {
            /* eslint-disable react-hooks/set-state-in-effect */
            setIsLoading(true);
            fetchWorkflows(appId)
                .then((data) => {
                    // Sort by createTime descending (newest first)
                    const sortedData = [...data].sort((a, b) => {
                        return new Date(b.createTime).getTime() - new Date(a.createTime).getTime();
                    });
                    setWorkflows(sortedData);
                })
                .finally(() => {
                    setIsLoading(false);
                    /* eslint-enable react-hooks/set-state-in-effect */
                });
        }
    }, [isOpen, appId]);

    if (!isOpen) return null;

    const handleWorkflowClick = (workflow: Workflow) => {
        setInternalSelectedId(workflow.id);
        onSelectWorkflow(workflow);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getWorkflowTypeColor = (type: string) => {
        switch (type) {
            case 'update':
                return 'bg-amber-100 text-amber-700';
            case 'workflow':
                return 'bg-blue-100 text-blue-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div
            className="absolute top-full mt-2 right-0 z-50 w-[380px] rounded-2xl bg-white shadow-xl"
            style={{
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            }}
        >
            {/* Header */}
            <div className="px-5 pt-5 pb-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-gray-900">
                        Workflows ({workflows.length})
                    </h2>
                    <button
                        onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors border-none bg-transparent cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    Select a workflow to apply connections
                </p>
            </div>

            {/* Content */}
            <div className="px-5 pb-5 pt-3 space-y-2.5 max-h-[400px] overflow-y-auto">
                {isLoading ? (
                    <div className="py-8 flex flex-col items-center justify-center text-gray-400">
                        <Loader2 size={24} className="animate-spin mb-2" />
                        <span className="text-xs">Loading workflows...</span>
                    </div>
                ) : workflows.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-400">
                        No workflows found
                    </div>
                ) : (
                    workflows.map((workflow) => (
                        <div
                            key={workflow.id}
                            onClick={() => handleWorkflowClick(workflow)}
                            className={`rounded-lg border p-3 cursor-pointer transition-all ${selectedWorkflowId === workflow.id
                                ? 'border-blue-400 bg-blue-50/50 ring-1 ring-blue-400'
                                : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-gray-100/50'
                                }`}
                        >
                            {/* Workflow Header */}
                            <div className="flex items-start gap-2.5">
                                <div
                                    className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                                    style={{
                                        backgroundColor: '#EFF6FF',
                                        border: '1px solid #60A5FA',
                                    }}
                                >
                                    <GitBranch size={14} color="#3B82F6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-900 truncate">
                                            {workflow.alias || workflow.name}
                                        </span>
                                        {selectedWorkflowId === workflow.id && (
                                            <Check size={14} className="text-blue-500 shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">
                                        {workflow.description || 'No description'}
                                    </p>
                                </div>
                            </div>

                            {/* Workflow Meta */}
                            <div className="flex items-center gap-3 mt-2.5 pl-10">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getWorkflowTypeColor(workflow.workflowType)}`}>
                                    {workflow.workflowType}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    {workflow.namespace}
                                </span>
                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <Clock size={10} />
                                    {formatDate(workflow.createTime)}
                                </div>
                            </div>

                            {/* Steps Preview */}
                            <div className="mt-2.5 pl-10">
                                <div className="flex items-center gap-1 flex-wrap">
                                    {workflow.steps.slice(0, 4).map((step, index) => (
                                        <React.Fragment key={step.name}>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                {step.name}
                                            </span>
                                            {index < Math.min(workflow.steps.length - 1, 3) && (
                                                <span className="text-gray-300 text-[10px]">→</span>
                                            )}
                                        </React.Fragment>
                                    ))}
                                    {workflow.steps.length > 4 && (
                                        <span className="text-[10px] text-gray-400">
                                            +{workflow.steps.length - 4} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default WorkflowPanel;
