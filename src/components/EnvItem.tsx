import React from 'react';
import { Edit2, Trash2, Lock, Type } from 'lucide-react';
import type { EnvironmentVariable } from '../types/flow';
import { useFlowStore } from '../stores/flowStore';

interface EnvItemProps {
    variable: EnvironmentVariable;
    onEdit: (variable: EnvironmentVariable) => void;
    onDelete: (variable: EnvironmentVariable) => void;
}

const EnvItem: React.FC<EnvItemProps> = ({ variable, onEdit, onDelete }) => {
    const { envSecrets } = useFlowStore();

    const getIcon = () => {
        if (variable.isSecret) return <Lock className="h-3.5 w-3.5 text-text-tertiary" />;
        // Basic type inference or explicit type if added to EnvironmentVariable
        return <Type className="h-3.5 w-3.5 text-text-tertiary" />;
    };

    const getValue = () => {
        if (variable.isSecret) {
            return envSecrets[variable.key] ? '******' : '[__HIDDEN__]';
        }
        return variable.value;
    };

    return (
        <div className="group flex flex-col gap-1 rounded-lg border border-components-panel-border bg-components-panel-bg p-3 transition-all hover:border-state-accent-solid hover:shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-components-panel-bg-alt">
                        {getIcon()}
                    </div>
                    <span className="text-[15px] font-medium text-text-primary">{variable.key}</span>
                    <span className="text-[15px] text-text-tertiary">
                        {variable.isSecret ? 'Secret' : 'String'}
                    </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                        onClick={() => onEdit(variable)}
                        className="rounded p-1 text-text-tertiary hover:bg-state-base-hover hover:text-text-primary"
                    >
                        <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                        onClick={() => onDelete(variable)}
                        className="rounded p-1 text-text-tertiary hover:bg-state-destructive-hover hover:text-state-destructive-solid"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
            <div className="pl-8">
                <div className="truncate text-[15px] font-mono text-text-secondary">
                    {getValue()}
                </div>
                {variable.description && (
                    <div className="mt-1 truncate text-[15px] text-text-tertiary">
                        {variable.description}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnvItem;