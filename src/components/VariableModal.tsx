import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X, Info } from 'lucide-react';
import type { EnvironmentVariable } from '../types/flow';
import { useFlowStore } from '../stores/flowStore';

interface VariableModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: EnvironmentVariable | null;
}

const VariableModal: React.FC<VariableModalProps> = ({ isOpen, onClose, initialData }) => {
    const t = useTranslations('Workflow');
    const { environmentVariables, setEnvironmentVariables, envSecrets, setEnvSecrets } = useFlowStore();
    const [keyError, setKeyError] = useState<string | null>(null);
    const [formData, setFormData] = useState<EnvironmentVariable>({
        key: '',
        value: '',
        isSecret: false,
        description: '', // Assuming description is part of the type now or we handle it
    });

    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
        if (initialData) {
            setFormData({
                ...initialData,
                value: initialData.isSecret ? (envSecrets[initialData.key] || '') : initialData.value,
            });
        } else {
            setFormData({
                key: '',
                value: '',
                isSecret: false,
                description: '',
            });
        }
        setKeyError(null);
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [initialData, isOpen, envSecrets]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.key) return;

        const newVars = [...environmentVariables];
        const existingIndex = newVars.findIndex(v => v.key === (initialData?.key || formData.key));

        const newVar: EnvironmentVariable = {
            key: formData.key,
            value: formData.isSecret ? '[__HIDDEN__]' : formData.value,
            isSecret: formData.isSecret,
            description: formData.description,
        };

        if (existingIndex >= 0 && initialData) {
            newVars[existingIndex] = newVar;
        } else {
            // Check for duplicate key if new
            if (newVars.some(v => v.key === formData.key)) {
                setKeyError(t('variableKeyExists'));
                return;
            }
            newVars.push(newVar);
        }

        setEnvironmentVariables(newVars);

        if (formData.isSecret) {
            setEnvSecrets({
                ...envSecrets,
                [formData.key]: formData.value,
            });
        }

        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-[360px] rounded-2xl border border-components-panel-border bg-components-panel-bg shadow-xl">
                <div className="flex items-center justify-between border-b border-components-panel-border p-4">
                    <h3 className="text-lg font-semibold text-text-primary">
                        {initialData ? 'Edit Variable' : 'Add Variable'}
                    </h3>
                    <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-text-secondary">Type</label>
                        <select
                            value={formData.isSecret ? 'secret' : 'string'}
                            onChange={(e) => setFormData({ ...formData, isSecret: e.target.value === 'secret' })}
                            className="w-full rounded-lg border border-components-panel-border bg-components-panel-bg-alt p-2 text-sm text-text-primary outline-none focus:border-state-accent-solid"
                        >
                            <option value="string">String</option>
                            <option value="secret">Secret</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-text-secondary">Name</label>
                        <input
                            type="text"
                            value={formData.key}
                            onChange={(e) => {
                                setFormData({ ...formData, key: e.target.value });
                                if (keyError) setKeyError(null);
                            }}
                            className={`w-full rounded-lg border bg-components-panel-bg-alt p-2 text-sm text-text-primary outline-none focus:border-state-accent-solid ${
                                keyError ? 'border-red-300' : 'border-components-panel-border'
                            }`}
                            placeholder="API_KEY"
                            disabled={!!initialData} // Prevent key change on edit for simplicity
                            aria-invalid={!!keyError}
                            aria-describedby={keyError ? 'variable-modal-key-error' : undefined}
                        />
                        {keyError && (
                            <p id="variable-modal-key-error" role="alert" className="mt-1 text-xs text-red-600">
                                {keyError}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-text-secondary">
                            Value
                            {formData.isSecret && (
                                <span className="ml-2 inline-flex items-center text-xs text-text-tertiary">
                                    <Info className="mr-1 h-3 w-3" />
                                    Value will be masked
                                </span>
                            )}
                        </label>
                        <input
                            type={formData.isSecret ? "password" : "text"}
                            value={formData.value}
                            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                            className="w-full rounded-lg border border-components-panel-border bg-components-panel-bg-alt p-2 text-sm text-text-primary outline-none focus:border-state-accent-solid"
                            placeholder={formData.isSecret ? "Enter secret value" : "Enter value"}
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-text-secondary">Description</label>
                        <textarea
                            value={formData.description ?? ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full rounded-lg border border-components-panel-border bg-components-panel-bg-alt p-2 text-sm text-text-primary outline-none focus:border-state-accent-solid"
                            rows={3}
                            placeholder="Optional description"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:bg-state-base-hover"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg bg-state-accent-solid px-4 py-2 text-sm font-medium text-white hover:bg-state-accent-solid-hover"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VariableModal;
