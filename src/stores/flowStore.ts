import { create } from 'zustand';
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
} from '@xyflow/react';
import type {
    Connection,
    EdgeChange,
    NodeChange,
} from '@xyflow/react';
import type { FlowState, FlowNode, FlowNodeData, ComponentStatus } from '../types/flow';
import { ControlMode } from '../types/flow';

// Helper function to generate unique node names
const generateUniqueName = (baseName: string, existingNames: string[]): string => {
    // Remove any existing numbers and trailing spaces from the base name
    const cleanBaseName = baseName.replace(/\s*\d+$/, '').trim();

    // Check if the base name already exists
    const baseExists = existingNames.some(name => name === cleanBaseName);

    // Find all names with the same base (including the original without number)
    const existingNumbers = existingNames
        .filter(name => {
            // Match exact base name or base name followed by space and number
            return name === cleanBaseName || name.startsWith(cleanBaseName + ' ');
        })
        .map(name => {
            if (name === cleanBaseName) return 0; // Original name without number counts as 0
            const match = name.match(/\s(\d+)$/);
            return match ? parseInt(match[1]) : -1;
        })
        .filter(num => num >= 0);

    // If base name doesn't exist and no numbered variants, use base name
    if (!baseExists && existingNumbers.length === 0) {
        return cleanBaseName;
    }

    // Find the next available number
    let nextNumber = 1;
    while (existingNumbers.includes(nextNumber)) {
        nextNumber++;
    }

    return `${cleanBaseName} ${nextNumber}`;
};

export const useFlowStore = create<FlowState>((set, get) => ({
    nodes: [],
    edges: [],
    setNodes: (nodes: FlowNode[]) => {
        set({ nodes });
    },
    setEdges: (edges) => {
        set({ edges });
    },
    clearNodes: () => {
        set({ nodes: [], edges: [], selectedNodeId: null });
    },
    selectedNodeId: null,
    controlMode: ControlMode.Pointer,
    panelMenu: null,
    onNodesChange: (changes: NodeChange[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes) as FlowNode[],
        });
    },
    onEdgesChange: (changes: EdgeChange[]) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },
    onConnect: (connection: Connection) => {
        set({
            edges: addEdge(connection, get().edges),
        });
    },
    addNode: (node: FlowNode) => {
        const { nodes } = get();

        // Auto-generate unique name if not provided
        if (!node.data.name) {
            const baseName = node.data.label || 'Component';
            const existingNames = nodes.map(n => n.data.name).filter(Boolean) as string[];
            node.data.name = generateUniqueName(baseName, existingNames);
        }

        set({
            nodes: [...nodes, node],
        });
    },
    insertNodeOnEdge: (edgeId: string, node: FlowNode) => {
        const { edges, nodes } = get();
        const targetEdge = edges.find(e => e.id === edgeId);
        if (!targetEdge) return;

        // Auto-generate unique name if not provided
        if (!node.data.name) {
            const baseName = node.data.label || 'Component';
            const existingNames = nodes.map(n => n.data.name).filter(Boolean) as string[];
            node.data.name = generateUniqueName(baseName, existingNames);
        }

        const newEdge1 = {
            id: `e-${targetEdge.source}-${node.id}`,
            source: targetEdge.source,
            target: node.id,
            type: 'custom',
            sourceHandle: targetEdge.sourceHandle,
        };

        const newEdge2 = {
            id: `e-${node.id}-${targetEdge.target}`,
            source: node.id,
            target: targetEdge.target,
            type: 'custom',
            targetHandle: targetEdge.targetHandle,
        };

        set({
            nodes: [...nodes, node],
            edges: [
                ...edges.filter(e => e.id !== edgeId),
                newEdge1,
                newEdge2
            ]
        });
    },
    setSelectedNode: (id: string | null) => {
        set({ selectedNodeId: id });
    },
    updateNodeData: (id: string, data: Partial<FlowNodeData>) => {
        set({
            nodes: get().nodes.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: { ...node.data, ...data },
                    };
                }
                return node;
            }),
        });
    },
    setControlMode: (mode: ControlMode) => {
        set({ controlMode: mode });
    },
    setPanelMenu: (menu) => {
        set({ panelMenu: menu });
    },
    deleteSelectedElements: () => {
        const { nodes, edges, selectedNodeId } = get();
        const nodesToDelete = nodes.filter((node) => node.selected || node.id === selectedNodeId);
        const edgesToDelete = edges.filter((edge) => edge.selected);

        if (nodesToDelete.length === 0 && edgesToDelete.length === 0) {
            return;
        }

        const nodeIdsToDelete = new Set(nodesToDelete.map((node) => node.id));

        set({
            nodes: nodes.filter((node) => !nodeIdsToDelete.has(node.id)),
            edges: edges.filter(
                (edge) =>
                    !edgesToDelete.includes(edge) &&
                    !nodeIdsToDelete.has(edge.source) &&
                    !nodeIdsToDelete.has(edge.target)
            ),
            selectedNodeId: nodeIdsToDelete.has(selectedNodeId || '') ? null : selectedNodeId,
        });
    },
    clipboard: null,
    copyNode: () => {
        const { nodes, selectedNodeId } = get();
        const selectedNode = nodes.find((n) => n.id === selectedNodeId || n.selected);
        if (selectedNode) {
            set({ clipboard: selectedNode });
        }
    },
    pasteNode: () => {
        const { clipboard, nodes } = get();
        if (!clipboard) return;

        const id = Math.random().toString(36).substr(2, 9);

        // Get existing names of nodes with the same componentType
        const sameTypeNodes = nodes.filter(
            n => n.data.componentType === clipboard.data.componentType
        );
        const existingNames = sameTypeNodes
            .map(n => n.data.name)
            .filter(Boolean) as string[];

        // Generate unique name based on the copied node's name
        const baseName = clipboard.data.name || clipboard.data.label || 'Component';
        const uniqueName = generateUniqueName(baseName, existingNames);

        const newNode: FlowNode = {
            ...clipboard,
            id,
            position: {
                x: clipboard.position.x + 50,
                y: clipboard.position.y + 50,
            },
            selected: true,
            data: {
                ...clipboard.data,
                name: uniqueName,  // Use the generated unique name
            },
        };

        set({
            nodes: [...nodes.map(n => ({ ...n, selected: false })), newNode],
            selectedNodeId: id,
        });
    },
    showEnvPanel: false,
    setShowEnvPanel: (show: boolean) => {
        set({
            showEnvPanel: show,
            // Close other panels when opening EnvPanel
            // Note: Assuming other panel states will be added or are managed elsewhere.
            // Based on requirements: setShowChatVariablePanel(false), setShowGlobalVariablePanel(false), etc.
            // For now, we just set the state.
        });
    },
    environmentVariables: [],
    setEnvironmentVariables: (vars) => set({ environmentVariables: vars }),
    envSecrets: {},
    setEnvSecrets: (secrets) => set({ envSecrets: secrets }),
    // Preview mode state
    isPreviewMode: false,
    setPreviewMode: (mode: boolean) => set({ isPreviewMode: mode }),
    taskId: null,
    setTaskId: (id: string | null) => set({ taskId: id }),
    componentStatuses: {},
    setComponentStatuses: (statuses: Record<string, ComponentStatus>) => set({ componentStatuses: statuses }),
    clearPreviewState: () => set({
        isPreviewMode: false,
        taskId: null,
        componentStatuses: {}
    }),
    // Log panel state
    showLogPanel: false,
    setShowLogPanel: (show: boolean) => set({ showLogPanel: show }),
    logComponentName: null,
    setLogComponentName: (name: string | null) => set({ logComponentName: name }),
    logs: [],
    appendLog: (line: string) => set((state) => ({ logs: [...state.logs, line] })),
    clearLogs: () => set({ logs: [] }),
    resetLogPanelState: () => set({
        showLogPanel: false,
        logComponentName: null,
        logs: []
    }),
}));
