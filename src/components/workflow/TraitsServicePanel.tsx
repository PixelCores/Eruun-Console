import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Check, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import {
    PortalToFollowElem,
    PortalToFollowElemContent,
    PortalToFollowElemTrigger,
} from '../ui/PortalToFollowElem';
import type { TraitServiceSpec, TraitServicePort, TraitServiceType } from '../../types/flow';

interface TraitsServicePanelProps {
    onClose: () => void;
    onAdd: (service: TraitServiceSpec) => void;
    initialData?: TraitServiceSpec;
    onUpdate?: (service: TraitServiceSpec) => void;
}

interface KeyValueItem {
    key: string;
    value: string;
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

const SERVICE_TYPES: { value: TraitServiceType; label: string; desc: string }[] = [
    { value: 'internal', label: 'Internal (ClusterIP)', desc: 'Only accessible within the cluster' },
    { value: 'node', label: 'NodePort', desc: 'Exposed via a static port on each node' },
    { value: 'public', label: 'Public (LoadBalancer)', desc: 'Exposed externally via cloud load balancer' },
    { value: 'external', label: 'External (ExternalName)', desc: 'Maps to an external DNS name' },
];

const PROTOCOLS = ['TCP', 'UDP', 'SCTP'] as const;

function recordToItems(record?: Record<string, string>): KeyValueItem[] {
    if (!record) return [];
    return Object.entries(record).map(([key, value]) => ({ key, value }));
}

function itemsToRecord(items: KeyValueItem[]): Record<string, string> | undefined {
    const filtered = items.filter(i => i.key.trim());
    if (filtered.length === 0) return undefined;
    const result: Record<string, string> = {};
    for (const item of filtered) {
        result[item.key.trim()] = item.value;
    }
    return result;
}

const TraitsServicePanel: React.FC<TraitsServicePanelProps> = ({ onClose, onAdd, initialData, onUpdate }) => {
    const [name, setName] = useState('');
    const [serviceType, setServiceType] = useState<TraitServiceType>('internal');
    const [headless, setHeadless] = useState(false);
    const [selector, setSelector] = useState<KeyValueItem[]>([]);
    const [externalName, setExternalName] = useState('');
    const [labels, setLabels] = useState<KeyValueItem[]>([]);
    const [ports, setPorts] = useState<TraitServicePort[]>([{ port: 80 }]);
    const [isTypeOpen, setIsTypeOpen] = useState(false);

    const isEditMode = !!initialData;

    // Populate form when initialData changes (edit mode)
    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
        if (initialData) {
            setName(initialData.name || '');
            setServiceType(initialData.type || 'internal');
            setHeadless(initialData.headless || false);
            setSelector(recordToItems(initialData.selector));
            setExternalName(initialData.externalName || '');
            setLabels(recordToItems(initialData.labels));
            setPorts(initialData.ports.length > 0 ? initialData.ports : [{ port: 80 }]);
        } else {
            setName('');
            setServiceType('internal');
            setHeadless(false);
            setSelector([]);
            setExternalName('');
            setLabels([]);
            setPorts([{ port: 80 }]);
        }
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [initialData]);

    const handleSubmit = () => {
        if (ports.length === 0) return;
        if (serviceType === 'external' && !externalName.trim()) return;

        const serviceData: TraitServiceSpec = {
            ...(name.trim() && { name: name.trim() }),
            type: serviceType,
            ...(serviceType === 'internal' && headless && { headless: true }),
            ...(serviceType !== 'external' && { selector: itemsToRecord(selector) }),
            ...(serviceType === 'external' && { externalName: externalName.trim() }),
            ...(itemsToRecord(labels) && { labels: itemsToRecord(labels) }),
            ports: ports.filter(p => p.port > 0),
        };

        if (isEditMode && onUpdate) {
            onUpdate(serviceData);
        } else {
            onAdd(serviceData);
        }
    };

    const addPort = () => {
        setPorts([...ports, { port: 0 }]);
    };

    const removePort = (index: number) => {
        setPorts(ports.filter((_, i) => i !== index));
    };

    const updatePort = (index: number, field: keyof TraitServicePort, value: string | number) => {
        const updated = [...ports];
        updated[index] = { ...updated[index], [field]: value };
        setPorts(updated);
    };

    const addKeyValue = (setter: React.Dispatch<React.SetStateAction<KeyValueItem[]>>) => {
        setter(prev => [...prev, { key: '', value: '' }]);
    };

    const updateKeyValue = (
        setter: React.Dispatch<React.SetStateAction<KeyValueItem[]>>,
        index: number,
        field: 'key' | 'value',
        value: string
    ) => {
        setter(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const removeKeyValue = (setter: React.Dispatch<React.SetStateAction<KeyValueItem[]>>, index: number) => {
        setter(prev => prev.filter((_, i) => i !== index));
    };

    const isValid = ports.filter(p => p.port > 0).length > 0 &&
        (serviceType !== 'external' || externalName.trim().length > 0);

    return (
        <>
            <style>{gradientBorderStyle}</style>
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-components-panel-border">
                    <span className="text-[15px] font-semibold text-text-primary">
                        {isEditMode ? 'Edit Service' : 'Add Service'}
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
                    {/* Name */}
                    <div>
                        <label className="text-[13px] font-medium text-text-primary mb-2 block">
                            Name <span className="text-text-tertiary">(optional)</span>
                        </label>
                        <input
                            type="text"
                            className={INPUT_STYLES}
                            placeholder="e.g. my-svc (defaults to component name)"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="text-[13px] font-medium text-text-primary mb-2 block">
                            Type
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
                                    <span>{SERVICE_TYPES.find(t => t.value === serviceType)?.label || serviceType}</span>
                                    <ChevronDown className="h-4 w-4 text-text-tertiary shrink-0" />
                                </button>
                            </PortalToFollowElemTrigger>
                            <PortalToFollowElemContent className="w-[320px] p-1 bg-white border border-components-panel-border shadow-lg rounded-lg z-[100]">
                                <div className="flex flex-col gap-0.5">
                                    {SERVICE_TYPES.map((type) => {
                                        const isSelected = serviceType === type.value;
                                        return (
                                            <div
                                                key={type.value}
                                                className={cn(
                                                    "flex items-center gap-2.5 p-2.5 rounded-md cursor-pointer transition-colors",
                                                    isSelected ? "bg-state-accent-active" : "hover:bg-state-base-hover"
                                                )}
                                                onClick={() => {
                                                    setServiceType(type.value);
                                                    setIsTypeOpen(false);
                                                    // Reset headless if switching away from internal
                                                    if (type.value !== 'internal') setHeadless(false);
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

                    {/* Headless (only for internal type) */}
                    {serviceType === 'internal' && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[13px] font-medium text-text-primary">
                                    Headless
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setHeadless(!headless)}
                                    className={cn(
                                        "relative w-9 h-5 rounded-full transition-colors",
                                        headless ? "bg-blue-500" : "bg-gray-300"
                                    )}
                                >
                                    <span className={cn(
                                        "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm",
                                        headless && "translate-x-4"
                                    )} />
                                </button>
                            </div>
                            {headless && (
                                <p className="text-xs text-text-tertiary bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                                    Sets <code className="text-[11px] bg-blue-100 px-1 rounded">ClusterIP: None</code>. No load-balancing proxy is allocated. Useful for StatefulSet DNS resolution and direct pod addressing.
                                </p>
                            )}
                        </div>
                    )}

                    {/* External Name (only for external type) */}
                    {serviceType === 'external' && (
                        <div>
                            <label className="text-[13px] font-medium text-text-primary mb-2 block">
                                External Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className={INPUT_STYLES}
                                placeholder="e.g. my.external.database.example.com"
                                value={externalName}
                                onChange={(e) => setExternalName(e.target.value)}
                            />
                            <p className="mt-1 text-xs text-text-tertiary">
                                The external DNS name this service should point to
                            </p>
                        </div>
                    )}

                    {/* Selector (not for external type) */}
                    {serviceType !== 'external' && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[13px] font-medium text-text-primary">
                                    Selector
                                </label>
                                <button
                                    type="button"
                                    onClick={() => addKeyValue(setSelector)}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                >
                                    <Plus size={12} /> Add
                                </button>
                            </div>
                            {selector.length > 0 && (
                                <div className="space-y-2">
                                    {selector.map((item, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                className={cn(INPUT_STYLES, "flex-1")}
                                                placeholder="key"
                                                value={item.key}
                                                onChange={(e) => updateKeyValue(setSelector, index, 'key', e.target.value)}
                                            />
                                            <span className="text-text-tertiary text-xs">=</span>
                                            <input
                                                type="text"
                                                className={cn(INPUT_STYLES, "flex-1")}
                                                placeholder="value"
                                                value={item.value}
                                                onChange={(e) => updateKeyValue(setSelector, index, 'value', e.target.value)}
                                            />
                                            <button
                                                onClick={() => removeKeyValue(setSelector, index)}
                                                className="text-text-tertiary hover:text-red-500 transition-colors shrink-0"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Labels (optional) */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[13px] font-medium text-text-primary">
                                Labels <span className="text-text-tertiary text-xs">(optional)</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => addKeyValue(setLabels)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                            >
                                <Plus size={12} /> Add
                            </button>
                        </div>
                        {labels.length > 0 && (
                            <div className="space-y-2">
                                {labels.map((item, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            className={cn(INPUT_STYLES, "flex-1")}
                                            placeholder="key"
                                            value={item.key}
                                            onChange={(e) => updateKeyValue(setLabels, index, 'key', e.target.value)}
                                        />
                                        <span className="text-text-tertiary text-xs">=</span>
                                        <input
                                            type="text"
                                            className={cn(INPUT_STYLES, "flex-1")}
                                            placeholder="value"
                                            value={item.value}
                                            onChange={(e) => updateKeyValue(setLabels, index, 'value', e.target.value)}
                                        />
                                        <button
                                            onClick={() => removeKeyValue(setLabels, index)}
                                            className="text-text-tertiary hover:text-red-500 transition-colors shrink-0"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Ports */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[13px] font-medium text-text-primary">
                                Ports <span className="text-red-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={addPort}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                            >
                                <Plus size={12} /> Add Port
                            </button>
                        </div>
                        <div className="space-y-3">
                            {ports.map((port, index) => (
                                <div key={index} className="p-3 rounded-lg border border-components-panel-border bg-gray-50/50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wide">
                                            Port #{index + 1}
                                        </span>
                                        {ports.length > 1 && (
                                            <button
                                                onClick={() => removePort(index)}
                                                className="text-text-tertiary hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[11px] text-text-tertiary mb-1 block">Port *</label>
                                            <input
                                                type="number"
                                                className={INPUT_STYLES}
                                                placeholder="80"
                                                value={port.port || ''}
                                                onChange={(e) => updatePort(index, 'port', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] text-text-tertiary mb-1 block">Target Port</label>
                                            <input
                                                type="number"
                                                className={INPUT_STYLES}
                                                placeholder="Same as port"
                                                value={port.targetPort || ''}
                                                onChange={(e) => updatePort(index, 'targetPort', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] text-text-tertiary mb-1 block">Protocol</label>
                                            <select
                                                className={cn(INPUT_STYLES, "cursor-pointer")}
                                                value={port.protocol || 'TCP'}
                                                onChange={(e) => updatePort(index, 'protocol', e.target.value)}
                                            >
                                                {PROTOCOLS.map(p => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[11px] text-text-tertiary mb-1 block">Name</label>
                                            <input
                                                type="text"
                                                className={INPUT_STYLES}
                                                placeholder="e.g. http"
                                                value={port.name || ''}
                                                onChange={(e) => updatePort(index, 'name', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
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

export default TraitsServicePanel;
