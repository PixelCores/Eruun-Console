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
import type { TraitStorage } from '../../types/flow';

interface TraitsStoragePanelProps {
    onClose: () => void;
    onAdd: (storage: TraitStorage) => void;
    initialData?: TraitStorage;
    onUpdate?: (storage: TraitStorage) => void;
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

const STORAGE_TYPES = [
    { value: 'persistent', label: 'Persistent', desc: 'Persistent volume with specified size' },
    { value: 'ephemeral', label: 'Ephemeral', desc: 'Temporary storage, cleared on restart' },
    { value: 'config', label: 'Config', desc: 'Mount from ConfigMap' },
] as const;

const TraitsStoragePanel: React.FC<TraitsStoragePanelProps> = ({ onClose, onAdd, initialData, onUpdate }) => {
    const { nodes } = useFlowStore();
    const [storageType, setStorageType] = useState<TraitStorage['type']>('persistent');
    const [name, setName] = useState('');
    const [mountPath, setMountPath] = useState('');
    const [subPath, setSubPath] = useState('');
    const [size, setSize] = useState('');
    const [sourceName, setSourceName] = useState('');
    const [isTypeOpen, setIsTypeOpen] = useState(false);
    const [isSourceOpen, setIsSourceOpen] = useState(false);

    const isEditMode = !!initialData;

    // Filter config nodes for config type storage (including config-secret type)
    const configNodes = nodes.filter(n => {
        const type = n.data.componentType;
        return type === 'config' || type === 'config-secret';
    });

    // Populate form when initialData changes (edit mode)
    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
        if (initialData) {
            setStorageType(initialData.type || 'persistent');
            setName(initialData.name || '');
            setMountPath(initialData.mountPath || '');
            setSubPath(initialData.subPath || '');
            setSize(initialData.size || '');
            setSourceName(initialData.sourceName || '');
        } else {
            setStorageType('persistent');
            setName('');
            setMountPath('');
            setSubPath('');
            setSize('');
            setSourceName('');
        }
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [initialData]);

    const handleSubmit = () => {
        if (!name || !mountPath) return;

        const storageData: TraitStorage = {
            type: storageType,
            name,
            mountPath,
            ...(subPath && { subPath }),
            ...(storageType === 'persistent' && size && { size }),
            ...(storageType === 'config' && sourceName && { sourceName }),
        };

        if (isEditMode && onUpdate) {
            onUpdate(storageData);
        } else {
            onAdd(storageData);
        }
        
        // Reset form
        setName('');
        setMountPath('');
        setSubPath('');
        setSize('');
        setSourceName('');
    };

    const isValid = name && mountPath && (storageType !== 'config' || sourceName);

    return (
        <>
            <style>{gradientBorderStyle}</style>
            <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-components-panel-border">
                <span className="text-[15px] font-semibold text-text-primary">
                    {isEditMode ? 'Edit Traits Storage' : 'Add Traits Storage'}
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
                {/* Type */}
                <div>
                    <label className="text-[13px] font-medium text-text-primary mb-2 block">
                        Type <span className="text-red-500">*</span>
                    </label>
                    <PortalToFollowElem
                        placement="bottom-start"
                        offsetValue={4}
                        trigger="click"
                        open={isTypeOpen}
                        onOpenChange={setIsTypeOpen}
                    >
                        <PortalToFollowElemTrigger asChild>
                            <button
                                type="button"
                                className={cn(INPUT_STYLES, "flex items-center justify-between cursor-pointer hover:bg-state-base-hover")}
                            >
                                <span className="capitalize">{storageType}</span>
                                <ChevronDown className="h-4 w-4 text-text-tertiary shrink-0" />
                            </button>
                        </PortalToFollowElemTrigger>
                        <PortalToFollowElemContent className="w-[320px] p-1 bg-white border border-components-panel-border shadow-lg rounded-lg z-[100]">
                            <div className="flex flex-col gap-0.5">
                                {STORAGE_TYPES.map((type) => {
                                    const isSelected = storageType === type.value;
                                    return (
                                        <div
                                            key={type.value}
                                            className={cn(
                                                "flex items-center gap-2.5 p-2.5 rounded-md cursor-pointer transition-colors",
                                                isSelected ? "bg-state-accent-active" : "hover:bg-state-base-hover"
                                            )}
                                            onClick={() => {
                                                setStorageType(type.value);
                                                setIsTypeOpen(false);
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
                                                    "text-[13px] font-medium leading-none capitalize",
                                                    isSelected ? "text-state-accent-solid" : "text-text-primary"
                                                )}>
                                                    {type.label}
                                                </span>
                                                <span className="text-[11px] leading-normal text-text-tertiary">
                                                    {type.desc}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </PortalToFollowElemContent>
                    </PortalToFollowElem>
                </div>

                {/* Name */}
                <div>
                    <label className="text-[13px] font-medium text-text-primary mb-2 block">
                        Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        className={INPUT_STYLES}
                        placeholder="e.g. data, conf, init-scripts"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-text-tertiary">
                        Unique name for this storage volume
                    </p>
                </div>

                {/* Mount Path */}
                <div>
                    <label className="text-[13px] font-medium text-text-primary mb-2 block">
                        Mount Path <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        className={INPUT_STYLES}
                        placeholder="e.g. /var/lib/mysql"
                        value={mountPath}
                        onChange={(e) => setMountPath(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-text-tertiary">
                        Path where the volume will be mounted in the container
                    </p>
                </div>

                {/* Sub Path (optional, for persistent) */}
                {storageType === 'persistent' && (
                    <div>
                        <label className="text-[13px] font-medium text-text-primary mb-2 block">
                            Sub Path <span className="text-text-tertiary">(optional)</span>
                        </label>
                        <input
                            type="text"
                            className={INPUT_STYLES}
                            placeholder="e.g. mysql"
                            value={subPath}
                            onChange={(e) => setSubPath(e.target.value)}
                        />
                        <p className="mt-1 text-xs text-text-tertiary">
                            Subdirectory within the volume to mount
                        </p>
                    </div>
                )}

                {/* Size (for persistent) */}
                {storageType === 'persistent' && (
                    <div>
                        <label className="text-[13px] font-medium text-text-primary mb-2 block">
                            Size <span className="text-text-tertiary">(optional)</span>
                        </label>
                        <input
                            type="text"
                            className={INPUT_STYLES}
                            placeholder="e.g. 5Gi, 10Gi"
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                        />
                        <p className="mt-1 text-xs text-text-tertiary">
                            Storage size (e.g. 1Gi, 5Gi, 10Gi)
                        </p>
                    </div>
                )}

                {/* Source Name (for config type) */}
                {storageType === 'config' && (
                    <div>
                        <label className="text-[13px] font-medium text-text-primary mb-2 block">
                            Config Source <span className="text-red-500">*</span>
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
                                    <span className={cn("truncate", !sourceName && "text-text-tertiary")}>
                                        {sourceName || 'Select a Config node...'}
                                    </span>
                                    <ChevronDown className="h-4 w-4 text-text-tertiary shrink-0" />
                                </button>
                            </PortalToFollowElemTrigger>
                            <PortalToFollowElemContent className="w-[320px] p-1 bg-white border border-components-panel-border shadow-lg rounded-lg z-[100]">
                                <div className="flex flex-col gap-0.5 max-h-[240px] overflow-y-auto">
                                    {configNodes.length > 0 ? (
                                        configNodes.map((node) => {
                                            const nodeLabel = node.data.label || node.id;
                                            const isSelected = sourceName === nodeLabel;
                                            return (
                                                <div
                                                    key={node.id}
                                                    className={cn(
                                                        "flex items-center gap-2.5 p-2.5 rounded-md cursor-pointer transition-colors",
                                                        isSelected ? "bg-state-accent-active" : "hover:bg-state-base-hover"
                                                    )}
                                                    onClick={() => {
                                                        setSourceName(nodeLabel);
                                                        setIsSourceOpen(false);
                                                    }}
                                                >
                                                    <div className={cn(
                                                        "flex h-4 w-4 items-center justify-center shrink-0",
                                                        isSelected ? "text-state-accent-solid" : "invisible"
                                                    )}>
                                                        <Check size={14} strokeWidth={2.5} />
                                                    </div>
                                                    <span className={cn(
                                                        "text-[13px] font-medium",
                                                        isSelected ? "text-state-accent-solid" : "text-text-primary"
                                                    )}>
                                                        {nodeLabel}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="p-4 text-center text-sm text-text-tertiary">
                                            No Config nodes available.
                                            <br />
                                            Please add a Config node first.
                                        </div>
                                    )}
                                </div>
                            </PortalToFollowElemContent>
                        </PortalToFollowElem>
                        <p className="mt-1 text-xs text-text-tertiary">
                            Select a Config node to mount as a volume
                        </p>
                    </div>
                )}
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

export default TraitsStoragePanel;

