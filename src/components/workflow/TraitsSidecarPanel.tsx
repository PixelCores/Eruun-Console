import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import type { TraitContainer, TraitEnv, TraitStorage, TraitSecurityPolicy } from '../../types/flow';
import SecurityPolicyForm from './SecurityPolicyForm';

interface TraitsSidecarPanelProps {
    onClose: () => void;
    onAdd: (container: TraitContainer) => void;
    initialData?: TraitContainer;
    onUpdate?: (container: TraitContainer) => void;
}

const INPUT_STYLES = 'w-full px-3 py-2 text-sm border border-components-panel-border rounded-lg bg-white input-gradient-focus focus:ring-0 outline-none transition-colors';
const SMALL_INPUT_STYLES = 'px-2 py-1.5 text-xs border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none';

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

const TraitsSidecarPanel: React.FC<TraitsSidecarPanelProps> = ({ onClose, onAdd, initialData, onUpdate }) => {
    const [name, setName] = useState('');
    const [image, setImage] = useState('');
    const [command, setCommand] = useState('');

    // Nested traits
    const [envs, setEnvs] = useState<TraitEnv[]>([]);
    const [storage, setStorage] = useState<TraitStorage[]>([]);
    const [securityPolicy, setSecurityPolicy] = useState<TraitSecurityPolicy | null>(null);

    // Env form
    const [envName, setEnvName] = useState('');
    const [envSecretName, setEnvSecretName] = useState('');
    const [envSecretKey, setEnvSecretKey] = useState('');

    // Storage form
    const [storageName, setStorageName] = useState('');
    const [storageType, setStorageType] = useState<'persistent' | 'ephemeral'>('ephemeral');
    const [storageMountPath, setStorageMountPath] = useState('');
    const [storageSubPath, setStorageSubPath] = useState('');

    const isEditMode = !!initialData;

    // Populate form when initialData changes (edit mode)
    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
        if (initialData) {
            setName(initialData.name || '');
            setImage(initialData.image || '');
            // Convert command array to JSON string for display
            if (initialData.command && Array.isArray(initialData.command)) {
                setCommand(JSON.stringify(initialData.command));
            } else {
                setCommand('');
            }
            setEnvs(initialData.traits?.envs || []);
            setStorage(initialData.traits?.storage || []);
            setSecurityPolicy(initialData.securityPolicy || null);
        } else {
            setName('');
            setImage('');
            setCommand('');
            setEnvs([]);
            setStorage([]);
            setSecurityPolicy(null);
        }
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [initialData]);

    const handleAddEnv = () => {
        if (!envName || !envSecretName || !envSecretKey) return;
        const newEnv: TraitEnv = {
            name: envName,
            valueFrom: { secret: { name: envSecretName, key: envSecretKey } }
        };
        setEnvs([...envs, newEnv]);
        setEnvName('');
        setEnvSecretName('');
        setEnvSecretKey('');
    };

    const handleRemoveEnv = (index: number) => {
        setEnvs(envs.filter((_, i) => i !== index));
    };

    const handleAddStorage = () => {
        if (!storageName || !storageMountPath) return;
        const newStorage: TraitStorage = {
            type: storageType,
            name: storageName,
            mountPath: storageMountPath,
            ...(storageSubPath && { subPath: storageSubPath })
        };
        setStorage([...storage, newStorage]);
        setStorageName('');
        setStorageMountPath('');
        setStorageSubPath('');
    };

    const handleRemoveStorage = (index: number) => {
        setStorage(storage.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!name) return;

        // Parse command into array
        let commandArray: string[] | undefined;
        if (command.trim()) {
            try {
                // Try to parse as JSON array first
                commandArray = JSON.parse(command);
                if (!Array.isArray(commandArray)) {
                    commandArray = [command];
                }
            } catch {
                // If not valid JSON, treat as single command
                commandArray = [command];
            }
        }

        const containerData: TraitContainer = {
            name,
            ...(image && { image }),
            ...(commandArray && { command: commandArray }),
            ...((envs.length > 0 || storage.length > 0) && {
                traits: {
                    ...(envs.length > 0 && { envs }),
                    ...(storage.length > 0 && { storage })
                }
            }),
            ...(securityPolicy && { securityPolicy })
        };

        if (isEditMode && onUpdate) {
            onUpdate(containerData);
        } else {
            onAdd(containerData);
        }

        // Reset form
        setName('');
        setImage('');
        setCommand('');
        setEnvs([]);
        setStorage([]);
        setSecurityPolicy(null);
    };

    const isValid = name.trim() !== '';

    return (
        <>
            <style>{gradientBorderStyle}</style>
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-components-panel-border">
                    <span className="text-[15px] font-semibold text-text-primary">
                        {isEditMode ? 'Edit Sidecar Container' : 'Add Sidecar Container'}
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
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            className={INPUT_STYLES}
                            placeholder="e.g. xtrabackup"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    {/* Image */}
                    <div>
                        <label className="text-[13px] font-medium text-text-primary mb-2 block">
                            Image
                        </label>
                        <input
                            type="text"
                            className={INPUT_STYLES}
                            placeholder="e.g. docker.yu3.co/3os/xtrabackup:latest"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                        />
                    </div>

                    {/* Command */}
                    <div>
                        <label className="text-[13px] font-medium text-text-primary mb-2 block">
                            Command
                        </label>
                        <textarea
                            className={cn(INPUT_STYLES, "min-h-[100px] resize-y")}
                            placeholder='["bash", "-c", "your script here..."]'
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                        />
                        <p className="mt-1 text-xs text-text-tertiary">
                            JSON array format: ["cmd", "arg1", "arg2"]
                        </p>
                    </div>

                    {/* Nested Envs */}
                    <div className="border border-components-panel-border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-[13px] font-medium text-text-primary">
                                Environment Variables
                            </label>
                        </div>

                        {/* Env List */}
                        {envs.length > 0 && (
                            <div className="space-y-2 mb-3">
                                {envs.map((env, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                                        <div className="text-xs">
                                            <span className="font-medium text-blue-700">{env.name}</span>
                                            <span className="text-blue-500"> from {env.valueFrom?.secret?.name}</span>
                                        </div>
                                        <button onClick={() => handleRemoveEnv(index)} className="text-blue-400 hover:text-blue-600">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Env Form */}
                        <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                                <input
                                    type="text"
                                    className={SMALL_INPUT_STYLES}
                                    placeholder="Var name"
                                    value={envName}
                                    onChange={(e) => setEnvName(e.target.value)}
                                />
                                <input
                                    type="text"
                                    className={SMALL_INPUT_STYLES}
                                    placeholder="Secret name"
                                    value={envSecretName}
                                    onChange={(e) => setEnvSecretName(e.target.value)}
                                />
                                <input
                                    type="text"
                                    className={SMALL_INPUT_STYLES}
                                    placeholder="Key"
                                    value={envSecretKey}
                                    onChange={(e) => setEnvSecretKey(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleAddEnv}
                                disabled={!envName || !envSecretName || !envSecretKey}
                                className="flex items-center gap-1 text-xs text-state-accent-solid hover:text-state-accent-active disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus size={14} /> Add Env
                            </button>
                        </div>
                    </div>

                    {/* Nested Storage */}
                    <div className="border border-components-panel-border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-[13px] font-medium text-text-primary">
                                Storage Volumes
                            </label>
                        </div>

                        {/* Storage List */}
                        {storage.length > 0 && (
                            <div className="space-y-2 mb-3">
                                {storage.map((s, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                                        <div className="text-xs">
                                            <span className="font-medium text-green-700">{s.name}</span>
                                            <span className="text-green-500"> ({s.type}) → {s.mountPath}</span>
                                        </div>
                                        <button onClick={() => handleRemoveStorage(index)} className="text-green-400 hover:text-green-600">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Storage Form */}
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    className={SMALL_INPUT_STYLES}
                                    value={storageType}
                                    onChange={(e) => setStorageType(e.target.value as 'persistent' | 'ephemeral')}
                                >
                                    <option value="persistent">Persistent</option>
                                    <option value="ephemeral">Ephemeral</option>
                                </select>
                                <input
                                    type="text"
                                    className={SMALL_INPUT_STYLES}
                                    placeholder="Name"
                                    value={storageName}
                                    onChange={(e) => setStorageName(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    className={SMALL_INPUT_STYLES}
                                    placeholder="Mount path"
                                    value={storageMountPath}
                                    onChange={(e) => setStorageMountPath(e.target.value)}
                                />
                                <input
                                    type="text"
                                    className={SMALL_INPUT_STYLES}
                                    placeholder="Sub path (optional)"
                                    value={storageSubPath}
                                    onChange={(e) => setStorageSubPath(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleAddStorage}
                                disabled={!storageName || !storageMountPath}
                                className="flex items-center gap-1 text-xs text-state-accent-solid hover:text-state-accent-active disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus size={14} /> Add Storage
                            </button>
                        </div>
                    </div>

                    {/* Security Policy */}
                    <SecurityPolicyForm
                        policy={securityPolicy}
                        onChange={setSecurityPolicy}
                    />
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

export default TraitsSidecarPanel;

