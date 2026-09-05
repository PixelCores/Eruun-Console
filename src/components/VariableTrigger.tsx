import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import VariableModal from './VariableModal';

const VariableTrigger: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-state-accent-solid py-2 text-[15px] font-medium text-white transition-colors hover:bg-state-accent-solid-hover"
            >
                <Plus className="h-4 w-4" />
                Add Variable
            </button>
            <VariableModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
};

export default VariableTrigger;