import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useFlowStore } from '../stores/flowStore';
import VariableTrigger from './VariableTrigger';
import EnvItem from './EnvItem';
import VariableForm from './VariableForm';
import configIcon from '../assets/config.svg';
import type { EnvironmentVariable } from '../types/flow';

interface EnvPanelProps {
    variables?: EnvironmentVariable[];
    onUpdate?: (vars: EnvironmentVariable[]) => void;
}

const EnvPanel: React.FC<EnvPanelProps> = ({ variables: propVariables, onUpdate }) => {
    const t = useTranslations('Workflow');
    const { nodes, selectedNodeId, environmentVariables: storeVariables, setEnvironmentVariables, envSecrets, setEnvSecrets, setSelectedNode, updateNodeData } = useFlowStore();
    const [editingVar, setEditingVar] = useState<EnvironmentVariable | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editingName, setEditingName] = useState('');

    // Get selected node
    const selectedNode = useMemo(() => {
        return nodes.find((n) => n.id === selectedNodeId);
    }, [nodes, selectedNodeId]);

    // Use props if provided, otherwise fall back to store
    const variables = propVariables || storeVariables;

    // Note: showEnvPanel check removed as this component is now rendered by PropertyPanel based on selection

    const handleClose = () => {
        setSelectedNode(null);
    };

    const handleEdit = (variable: EnvironmentVariable) => {
        setEditingVar(variable);
        setIsAdding(false); // Ensure we are not in add mode
    };

    const handleDelete = (variable: EnvironmentVariable) => {
        const newVars = variables.filter(v => v.key !== variable.key);

        if (onUpdate) {
            onUpdate(newVars);
        } else {
            setEnvironmentVariables(newVars);
            if (variable.isSecret) {
                const newSecrets = { ...envSecrets };
                delete newSecrets[variable.key];
                setEnvSecrets(newSecrets);
            }
        }
    };

    const handleSave = () => {
        setIsAdding(false);
        setEditingVar(null);
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingVar(null);
    };

    return (
        <div className="absolute top-[70px] right-5 bottom-5 flex flex-col overflow-hidden rounded-2xl border-[0.5px] border-components-panel-border bg-white shadow-2xl z-20 transition-all duration-200"
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
                                    if (editingName.trim() && selectedNode) {
                                        updateNodeData(selectedNode.id, { name: editingName.trim() });
                                    }
                                    setIsEditingName(false);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        if (editingName.trim() && selectedNode) {
                                            updateNodeData(selectedNode.id, { name: editingName.trim() });
                                        }
                                        setIsEditingName(false);
                                    } else if (e.key === 'Escape') {
                                        setIsEditingName(false);
                                        setEditingName(selectedNode?.data.name || '');
                                    }
                                }}
                                className="text-sm font-bold text-text-primary outline-none border-b-2 border-blue-300 bg-transparent"
                                autoFocus
                            />
                        ) : (
                            <span
                                className="text-sm font-bold text-text-primary cursor-pointer"
                                onDoubleClick={() => {
                                    setEditingName(selectedNode?.data.name || '');
                                    setIsEditingName(true);
                                }}
                            >
                                {selectedNode?.data.name || 'Unnamed'}
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
                    {!isAdding && !editingVar && (
                        <div className="mb-4">
                            <div onClick={() => setIsAdding(true)}>
                                <VariableTrigger />
                            </div>
                        </div>
                    )}

                    {isAdding && (
                        <VariableForm
                            onSave={handleSave}
                            onCancel={handleCancel}
                            onSubmit={(newVar: EnvironmentVariable) => {
                                if (variables.some((variable) => variable.key === newVar.key)) {
                                    return t('variableKeyExists');
                                }
                                const newVars = [...variables, newVar];
                                if (onUpdate) {
                                    onUpdate(newVars);
                                } else {
                                    setEnvironmentVariables(newVars);
                                    if (newVar.isSecret) {
                                        setEnvSecrets({ ...envSecrets, [newVar.key]: newVar.value });
                                    }
                                }
                                return undefined;
                            }}
                        />
                    )}

                    {editingVar && (
                        <VariableForm
                            initialData={editingVar}
                            onSave={handleSave}
                            onCancel={handleCancel}
                            onSubmit={(updatedVar: EnvironmentVariable) => {
                                const newVars = variables.map(v => v.key === editingVar.key ? updatedVar : v);
                                if (onUpdate) {
                                    onUpdate(newVars);
                                } else {
                                    setEnvironmentVariables(newVars);
                                    if (updatedVar.isSecret) {
                                        setEnvSecrets({ ...envSecrets, [updatedVar.key]: updatedVar.value });
                                    }
                                }
                                return undefined;
                            }}
                        />
                    )}

                    <div className="space-y-2">
                        {variables.length === 0 && !isAdding ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <p className="text-[15px] text-text-tertiary">No environment variables yet</p>
                            </div>
                        ) : (
                            variables.map((variable) => (
                                // Hide the item if it's being edited, as the form is shown above (or we could replace it in place, but showing above is simpler for now as per plan)
                                // Actually, if we are editing, we probably want to hide the list or just show the form.
                                // Let's just show the list, but maybe disable interaction?
                                // Or better: if editingVar matches, don't show the item?
                                // Let's hide the item if it's being edited.
                                editingVar?.key === variable.key ? null : (
                                    <EnvItem
                                        key={variable.key}
                                        variable={variable}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                )
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnvPanel;
