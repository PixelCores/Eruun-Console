import React, { useState } from 'react';
import { ChevronDown, Plus, Trash2, X, Settings } from 'lucide-react';
import { useFlowStore } from '../../stores/flowStore';
import type { TraitEnv } from '../../types/flow';

interface TraitsEnvsManagerProps {
    envs: TraitEnv[];
    onChange: (envs: TraitEnv[]) => void;
}

const TraitsEnvsManager: React.FC<TraitsEnvsManagerProps> = ({ envs, onChange }) => {
    const { nodes } = useFlowStore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [selectedNodeId, setSelectedNodeId] = useState('');
    const [key, setKey] = useState('');

    // Filter config and secret nodes (including config-secret type)
    const configNodes = nodes.filter(n => {
        const type = n.data.componentType;
        return type === 'config' || type === 'secret' || type === 'config-secret';
    });

    const resetForm = () => {
        setName('');
        setSelectedNodeId('');
        setKey('');
        setIsAdding(false);
        setEditingIndex(null);
    };

    const handleSave = () => {
        if (!name || !selectedNodeId || !key) return;

        const selectedNode = nodes.find(n => n.id === selectedNodeId);
        if (!selectedNode) return;

        const newEnv: TraitEnv = {
            name,
            valueFrom: {
                secret: {
                    name: selectedNode.data.label || selectedNode.id, // Assuming label is the resource name
                    key
                }
            }
        };

        if (editingIndex !== null) {
            const newEnvs = [...envs];
            newEnvs[editingIndex] = newEnv;
            onChange(newEnvs);
        } else {
            onChange([...envs, newEnv]);
        }
        resetForm();
    };

    const handleEdit = (index: number) => {
        const env = envs[index];
        setName(env.name);
        // Reverse lookup node by name (this is imperfect if names aren't unique, but works for now)
        const nodeName = env.valueFrom?.secret?.name;
        const node = nodes.find(n => n.data.label === nodeName);
        setSelectedNodeId(node?.id || '');
        setKey(env.valueFrom?.secret?.key || '');
        setEditingIndex(index);
        setIsAdding(true);
    };

    const handleDelete = (index: number) => {
        onChange(envs.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-3">
            {!isAdding ? (
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 text-sm text-state-accent-solid hover:text-state-accent-active font-medium"
                >
                    <Plus size={16} />
                    Add Environment Variable
                </button>
            ) : (
                <div className="p-3 border border-components-panel-border rounded-lg bg-components-badge-bg-dimm space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                            {editingIndex !== null ? 'Edit Variable' : 'New Variable'}
                        </span>
                        <button onClick={resetForm} className="text-text-tertiary hover:text-text-primary">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <div>
                            <label className="text-xs text-text-tertiary mb-1 block">Variable Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. MYSQL_ROOT_PASSWORD"
                                className="w-full px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-text-tertiary mb-1 block">Source Node (Config/Secret)</label>
                            <div className="relative">
                                <select
                                    value={selectedNodeId}
                                    onChange={(e) => setSelectedNodeId(e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none appearance-none"
                                >
                                    <option value="">Select a node...</option>
                                    {configNodes.map(node => (
                                        <option key={node.id} value={node.id}>
                                            {node.data.label} ({node.data.componentType})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-text-tertiary mb-1 block">Key</label>
                            <input
                                type="text"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                placeholder="Key in config/secret"
                                className="w-full px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={resetForm}
                                className="px-3 py-1.5 text-xs text-text-secondary hover:bg-state-base-hover rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!name || !selectedNodeId || !key}
                                className="px-3 py-1.5 text-xs bg-state-accent-solid text-white rounded hover:bg-state-accent-active disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {editingIndex !== null ? 'Update' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {envs.map((env, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border border-components-panel-border rounded-lg bg-white group">
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-text-primary truncate">{env.name}</div>
                            <div className="text-xs text-text-tertiary truncate">
                                from {env.valueFrom?.secret?.name} ({env.valueFrom?.secret?.key})
                            </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleEdit(index)}
                                className="p-1 text-text-tertiary hover:text-state-accent-solid rounded"
                            >
                                <Settings size={14} /> {/* Using Settings icon as edit placeholder if needed, or just text */}
                                <span className="sr-only">Edit</span>
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

export default TraitsEnvsManager;
