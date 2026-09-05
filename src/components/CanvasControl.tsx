import React, { useState, useRef, useEffect } from 'react';
import { MousePointer2, Hand, Plus, CircleHelp } from 'lucide-react';
import { useFlowStore } from '../stores/flowStore';
import { useTourStore } from '../stores/tourStore';
import { ControlMode } from '../types/flow';
import BlockSelector from './BlockSelector';

const CanvasControl: React.FC = () => {
    const { controlMode, setControlMode, addNode } = useFlowStore();
    const { startTour, resetTour } = useTourStore();
    const [showAddBlock, setShowAddBlock] = useState(false);
    const addBlockRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (addBlockRef.current && !addBlockRef.current.contains(event.target as Node)) {
                setShowAddBlock(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleAddBlock = (type: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        const isConfigSecret = type === 'config-secret';

        addNode({
            id,
            type: 'custom',
            position: { x: Math.random() * 500 + 100, y: Math.random() * 500 + 100 },
            data: {
                label: isConfigSecret ? 'Config/Secret' : type.charAt(0).toUpperCase() + type.slice(1),
                description: isConfigSecret ? 'Manage global environment variables' : '',
                icon: isConfigSecret ? 'settings' : 'box',
                componentType: isConfigSecret ? 'config-secret' : undefined,
                originalType: isConfigSecret ? 'secret' : undefined,
            },
        });
        setShowAddBlock(false);
    };

    return (
        <div className="pointer-events-none absolute left-4 top-4 z-50 flex flex-col items-start gap-2">
            <div className="pointer-events-auto flex items-center rounded-lg border-[0.5px] border-components-actionbar-border bg-components-actionbar-bg p-0.5 text-text-tertiary shadow-lg">
                {/* Pointer Mode */}
                <div
                    className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors ${controlMode === ControlMode.Pointer
                        ? 'bg-state-accent-active text-text-accent'
                        : 'hover:bg-state-base-hover hover:text-text-secondary'
                        } `}
                    onClick={() => setControlMode(ControlMode.Pointer)}
                    title="Pointer Mode (V)"
                >
                    <MousePointer2 className="h-4 w-4" />
                </div>

                {/* Hand Mode */}
                <div
                    className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors ${controlMode === ControlMode.Hand
                        ? 'bg-state-accent-active text-text-accent'
                        : 'hover:bg-state-base-hover hover:text-text-secondary'
                        } `}
                    onClick={() => setControlMode(ControlMode.Hand)}
                    title="Hand Mode (H)"
                >
                    <Hand className="h-4 w-4" />
                </div>

                {/* Divider */}
                <div className="mx-1 h-4 w-[1px] bg-divider-regular" />

                {/* Add Block Button */}
                <div className="relative" ref={addBlockRef}>
                    <div
                        data-tour="add-node"
                        className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors ${showAddBlock
                            ? 'bg-state-accent-active text-text-accent'
                            : 'hover:bg-state-base-hover hover:text-text-secondary'
                            } `}
                        onClick={() => setShowAddBlock(!showAddBlock)}
                        title="Add Block"
                    >
                        <Plus className="h-4 w-4" />
                    </div>

                    {/* Block Selector Popup */}
                    {showAddBlock && (
                        <div className="pointer-events-auto absolute left-0 top-full mt-2 z-50">
                            <BlockSelector onSelect={handleAddBlock} onClose={() => setShowAddBlock(false)} />
                        </div>
                    )}
                </div>
            </div>

            {/* Help / Restart Tour Button */}
            <div
                className="pointer-events-auto flex items-center rounded-lg border-[0.5px] border-components-actionbar-border bg-components-actionbar-bg p-0.5 text-text-tertiary shadow-lg"
            >
                <div
                    data-tour="help-trigger"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-state-base-hover hover:text-text-secondary"
                    onClick={() => {
                        resetTour();
                        startTour();
                    }}
                    title="新手引导"
                >
                    <CircleHelp className="h-4 w-4" />
                </div>
            </div>
        </div>
    );
};

export default CanvasControl;
