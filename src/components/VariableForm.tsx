import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import type { EnvironmentVariable } from '../types/flow';
import { useFlowStore } from '../stores/flowStore';

interface VariableFormProps {
    initialData?: EnvironmentVariable | null;
    onSave: () => void;
    onCancel: () => void;
    onSubmit?: (variable: EnvironmentVariable) => string | undefined;
}

const VariableForm: React.FC<VariableFormProps> = ({ initialData, onSave, onCancel, onSubmit }) => {
    const t = useTranslations('Workflow');
    const { environmentVariables, setEnvironmentVariables, envSecrets, setEnvSecrets } = useFlowStore();
    const [keyError, setKeyError] = useState<string | null>(null);
    const [formData, setFormData] = useState<EnvironmentVariable>({
        key: '',
        value: '',
        isSecret: false,
        description: '',
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
    }, [initialData, envSecrets]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.key) return;

        const newVar: EnvironmentVariable = {
            key: formData.key,
            value: formData.isSecret ? '[__HIDDEN__]' : formData.value,
            isSecret: formData.isSecret,
            // description removed
        };

        if (onSubmit) {
            const submitError = onSubmit({ ...newVar, value: formData.value }); // Pass actual value, not masked
            if (submitError) {
                setKeyError(submitError);
                return;
            }
            onSave();
            return;
        }

        const newVars = [...environmentVariables];
        const existingIndex = newVars.findIndex(v => v.key === (initialData?.key || formData.key));

        if (existingIndex >= 0 && initialData) {
            newVars[existingIndex] = newVar;
        } else {
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

        onSave();
    };

    return (
        <form onSubmit={handleSubmit} className="rounded-lg border border-components-panel-border bg-components-panel-bg-alt p-4 space-y-4 mb-4">
            <div>
                <label className="mb-1 block text-[15px] font-medium text-text-secondary">Type</label>
                <select
                    value={formData.isSecret ? 'secret' : 'string'}
                    onChange={(e) => setFormData({ ...formData, isSecret: e.target.value === 'secret' })}
                    className="w-full rounded-lg border border-components-panel-border bg-white p-2 text-[15px] text-text-primary outline-none focus:border-state-accent-solid"
                >
                    <option value="string">String</option>
                    <option value="secret">Secret</option>
                </select>
            </div>

            <div>
                <label className="mb-1 block text-[15px] font-medium text-text-secondary">Name</label>
                <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => {
                        setFormData({ ...formData, key: e.target.value });
                        if (keyError) setKeyError(null);
                    }}
                    className={`w-full rounded-lg border bg-white p-2 text-[15px] text-text-primary outline-none focus:border-state-accent-solid ${
                        keyError ? 'border-red-300' : 'border-components-panel-border'
                    }`}
                    placeholder="API_KEY"
                    disabled={!!initialData}
                    aria-invalid={!!keyError}
                    aria-describedby={keyError ? 'variable-form-key-error' : undefined}
                />
                {keyError && (
                    <p id="variable-form-key-error" role="alert" className="mt-1 text-xs text-red-600">
                        {keyError}
                    </p>
                )}
            </div>

            <div>
                <label className="mb-1 block text-[15px] font-medium text-text-secondary">
                    Value
                    {formData.isSecret && (
                        <span className="ml-2 inline-flex items-center text-[15px] text-text-tertiary">
                            <Info className="mr-1 h-3 w-3" />
                            Value will be masked
                        </span>
                    )}
                </label>
                {formData.isSecret ? (
                    <input
                        type="password"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        className="w-full rounded-lg border border-components-panel-border bg-white p-2 text-[15px] text-text-primary outline-none focus:border-state-accent-solid"
                        placeholder="Enter secret value"
                    />
                ) : (
                    <textarea
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        className="w-full resize-none rounded-lg border border-components-panel-border bg-white p-2 text-[15px] text-text-primary outline-none focus:border-state-accent-solid"
                        placeholder="Enter value"
                        rows={3}
                    />
                )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg px-4 py-2 text-[15px] font-medium text-text-secondary hover:bg-state-base-hover"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="rounded-lg bg-state-accent-solid px-4 py-2 text-[15px] font-medium text-white hover:bg-state-accent-solid-hover"
                >
                    Save
                </button>
            </div>
        </form>
    );
};

export default VariableForm;
