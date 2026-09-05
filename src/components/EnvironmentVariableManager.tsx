import React, { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { EnvironmentVariable } from '../types/flow';
import ConfirmDialog from './base/ConfirmDialog';

interface EnvironmentVariableManagerProps {
    variables: EnvironmentVariable[];
    onChange: (variables: EnvironmentVariable[]) => void;
}

const EnvironmentVariableManager: React.FC<EnvironmentVariableManagerProps> = ({
    variables,
    onChange
}) => {
    const t = useTranslations('Workflow');
    const commonT = useTranslations('Common');
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [isSecret, setIsSecret] = useState(false);
    const [newKeyError, setNewKeyError] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editKey, setEditKey] = useState('');
    const [editValue, setEditValue] = useState('');
    const [editIsSecret, setEditIsSecret] = useState(false);
    const [editKeyError, setEditKeyError] = useState('');
    const [pendingDelete, setPendingDelete] = useState<{ index: number; name: string } | null>(null);
    const newKeyErrorId = useId();
    const editKeyErrorId = useId();

    const addVariable = () => {
        if (newKey.trim() && newValue.trim()) {
            // Check if key already exists
            const exists = variables.some(v => v.key === newKey.trim());
            if (exists) {
                setNewKeyError(t('variableNameExists'));
                return;
            }

            onChange([...variables, {
                key: newKey.trim(),
                value: newValue.trim(),
                isSecret
            }]);
            setNewKey('');
            setNewValue('');
            setIsSecret(false);
            setNewKeyError('');
        }
    };

    const removeVariable = (index: number) => {
        onChange(variables.filter((_, i) => i !== index));
    };

    const startEdit = (index: number) => {
        setEditingIndex(index);
        setEditKey(variables[index].key);
        setEditValue(variables[index].value);
        setEditIsSecret(variables[index].isSecret || false);
        setEditKeyError('');
    };

    const saveEdit = () => {
        if (editKey.trim() && editValue.trim() && editingIndex !== null) {
            // Check if key conflicts with other variables (excluding the one being edited)
            const exists = variables.some((v, i) => i !== editingIndex && v.key === editKey.trim());
            if (exists) {
                setEditKeyError(t('variableNameExists'));
                return;
            }

            const newVariables = [...variables];
            newVariables[editingIndex] = {
                key: editKey.trim(),
                value: editValue.trim(),
                isSecret: editIsSecret
            };
            onChange(newVariables);
            setEditingIndex(null);
            setEditKey('');
            setEditValue('');
            setEditIsSecret(false);
            setEditKeyError('');
        }
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditKey('');
        setEditValue('');
        setEditIsSecret(false);
        setEditKeyError('');
    };

    const handleKeyPress = (e: React.KeyboardEvent, action: 'add' | 'save') => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (action === 'add') {
                addVariable();
            } else {
                saveEdit();
            }
        }
    };

    return (
        <div className="space-y-3">
            {/* Add new variable form */}
            <div className="space-y-2 p-3 bg-components-panel-bg rounded-lg border border-components-panel-border">
                <div className="text-[15px] font-medium text-text-secondary">Add Environment Variable</div>
                <div className="space-y-2">
                    <input
                        type="text"
                        placeholder="Variable name (e.g. DATABASE_URL)"
                        value={newKey}
                        onChange={(e) => {
                            setNewKey(e.target.value);
                            setNewKeyError('');
                        }}
                        onKeyPress={(e) => handleKeyPress(e, 'add')}
                        aria-invalid={Boolean(newKeyError)}
                        aria-describedby={newKeyError ? newKeyErrorId : undefined}
                        className={`w-full px-3 py-2 text-[15px] border rounded-md bg-white input-gradient-focus focus:ring-0 outline-none ${
                            newKeyError ? 'border-red-300' : 'border-components-panel-border'
                        }`}
                    />
                    {newKeyError && (
                        <p id={newKeyErrorId} role="alert" className="text-xs text-red-600">
                            {newKeyError}
                        </p>
                    )}
                    <div className="flex gap-2">
                        <textarea
                            placeholder="Variable value (supports multiline)"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            rows={3}
                            className="flex-1 px-3 py-2 text-[15px] border border-components-panel-border rounded-md bg-white input-gradient-focus focus:ring-0 outline-none resize-vertical min-h-[60px] max-h-[200px]"
                        />
                        <label className="flex items-center gap-1 px-2 py-2 text-[15px]">
                            <input
                                type="checkbox"
                                checked={isSecret}
                                onChange={(e) => setIsSecret(e.target.checked)}
                                className="rounded"
                            />
                            <span className="text-text-secondary">Secret</span>
                        </label>
                    </div>
                    <button
                        onClick={addVariable}
                        disabled={!newKey.trim() || !newValue.trim()}
                        className="px-4 py-2 text-[15px] bg-state-accent-solid text-white rounded-md hover:bg-state-accent-solid-hover disabled:bg-state-accent-disabled disabled:cursor-not-allowed transition-colors"
                    >
                        Add Variable
                    </button>
                </div>
            </div>

            {/* Existing variable list */}
            {variables.length > 0 && (
                <div className="space-y-2">
                    <div className="text-[15px] font-medium text-text-secondary">
                        Environment Variables ({variables.length})
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {variables.map((variable, index) => (
                            <div key={index} className="group border border-components-panel-border rounded-lg bg-white hover:bg-state-base-hover transition-colors">
                                {editingIndex === index ? (
                                    /* Edit mode */
                                    <div className="p-3 space-y-2">
                                        <input
                                            type="text"
                                            value={editKey}
                                            onChange={(e) => {
                                                setEditKey(e.target.value);
                                                setEditKeyError('');
                                            }}
                                            aria-invalid={Boolean(editKeyError)}
                                            aria-describedby={editKeyError ? editKeyErrorId : undefined}
                                            className={`w-full px-2 py-1 text-[15px] border rounded input-gradient-focus focus:ring-0 outline-none ${
                                                editKeyError ? 'border-red-300' : 'border-components-panel-border'
                                            }`}
                                        />
                                        {editKeyError && (
                                            <p id={editKeyErrorId} role="alert" className="text-xs text-red-600">
                                                {editKeyError}
                                            </p>
                                        )}
                                        <div className="flex gap-2">
                                            <textarea
                                                placeholder="Variable value (supports multiline)"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                rows={3}
                                                className="flex-1 px-2 py-1 text-[15px] border border-components-panel-border rounded input-gradient-focus focus:ring-0 outline-none resize-vertical min-h-[60px] max-h-[150px]"
                                            />
                                            <label className="flex items-center gap-1 text-[15px]">
                                                <input
                                                    type="checkbox"
                                                    checked={editIsSecret}
                                                    onChange={(e) => setEditIsSecret(e.target.checked)}
                                                />
                                                Secret
                                            </label>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={saveEdit}
                                                className="px-3 py-1 text-[15px] bg-state-accent-solid text-white rounded hover:bg-state-accent-solid-hover transition-colors"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="px-3 py-1 text-[15px] bg-components-badge-bg-dimm text-text-secondary rounded hover:bg-state-base-hover transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Display mode */
                                    <div className="p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex grow items-center gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[15px] font-medium text-text-primary truncate">
                                                        {variable.key}
                                                    </div>
                                                    <div className="text-[15px] text-text-tertiary mt-0.5">
                                                        {variable.isSecret ? '••••••••' : variable.value}
                                                    </div>
                                                </div>
                                                {variable.isSecret && (
                                                    <span className="px-2 py-0.5 text-[15px] bg-red-100 text-red-700 rounded-full">
                                                        Secret
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startEdit(index)}
                                                    className="p-1 text-text-tertiary hover:text-text-secondary hover:bg-state-base-hover rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setPendingDelete({ index, name: variable.key })}
                                                    className="p-1 text-text-tertiary hover:text-text-destructive hover:bg-state-destructive-hover rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {variables.length === 0 && (
                <div className="text-center py-8 text-text-tertiary">
                    <div className="text-[15px]">No environment variables</div>
                    <div className="text-[15px] mt-1">Use the form above to add environment variables</div>
                </div>
            )}

            <ConfirmDialog
                isOpen={pendingDelete !== null}
                title={t('deleteVariableTitle')}
                description={t('deleteVariableDescription', { name: pendingDelete?.name ?? '' })}
                confirmLabel={commonT('delete')}
                cancelLabel={commonT('cancel')}
                tone="destructive"
                onConfirm={() => {
                    if (!pendingDelete) return;
                    removeVariable(pendingDelete.index);
                    setPendingDelete(null);
                }}
                onCancel={() => setPendingDelete(null)}
            />
        </div>
    );
};

export default EnvironmentVariableManager;
