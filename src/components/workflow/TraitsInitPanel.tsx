import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import type { TraitContainer, TraitEnv, TraitStorage, TraitSecurityPolicy } from '../../types/flow';
import SecurityPolicyForm from './SecurityPolicyForm';

interface TraitsInitPanelProps {
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

const TraitsInitPanel: React.FC<TraitsInitPanelProps> = ({ onClose, onAdd, initialData, onUpdate }) => {
    const [name, setName] = useState('');
    const [image, setImage] = useState('');
    const [command, setCommand] = useState('');
    const [envVars, setEnvVars] = useState(''); // JSON format for properties.env

    // Nested traits
    const [envs, setEnvs] = useState<TraitEnv[]>([]);
    const [storage, setStorage] = useState<TraitStorage[]>([]);
    const [securityPolicy, setSecurityPolicy] = useState<TraitSecurityPolicy | null>(null);

    // Env form
    const [envName, setEnvName] = useState('');
    const [envSecretName, setEnvSecretName] = useState('');
    const [envSecretKey, setEnvSecretKey] = useState('');
    const [envFieldPath, setEnvFieldPath] = useState('');
    const [envType, setEnvType] = useState<'secret' | 'field'>('secret');

    // Storage form
    const [storageName, setStorageName] = useState('');
    const [storageType, setStorageType] = useState<'persistent' | 'ephemeral' | 'config'>('ephemeral');
    const [storageMountPath, setStorageMountPath] = useState('');
    const [storageSubPath, setStorageSubPath] = useState('');
    const [storageSourceName, setStorageSourceName] = useState('');

    const isEditMode = !!initialData;

    // Populate form when initialData changes (edit mode)
    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
        if (initialData) {
            setName(initialData.name || '');
            setImage(initialData.properties?.image || '');
            // Convert command array to JSON string for display
            if (initialData.properties?.command && Array.isArray(initialData.properties.command)) {
                setCommand(JSON.stringify(initialData.properties.command));
            } else {
                setCommand('');
            }
            // Convert env object to JSON string
            if (initialData.properties?.env) {
                setEnvVars(JSON.stringify(initialData.properties.env));
            } else {
                setEnvVars('');
            }
            setEnvs(initialData.traits?.envs || []);
            setStorage(initialData.traits?.storage || []);
            setSecurityPolicy(initialData.securityPolicy || null);
        } else {
            setName('');
            setImage('');
            setCommand('');
            setEnvVars('');
            setEnvs([]);
            setStorage([]);
            setSecurityPolicy(null);
        }
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [initialData]);

    const handleAddEnv = () => {
        if (!envName) return;

        let newEnv: TraitEnv;
        if (envType === 'secret') {
            if (!envSecretName || !envSecretKey) return;
            newEnv = {
                name: envName,
                valueFrom: { secret: { name: envSecretName, key: envSecretKey } }
            };
        } else {
            if (!envFieldPath) return;
            newEnv = {
                name: envName,
                valueFrom: { field: { fieldPath: envFieldPath } }
            };
        }

        setEnvs([...envs, newEnv]);
        setEnvName('');
        setEnvSecretName('');
        setEnvSecretKey('');
        setEnvFieldPath('');
    };

    const handleRemoveEnv = (index: number) => {
        setEnvs(envs.filter((_, i) => i !== index));
    };

    const handleAddStorage = () => {
        if (!storageName || !storageMountPath) return;
        if (storageType === 'config' && !storageSourceName) return;

        const newStorage: TraitStorage = {
            type: storageType,
            name: storageName,
            mountPath: storageMountPath,
            ...(storageSubPath && { subPath: storageSubPath }),
            ...(storageType === 'config' && { sourceName: storageSourceName })
        };
        setStorage([...storage, newStorage]);
        setStorageName('');
        setStorageMountPath('');
        setStorageSubPath('');
        setStorageSourceName('');
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
                commandArray = JSON.parse(command);
                if (!Array.isArray(commandArray)) {
                    commandArray = [command];
                }
            } catch {
                commandArray = [command];
            }
        }

        // Parse env vars for properties
        let propertiesEnv: Record<string, string> | undefined;
        if (envVars.trim()) {
            try {
                propertiesEnv = JSON.parse(envVars);
            } catch {
                // Invalid JSON, ignore
            }
        }

        const containerData: TraitContainer = {
            name,
            properties: {
                ...(image && { image }),
                ...(commandArray && { command: commandArray }),
                ...(propertiesEnv && { env: propertiesEnv })
            },
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
        setEnvVars('');
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
                        {isEditMode ? 'Edit Init Container' : 'Add Init Container'}
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
                            placeholder="e.g. init-mysql, clone-mysql"
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
                            placeholder="e.g. docker.yu3.co/3os/kubectl:1.28.5"
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

                    {/* Properties Env (static env vars) */}
                    <div>
                        <label className="text-[13px] font-medium text-text-primary mb-2 block">
                            Static Environment Variables
                        </label>
                        <textarea
                            className={cn(INPUT_STYLES, "min-h-[60px] resize-y font-mono text-xs")}
                            placeholder='{"MYSQL_DATABASE":"game","SQL_URL":"https://..."}'
                            value={envVars}
                            onChange={(e) => setEnvVars(e.target.value)}
                        />
                        <p className="mt-1 text-xs text-text-tertiary">
                            JSON object format for static env vars
                        </p>
                    </div>

                    {/* Nested Envs (from secrets/fields) */}
                    <div className="border border-components-panel-border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-[13px] font-medium text-text-primary">
                                Dynamic Environment Variables
                            </label>
                        </div>

                        {/* Env List */}
                        {envs.length > 0 && (
                            <div className="space-y-2 mb-3">
                                {envs.map((env, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                                        <div className="text-xs">
                                            <span className="font-medium text-blue-700">{env.name}</span>
                                            {env.valueFrom?.secret && (
                                                <span className="text-blue-500"> from secret:{env.valueFrom.secret.name}</span>
                                            )}
                                            {env.valueFrom?.field && (
                                                <span className="text-blue-500"> from field:{env.valueFrom.field.fieldPath}</span>
                                            )}
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
                            <div className="flex gap-2">
                                <select
                                    className={cn(SMALL_INPUT_STYLES, "w-24")}
                                    value={envType}
                                    onChange={(e) => setEnvType(e.target.value as 'secret' | 'field')}
                                >
                                    <option value="secret">Secret</option>
                                    <option value="field">Field</option>
                                </select>
                                <input
                                    type="text"
                                    className={cn(SMALL_INPUT_STYLES, "flex-1")}
                                    placeholder="Var name"
                                    value={envName}
                                    onChange={(e) => setEnvName(e.target.value)}
                                />
                            </div>
                            {envType === 'secret' ? (
                                <div className="grid grid-cols-2 gap-2">
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
                            ) : (
                                <input
                                    type="text"
                                    className={SMALL_INPUT_STYLES}
                                    placeholder="Field path (e.g. metadata.namespace)"
                                    value={envFieldPath}
                                    onChange={(e) => setEnvFieldPath(e.target.value)}
                                />
                            )}
                            <button
                                onClick={handleAddEnv}
                                disabled={!envName || (envType === 'secret' ? (!envSecretName || !envSecretKey) : !envFieldPath)}
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
                                            {s.sourceName && <span className="text-green-400"> [{s.sourceName}]</span>}
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
                                    onChange={(e) => setStorageType(e.target.value as 'persistent' | 'ephemeral' | 'config')}
                                >
                                    <option value="persistent">Persistent</option>
                                    <option value="ephemeral">Ephemeral</option>
                                    <option value="config">Config</option>
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
                                {storageType === 'config' ? (
                                    <input
                                        type="text"
                                        className={SMALL_INPUT_STYLES}
                                        placeholder="Source name (config)"
                                        value={storageSourceName}
                                        onChange={(e) => setStorageSourceName(e.target.value)}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        className={SMALL_INPUT_STYLES}
                                        placeholder="Sub path (optional)"
                                        value={storageSubPath}
                                        onChange={(e) => setStorageSubPath(e.target.value)}
                                    />
                                )}
                            </div>
                            <button
                                onClick={handleAddStorage}
                                disabled={!storageName || !storageMountPath || (storageType === 'config' && !storageSourceName)}
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

export default TraitsInitPanel;

