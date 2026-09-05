import React, { useState, useMemo } from 'react';
import { X, File, Key, Plus, Trash2, Edit2, ChevronDown, ChevronRight } from 'lucide-react';
import { useFlowStore } from '../stores/flowStore';
import configIcon from '../assets/config.svg';
import Switch from './base/switch';
import type { ConfigDataItem, SecretDataItem, Traits } from '../types/flow';

type ConfigSecretPanelProps = Record<string, never>;

const ConfigSecretPanel: React.FC<ConfigSecretPanelProps> = () => {
    const { nodes, selectedNodeId, updateNodeData, setSelectedNode } = useFlowStore();
    const [isEditingName, setIsEditingName] = useState(false);
    const [editingName, setEditingName] = useState('');
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingKey, setEditingKey] = useState('');
    const [editingValue, setEditingValue] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');

    // Get selected node
    const selectedNode = useMemo(() => {
        return nodes.find((n) => n.id === selectedNodeId);
    }, [nodes, selectedNodeId]);

    if (!selectedNode) {
        return null;
    }

    const originalType = selectedNode.data.originalType as string;
    const isConfig = originalType === 'config';
    const configData = (selectedNode.data.configData as ConfigDataItem[]) || [];
    const secretData = (selectedNode.data.secretData as SecretDataItem[]) || [];

    const handleClose = () => {
        setSelectedNode(null);
    };

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedItems(newExpanded);
    };

    // Config handlers
    const handleAddConfig = () => {
        if (!newKey.trim()) return;
        const newItem: ConfigDataItem = {
            id: `config-${Date.now()}`,
            key: newKey.trim(),
            value: newValue,
        };
        updateNodeData(selectedNode.id, {
            configData: [...configData, newItem],
        });
        setNewKey('');
        setNewValue('');
        setIsAdding(false);
    };

    const handleUpdateConfig = (id: string) => {
        if (!editingKey.trim()) return;
        const updatedData = configData.map(item =>
            item.id === id ? { ...item, key: editingKey.trim(), value: editingValue } : item
        );
        updateNodeData(selectedNode.id, { configData: updatedData });
        setEditingItemId(null);
    };

    const handleDeleteConfig = (id: string) => {
        const updatedData = configData.filter(item => item.id !== id);
        updateNodeData(selectedNode.id, { configData: updatedData });
    };

    // Secret handlers
    const handleAddSecret = () => {
        if (!newKey.trim()) return;
        const newItem: SecretDataItem = {
            id: `secret-${Date.now()}`,
            key: newKey.trim(),
            value: newValue,
        };
        updateNodeData(selectedNode.id, {
            secretData: [...secretData, newItem],
        });
        setNewKey('');
        setNewValue('');
        setIsAdding(false);
    };

    const handleUpdateSecret = (id: string) => {
        if (!editingKey.trim()) return;
        const updatedData = secretData.map(item =>
            item.id === id ? { ...item, key: editingKey.trim(), value: editingValue } : item
        );
        updateNodeData(selectedNode.id, { secretData: updatedData });
        setEditingItemId(null);
    };

    const handleDeleteSecret = (id: string) => {
        const updatedData = secretData.filter(item => item.id !== id);
        updateNodeData(selectedNode.id, { secretData: updatedData });
    };

    const startEdit = (item: ConfigDataItem | SecretDataItem) => {
        setEditingItemId(item.id);
        setEditingKey(item.key);
        setEditingValue(item.value);
    };

    const cancelEdit = () => {
        setEditingItemId(null);
        setEditingKey('');
        setEditingValue('');
    };

    const renderConfigItem = (item: ConfigDataItem) => {
        const isExpanded = expandedItems.has(item.id);
        const isEditing = editingItemId === item.id;

        if (isEditing) {
            return (
                <div key={item.id} className="border border-blue-200 rounded-lg p-3 bg-blue-50/50">
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-text-tertiary mb-1 block">Filename</label>
                            <input
                                type="text"
                                value={editingKey}
                                onChange={(e) => setEditingKey(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., master.cnf"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-text-tertiary mb-1 block">Content</label>
                            <textarea
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                rows={8}
                                placeholder="File content..."
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={cancelEdit}
                                className="px-3 py-1.5 text-sm text-text-secondary hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleUpdateConfig(item.id)}
                                className="px-3 py-1.5 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div
                    className="flex items-center justify-between px-3 py-2.5 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleExpand(item.id)}
                >
                    <div className="flex items-center gap-2">
                        {isExpanded ? (
                            <ChevronDown size={14} className="text-text-tertiary" />
                        ) : (
                            <ChevronRight size={14} className="text-text-tertiary" />
                        )}
                        <File size={14} className="text-text-tertiary" />
                        <span className="text-sm font-medium text-text-primary">{item.key}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                startEdit(item);
                            }}
                            className="p-1 text-text-tertiary hover:text-blue-500 transition-colors"
                        >
                            <Edit2 size={14} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConfig(item.id);
                            }}
                            className="p-1 text-text-tertiary hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
                {isExpanded && (
                    <div className="px-3 py-2 bg-white border-t border-gray-100">
                        <pre className="text-xs text-text-secondary font-mono whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto">
                            {item.value}
                        </pre>
                    </div>
                )}
            </div>
        );
    };

    const renderSecretItem = (item: SecretDataItem) => {
        const isEditing = editingItemId === item.id;

        if (isEditing) {
            return (
                <div key={item.id} className="border border-blue-200 rounded-lg p-3 bg-blue-50/50">
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-text-tertiary mb-1 block">Key</label>
                            <input
                                type="text"
                                value={editingKey}
                                onChange={(e) => setEditingKey(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., MYSQL_ROOT_PASSWORD"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-text-tertiary mb-1 block">Value (Base64)</label>
                            <input
                                type="text"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                placeholder="Base64 encoded value"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={cancelEdit}
                                className="px-3 py-1.5 text-sm text-text-secondary hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleUpdateSecret(item.id)}
                                className="px-3 py-1.5 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div key={item.id} className="flex items-center justify-between px-3 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                    <Key size={14} className="text-text-tertiary" />
                    <span className="text-sm font-medium text-text-primary">{item.key}</span>
                    <span className="text-xs text-text-tertiary font-mono">••••••••</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => startEdit(item)}
                        className="p-1 text-text-tertiary hover:text-blue-500 transition-colors"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={() => handleDeleteSecret(item.id)}
                        className="p-1 text-text-tertiary hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        );
    };

    const renderAddForm = () => {
        if (!isAdding) return null;

        return (
            <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/50 mb-3">
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-text-tertiary mb-1 block">
                            {isConfig ? 'Filename' : 'Key'}
                        </label>
                        <input
                            type="text"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={isConfig ? 'e.g., master.cnf' : 'e.g., MYSQL_ROOT_PASSWORD'}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="text-xs text-text-tertiary mb-1 block">
                            {isConfig ? 'Content' : 'Value (Base64)'}
                        </label>
                        {isConfig ? (
                            <textarea
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                rows={6}
                                placeholder="File content..."
                            />
                        ) : (
                            <input
                                type="text"
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                placeholder="Base64 encoded value"
                            />
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => {
                                setIsAdding(false);
                                setNewKey('');
                                setNewValue('');
                            }}
                            className="px-3 py-1.5 text-sm text-text-secondary hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={isConfig ? handleAddConfig : handleAddSecret}
                            className="px-3 py-1.5 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const data = isConfig ? configData : secretData;

    return (
        <div
            className="absolute top-[70px] right-5 bottom-5 flex flex-col overflow-hidden rounded-2xl border-[0.5px] border-components-panel-border bg-white shadow-2xl z-20 transition-all duration-200"
            style={{
                minWidth: '400px',
                maxWidth: '720px',
                width: '400px',
            }}
        >
            <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-components-panel-border px-5 py-4">
                    <div className="flex items-center gap-2">
                        <img
                            src={configIcon}
                            alt="icon"
                            className="w-5 h-5"
                        />
                        {isEditingName ? (
                            <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onBlur={() => {
                                    if (editingName.trim()) {
                                        updateNodeData(selectedNode.id, { name: editingName.trim() });
                                    }
                                    setIsEditingName(false);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        if (editingName.trim()) {
                                            updateNodeData(selectedNode.id, { name: editingName.trim() });
                                        }
                                        setIsEditingName(false);
                                    } else if (e.key === 'Escape') {
                                        setIsEditingName(false);
                                        setEditingName(selectedNode.data.name || '');
                                    }
                                }}
                                className="text-sm font-bold text-text-primary outline-none border-b-2 border-blue-300 bg-transparent"
                                autoFocus
                            />
                        ) : (
                            <span
                                className="text-sm font-bold text-text-primary cursor-pointer"
                                onDoubleClick={() => {
                                    setEditingName(selectedNode.data.name || '');
                                    setIsEditingName(true);
                                }}
                            >
                                {selectedNode.data.name || 'Unnamed'}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleClose}
                        className="flex items-center justify-center rounded-md p-1 text-text-secondary hover:bg-state-base-hover transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                {/* Config/Secret Toggle */}
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg mb-4">
                    <button
                        onClick={() => {
                            updateNodeData(selectedNode.id, { originalType: 'config' });
                            setIsAdding(false);
                            setEditingItemId(null);
                        }}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                            isConfig
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <File size={14} />
                        Config
                    </button>
                    <button
                        onClick={() => {
                            updateNodeData(selectedNode.id, { originalType: 'secret' });
                            setIsAdding(false);
                            setEditingItemId(null);
                        }}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                            !isConfig
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Key size={14} />
                        Secret
                    </button>
                </div>

                    {/* Add Button */}
                    {!isAdding && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-4 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                        >
                            <Plus size={16} />
                            Add {isConfig ? 'Config File' : 'Secret'}
                        </button>
                    )}

                    {/* Add Form */}
                    {renderAddForm()}

                    {/* Data List */}
                    <div className="space-y-2">
                        {data.length === 0 && !isAdding ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <p className="text-[15px] text-text-tertiary">
                                    No {isConfig ? 'config files' : 'secrets'} yet
                                </p>
                            </div>
                        ) : (
                            isConfig
                                ? configData.map(renderConfigItem)
                                : secretData.map(renderSecretItem)
                        )}
                    </div>

                    {/* Traits Share */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-text-primary">Traits Share</span>
                            {(selectedNode.data.traits as Traits)?.share ? (
                                <div className="flex items-center gap-2">
                                    <select
                                        className="h-8 px-3 text-sm rounded-lg border border-gray-200 bg-white text-text-primary outline-none cursor-pointer hover:border-blue-300 transition-colors"
                                        value={(selectedNode.data.traits as Traits)?.share?.strategy || 'default'}
                                        onChange={(e) => {
                                            const traits = (selectedNode.data.traits as Traits) || {};
                                            updateNodeData(selectedNode.id, {
                                                traits: {
                                                    ...traits,
                                                    share: {
                                                        ...traits.share,
                                                        strategy: e.target.value as 'default' | 'ignore' | 'force'
                                                    }
                                                }
                                            });
                                        }}
                                    >
                                        <option value="default">Default</option>
                                        <option value="ignore">Ignore</option>
                                        <option value="force">Force</option>
                                    </select>
                                    <button
                                        onClick={() => {
                                            const traits = (selectedNode.data.traits as Traits) || {};
                                            const { share, ...restTraits } = traits;
                                            void share;
                                            updateNodeData(selectedNode.id, { traits: restTraits });
                                        }}
                                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-text-tertiary hover:text-red-500 hover:border-red-300 transition-colors"
                                        title="Disable Share"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <Switch
                                    checked={false}
                                    onChange={(checked) => {
                                        if (checked) {
                                            const traits = (selectedNode.data.traits as Traits) || {};
                                            updateNodeData(selectedNode.id, {
                                                traits: { ...traits, share: { strategy: 'default' } }
                                            });
                                        }
                                    }}
                                    size="md"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfigSecretPanel;

