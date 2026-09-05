import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useFlowStore } from '../stores/flowStore';
import { cn } from '../utils/cn';
import ConfigSecretPanel from './ConfigSecretPanel';
import ComponentSetMenu from './workflow/ComponentSetMenu';
import WorkflowEnvPanel from './workflow/EnvPanel';
import TraitsEnvPanel from './workflow/TraitsEnvPanel';
import TraitsStoragePanel from './workflow/TraitsStoragePanel';
import TraitsSidecarPanel from './workflow/TraitsSidecarPanel';
import TraitsInitPanel from './workflow/TraitsInitPanel';
import TraitsRbacPanel from './workflow/TraitsRbacPanel';
import TraitsIngressPanel from './workflow/TraitsIngressPanel';
import TraitsSecurityPolicyPanel from './workflow/TraitsSecurityPolicyPanel';
import TraitsServicePanel from './workflow/TraitsServicePanel';
import { Button } from './ui/Button';
import TraitsPanel from './TraitsPanel';
import componentIcon from '../assets/component.svg';
import configIcon from '../assets/config.svg';
import type { EnvironmentVariable, Traits, TraitEnv, TraitStorage, TraitContainer, TraitRbac, TraitIngressSpec, TraitSecurityPolicy, TraitServiceSpec } from '../types/flow';

type TraitsPanelType = 'env' | 'storage' | 'sidecar' | 'init' | 'rbac' | 'ingress' | 'securityPolicy' | 'service' | null;

// Edit state type
interface EditState {
    type: 'env' | 'traitsEnv' | 'traitsStorage' | 'traitsSidecar' | 'traitsInit' | 'traitsRbac' | 'traitsIngress' | 'traitsSecurityPolicy' | 'traitsService' | null;
    index: number;
    data: EnvironmentVariable | TraitEnv | TraitStorage | TraitContainer | TraitRbac | TraitIngressSpec | TraitSecurityPolicy | TraitServiceSpec | null;
}

const PANEL_CONTAINER_STYLES = 'absolute top-[70px] right-5 bottom-5 flex flex-col overflow-hidden rounded-2xl border-[0.5px] border-components-panel-border bg-white shadow-2xl z-20 transition-all duration-200';
const PANEL_TITLE_STYLES = 'text-[15px] font-semibold text-text-primary';
const PANEL_CONTENT_STYLES = 'flex-1 overflow-y-auto p-4';

export type ComponentSetSectionKey = 'system' | 'user' | 'memory' | 'vision' | 'resolution';

const PropertyPanel: React.FC = () => {
    const t = useTranslations('Workflow');
    const { nodes, selectedNodeId, updateNodeData, setSelectedNode, envSecrets, setEnvSecrets } = useFlowStore();
    const [showConfigPanel, setShowConfigPanel] = React.useState(false);
    const [activeSection, setActiveSection] = React.useState<ComponentSetSectionKey>('system');
    const [isEditingName, setIsEditingName] = useState(false);
    const [editingName, setEditingName] = useState('');
    const [showEnvPanel, setShowEnvPanel] = useState(false); // Env Panel sidebar
    const [activeTraitsPanel, setActiveTraitsPanel] = useState<TraitsPanelType>(null); // Current active traits panel
    const [editState, setEditState] = useState<EditState>({ type: null, index: -1, data: null }); // Edit state

    const selectedNode = useMemo(() => {
        return nodes.find((n) => n.id === selectedNodeId);
    }, [nodes, selectedNodeId]);

    if (!selectedNode) {
        return null;
    }

    // Use ConfigSecretPanel for config-secret type nodes
    if (selectedNode.data.componentType === 'config-secret') {
        return <ConfigSecretPanel />;
    }

    const handleEnvAdd = () => {
        setEditState({ type: null, index: -1, data: null });
        setShowEnvPanel(true);
    };

    const handleEnvAddFromPanel = (variable: EnvironmentVariable) => {
        if (!selectedNodeId) return;

        // Get the latest node data from store
        const latestNodes = useFlowStore.getState().nodes;
        const latestNode = latestNodes.find(n => n.id === selectedNodeId);
        if (!latestNode) return;

        const currentVars = latestNode.data.environmentVariables || [];

        // Check for duplicate key
        if (currentVars.some(v => v.key === variable.key)) {
            return t('variableNameExists');
        }

        // Store secret value separately before masking
        const secretValue = variable.isSecret ? variable.value : undefined;

        // Mask the value if it's a secret
        const variableToSave: EnvironmentVariable = variable.isSecret
            ? { ...variable, value: '[__HIDDEN__]' }
            : variable;

        const newVars = [...currentVars, variableToSave];

        // Store secret value separately
        if (variable.isSecret && secretValue) {
            setEnvSecrets({
                ...envSecrets,
                [variable.key]: secretValue
            });
        }

        updateNodeData(selectedNodeId, { environmentVariables: newVars });
        setShowEnvPanel(false);
    };

    const handleTraitsEnvAdd = (newEnv: TraitEnv) => {
        if (!selectedNode) return;
        const traits = (selectedNode.data.traits as Traits) || {};
        updateNodeData(selectedNode.id, {
            traits: { ...traits, envs: [...(traits.envs || []), newEnv] }
        });
        setActiveTraitsPanel(null);
    };

    const handleTraitsStorageAdd = (newStorage: TraitStorage) => {
        if (!selectedNode) return;
        const traits = (selectedNode.data.traits as Traits) || {};
        updateNodeData(selectedNode.id, {
            traits: { ...traits, storage: [...(traits.storage || []), newStorage] }
        });
        setActiveTraitsPanel(null);
    };

    const handleTraitsSidecarAdd = (newSidecar: TraitContainer) => {
        if (!selectedNode) return;
        const traits = (selectedNode.data.traits as Traits) || {};
        updateNodeData(selectedNode.id, {
            traits: { ...traits, sidecar: [...(traits.sidecar || []), newSidecar] }
        });
        setActiveTraitsPanel(null);
    };

    const handleTraitsInitAdd = (newInit: TraitContainer) => {
        if (!selectedNode) return;
        const traits = (selectedNode.data.traits as Traits) || {};
        updateNodeData(selectedNode.id, {
            traits: { ...traits, init: [...(traits.init || []), newInit] }
        });
        setActiveTraitsPanel(null);
    };

    // Edit handlers
    const handleEnvEdit = (index: number, env: EnvironmentVariable) => {
        setEditState({ type: 'env', index, data: env });
        setShowEnvPanel(true);
    };

    const handleEnvUpdate = (updatedEnv: EnvironmentVariable) => {
        if (!selectedNode || editState.index < 0) return;
        const currentVars = (selectedNode.data.environmentVariables as EnvironmentVariable[]) || [];

        if (currentVars.some((variable, index) => index !== editState.index && variable.key === updatedEnv.key)) {
            return t('variableNameExists');
        }

        const newVars = [...currentVars];
        newVars[editState.index] = updatedEnv;
        updateNodeData(selectedNode.id, { environmentVariables: newVars });
        setShowEnvPanel(false);
        setEditState({ type: null, index: -1, data: null });
    };

    const handleTraitsEnvEdit = (index: number, env: TraitEnv) => {
        setEditState({ type: 'traitsEnv', index, data: env });
        setActiveTraitsPanel('env');
    };

    const handleTraitsEnvUpdate = (updatedEnv: TraitEnv) => {
        if (!selectedNode || editState.index < 0) return;
        const traits = (selectedNode.data.traits as Traits) || {};
        const newEnvs = [...(traits.envs || [])];
        newEnvs[editState.index] = updatedEnv;
        updateNodeData(selectedNode.id, {
            traits: { ...traits, envs: newEnvs }
        });
        setActiveTraitsPanel(null);
        setEditState({ type: null, index: -1, data: null });
    };

    const handleTraitsStorageEdit = (index: number, storage: TraitStorage) => {
        setEditState({ type: 'traitsStorage', index, data: storage });
        setActiveTraitsPanel('storage');
    };

    const handleTraitsStorageUpdate = (updatedStorage: TraitStorage) => {
        if (!selectedNode || editState.index < 0) return;
        const traits = (selectedNode.data.traits as Traits) || {};
        const newStorage = [...(traits.storage || [])];
        newStorage[editState.index] = updatedStorage;
        updateNodeData(selectedNode.id, {
            traits: { ...traits, storage: newStorage }
        });
        setActiveTraitsPanel(null);
        setEditState({ type: null, index: -1, data: null });
    };

    const handleTraitsSidecarEdit = (index: number, sidecar: TraitContainer) => {
        setEditState({ type: 'traitsSidecar', index, data: sidecar });
        setActiveTraitsPanel('sidecar');
    };

    const handleTraitsSidecarUpdate = (updatedSidecar: TraitContainer) => {
        if (!selectedNode || editState.index < 0) return;
        const traits = (selectedNode.data.traits as Traits) || {};
        const newSidecar = [...(traits.sidecar || [])];
        newSidecar[editState.index] = updatedSidecar;
        updateNodeData(selectedNode.id, {
            traits: { ...traits, sidecar: newSidecar }
        });
        setActiveTraitsPanel(null);
        setEditState({ type: null, index: -1, data: null });
    };

    const handleTraitsInitEdit = (index: number, init: TraitContainer) => {
        setEditState({ type: 'traitsInit', index, data: init });
        setActiveTraitsPanel('init');
    };

    const handleTraitsInitUpdate = (updatedInit: TraitContainer) => {
        if (!selectedNode || editState.index < 0) return;
        const traits = (selectedNode.data.traits as Traits) || {};
        const newInit = [...(traits.init || [])];
        newInit[editState.index] = updatedInit;
        updateNodeData(selectedNode.id, {
            traits: { ...traits, init: newInit }
        });
        setActiveTraitsPanel(null);
        setEditState({ type: null, index: -1, data: null });
    };

    const handleTraitsRbacAdd = (newRbac: TraitRbac) => {
        if (!selectedNode) return;
        const traits = (selectedNode.data.traits as Traits) || {};
        updateNodeData(selectedNode.id, {
            traits: { ...traits, rbac: [...(traits.rbac || []), newRbac] }
        });
        setActiveTraitsPanel(null);
    };

    const handleTraitsRbacEdit = (index: number, rbac: TraitRbac) => {
        setEditState({ type: 'traitsRbac', index, data: rbac });
        setActiveTraitsPanel('rbac');
    };

    const handleTraitsRbacUpdate = (updatedRbac: TraitRbac) => {
        if (!selectedNode || editState.index < 0) return;
        const traits = (selectedNode.data.traits as Traits) || {};
        const newRbac = [...(traits.rbac || [])];
        newRbac[editState.index] = updatedRbac;
        updateNodeData(selectedNode.id, {
            traits: { ...traits, rbac: newRbac }
        });
        setActiveTraitsPanel(null);
        setEditState({ type: null, index: -1, data: null });
    };

    const handleTraitsIngressAdd = (newIngress: TraitIngressSpec) => {
        if (!selectedNode) return;
        const traits = (selectedNode.data.traits as Traits) || {};
        updateNodeData(selectedNode.id, {
            traits: { ...traits, ingress: [...(traits.ingress || []), newIngress] }
        });
        setActiveTraitsPanel(null);
    };

    const handleTraitsIngressEdit = (index: number, ingress: TraitIngressSpec) => {
        setEditState({ type: 'traitsIngress', index, data: ingress });
        setActiveTraitsPanel('ingress');
    };

    const handleTraitsIngressUpdate = (updatedIngress: TraitIngressSpec) => {
        if (!selectedNode || editState.index < 0) return;
        const traits = (selectedNode.data.traits as Traits) || {};
        const newIngress = [...(traits.ingress || [])];
        newIngress[editState.index] = updatedIngress;
        updateNodeData(selectedNode.id, {
            traits: { ...traits, ingress: newIngress }
        });
        setActiveTraitsPanel(null);
        setEditState({ type: null, index: -1, data: null });
    };

    const handleTraitsSecurityPolicyAdd = (newPolicy: TraitSecurityPolicy) => {
        if (!selectedNode) return;
        const traits = (selectedNode.data.traits as Traits) || {};
        updateNodeData(selectedNode.id, {
            traits: { ...traits, securityPolicy: [...(traits.securityPolicy || []), newPolicy] }
        });
        setActiveTraitsPanel(null);
    };

    const handleTraitsSecurityPolicyEdit = (index: number, policy: TraitSecurityPolicy) => {
        setEditState({ type: 'traitsSecurityPolicy', index, data: policy });
        setActiveTraitsPanel('securityPolicy');
    };

    const handleTraitsSecurityPolicyUpdate = (updatedPolicy: TraitSecurityPolicy) => {
        if (!selectedNode || editState.index < 0) return;
        const traits = (selectedNode.data.traits as Traits) || {};
        const newSecurityPolicy = [...(traits.securityPolicy || [])];
        newSecurityPolicy[editState.index] = updatedPolicy;
        updateNodeData(selectedNode.id, {
            traits: { ...traits, securityPolicy: newSecurityPolicy }
        });
        setActiveTraitsPanel(null);
        setEditState({ type: null, index: -1, data: null });
    };

    const handleTraitsServiceAdd = (newService: TraitServiceSpec) => {
        if (!selectedNode) return;
        const traits = (selectedNode.data.traits as Traits) || {};
        updateNodeData(selectedNode.id, {
            traits: { ...traits, service: [...(traits.service || []), newService] }
        });
        setActiveTraitsPanel(null);
    };

    const handleTraitsServiceEdit = (index: number, service: TraitServiceSpec) => {
        setEditState({ type: 'traitsService', index, data: service });
        setActiveTraitsPanel('service');
    };

    const handleTraitsServiceUpdate = (updatedService: TraitServiceSpec) => {
        if (!selectedNode || editState.index < 0) return;
        const traits = (selectedNode.data.traits as Traits) || {};
        const newService = [...(traits.service || [])];
        newService[editState.index] = updatedService;
        updateNodeData(selectedNode.id, {
            traits: { ...traits, service: newService }
        });
        setActiveTraitsPanel(null);
        setEditState({ type: null, index: -1, data: null });
    };

    // Close panel and clear edit state
    const handleCloseEnvPanel = () => {
        setShowEnvPanel(false);
        setEditState({ type: null, index: -1, data: null });
    };

    const handleCloseTraitsPanel = () => {
        setActiveTraitsPanel(null);
        setEditState({ type: null, index: -1, data: null });
    };

    return (
        <>
            {/* Floating Configuration Panel */}
            {showConfigPanel && (
                <div
                    className={cn(PANEL_CONTAINER_STYLES, "right-[440px]")}
                    style={{
                        minWidth: '400px',
                        maxWidth: '400px',
                        width: '400px',
                        height: 'auto',
                        maxHeight: 'calc(100vh - 100px)',
                    }}
                >
                    <div className="flex items-center justify-between border-b border-components-panel-border px-5 py-4">
                        <div className={PANEL_TITLE_STYLES}>Traits</div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowConfigPanel(false)}
                        >
                            <X size={16} />
                        </Button>
                    </div>
                    <div className={PANEL_CONTENT_STYLES}>
                        <TraitsPanel node={selectedNode} />
                    </div>
                </div>
            )}

            <div className="absolute top-[70px] right-5 bottom-5 flex gap-4 z-20">
                {/* Traits Panels - Left (conditionally rendered) */}
                {activeTraitsPanel === 'env' && (
                    <div
                        className="flex flex-col overflow-hidden rounded-2xl border-[0.5px] border-components-panel-border bg-white shadow-2xl transition-all duration-200"
                        style={{
                            minWidth: '360px',
                            maxWidth: '360px',
                            width: '360px',
                            height: '100%',
                        }}
                    >
                        <TraitsEnvPanel
                            onClose={handleCloseTraitsPanel}
                            onAdd={handleTraitsEnvAdd}
                            initialData={editState.type === 'traitsEnv' ? editState.data as TraitEnv : undefined}
                            onUpdate={handleTraitsEnvUpdate}
                        />
                    </div>
                )}

                {activeTraitsPanel === 'storage' && (
                    <div
                        className="flex flex-col overflow-hidden rounded-2xl border-[0.5px] border-components-panel-border bg-white shadow-2xl transition-all duration-200"
                        style={{
                            minWidth: '360px',
                            maxWidth: '360px',
                            width: '360px',
                            height: '100%',
                        }}
                    >
                        <TraitsStoragePanel
                            onClose={handleCloseTraitsPanel}
                            onAdd={handleTraitsStorageAdd}
                            initialData={editState.type === 'traitsStorage' ? editState.data as TraitStorage : undefined}
                            onUpdate={handleTraitsStorageUpdate}
                        />
                    </div>
                )}

                {activeTraitsPanel === 'sidecar' && (
                    <div
                        className="flex flex-col overflow-hidden rounded-2xl border-[0.5px] border-components-panel-border bg-white shadow-2xl transition-all duration-200"
                        style={{
                            minWidth: '400px',
                            maxWidth: '400px',
                            width: '400px',
                            height: '100%',
                        }}
                    >
                        <TraitsSidecarPanel
                            onClose={handleCloseTraitsPanel}
                            onAdd={handleTraitsSidecarAdd}
                            initialData={editState.type === 'traitsSidecar' ? editState.data as TraitContainer : undefined}
                            onUpdate={handleTraitsSidecarUpdate}
                        />
                    </div>
                )}

                {activeTraitsPanel === 'init' && (
                    <div
                        className="flex flex-col overflow-hidden rounded-2xl border-[0.5px] border-components-panel-border bg-white shadow-2xl transition-all duration-200"
                        style={{
                            minWidth: '400px',
                            maxWidth: '400px',
                            width: '400px',
                            height: '100%',
                        }}
                    >
                        <TraitsInitPanel
                            onClose={handleCloseTraitsPanel}
                            onAdd={handleTraitsInitAdd}
                            initialData={editState.type === 'traitsInit' ? editState.data as TraitContainer : undefined}
                            onUpdate={handleTraitsInitUpdate}
                        />
                    </div>
                )}

                {activeTraitsPanel === 'rbac' && (
                    <div
                        className="flex flex-col overflow-hidden rounded-2xl border-[0.5px] border-components-panel-border bg-white shadow-2xl transition-all duration-200"
                        style={{
                            minWidth: '420px',
                            maxWidth: '420px',
                            width: '420px',
                            height: '100%',
                        }}
                    >
                        <TraitsRbacPanel
                            onClose={handleCloseTraitsPanel}
                            onAdd={handleTraitsRbacAdd}
                            initialData={editState.type === 'traitsRbac' ? editState.data as TraitRbac : undefined}
                            onUpdate={handleTraitsRbacUpdate}
                        />
                    </div>
                )}

                {activeTraitsPanel === 'ingress' && (
                    <div
                        className="flex flex-col overflow-hidden rounded-2xl border-[0.5px] border-components-panel-border bg-white shadow-2xl transition-all duration-200"
                        style={{
                            minWidth: '420px',
                            maxWidth: '420px',
                            width: '420px',
                            height: '100%',
                        }}
                    >
                        <TraitsIngressPanel
                            onClose={handleCloseTraitsPanel}
                            onAdd={handleTraitsIngressAdd}
                            initialData={editState.type === 'traitsIngress' ? editState.data as TraitIngressSpec : undefined}
                            onUpdate={handleTraitsIngressUpdate}
                        />
                    </div>
                )}

                {activeTraitsPanel === 'securityPolicy' && (
                    <div
                        className="flex flex-col overflow-hidden rounded-2xl border-[0.5px] border-components-panel-border bg-white shadow-2xl transition-all duration-200"
                        style={{
                            minWidth: '420px',
                            maxWidth: '420px',
                            width: '420px',
                            height: '100%',
                        }}
                    >
                        <TraitsSecurityPolicyPanel
                            onClose={handleCloseTraitsPanel}
                            onAdd={handleTraitsSecurityPolicyAdd}
                            initialData={editState.type === 'traitsSecurityPolicy' ? editState.data as TraitSecurityPolicy : undefined}
                            onUpdate={handleTraitsSecurityPolicyUpdate}
                        />
                    </div>
                )}

                {activeTraitsPanel === 'service' && (
                    <div
                        className="flex flex-col overflow-hidden rounded-2xl border-[0.5px] border-components-panel-border bg-white shadow-2xl transition-all duration-200"
                        style={{
                            minWidth: '420px',
                            maxWidth: '420px',
                            width: '420px',
                            height: '100%',
                        }}
                    >
                        <TraitsServicePanel
                            onClose={handleCloseTraitsPanel}
                            onAdd={handleTraitsServiceAdd}
                            initialData={editState.type === 'traitsService' ? editState.data as TraitServiceSpec : undefined}
                            onUpdate={handleTraitsServiceUpdate}
                        />
                    </div>
                )}

                {/* Env Panel - Left (conditionally rendered) */}
                {showEnvPanel && !activeTraitsPanel && (
                    <div
                        className="flex flex-col overflow-hidden rounded-2xl border-[0.5px] border-components-panel-border bg-white shadow-2xl transition-all duration-200"
                        style={{
                            minWidth: '360px',
                            maxWidth: '360px',
                            width: '360px',
                            height: '100%',
                        }}
                    >
                        <WorkflowEnvPanel
                            onClose={handleCloseEnvPanel}
                            onAdd={handleEnvAddFromPanel}
                            initialData={editState.type === 'env' ? editState.data as EnvironmentVariable : undefined}
                            onUpdate={handleEnvUpdate}
                        />
                    </div>
                )}

                {/* Component Properties Panel - Right */}
                <div
                    data-tour="property-panel"
                    className="flex flex-col overflow-hidden rounded-2xl border-[0.5px] border-components-panel-border bg-white shadow-2xl transition-all duration-200"
                    style={{
                        minWidth: '400px',
                        maxWidth: '720px',
                        width: '400px',
                        height: '100%',
                    }}
                >
                    {/* Node Name and Icon - Above tabs with 10px margin */}
                    <div className="px-5 pt-4 pb-0" style={{ marginBottom: '10px' }}>
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <img
                                    src={(selectedNode.data.componentType as string)?.includes('config') || (selectedNode.data.componentType as string)?.includes('secret') ? configIcon : componentIcon}
                                    alt="icon"
                                    className="w-5 h-5"
                                />
                                {isEditingName ? (
                                    <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        onBlur={() => {
                                            if (editingName.trim()) {
                                                updateNodeData(selectedNode.id, { name: editingName.trim() });
                                            }
                                            setIsEditingName(false);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                if (editingName.trim()) {
                                                    updateNodeData(selectedNode.id, { name: editingName.trim() });
                                                }
                                                setIsEditingName(false);
                                            } else if (e.key === 'Escape') {
                                                setIsEditingName(false);
                                                setEditingName(selectedNode.data.name || '');
                                            }
                                        }}
                                        className="text-sm font-bold text-text-primary outline-none border-b-2 border-blue-300 bg-transparent"
                                        autoFocus
                                    />
                                ) : (
                                    <span
                                        className="text-sm font-bold text-text-primary cursor-pointer"
                                        onDoubleClick={() => {
                                            setEditingName(selectedNode.data.name || '');
                                            setIsEditingName(true);
                                        }}
                                    >
                                        {selectedNode.data.name || 'Unnamed'}
                                    </span>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedNode(null)}
                                className="h-6 w-6"
                            >
                                <X size={16} />
                            </Button>
                        </div>
                    </div>

                    {/* Header with Tabs */}
                    <div className="border-b border-components-panel-border">
                        <div className="flex items-center gap-6 px-5 pt-4">
                            <button className="text-[13px] font-medium text-text-primary pb-2.5 border-b-2 border-text-primary relative">
                                Settings
                            </button>
                            <button className="text-[13px] font-medium text-text-tertiary pb-2.5 border-b-2 border-transparent hover:text-text-secondary transition-colors">
                                Last Run
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className={PANEL_CONTENT_STYLES}>
                        {/* Component Set Menu */}
                        <div className="mb-4">
                            <ComponentSetMenu
                                activeKey={activeSection}
                                onChange={setActiveSection}
                                onEnvAddClick={handleEnvAdd}
                                onEnvEditClick={handleEnvEdit}
                                onTraitsEnvAddClick={() => {
                                    setEditState({ type: null, index: -1, data: null });
                                    setActiveTraitsPanel('env');
                                }}
                                onTraitsEnvEditClick={handleTraitsEnvEdit}
                                onTraitsStorageAddClick={() => {
                                    setEditState({ type: null, index: -1, data: null });
                                    setActiveTraitsPanel('storage');
                                }}
                                onTraitsStorageEditClick={handleTraitsStorageEdit}
                                onTraitsSidecarAddClick={() => {
                                    setEditState({ type: null, index: -1, data: null });
                                    setActiveTraitsPanel('sidecar');
                                }}
                                onTraitsSidecarEditClick={handleTraitsSidecarEdit}
                                onTraitsInitAddClick={() => {
                                    setEditState({ type: null, index: -1, data: null });
                                    setActiveTraitsPanel('init');
                                }}
                                onTraitsInitEditClick={handleTraitsInitEdit}
                                onTraitsRbacAddClick={() => {
                                    setEditState({ type: null, index: -1, data: null });
                                    setActiveTraitsPanel('rbac');
                                }}
                                onTraitsRbacEditClick={handleTraitsRbacEdit}
                                onTraitsIngressAddClick={() => {
                                    setEditState({ type: null, index: -1, data: null });
                                    setActiveTraitsPanel('ingress');
                                }}
                                onTraitsIngressEditClick={handleTraitsIngressEdit}
                                onTraitsSecurityPolicyAddClick={() => {
                                    setEditState({ type: null, index: -1, data: null });
                                    setActiveTraitsPanel('securityPolicy');
                                }}
                                onTraitsSecurityPolicyEditClick={handleTraitsSecurityPolicyEdit}
                                onTraitsServiceAddClick={() => {
                                    setEditState({ type: null, index: -1, data: null });
                                    setActiveTraitsPanel('service');
                                }}
                                onTraitsServiceEditClick={handleTraitsServiceEdit}
                            />
                        </div>

                        {/* Placeholder for other sections */}
                        {activeSection !== 'system' && (
                            <div className="mt-6 text-xs text-text-tertiary">
                                This area corresponds to menu "{activeSection.toUpperCase()}", form configuration can be added as needed.
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </>
    );
};

export default PropertyPanel;
