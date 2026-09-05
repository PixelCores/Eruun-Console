import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, X, Settings } from 'lucide-react';
import type { TraitRbac, TraitRbacRule } from '../../types/flow';

interface TraitsRbacManagerProps {
    rbac: TraitRbac[];
    onChange: (rbac: TraitRbac[]) => void;
}

interface LabelItem {
    key: string;
    value: string;
}

const TraitsRbacManager: React.FC<TraitsRbacManagerProps> = ({ rbac, onChange }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    // Form State
    const [serviceAccount, setServiceAccount] = useState('');
    const [roleName, setRoleName] = useState('');
    const [bindingName, setBindingName] = useState('');
    const [rules, setRules] = useState<TraitRbacRule[]>([{ apiGroups: [''], resources: [''], verbs: [''] }]);
    const [roleLabels, setRoleLabels] = useState<LabelItem[]>([]);

    // Collapsed sections state
    const [showRoleLabels, setShowRoleLabels] = useState(false);

    const resetForm = () => {
        setServiceAccount('');
        setRoleName('');
        setBindingName('');
        setRules([{ apiGroups: [''], resources: [''], verbs: [''] }]);
        setRoleLabels([]);
        setShowRoleLabels(false);
        setIsAdding(false);
        setEditingIndex(null);
    };

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

    const handleSave = () => {
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

        const newRbac: TraitRbac = {
            serviceAccount,
            roleName,
            bindingName,
            rules: filteredRules.length > 0 ? filteredRules : [{ apiGroups: [''], resources: [''], verbs: ['get'] }],
            roleLabels: labelsToRecord(roleLabels),
        };

        if (editingIndex !== null) {
            const newRbacList = [...rbac];
            newRbacList[editingIndex] = newRbac;
            onChange(newRbacList);
        } else {
            onChange([...rbac, newRbac]);
        }
        resetForm();
    };

    const handleEdit = (index: number) => {
        const item = rbac[index];
        setServiceAccount(item.serviceAccount);
        setRoleName(item.roleName);
        setBindingName(item.bindingName);
        setRules(item.rules.length > 0 ? item.rules : [{ apiGroups: [''], resources: [''], verbs: [''] }]);
        setRoleLabels(recordToLabels(item.roleLabels));
        setShowRoleLabels(!!item.roleLabels && Object.keys(item.roleLabels).length > 0);
        setEditingIndex(index);
        setIsAdding(true);
    };

    const handleDelete = (index: number) => {
        onChange(rbac.filter((_, i) => i !== index));
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
        // Split by comma and trim whitespace
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
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-state-accent-solid/10 text-state-accent-solid">
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
                                className="flex-1 px-2 py-1 text-xs border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                            />
                            <input
                                type="text"
                                value={label.value}
                                onChange={(e) => updateLabel(setter, idx, 'value', e.target.value)}
                                placeholder="Value"
                                className="flex-1 px-2 py-1 text-xs border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => removeLabel(setter, idx)}
                                className="p-1 text-text-tertiary hover:text-state-destructive-solid rounded"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => addLabel(setter)}
                        className="flex items-center gap-1 text-xs text-state-accent-solid hover:text-state-accent-active"
                    >
                        <Plus size={12} />
                        Add Label
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-3">
            {!isAdding ? (
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 text-sm text-state-accent-solid hover:text-state-accent-active font-medium"
                >
                    <Plus size={16} />
                    Add RBAC
                </button>
            ) : (
                <div className="p-3 border border-components-panel-border rounded-lg bg-components-badge-bg-dimm space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                            {editingIndex !== null ? 'Edit RBAC' : 'New RBAC'}
                        </span>
                        <button onClick={resetForm} className="text-text-tertiary hover:text-text-primary">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {/* Basic Fields */}
                        <div className="grid grid-cols-1 gap-2">
                            <div>
                                <label className="text-xs text-text-tertiary mb-1 block">Service Account *</label>
                                <input
                                    type="text"
                                    value={serviceAccount}
                                    onChange={(e) => setServiceAccount(e.target.value)}
                                    placeholder="e.g. pod-labeler-sa"
                                    className="w-full px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-text-tertiary mb-1 block">Role Name *</label>
                                <input
                                    type="text"
                                    value={roleName}
                                    onChange={(e) => setRoleName(e.target.value)}
                                    placeholder="e.g. pod-labeler-role"
                                    className="w-full px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-text-tertiary mb-1 block">Binding Name *</label>
                                <input
                                    type="text"
                                    value={bindingName}
                                    onChange={(e) => setBindingName(e.target.value)}
                                    placeholder="e.g. pod-labeler-binding"
                                    className="w-full px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                                />
                            </div>
                        </div>

                        {/* Rules Section */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs text-text-tertiary">Rules</label>
                                <button
                                    type="button"
                                    onClick={addRule}
                                    className="flex items-center gap-1 text-xs text-state-accent-solid hover:text-state-accent-active"
                                >
                                    <Plus size={12} />
                                    Add Rule
                                </button>
                            </div>
                            <div className="space-y-2">
                                {rules.map((rule, idx) => (
                                    <div key={idx} className="p-2 border border-components-panel-border rounded-lg bg-white space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-text-secondary">Rule {idx + 1}</span>
                                            {rules.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeRule(idx)}
                                                    className="p-1 text-text-tertiary hover:text-state-destructive-solid rounded"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-text-tertiary mb-0.5 block">API Groups (comma-separated)</label>
                                            <input
                                                type="text"
                                                value={rule.apiGroups.join(', ')}
                                                onChange={(e) => updateRule(idx, 'apiGroups', e.target.value)}
                                                placeholder='e.g. "", apps, batch'
                                                className="w-full px-2 py-1 text-xs border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-text-tertiary mb-0.5 block">Resources (comma-separated)</label>
                                            <input
                                                type="text"
                                                value={rule.resources.join(', ')}
                                                onChange={(e) => updateRule(idx, 'resources', e.target.value)}
                                                placeholder="e.g. pods, pods/log, deployments"
                                                className="w-full px-2 py-1 text-xs border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-text-tertiary mb-0.5 block">Verbs (comma-separated)</label>
                                            <input
                                                type="text"
                                                value={rule.verbs.join(', ')}
                                                onChange={(e) => updateRule(idx, 'verbs', e.target.value)}
                                                placeholder="e.g. get, list, watch, patch"
                                                className="w-full px-2 py-1 text-xs border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Role Labels Section */}
                        <div className="space-y-2">
                            {renderLabelEditor(
                                'Role Labels',
                                roleLabels,
                                setRoleLabels,
                                showRoleLabels,
                                setShowRoleLabels
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={resetForm}
                                className="px-3 py-1.5 text-xs text-text-secondary hover:bg-state-base-hover rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!serviceAccount || !roleName || !bindingName}
                                className="px-3 py-1.5 text-xs bg-state-accent-solid text-white rounded hover:bg-state-accent-active disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {editingIndex !== null ? 'Update' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* RBAC List */}
            <div className="space-y-2">
                {rbac.map((item, index) => (
                    <div key={index} className="border border-components-panel-border rounded-lg bg-white overflow-hidden">
                        <div
                            className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50"
                            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-text-primary truncate">
                                        {item.serviceAccount}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                        {item.rules.length} rule{item.rules.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="text-xs text-text-tertiary truncate">
                                    Role: {item.roleName}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(index);
                                    }}
                                    className="p-1 text-text-tertiary hover:text-state-accent-solid rounded"
                                >
                                    <Settings size={14} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(index);
                                    }}
                                    className="p-1 text-text-tertiary hover:text-state-destructive-solid rounded"
                                >
                                    <Trash2 size={14} />
                                </button>
                                {expandedIndex === index ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </div>
                        </div>
                        {expandedIndex === index && (
                            <div className="px-3 pb-3 pt-1 border-t border-components-panel-border bg-gray-50 space-y-2">
                                <div className="text-xs">
                                    <span className="text-text-tertiary">Binding: </span>
                                    <span className="text-text-secondary">{item.bindingName}</span>
                                </div>
                                {item.rules.map((rule, ruleIdx) => (
                                    <div key={ruleIdx} className="text-xs p-2 bg-white rounded border border-components-panel-border">
                                        <div className="font-medium text-text-secondary mb-1">Rule {ruleIdx + 1}</div>
                                        <div className="grid grid-cols-3 gap-2 text-[10px]">
                                            <div>
                                                <span className="text-text-tertiary">apiGroups: </span>
                                                <span className="text-text-primary">{rule.apiGroups.join(', ') || '""'}</span>
                                            </div>
                                            <div>
                                                <span className="text-text-tertiary">resources: </span>
                                                <span className="text-text-primary">{rule.resources.join(', ')}</span>
                                            </div>
                                            <div>
                                                <span className="text-text-tertiary">verbs: </span>
                                                <span className="text-text-primary">{rule.verbs.join(', ')}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {item.roleLabels && Object.keys(item.roleLabels).length > 0 && (
                                    <div className="text-xs">
                                        <span className="text-text-tertiary">Role Labels: </span>
                                        <span className="text-text-secondary">
                                            {Object.entries(item.roleLabels).map(([k, v]) => `${k}=${v}`).join(', ')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TraitsRbacManager;
