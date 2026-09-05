import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import type { TraitContainer, Traits } from '../../types/flow';
import TraitsEnvsManager from './TraitsEnvsManager';
import TraitsStorageManager from './TraitsStorageManager';

interface TraitsContainerListProps {
    title: string;
    containers: TraitContainer[];
    onChange: (containers: TraitContainer[]) => void;
    variant?: 'sidecar' | 'init';
}

const TraitsContainerList: React.FC<TraitsContainerListProps> = ({ title, containers, onChange, variant = 'sidecar' }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    // Form State for new container
    const [name, setName] = useState('');
    const [image, setImage] = useState('');
    const [command, setCommand] = useState('');

    const resetForm = () => {
        setName('');
        setImage('');
        setCommand('');
        setIsAdding(false);
    };

    const handleAdd = () => {
        if (!name) return;

        const newContainer: TraitContainer = {
            name,
            traits: {
                envs: [],
                storage: []
            }
        };

        if (variant === 'init') {
            newContainer.properties = {
                image,
                command: command ? command.split('\n') : undefined
            };
        } else {
            newContainer.image = image;
            newContainer.command = command ? command.split('\n') : undefined;
        }

        onChange([...containers, newContainer]);
        resetForm();
    };

    const handleUpdateContainer = (index: number, updates: Partial<TraitContainer>) => {
        const newContainers = [...containers];
        newContainers[index] = { ...newContainers[index], ...updates };
        onChange(newContainers);
    };

    const handleUpdateTraits = (index: number, traitsUpdates: Partial<Traits>) => {
        const container = containers[index];
        const newTraits = { ...(container.traits || {}), ...traitsUpdates };
        handleUpdateContainer(index, { traits: newTraits });
    };

    const handleDelete = (index: number) => {
        onChange(containers.filter((_, i) => i !== index));
    };

    const toggleExpand = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{title}</span>
                <button
                    onClick={() => setIsAdding(true)}
                    className="text-xs text-state-accent-solid hover:text-state-accent-active flex items-center gap-1"
                >
                    <Plus size={14} /> Add
                </button>
            </div>

            {isAdding && (
                <div className="p-3 border border-components-panel-border rounded-lg bg-components-badge-bg-dimm space-y-3">
                    <div>
                        <label className="text-xs text-text-tertiary mb-1 block">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-text-tertiary mb-1 block">Image</label>
                        <input
                            type="text"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-text-tertiary mb-1 block">Command</label>
                        <textarea
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            placeholder="One argument per line"
                            rows={2}
                            className="w-full px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none resize-vertical"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={resetForm} className="px-3 py-1.5 text-xs text-text-secondary hover:bg-state-base-hover rounded">Cancel</button>
                        <button onClick={handleAdd} disabled={!name} className="px-3 py-1.5 text-xs bg-state-accent-solid text-white rounded hover:bg-state-accent-active disabled:opacity-50">Add</button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {containers.map((container, index) => (
                    <div key={index} className="border border-components-panel-border rounded-lg bg-white overflow-hidden">
                        <div
                            className="flex items-center justify-between p-3 cursor-pointer hover:bg-state-base-hover"
                            onClick={() => toggleExpand(index)}
                        >
                            <div className="flex items-center gap-2">
                                {expandedIndex === index ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                <span className="text-sm font-medium">{container.name}</span>
                                {container.image && <span className="text-xs text-text-tertiary truncate max-w-[150px]">{container.image}</span>}
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(index); }}
                                className="p-1 text-text-tertiary hover:text-state-destructive-solid rounded"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        {expandedIndex === index && (
                            <div className="p-3 border-t border-components-panel-border bg-gray-50 space-y-4">
                                {/* Basic Info Edit */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-text-secondary uppercase">Basic Info</label>
                                    <input
                                        type="text"
                                        value={(variant === 'init' ? container.properties?.image : container.image) || ''}
                                        onChange={(e) => {
                                            if (variant === 'init') {
                                                handleUpdateContainer(index, { properties: { ...container.properties, image: e.target.value } });
                                            } else {
                                                handleUpdateContainer(index, { image: e.target.value });
                                            }
                                        }}
                                        placeholder="Image"
                                        className="w-full px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                                    />
                                    <textarea
                                        value={(variant === 'init' ? container.properties?.command : container.command)?.join('\n') || ''}
                                        onChange={(e) => {
                                            const cmd = e.target.value.split('\n');
                                            if (variant === 'init') {
                                                handleUpdateContainer(index, { properties: { ...container.properties, command: cmd } });
                                            } else {
                                                handleUpdateContainer(index, { command: cmd });
                                            }
                                        }}
                                        placeholder="Command (one per line)"
                                        rows={2}
                                        className="w-full px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none resize-vertical"
                                    />
                                </div>

                                {/* Nested Traits */}
                                <div>
                                    <label className="text-xs font-medium text-text-secondary uppercase mb-2 block">Environment Variables</label>
                                    <TraitsEnvsManager
                                        envs={container.traits?.envs || []}
                                        onChange={(envs) => handleUpdateTraits(index, { envs })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-secondary uppercase mb-2 block">Storage</label>
                                    <TraitsStorageManager
                                        storage={container.traits?.storage || []}
                                        onChange={(storage) => handleUpdateTraits(index, { storage })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TraitsContainerList;
