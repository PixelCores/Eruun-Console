import React, { useEffect } from 'react';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';
import type { EnvironmentVariable } from '../../types/flow';

interface EnvManagerProps {
    variables: EnvironmentVariable[];
    onChange: (variables: EnvironmentVariable[]) => void;
    onAddClick: () => void;
    onEditClick?: (variable: EnvironmentVariable) => void;
    onClose?: () => void;
}

const EnvManager: React.FC<EnvManagerProps> = ({ variables, onChange, onAddClick, onEditClick, onClose }) => {
    // Debug: log variables
    useEffect(() => {
        console.log('EnvManager received variables:', variables, 'length:', variables?.length);
    }, [variables]);

    const handleEdit = (variable: EnvironmentVariable) => {
        if (onEditClick) {
            onEditClick(variable);
        }
    };

    const handleDelete = (variable: EnvironmentVariable) => {
        const newVars = variables.filter(v => v.key !== variable.key);
        onChange(newVars);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-medium text-text-primary">Environment Variables</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onAddClick}
                        className="flex items-center justify-center w-6 h-6 rounded-md border border-components-button-secondary-border bg-white hover:bg-state-base-hover transition-colors"
                        aria-label="Add environment variable"
                    >
                        <Plus className="h-4 w-4 text-text-primary" />
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="flex items-center justify-center w-6 h-6 rounded-md border border-components-button-secondary-border bg-white hover:bg-state-base-hover transition-colors"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4 text-text-primary" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
                {variables.length === 0 ? (
                    <div className="text-center py-8 text-text-tertiary text-sm">
                        No environment variables
                    </div>
                ) : (
                    variables.map((variable) => (
                        <div
                            key={variable.key}
                            className="group rounded-lg border border-components-panel-border bg-white p-3 hover:border-state-accent-solid transition-colors"
                        >
                            <div className="flex items-start gap-2">
                                <div className="flex items-center justify-center w-6 h-6 rounded shrink-0" style={{ backgroundColor: '#a855f7' }}>
                                    <span className="text-[10px] font-bold text-white">[ENV]</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[13px] font-semibold text-text-primary">
                                            {variable.key}
                                        </span>
                                        <span className="text-[13px] text-text-tertiary">
                                            {variable.type || 'String'}
                                        </span>
                                    </div>
                                    {variable.description && (
                                        <div className="text-[12px] text-text-tertiary line-clamp-2 mt-1">
                                            {variable.description}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <button
                                        onClick={() => handleEdit(variable)}
                                        className="p-1 rounded hover:bg-state-base-hover text-text-tertiary hover:text-text-primary"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(variable)}
                                        className="p-1 rounded hover:bg-state-base-hover text-text-tertiary hover:text-state-destructive-solid"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default EnvManager;
