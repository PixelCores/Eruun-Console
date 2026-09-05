import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useFlowStore } from '../../stores/flowStore';
import { Button } from '../ui/Button';
import {
    PortalToFollowElem,
    PortalToFollowElemContent,
    PortalToFollowElemTrigger,
} from '../ui/PortalToFollowElem';
import type { TraitEnv } from '../../types/flow';

interface TraitsEnvPanelProps {
    onClose: () => void;
    onAdd: (env: TraitEnv) => void;
    initialData?: TraitEnv;
    onUpdate?: (env: TraitEnv) => void;
}

const INPUT_STYLES = 'w-full px-3 py-2 text-sm border border-components-panel-border rounded-lg bg-white input-gradient-focus focus:ring-0 outline-none transition-colors';

const gradientBorderStyle = `
    .input-gradient-focus:focus {
        border-image: linear-gradient(to right, #67e8f9, #3b82f6) 1;
        border-width: 1px;
        outline: none;
    }
    .input-gradient-focus:focus-visible {
        border-image: linear-gradient(to right, #67e8f9, #3b82f6) 1;
        border-width: 1px;
        outline: none;
        box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3);
    }
`;

const TraitsEnvPanel: React.FC<TraitsEnvPanelProps> = ({ onClose, onAdd, initialData, onUpdate }) => {
    const { nodes } = useFlowStore();
    const [envName, setEnvName] = useState('');
    const [selectedNodeId, setSelectedNodeId] = useState('');
    const [envKey, setEnvKey] = useState('');
    const [isSourceOpen, setIsSourceOpen] = useState(false);

    const isEditMode = !!initialData;

    // Filter config and secret nodes (including config-secret type)
    const configNodes = nodes.filter(n => {
        const type = n.data.componentType;
        return type === 'config' || type === 'secret' || type === 'config-secret';
    });

    const selectedSourceNode = nodes.find(n => n.id === selectedNodeId);

    // Populate form when initialData changes (edit mode)
    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
        if (initialData) {
            setEnvName(initialData.name || '');
            setEnvKey(initialData.valueFrom?.secret?.key || '');
            // Find the node by secret name
            const secretName = initialData.valueFrom?.secret?.name;
            if (secretName) {
                const matchingNode = nodes.find(n => n.data.name === secretName || n.data.label === secretName);
                if (matchingNode) {
                    setSelectedNodeId(matchingNode.id);
                }
            }
        } else {
            setEnvName('');
            setSelectedNodeId('');
            setEnvKey('');
        }
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [initialData, nodes]);

    const handleSubmit = () => {
        if (!envName || !selectedNodeId || !envKey) return;

        const envData: TraitEnv = {
            name: envName,
            valueFrom: {
                secret: {
                    name: selectedSourceNode?.data.name || selectedSourceNode?.data.label || selectedNodeId,
                    key: envKey
                }
            }
        };

        if (isEditMode && onUpdate) {
            onUpdate(envData);
        } else {
            onAdd(envData);
        }

        // Reset form
        setEnvName('');
        setSelectedNodeId('');
        setEnvKey('');
    };

    const isValid = envName && selectedNodeId && envKey;

    return (
        <>
            <style>{gradientBorderStyle}</style>
            <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-components-panel-border">
                <span className="text-[15px] font-semibold text-text-primary">
                    {isEditMode ? 'Edit Traits Env' : 'Add Traits Env'}
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-6 w-6"
                >
                    <X size={16} />
                </Button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Variable Name */}
                <div>
                    <label className="text-[13px] font-medium text-text-primary mb-2 block">
                        Variable Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        className={INPUT_STYLES}
                        placeholder="e.g. MYSQL_ROOT_PASSWORD"
                        value={envName}
                        onChange={(e) => setEnvName(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-text-tertiary">
                        The environment variable name that will be set in the container
                    </p>
                </div>

                {/* Source Node */}
                <div>
                    <label className="text-[13px] font-medium text-text-primary mb-2 block">
                        Source Node <span className="text-red-500">*</span>
                    </label>
                    <PortalToFollowElem
                        placement="bottom-start"
                        offsetValue={4}
                        trigger="click"
                        open={isSourceOpen}
                        onOpenChange={setIsSourceOpen}
                    >
                        <PortalToFollowElemTrigger asChild>
                            <button
                                type="button"
                                className={cn(INPUT_STYLES, "flex items-center justify-between cursor-pointer hover:bg-state-base-hover")}
                            >
                                <span className={cn("truncate", !selectedNodeId && "text-text-tertiary")}>
                                    {selectedSourceNode ? `${selectedSourceNode.data.name || selectedSourceNode.data.label || selectedNodeId} (${selectedSourceNode.data.componentType})` : 'Select a Config/Secret node...'}
                                </span>
                                <ChevronDown className="h-4 w-4 text-text-tertiary shrink-0" />
                            </button>
                        </PortalToFollowElemTrigger>
                        <PortalToFollowElemContent className="w-[320px] p-1 bg-white border border-components-panel-border shadow-lg rounded-lg z-[100]">
                            <div className="flex flex-col gap-0.5 max-h-[240px] overflow-y-auto">
                                {configNodes.length > 0 ? (
                                    configNodes.map((node) => {
                                        const isSelected = selectedNodeId === node.id;
                                        return (
                                            <div
                                                key={node.id}
                                                className={cn(
                                                    "flex items-center gap-2.5 p-2.5 rounded-md cursor-pointer transition-colors",
                                                    isSelected ? "bg-state-accent-active" : "hover:bg-state-base-hover"
                                                )}
                                                onClick={() => {
                                                    setSelectedNodeId(node.id);
                                                    setIsSourceOpen(false);
                                                }}
                                            >
                                                <div className={cn(
                                                    "flex h-4 w-4 items-center justify-center shrink-0",
                                                    isSelected ? "text-state-accent-solid" : "invisible"
                                                )}>
                                                    <Check size={14} strokeWidth={2.5} />
                                                </div>
                                                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                                    <span className={cn(
                                                        "text-[13px] font-medium leading-none",
                                                        isSelected ? "text-state-accent-solid" : "text-text-primary"
                                                    )}>
                                                        {node.data.name || node.data.label || node.id}
                                                    </span>
                                                    <span className="text-[11px] leading-normal text-text-tertiary">
                                                        Type: {node.data.componentType}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-4 text-center text-sm text-text-tertiary">
                                        No Config or Secret nodes available.
                                        <br />
                                        Please add a Config or Secret node first.
                                    </div>
                                )}
                            </div>
                        </PortalToFollowElemContent>
                    </PortalToFollowElem>
                    <p className="mt-1 text-xs text-text-tertiary">
                        Select a Config or Secret node to reference the value from
                    </p>
                </div>

                {/* Key */}
                <div>
                    <label className="text-[13px] font-medium text-text-primary mb-2 block">
                        Key <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        className={INPUT_STYLES}
                        placeholder="e.g. ROOT_PASSWORD"
                        value={envKey}
                        onChange={(e) => setEnvKey(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-text-tertiary">
                        The key name in the Config/Secret to retrieve the value from
                    </p>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-components-panel-border">
                <Button
                    variant="secondary"
                    size="small"
                    onClick={onClose}
                >
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    size="small"
                    onClick={handleSubmit}
                    disabled={!isValid}
                >
                    {isEditMode ? 'Save' : 'Add'}
                </Button>
            </div>
        </div>
        </>
    );
};

export default TraitsEnvPanel;
