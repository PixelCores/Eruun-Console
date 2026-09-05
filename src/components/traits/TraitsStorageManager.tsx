import React, { useState } from 'react';
import { ChevronDown, Plus, Trash2, X, Settings } from 'lucide-react';
import { useFlowStore } from '../../stores/flowStore';
import type { TraitStorage } from '../../types/flow';

interface TraitsStorageManagerProps {
    storage: TraitStorage[];
    onChange: (storage: TraitStorage[]) => void;
}

const TraitsStorageManager: React.FC<TraitsStorageManagerProps> = ({ storage, onChange }) => {
    const { nodes } = useFlowStore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    // Form State
    const [type, setType] = useState<TraitStorage['type']>('persistent');
    const [name, setName] = useState('');
    const [mountPath, setMountPath] = useState('');
    const [subPath, setSubPath] = useState('');
    const [size, setSize] = useState('');
    const [sourceName, setSourceName] = useState('');

    // Filter config nodes
    const configNodes = nodes.filter(n => n.data.componentType === 'config');

    const resetForm = () => {
        setType('persistent');
        setName('');
        setMountPath('');
        setSubPath('');
        setSize('');
        setSourceName('');
        setIsAdding(false);
        setEditingIndex(null);
    };

    const handleSave = () => {
        if (!name || !mountPath) return;

        const newStorage: TraitStorage = {
            type,
            name,
            mountPath,
            ...(type === 'persistent' && { subPath, size }),
            ...(type === 'config' && { sourceName })
        };

        if (editingIndex !== null) {
            const newStorageList = [...storage];
            newStorageList[editingIndex] = newStorage;
            onChange(newStorageList);
        } else {
            onChange([...storage, newStorage]);
        }
        resetForm();
    };

    const handleEdit = (index: number) => {
        const item = storage[index];
        setType(item.type);
        setName(item.name);
        setMountPath(item.mountPath);
        setSubPath(item.subPath || '');
        setSize(item.size || '');
        setSourceName(item.sourceName || '');
        setEditingIndex(index);
        setIsAdding(true);
    };

    const handleDelete = (index: number) => {
        onChange(storage.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-3">
            {!isAdding ? (
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 text-sm text-state-accent-solid hover:text-state-accent-active font-medium"
                >
                    <Plus size={16} />
                    Add Storage
                </button>
            ) : (
                <div className="p-3 border border-components-panel-border rounded-lg bg-components-badge-bg-dimm space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                            {editingIndex !== null ? 'Edit Storage' : 'New Storage'}
                        </span>
                        <button onClick={resetForm} className="text-text-tertiary hover:text-text-primary">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <div>
                            <label className="text-xs text-text-tertiary mb-1 block">Type</label>
                            <div className="relative">
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as TraitStorage['type'])}
                                    className="w-full px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none appearance-none"
                                >
                                    <option value="persistent">Persistent</option>
                                    <option value="ephemeral">Ephemeral</option>
                                    <option value="config">Config</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-text-tertiary mb-1 block">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Volume Name"
                                className="w-full px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-text-tertiary mb-1 block">Mount Path</label>
                            <input
                                type="text"
                                value={mountPath}
                                onChange={(e) => setMountPath(e.target.value)}
                                placeholder="/var/lib/data"
                                className="w-full px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                            />
                        </div>

                        {type === 'persistent' && (
                            <>
                                <div>
                                    <label className="text-xs text-text-tertiary mb-1 block">Sub Path</label>
                                    <input
                                        type="text"
                                        value={subPath}
                                        onChange={(e) => setSubPath(e.target.value)}
                                        placeholder="Optional subpath"
                                        className="w-full px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-text-tertiary mb-1 block">Size</label>
                                    <input
                                        type="text"
                                        value={size}
                                        onChange={(e) => setSize(e.target.value)}
                                        placeholder="e.g. 5Gi"
                                        className="w-full px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                                    />
                                </div>
                            </>
                        )}

                        {type === 'config' && (
                            <div>
                                <label className="text-xs text-text-tertiary mb-1 block">Config Source</label>
                                <div className="relative">
                                    <select
                                        value={sourceName}
                                        onChange={(e) => setSourceName(e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none appearance-none"
                                    >
                                        <option value="">Select Config Node...</option>
                                        {configNodes.map(node => (
                                            <option key={node.id} value={node.data.label || node.id}>
                                                {node.data.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={resetForm}
                                className="px-3 py-1.5 text-xs text-text-secondary hover:bg-state-base-hover rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!name || !mountPath}
                                className="px-3 py-1.5 text-xs bg-state-accent-solid text-white rounded hover:bg-state-accent-active disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {editingIndex !== null ? 'Update' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {storage.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border border-components-panel-border rounded-lg bg-white group">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-text-primary truncate">{item.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-text-tertiary uppercase">{item.type}</span>
                            </div>
                            <div className="text-xs text-text-tertiary truncate">
                                {item.mountPath}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleEdit(index)}
                                className="p-1 text-text-tertiary hover:text-state-accent-solid rounded"
                            >
                                <Settings size={14} />
                            </button>
                            <button
                                onClick={() => handleDelete(index)}
                                className="p-1 text-text-tertiary hover:text-state-destructive-solid rounded"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TraitsStorageManager;
