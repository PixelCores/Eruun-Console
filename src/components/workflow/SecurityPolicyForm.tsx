import React from 'react';
import { X } from 'lucide-react';
import type { TraitSecurityPolicy } from '../../types/flow';
import Switch from '../base/switch';

interface SecurityPolicyFormProps {
    policy: TraitSecurityPolicy | null;
    onChange: (policy: TraitSecurityPolicy | null) => void;
}

const SMALL_INPUT_STYLES = 'px-2 py-1.5 text-xs border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none';

const SecurityPolicyForm: React.FC<SecurityPolicyFormProps> = ({ policy, onChange }) => {
    const [enabled, setEnabled] = React.useState(!!policy);
    const [privileged, setPrivileged] = React.useState(policy?.privileged ?? false);
    const [runAsUser, setRunAsUser] = React.useState(policy?.runAsUser?.toString() ?? '');
    const [runAsGroup, setRunAsGroup] = React.useState(policy?.runAsGroup?.toString() ?? '');
    const [runAsNonRoot, setRunAsNonRoot] = React.useState(policy?.runAsNonRoot ?? false);
    const [readOnlyRootFilesystem, setReadOnlyRootFilesystem] = React.useState(policy?.readOnlyRootFilesystem ?? false);
    const [allowPrivilegeEscalation, setAllowPrivilegeEscalation] = React.useState(policy?.allowPrivilegeEscalation ?? true);
    const [capAddInput, setCapAddInput] = React.useState('');
    const [capDropInput, setCapDropInput] = React.useState('');
    const [capabilitiesAdd, setCapabilitiesAdd] = React.useState<string[]>(policy?.capabilities?.add ?? []);
    const [capabilitiesDrop, setCapabilitiesDrop] = React.useState<string[]>(policy?.capabilities?.drop ?? []);

    // Sync state when policy changes
    React.useEffect(() => {
        setEnabled(!!policy);
        setPrivileged(policy?.privileged ?? false);
        setRunAsUser(policy?.runAsUser?.toString() ?? '');
        setRunAsGroup(policy?.runAsGroup?.toString() ?? '');
        setRunAsNonRoot(policy?.runAsNonRoot ?? false);
        setReadOnlyRootFilesystem(policy?.readOnlyRootFilesystem ?? false);
        setAllowPrivilegeEscalation(policy?.allowPrivilegeEscalation ?? true);
        setCapabilitiesAdd(policy?.capabilities?.add ?? []);
        setCapabilitiesDrop(policy?.capabilities?.drop ?? []);
    }, [policy]);

    const buildPolicy = (): TraitSecurityPolicy | null => {
        if (!enabled) return null;

        const hasCapabilities = capabilitiesAdd.length > 0 || capabilitiesDrop.length > 0;

        return {
            name: 'container-security',
            ...(hasCapabilities && {
                capabilities: {
                    ...(capabilitiesAdd.length > 0 && { add: capabilitiesAdd }),
                    ...(capabilitiesDrop.length > 0 && { drop: capabilitiesDrop }),
                }
            }),
            ...(privileged && { privileged }),
            ...(runAsUser && { runAsUser: parseInt(runAsUser, 10) }),
            ...(runAsGroup && { runAsGroup: parseInt(runAsGroup, 10) }),
            ...(runAsNonRoot && { runAsNonRoot }),
            ...(readOnlyRootFilesystem && { readOnlyRootFilesystem }),
            ...(!allowPrivilegeEscalation && { allowPrivilegeEscalation: false }),
        };
    };

    const handleEnabledChange = (checked: boolean) => {
        setEnabled(checked);
        if (!checked) {
            onChange(null);
        } else {
            onChange(buildPolicy());
        }
    };

    const handleFieldChange = () => {
        if (enabled) {
            // Use setTimeout to ensure state is updated
            setTimeout(() => {
                onChange(buildPolicy());
            }, 0);
        }
    };

    const handleAddCapability = (type: 'add' | 'drop') => {
        if (type === 'add' && capAddInput.trim()) {
            const newCaps = [...capabilitiesAdd, capAddInput.trim().toUpperCase()];
            setCapabilitiesAdd(newCaps);
            setCapAddInput('');
            if (enabled) {
                onChange({
                    ...buildPolicy()!,
                    capabilities: {
                        add: newCaps.length > 0 ? newCaps : undefined,
                        drop: capabilitiesDrop.length > 0 ? capabilitiesDrop : undefined,
                    }
                });
            }
        } else if (type === 'drop' && capDropInput.trim()) {
            const newCaps = [...capabilitiesDrop, capDropInput.trim().toUpperCase()];
            setCapabilitiesDrop(newCaps);
            setCapDropInput('');
            if (enabled) {
                onChange({
                    ...buildPolicy()!,
                    capabilities: {
                        add: capabilitiesAdd.length > 0 ? capabilitiesAdd : undefined,
                        drop: newCaps.length > 0 ? newCaps : undefined,
                    }
                });
            }
        }
    };

    const handleRemoveCapability = (type: 'add' | 'drop', index: number) => {
        if (type === 'add') {
            const newCaps = capabilitiesAdd.filter((_, i) => i !== index);
            setCapabilitiesAdd(newCaps);
            if (enabled) {
                onChange({
                    ...buildPolicy()!,
                    capabilities: {
                        add: newCaps.length > 0 ? newCaps : undefined,
                        drop: capabilitiesDrop.length > 0 ? capabilitiesDrop : undefined,
                    }
                });
            }
        } else {
            const newCaps = capabilitiesDrop.filter((_, i) => i !== index);
            setCapabilitiesDrop(newCaps);
            if (enabled) {
                onChange({
                    ...buildPolicy()!,
                    capabilities: {
                        add: capabilitiesAdd.length > 0 ? capabilitiesAdd : undefined,
                        drop: newCaps.length > 0 ? newCaps : undefined,
                    }
                });
            }
        }
    };

    return (
        <div className="border border-components-panel-border rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
                <label className="text-[13px] font-medium text-text-primary">
                    Security Policy
                </label>
                <Switch checked={enabled} onChange={handleEnabledChange} size="md" />
            </div>

            {enabled && (
                <div className="space-y-3">
                    {/* Privileged */}
                    <div className="flex items-center justify-between">
                        <label className="text-[12px] font-medium text-text-secondary">Privileged</label>
                        <Switch
                            checked={privileged}
                            onChange={(v) => { setPrivileged(v); handleFieldChange(); }}
                            size="sm"
                        />
                    </div>

                    {/* RunAsUser & RunAsGroup */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[11px] font-medium text-text-tertiary mb-1 block">Run As User</label>
                            <input
                                type="number"
                                className={SMALL_INPUT_STYLES + ' w-full'}
                                placeholder="UID"
                                value={runAsUser}
                                onChange={(e) => { setRunAsUser(e.target.value); handleFieldChange(); }}
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-medium text-text-tertiary mb-1 block">Run As Group</label>
                            <input
                                type="number"
                                className={SMALL_INPUT_STYLES + ' w-full'}
                                placeholder="GID"
                                value={runAsGroup}
                                onChange={(e) => { setRunAsGroup(e.target.value); handleFieldChange(); }}
                            />
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[12px] font-medium text-text-secondary">Run As Non-Root</label>
                            <Switch
                                checked={runAsNonRoot}
                                onChange={(v) => { setRunAsNonRoot(v); handleFieldChange(); }}
                                size="sm"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-[12px] font-medium text-text-secondary">Read-Only Root FS</label>
                            <Switch
                                checked={readOnlyRootFilesystem}
                                onChange={(v) => { setReadOnlyRootFilesystem(v); handleFieldChange(); }}
                                size="sm"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-[12px] font-medium text-text-secondary">Allow Privilege Escalation</label>
                            <Switch
                                checked={allowPrivilegeEscalation}
                                onChange={(v) => { setAllowPrivilegeEscalation(v); handleFieldChange(); }}
                                size="sm"
                            />
                        </div>
                    </div>

                    {/* Capabilities Add */}
                    <div>
                        <label className="text-[11px] font-medium text-text-tertiary mb-1 block">Capabilities Add</label>
                        <div className="flex gap-1 mb-1">
                            <input
                                type="text"
                                className={SMALL_INPUT_STYLES + ' flex-1'}
                                placeholder="e.g. NET_ADMIN"
                                value={capAddInput}
                                onChange={(e) => setCapAddInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCapability('add'); } }}
                            />
                            <button
                                onClick={() => handleAddCapability('add')}
                                className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                                +
                            </button>
                        </div>
                        {capabilitiesAdd.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {capabilitiesAdd.map((cap, i) => (
                                    <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-green-50 text-green-700 rounded border border-green-200">
                                        {cap}
                                        <button onClick={() => handleRemoveCapability('add', i)} className="hover:text-green-900"><X size={10} /></button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Capabilities Drop */}
                    <div>
                        <label className="text-[11px] font-medium text-text-tertiary mb-1 block">Capabilities Drop</label>
                        <div className="flex gap-1 mb-1">
                            <input
                                type="text"
                                className={SMALL_INPUT_STYLES + ' flex-1'}
                                placeholder="e.g. ALL"
                                value={capDropInput}
                                onChange={(e) => setCapDropInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCapability('drop'); } }}
                            />
                            <button
                                onClick={() => handleAddCapability('drop')}
                                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                                +
                            </button>
                        </div>
                        {capabilitiesDrop.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {capabilitiesDrop.map((cap, i) => (
                                    <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-red-50 text-red-700 rounded border border-red-200">
                                        {cap}
                                        <button onClick={() => handleRemoveCapability('drop', i)} className="hover:text-red-900"><X size={10} /></button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecurityPolicyForm;
