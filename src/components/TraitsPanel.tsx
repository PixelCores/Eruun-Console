import React, { useState } from 'react';
import { cn } from '../utils/cn';
import { useFlowStore } from '../stores/flowStore';
import type { FlowNode, Traits } from '../types/flow';
import TraitsEnvsManager from './traits/TraitsEnvsManager';
import TraitsProbesManager from './traits/TraitsProbesManager';
import TraitsStorageManager from './traits/TraitsStorageManager';
import TraitsContainerList from './traits/TraitsContainerList';
import TraitsRbacManager from './traits/TraitsRbacManager';

interface TraitsPanelProps {
    node: FlowNode;
}

const TraitsPanel: React.FC<TraitsPanelProps> = ({ node }) => {
    const { updateNodeData } = useFlowStore();
    const [activeTab, setActiveTab] = useState<'envs' | 'probes' | 'storage' | 'sidecar' | 'init' | 'rbac'>('envs');

    const traits = node.data.traits || {};

    const updateTraits = (updates: Partial<Traits>) => {
        updateNodeData(node.id, {
            traits: { ...traits, ...updates }
        });
    };

    const tabs = [
        { id: 'envs', label: 'Envs' },
        { id: 'probes', label: 'Probes' },
        { id: 'storage', label: 'Storage' },
        { id: 'sidecar', label: 'Sidecar' },
        { id: 'init', label: 'Init' },
        { id: 'rbac', label: 'RBAC' },
    ] as const;

    return (
        <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="flex border-b border-components-panel-border mb-4 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2",
                            activeTab === tab.id
                                ? "text-state-accent-solid border-state-accent-solid"
                                : "text-text-tertiary border-transparent hover:text-text-primary"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'envs' && (
                    <TraitsEnvsManager
                        envs={traits.envs || []}
                        onChange={(envs) => updateTraits({ envs })}
                    />
                )}
                {activeTab === 'probes' && (
                    <TraitsProbesManager
                        probes={traits.probes || []}
                        onChange={(probes) => updateTraits({ probes })}
                    />
                )}
                {activeTab === 'storage' && (
                    <TraitsStorageManager
                        storage={traits.storage || []}
                        onChange={(storage) => updateTraits({ storage })}
                    />
                )}
                {activeTab === 'sidecar' && (
                    <TraitsContainerList
                        title="Sidecar Containers"
                        containers={traits.sidecar || []}
                        onChange={(sidecar) => updateTraits({ sidecar })}
                        variant="sidecar"
                    />
                )}
                {activeTab === 'init' && (
                    <TraitsContainerList
                        title="Init Containers"
                        containers={traits.init || []}
                        onChange={(init) => updateTraits({ init })}
                        variant="init"
                    />
                )}
                {activeTab === 'rbac' && (
                    <TraitsRbacManager
                        rbac={traits.rbac || []}
                        onChange={(rbac) => updateTraits({ rbac })}
                    />
                )}
            </div>
        </div>
    );
};

export default TraitsPanel;
