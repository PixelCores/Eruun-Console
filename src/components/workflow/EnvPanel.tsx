import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import {
    PortalToFollowElem,
    PortalToFollowElemContent,
    PortalToFollowElemTrigger,
} from '../ui/PortalToFollowElem';
import type { EnvironmentVariable } from '../../types/flow';

interface EnvPanelProps {
    onClose: () => void;
    onAdd: (env: EnvironmentVariable) => string | undefined;
    initialData?: EnvironmentVariable;
    onUpdate?: (env: EnvironmentVariable) => string | undefined;
}

const INPUT_STYLES = 'w-full px-3 py-2 text-sm border border-components-panel-border rounded-lg bg-white input-gradient-focus focus:ring-0 outline-none transition-colors';

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

const ENV_TYPES = [
    { value: 'String', label: 'String', desc: 'Text value' },
    { value: 'Number', label: 'Number', desc: 'Numeric value' },
    { value: 'Secret', label: 'Secret', desc: 'Sensitive value (hidden)' },
] as const;

const EnvPanel: React.FC<EnvPanelProps> = ({ onClose, onAdd, initialData, onUpdate }) => {
    const [envType, setEnvType] = useState<'String' | 'Number' | 'Secret'>('String');
    const [key, setKey] = useState('');
    const [value, setValue] = useState('');
    const [isTypeOpen, setIsTypeOpen] = useState(false);
    const [keyError, setKeyError] = useState<string | null>(null);

    const isEditMode = !!initialData;

    // Populate form when initialData changes (edit mode)
    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
        if (initialData) {
            setKey(initialData.key || '');
            setValue(initialData.value || '');
            setEnvType(initialData.type || 'String');
        } else {
            // Reset form for add mode
            setKey('');
            setValue('');
            setEnvType('String');
        }
        setKeyError(null);
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [initialData]);

    const handleSubmit = () => {
        if (!key.trim() || !value.trim()) return;

        const envData: EnvironmentVariable = {
            key: key.trim(),
            value: value.trim(),
            type: envType,
            isSecret: envType === 'Secret',
        };

        const submitError = isEditMode && onUpdate
            ? onUpdate(envData)
            : onAdd(envData);

        if (submitError) {
            setKeyError(submitError);
            return;
        }
        
        // Reset form
        setKey('');
        setValue('');
        setEnvType('String');
    };

    const isValid = key.trim() && value.trim();

    return (
        <>
            <style>{gradientBorderStyle}</style>
            <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-components-panel-border">
                <span className="text-[15px] font-semibold text-text-primary">
                    {isEditMode ? 'Edit Environment Variable' : 'Add Environment Variable'}
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
                {/* Type */}
                <div>
                    <label className="text-[13px] font-medium text-text-primary mb-2 block">
                        Type <span className="text-red-500">*</span>
                    </label>
                    <PortalToFollowElem
                        placement="bottom-start"
                        offsetValue={4}
                        trigger="click"
                        open={isTypeOpen}
                        onOpenChange={setIsTypeOpen}
                    >
                        <PortalToFollowElemTrigger asChild>
                            <button
                                type="button"
                                className={cn(INPUT_STYLES, "flex items-center justify-between cursor-pointer hover:bg-state-base-hover")}
                            >
                                <span>{envType}</span>
                                <ChevronDown className="h-4 w-4 text-text-tertiary shrink-0" />
                            </button>
                        </PortalToFollowElemTrigger>
                        <PortalToFollowElemContent className="w-[320px] p-1 bg-white border border-components-panel-border shadow-lg rounded-lg z-[100]">
                            <div className="flex flex-col gap-0.5">
                                {ENV_TYPES.map((type) => {
                                    const isSelected = envType === type.value;
                                    return (
                                        <div
                                            key={type.value}
                                            className={cn(
                                                "flex items-center gap-2.5 p-2.5 rounded-md cursor-pointer transition-colors",
                                                isSelected ? "bg-state-accent-active" : "hover:bg-state-base-hover"
                                            )}
                                            onClick={() => {
                                                setEnvType(type.value);
                                                setIsTypeOpen(false);
                                            }}
                                        >
                                            <div className={cn(
                                                "flex h-4 w-4 items-center justify-center shrink-0",
                                                isSelected ? "text-state-accent-solid" : "invisible"
                                            )}>
                                                <Check size={14} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                                <span className={cn(
                                                    "text-[13px] font-medium leading-none",
                                                    isSelected ? "text-state-accent-solid" : "text-text-primary"
                                                )}>
                                                    {type.label}
                                                </span>
                                                <span className="text-[11px] leading-normal text-text-tertiary">
                                                    {type.desc}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </PortalToFollowElemContent>
                    </PortalToFollowElem>
                </div>

                {/* Key */}
                <div>
                    <label className="text-[13px] font-medium text-text-primary mb-2 block">
                        Variable Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        className={cn(
                            INPUT_STYLES,
                            keyError && 'border-red-300 focus:border-red-400'
                        )}
                        placeholder="e.g. MYSQL_ROOT_PASSWORD"
                        value={key}
                        onChange={(e) => {
                            setKey(e.target.value);
                            if (keyError) setKeyError(null);
                        }}
                        aria-invalid={!!keyError}
                        aria-describedby={keyError ? 'workflow-env-key-error' : undefined}
                    />
                    {keyError ? (
                        <p id="workflow-env-key-error" role="alert" className="mt-1 text-xs text-red-600">
                            {keyError}
                        </p>
                    ) : (
                        <p className="mt-1 text-xs text-text-tertiary">
                            The environment variable name
                        </p>
                    )}
                </div>

                {/* Value */}
                <div>
                    <label className="text-[13px] font-medium text-text-primary mb-2 block">
                        Value <span className="text-red-500">*</span>
                    </label>
                    {envType === 'Secret' ? (
                        <input
                            type="password"
                            className={INPUT_STYLES}
                            placeholder="Enter secret value"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                        />
                    ) : (
                        <input
                            type="text"
                            className={INPUT_STYLES}
                            placeholder="Enter value"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                        />
                    )}
                    <p className="mt-1 text-xs text-text-tertiary">
                        {envType === 'Secret' ? 'Secret values are hidden' : 'The environment variable value'}
                    </p>
                </div>

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

export default EnvPanel;
