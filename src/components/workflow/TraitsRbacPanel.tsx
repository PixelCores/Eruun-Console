import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import type { TraitRbac, TraitRbacRule } from '../../types/flow';

interface TraitsRbacPanelProps {
    onClose: () => void;
    onAdd: (rbac: TraitRbac) => void;
    initialData?: TraitRbac;
    onUpdate?: (rbac: TraitRbac) => void;
}

interface LabelItem {
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

const TraitsRbacPanel: React.FC<TraitsRbacPanelProps> = ({ onClose, onAdd, initialData, onUpdate }) => {
    const [serviceAccount, setServiceAccount] = useState('');
    const [roleName, setRoleName] = useState('');
    const [bindingName, setBindingName] = useState('');
    const [rules, setRules] = useState<TraitRbacRule[]>([{ apiGroups: [''], resources: [''], verbs: [''] }]);
    const [roleLabels, setRoleLabels] = useState<LabelItem[]>([]);

    // Collapsed sections state
    const [showRoleLabels, setShowRoleLabels] = useState(false);

    const isEditMode = !!initialData;

    const labelsToRecord = (labels: LabelItem[]): Record<string, string> | undefined => {
        if (labels.length === 0) return undefined;
        const record: Record<string, string> = {};
        labels.forEach(l => {
            if (l.key.trim()) {
                record[l.key.trim()] = l.value;
            }
        });
        return Object.keys(record).length > 0 ? record : undefined;
    };

    const recordToLabels = (record?: Record<string, string>): LabelItem[] => {
        if (!record) return [];
        return Object.entries(record).map(([key, value]) => ({ key, value }));
    };

    // Populate form when initialData changes (edit mode)
    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
        if (initialData) {
            setServiceAccount(initialData.serviceAccount || '');
            setRoleName(initialData.roleName || '');
            setBindingName(initialData.bindingName || '');
            setRules(initialData.rules.length > 0 ? initialData.rules : [{ apiGroups: [''], resources: [''], verbs: [''] }]);
            setRoleLabels(recordToLabels(initialData.roleLabels));
            setShowRoleLabels(!!initialData.roleLabels && Object.keys(initialData.roleLabels).length > 0);
        } else {
            setServiceAccount('');
            setRoleName('');
            setBindingName('');
            setRules([{ apiGroups: [''], resources: [''], verbs: [''] }]);
            setRoleLabels([]);
            setShowRoleLabels(false);
        }
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [initialData]);

    const handleSubmit = () => {
        if (!serviceAccount || !roleName || !bindingName) return;

        // Filter out empty rules
        const filteredRules = rules.filter(r =>
            r.apiGroups.some(g => g.trim()) ||
            r.resources.some(res => res.trim()) ||
            r.verbs.some(v => v.trim())
        ).map(r => ({
            apiGroups: r.apiGroups.filter(g => g.trim() !== ''),
            resources: r.resources.filter(res => res.trim() !== ''),
            verbs: r.verbs.filter(v => v.trim() !== ''),
        }));

        const rbacData: TraitRbac = {
            serviceAccount,
            roleName,
            bindingName,
            rules: filteredRules.length > 0 ? filteredRules : [{ apiGroups: [''], resources: [''], verbs: ['get'] }],
            roleLabels: labelsToRecord(roleLabels),
        };

        if (isEditMode && onUpdate) {
            onUpdate(rbacData);
        } else {
            onAdd(rbacData);
        }
    };

    // Rule management
    const addRule = () => {
        setRules([...rules, { apiGroups: [''], resources: [''], verbs: [''] }]);
    };

    const removeRule = (index: number) => {
        if (rules.length > 1) {
            setRules(rules.filter((_, i) => i !== index));
        }
    };

    const updateRule = (index: number, field: keyof TraitRbacRule, value: string) => {
        const newRules = [...rules];
        newRules[index] = {
            ...newRules[index],
            [field]: value.split(',').map(v => v.trim()),
        };
        setRules(newRules);
    };

    // Label management
    const addLabel = (setter: React.Dispatch<React.SetStateAction<LabelItem[]>>) => {
        setter(prev => [...prev, { key: '', value: '' }]);
    };

    const removeLabel = (setter: React.Dispatch<React.SetStateAction<LabelItem[]>>, index: number) => {
        setter(prev => prev.filter((_, i) => i !== index));
    };

    const updateLabel = (
        setter: React.Dispatch<React.SetStateAction<LabelItem[]>>,
        index: number,
        field: 'key' | 'value',
        value: string
    ) => {
        setter(prev => {
            const newLabels = [...prev];
            newLabels[index] = { ...newLabels[index], [field]: value };
            return newLabels;
        });
    };

    const renderLabelEditor = (
        title: string,
        labels: LabelItem[],
        setter: React.Dispatch<React.SetStateAction<LabelItem[]>>,
        isExpanded: boolean,
        setExpanded: React.Dispatch<React.SetStateAction<boolean>>
    ) => (
        <div className="border border-components-panel-border rounded-lg overflow-hidden">
            <button
                type="button"
                onClick={() => setExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
                <span className="text-xs font-medium text-text-secondary">{title}</span>
                <div className="flex items-center gap-2">
                    {labels.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700">
                            {labels.length}
                        </span>
                    )}
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
            </button>
            {isExpanded && (
                <div className="p-3 space-y-2 bg-white">
                    {labels.map((label, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={label.key}
                                onChange={(e) => updateLabel(setter, idx, 'key', e.target.value)}
                                placeholder="Key"
                                className="flex-1 px-2 py-1.5 text-xs border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                            />
                            <input
                                type="text"
                                value={label.value}
                                onChange={(e) => updateLabel(setter, idx, 'value', e.target.value)}
                                placeholder="Value"
                                className="flex-1 px-2 py-1.5 text-xs border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => removeLabel(setter, idx)}
                                className="p-1 text-text-tertiary hover:text-red-500 rounded"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => addLabel(setter)}
                        className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-700"
                    >
                        <Plus size={12} />
                        Add Label
                    </button>
                </div>
            )}
        </div>
    );

    const isValid = serviceAccount && roleName && bindingName;

    return (
        <>
            <style>{gradientBorderStyle}</style>
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-components-panel-border">
                    <span className="text-[15px] font-semibold text-text-primary">
                        {isEditMode ? 'Edit Traits RBAC' : 'Add Traits RBAC'}
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
                    {/* Service Account */}
                    <div>
                        <label className="text-[13px] font-medium text-text-primary mb-2 block">
                            Service Account <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            className={INPUT_STYLES}
                            placeholder="e.g. pod-labeler-sa"
                            value={serviceAccount}
                            onChange={(e) => setServiceAccount(e.target.value)}
                        />
                        <p className="mt-1 text-xs text-text-tertiary">
                            Name of the ServiceAccount to create
                        </p>
                    </div>

                    {/* Role Name */}
                    <div>
                        <label className="text-[13px] font-medium text-text-primary mb-2 block">
                            Role Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            className={INPUT_STYLES}
                            placeholder="e.g. pod-labeler-role"
                            value={roleName}
                            onChange={(e) => setRoleName(e.target.value)}
                        />
                        <p className="mt-1 text-xs text-text-tertiary">
                            Name of the Role to create
                        </p>
                    </div>

                    {/* Binding Name */}
                    <div>
                        <label className="text-[13px] font-medium text-text-primary mb-2 block">
                            Binding Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            className={INPUT_STYLES}
                            placeholder="e.g. pod-labeler-binding"
                            value={bindingName}
                            onChange={(e) => setBindingName(e.target.value)}
                        />
                        <p className="mt-1 text-xs text-text-tertiary">
                            Name of the RoleBinding to create
                        </p>
                    </div>

                    {/* Rules Section */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[13px] font-medium text-text-primary">Rules</label>
                            <button
                                type="button"
                                onClick={addRule}
                                className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-700"
                            >
                                <Plus size={12} />
                                Add Rule
                            </button>
                        </div>
                        <div className="space-y-3">
                            {rules.map((rule, idx) => (
                                <div key={idx} className="p-3 border border-components-panel-border rounded-lg bg-gray-50/50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-text-secondary">Rule {idx + 1}</span>
                                        {rules.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeRule(idx)}
                                                className="p-1 text-text-tertiary hover:text-red-500 rounded"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-[11px] text-text-tertiary mb-1 block">API Groups (comma-separated)</label>
                                        <input
                                            type="text"
                                            value={rule.apiGroups.join(', ')}
                                            onChange={(e) => updateRule(idx, 'apiGroups', e.target.value)}
                                            placeholder='e.g. "", apps, batch'
                                            className="w-full px-2 py-1.5 text-xs border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] text-text-tertiary mb-1 block">Resources (comma-separated)</label>
                                        <input
                                            type="text"
                                            value={rule.resources.join(', ')}
                                            onChange={(e) => updateRule(idx, 'resources', e.target.value)}
                                            placeholder="e.g. pods, pods/log, deployments"
                                            className="w-full px-2 py-1.5 text-xs border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] text-text-tertiary mb-1 block">Verbs (comma-separated)</label>
                                        <input
                                            type="text"
                                            value={rule.verbs.join(', ')}
                                            onChange={(e) => updateRule(idx, 'verbs', e.target.value)}
                                            placeholder="e.g. get, list, watch, patch"
                                            className="w-full px-2 py-1.5 text-xs border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Role Labels Section */}
                    <div className="space-y-2">
                        <label className="text-[13px] font-medium text-text-primary block">Labels (optional)</label>
                        {renderLabelEditor(
                            'Role Labels',
                            roleLabels,
                            setRoleLabels,
                            showRoleLabels,
                            setShowRoleLabels
                        )}
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

export default TraitsRbacPanel;
