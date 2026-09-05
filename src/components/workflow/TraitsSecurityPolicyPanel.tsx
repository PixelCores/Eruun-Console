import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useFlowStore } from '../../stores/flowStore';
import type {
    TraitSecurityPolicy,
    TraitCapabilities,
    TraitSELinuxOptions,
    TraitSeccompProfile,
    TraitAppArmorProfile,
} from '../../types/flow';
import Switch from '../base/switch';
import { cn } from '../../utils/cn';

interface TraitsSecurityPolicyPanelProps {
    onClose: () => void;
    onAdd: (policy: TraitSecurityPolicy) => void;
    initialData?: TraitSecurityPolicy;
    onUpdate?: (policy: TraitSecurityPolicy) => void;
}

const INPUT_STYLES =
    'w-full px-3 py-2 text-sm border border-components-panel-border rounded-lg bg-white input-gradient-focus focus:ring-0 outline-none transition-colors';

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

const TraitsSecurityPolicyPanel: React.FC<TraitsSecurityPolicyPanelProps> = ({
    onClose,
    onAdd,
    initialData,
    onUpdate,
}) => {
    const t = useTranslations('Workflow');
    const { selectedNodeId } = useFlowStore();
    const isEditMode = !!initialData;

    // Form state
    const [name, setName] = useState('');
    const [nameError, setNameError] = useState<string | null>(null);
    const [privileged, setPrivileged] = useState(false);
    const [runAsUser, setRunAsUser] = useState('');
    const [runAsGroup, setRunAsGroup] = useState('');
    const [runAsNonRoot, setRunAsNonRoot] = useState(false);
    const [readOnlyRootFilesystem, setReadOnlyRootFilesystem] = useState(false);
    const [allowPrivilegeEscalation, setAllowPrivilegeEscalation] = useState(true);
    const [procMount, setProcMount] = useState<'Default' | 'Unmasked'>('Default');

    // Capabilities
    const [capabilitiesAdd, setCapabilitiesAdd] = useState<string[]>([]);
    const [capabilitiesDrop, setCapabilitiesDrop] = useState<string[]>([]);
    const [capAddInput, setCapAddInput] = useState('');
    const [capDropInput, setCapDropInput] = useState('');

    // SELinux Options
    const [seLinuxEnabled, setSeLinuxEnabled] = useState(false);
    const [seLinuxLevel, setSeLinuxLevel] = useState('');
    const [seLinuxRole, setSeLinuxRole] = useState('');
    const [seLinuxType, setSeLinuxType] = useState('');
    const [seLinuxUser, setSeLinuxUser] = useState('');

    // Seccomp Profile
    const [seccompEnabled, setSeccompEnabled] = useState(false);
    const [seccompType, setSeccompType] = useState<'Unconfined' | 'RuntimeDefault' | 'Localhost'>('RuntimeDefault');
    const [seccompLocalhostProfile, setSeccompLocalhostProfile] = useState('');

    // AppArmor Profile
    const [appArmorEnabled, setAppArmorEnabled] = useState(false);
    const [appArmorType, setAppArmorType] = useState<'Unconfined' | 'RuntimeDefault' | 'Localhost'>('RuntimeDefault');
    const [appArmorLocalhostProfile, setAppArmorLocalhostProfile] = useState('');

    // Load initial data
    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setPrivileged(initialData.privileged ?? false);
            setRunAsUser(initialData.runAsUser?.toString() || '');
            setRunAsGroup(initialData.runAsGroup?.toString() || '');
            setRunAsNonRoot(initialData.runAsNonRoot ?? false);
            setReadOnlyRootFilesystem(initialData.readOnlyRootFilesystem ?? false);
            setAllowPrivilegeEscalation(initialData.allowPrivilegeEscalation ?? true);
            setProcMount(initialData.procMount || 'Default');

            // Capabilities
            setCapabilitiesAdd(initialData.capabilities?.add || []);
            setCapabilitiesDrop(initialData.capabilities?.drop || []);

            // SELinux
            if (initialData.seLinuxOptions) {
                setSeLinuxEnabled(true);
                setSeLinuxLevel(initialData.seLinuxOptions.level || '');
                setSeLinuxRole(initialData.seLinuxOptions.role || '');
                setSeLinuxType(initialData.seLinuxOptions.type || '');
                setSeLinuxUser(initialData.seLinuxOptions.user || '');
            }

            // Seccomp
            if (initialData.seccompProfile) {
                setSeccompEnabled(true);
                setSeccompType(initialData.seccompProfile.type);
                setSeccompLocalhostProfile(initialData.seccompProfile.localhostProfile || '');
            }

            // AppArmor
            if (initialData.appArmorProfile) {
                setAppArmorEnabled(true);
                setAppArmorType(initialData.appArmorProfile.type);
                setAppArmorLocalhostProfile(initialData.appArmorProfile.localhostProfile || '');
            }
        } else {
            // Reset form
            setName('');
            setPrivileged(false);
            setRunAsUser('');
            setRunAsGroup('');
            setRunAsNonRoot(false);
            setReadOnlyRootFilesystem(false);
            setAllowPrivilegeEscalation(true);
            setProcMount('Default');
            setCapabilitiesAdd([]);
            setCapabilitiesDrop([]);
            setSeLinuxEnabled(false);
            setSeLinuxLevel('');
            setSeLinuxRole('');
            setSeLinuxType('');
            setSeLinuxUser('');
            setSeccompEnabled(false);
            setSeccompType('RuntimeDefault');
            setSeccompLocalhostProfile('');
            setAppArmorEnabled(false);
            setAppArmorType('RuntimeDefault');
            setAppArmorLocalhostProfile('');
        }
        setNameError(null);
    }, [initialData, selectedNodeId]);

    const handleAddCapability = (type: 'add' | 'drop') => {
        if (type === 'add' && capAddInput.trim()) {
            setCapabilitiesAdd([...capabilitiesAdd, capAddInput.trim().toUpperCase()]);
            setCapAddInput('');
        } else if (type === 'drop' && capDropInput.trim()) {
            setCapabilitiesDrop([...capabilitiesDrop, capDropInput.trim().toUpperCase()]);
            setCapDropInput('');
        }
    };

    const handleRemoveCapability = (type: 'add' | 'drop', index: number) => {
        if (type === 'add') {
            setCapabilitiesAdd(capabilitiesAdd.filter((_, i) => i !== index));
        } else {
            setCapabilitiesDrop(capabilitiesDrop.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = () => {
        if (!name.trim()) {
            setNameError(t('policyNameRequired'));
            return;
        }

        // Build capabilities
        const capabilities: TraitCapabilities | undefined =
            (capabilitiesAdd.length > 0 || capabilitiesDrop.length > 0)
                ? {
                    add: capabilitiesAdd.length > 0 ? capabilitiesAdd : undefined,
                    drop: capabilitiesDrop.length > 0 ? capabilitiesDrop : undefined,
                }
                : undefined;

        // Build SELinux options
        const seLinuxOptions: TraitSELinuxOptions | undefined = seLinuxEnabled
            ? {
                level: seLinuxLevel.trim() || undefined,
                role: seLinuxRole.trim() || undefined,
                type: seLinuxType.trim() || undefined,
                user: seLinuxUser.trim() || undefined,
            }
            : undefined;

        // Build Seccomp Profile
        const seccompProfile: TraitSeccompProfile | undefined = seccompEnabled
            ? {
                type: seccompType,
                localhostProfile: seccompType === 'Localhost' ? seccompLocalhostProfile.trim() || undefined : undefined,
            }
            : undefined;

        // Build AppArmor Profile
        const appArmorProfile: TraitAppArmorProfile | undefined = appArmorEnabled
            ? {
                type: appArmorType,
                localhostProfile: appArmorType === 'Localhost' ? appArmorLocalhostProfile.trim() || undefined : undefined,
            }
            : undefined;

        const policyData: TraitSecurityPolicy = {
            name: name.trim(),
            capabilities,
            privileged: privileged || undefined,
            seLinuxOptions,
            runAsUser: runAsUser ? parseInt(runAsUser, 10) : undefined,
            runAsGroup: runAsGroup ? parseInt(runAsGroup, 10) : undefined,
            runAsNonRoot: runAsNonRoot || undefined,
            readOnlyRootFilesystem: readOnlyRootFilesystem || undefined,
            allowPrivilegeEscalation: allowPrivilegeEscalation === false ? false : undefined,
            procMount: procMount !== 'Default' ? procMount : undefined,
            seccompProfile,
            appArmorProfile,
        };

        if (isEditMode && onUpdate) {
            onUpdate(policyData);
        } else {
            onAdd(policyData);
        }
    };

    return (
        <>
            <style>{gradientBorderStyle}</style>
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-components-panel-border px-5 py-4">
                    <div className="text-[15px] font-semibold text-text-primary">
                        {isEditMode ? 'Edit Security Policy' : 'Add Security Policy'}
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X size={16} />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* Policy Name */}
                    <div>
                        <label className="text-[13px] font-medium text-text-primary mb-2 block">Policy Name *</label>
                        <input
                            type="text"
                            className={cn(
                                INPUT_STYLES,
                                nameError && 'border-red-300 focus:border-red-400'
                            )}
                            placeholder="e.g. restricted-policy"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (nameError) setNameError(null);
                            }}
                            aria-invalid={!!nameError}
                            aria-describedby={nameError ? 'security-policy-name-error' : undefined}
                        />
                        {nameError && (
                            <p id="security-policy-name-error" role="alert" className="mt-1 text-xs text-red-600">
                                {nameError}
                            </p>
                        )}
                    </div>

                    {/* Privileged */}
                    <div className="flex items-center justify-between">
                        <label className="text-[13px] font-medium text-text-primary">Privileged</label>
                        <Switch checked={privileged} onChange={setPrivileged} size="md" />
                    </div>

                    {/* RunAsUser */}
                    <div>
                        <label className="text-[13px] font-medium text-text-primary mb-2 block">Run As User (UID)</label>
                        <input
                            type="number"
                            className={INPUT_STYLES}
                            placeholder="e.g. 1000"
                            value={runAsUser}
                            onChange={(e) => setRunAsUser(e.target.value)}
                        />
                    </div>

                    {/* RunAsGroup */}
                    <div>
                        <label className="text-[13px] font-medium text-text-primary mb-2 block">Run As Group (GID)</label>
                        <input
                            type="number"
                            className={INPUT_STYLES}
                            placeholder="e.g. 1000"
                            value={runAsGroup}
                            onChange={(e) => setRunAsGroup(e.target.value)}
                        />
                    </div>

                    {/* RunAsNonRoot */}
                    <div className="flex items-center justify-between">
                        <label className="text-[13px] font-medium text-text-primary">Run As Non-Root</label>
                        <Switch checked={runAsNonRoot} onChange={setRunAsNonRoot} size="md" />
                    </div>

                    {/* ReadOnlyRootFilesystem */}
                    <div className="flex items-center justify-between">
                        <label className="text-[13px] font-medium text-text-primary">Read-Only Root Filesystem</label>
                        <Switch checked={readOnlyRootFilesystem} onChange={setReadOnlyRootFilesystem} size="md" />
                    </div>

                    {/* AllowPrivilegeEscalation */}
                    <div className="flex items-center justify-between">
                        <label className="text-[13px] font-medium text-text-primary">Allow Privilege Escalation</label>
                        <Switch checked={allowPrivilegeEscalation} onChange={setAllowPrivilegeEscalation} size="md" />
                    </div>

                    {/* ProcMount */}
                    <div>
                        <label className="text-[13px] font-medium text-text-primary mb-2 block">Proc Mount</label>
                        <select
                            className={INPUT_STYLES}
                            value={procMount}
                            onChange={(e) => setProcMount(e.target.value as 'Default' | 'Unmasked')}
                        >
                            <option value="Default">Default</option>
                            <option value="Unmasked">Unmasked</option>
                        </select>
                    </div>

                    {/* Capabilities Add */}
                    <div>
                        <label className="text-[13px] font-medium text-text-primary mb-2 block">Capabilities Add</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                className={INPUT_STYLES}
                                placeholder="e.g. NET_ADMIN"
                                value={capAddInput}
                                onChange={(e) => setCapAddInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddCapability('add');
                                    }
                                }}
                            />
                            <Button
                                variant="secondary"
                                size="small"
                                onClick={() => handleAddCapability('add')}
                                className="shrink-0"
                            >
                                Add
                            </Button>
                        </div>
                        {capabilitiesAdd.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {capabilitiesAdd.map((cap, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-md border border-green-200"
                                    >
                                        {cap}
                                        <button
                                            onClick={() => handleRemoveCapability('add', index)}
                                            className="hover:text-green-900 transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Capabilities Drop */}
                    <div>
                        <label className="text-[13px] font-medium text-text-primary mb-2 block">Capabilities Drop</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                className={INPUT_STYLES}
                                placeholder="e.g. ALL"
                                value={capDropInput}
                                onChange={(e) => setCapDropInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddCapability('drop');
                                    }
                                }}
                            />
                            <Button
                                variant="secondary"
                                size="small"
                                onClick={() => handleAddCapability('drop')}
                                className="shrink-0"
                            >
                                Add
                            </Button>
                        </div>
                        {capabilitiesDrop.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {capabilitiesDrop.map((cap, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-50 text-red-700 rounded-md border border-red-200"
                                    >
                                        {cap}
                                        <button
                                            onClick={() => handleRemoveCapability('drop', index)}
                                            className="hover:text-red-900 transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SELinux Options */}
                    <div className="border-t border-components-panel-border pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-[13px] font-medium text-text-primary">SELinux Options</label>
                            <Switch checked={seLinuxEnabled} onChange={setSeLinuxEnabled} size="md" />
                        </div>
                        {seLinuxEnabled && (
                            <div className="space-y-3 p-3 rounded-lg border border-components-panel-border bg-gray-50/50">
                                <div>
                                    <label className="text-[12px] font-medium text-text-secondary mb-1 block">Level</label>
                                    <input
                                        type="text"
                                        className={INPUT_STYLES}
                                        placeholder="e.g. s0:c123,c456"
                                        value={seLinuxLevel}
                                        onChange={(e) => setSeLinuxLevel(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[12px] font-medium text-text-secondary mb-1 block">Role</label>
                                    <input
                                        type="text"
                                        className={INPUT_STYLES}
                                        placeholder="e.g. object_r"
                                        value={seLinuxRole}
                                        onChange={(e) => setSeLinuxRole(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[12px] font-medium text-text-secondary mb-1 block">Type</label>
                                    <input
                                        type="text"
                                        className={INPUT_STYLES}
                                        placeholder="e.g. svirt_sandbox_file_t"
                                        value={seLinuxType}
                                        onChange={(e) => setSeLinuxType(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[12px] font-medium text-text-secondary mb-1 block">User</label>
                                    <input
                                        type="text"
                                        className={INPUT_STYLES}
                                        placeholder="e.g. system_u"
                                        value={seLinuxUser}
                                        onChange={(e) => setSeLinuxUser(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Seccomp Profile */}
                    <div className="border-t border-components-panel-border pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-[13px] font-medium text-text-primary">Seccomp Profile</label>
                            <Switch checked={seccompEnabled} onChange={setSeccompEnabled} size="md" />
                        </div>
                        {seccompEnabled && (
                            <div className="space-y-3 p-3 rounded-lg border border-components-panel-border bg-gray-50/50">
                                <div>
                                    <label className="text-[12px] font-medium text-text-secondary mb-1 block">Type</label>
                                    <select
                                        className={INPUT_STYLES}
                                        value={seccompType}
                                        onChange={(e) => setSeccompType(e.target.value as 'Unconfined' | 'RuntimeDefault' | 'Localhost')}
                                    >
                                        <option value="RuntimeDefault">RuntimeDefault</option>
                                        <option value="Unconfined">Unconfined</option>
                                        <option value="Localhost">Localhost</option>
                                    </select>
                                </div>
                                {seccompType === 'Localhost' && (
                                    <div>
                                        <label className="text-[12px] font-medium text-text-secondary mb-1 block">Localhost Profile</label>
                                        <input
                                            type="text"
                                            className={INPUT_STYLES}
                                            placeholder="e.g. profiles/my-profile.json"
                                            value={seccompLocalhostProfile}
                                            onChange={(e) => setSeccompLocalhostProfile(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* AppArmor Profile */}
                    <div className="border-t border-components-panel-border pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-[13px] font-medium text-text-primary">AppArmor Profile</label>
                            <Switch checked={appArmorEnabled} onChange={setAppArmorEnabled} size="md" />
                        </div>
                        {appArmorEnabled && (
                            <div className="space-y-3 p-3 rounded-lg border border-components-panel-border bg-gray-50/50">
                                <div>
                                    <label className="text-[12px] font-medium text-text-secondary mb-1 block">Type</label>
                                    <select
                                        className={INPUT_STYLES}
                                        value={appArmorType}
                                        onChange={(e) => setAppArmorType(e.target.value as 'Unconfined' | 'RuntimeDefault' | 'Localhost')}
                                    >
                                        <option value="RuntimeDefault">RuntimeDefault</option>
                                        <option value="Unconfined">Unconfined</option>
                                        <option value="Localhost">Localhost</option>
                                    </select>
                                </div>
                                {appArmorType === 'Localhost' && (
                                    <div>
                                        <label className="text-[12px] font-medium text-text-secondary mb-1 block">Localhost Profile</label>
                                        <input
                                            type="text"
                                            className={INPUT_STYLES}
                                            placeholder="e.g. my-custom-profile"
                                            value={appArmorLocalhostProfile}
                                            onChange={(e) => setAppArmorLocalhostProfile(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-components-panel-border px-5 py-4 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                        {isEditMode ? 'Update Policy' : 'Add Policy'}
                    </Button>
                </div>
            </div>
        </>
    );
};

export default TraitsSecurityPolicyPanel;
