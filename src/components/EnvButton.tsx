import React from 'react';
import { Leaf } from 'lucide-react';
import { useFlowStore } from '../stores/flowStore';

const EnvButton: React.FC = () => {
    const { showEnvPanel, setShowEnvPanel } = useFlowStore();

    const handleClick = () => {
        setShowEnvPanel(!showEnvPanel);
    };

    return (
        <button
            onClick={handleClick}
            className={`flex items-center justify-center rounded-md p-2 transition-colors ${showEnvPanel
                ? 'bg-state-accent-soft text-state-accent-solid hover:bg-state-accent-soft-hover'
                : 'text-text-secondary hover:bg-state-base-hover hover:text-text-primary'
                }`}
            title="Environment Variables"
        >
            <Leaf className="h-4 w-4" />
        </button>
    );
};

export default EnvButton;