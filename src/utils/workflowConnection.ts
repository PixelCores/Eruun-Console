import type { FlowNode, FlowEdge } from '../types/flow';
import type { Workflow } from '../types/app';
import dagre from 'dagre';

/**
 * Apply workflow connections to canvas nodes based on workflow steps.
 * 
 * Connection logic:
 * - StepByStep mode: Sequential connection between steps
 * - DAG mode: Parallel connections (previous step connects to all components in current step)
 * 
 * @param workflow - The workflow containing steps configuration
 * @param nodes - Current canvas nodes
 * @returns New edges array based on workflow steps
 */
export const applyWorkflowConnections = (
    workflow: Workflow,
    nodes: FlowNode[]
): FlowEdge[] => {
    const edges: FlowEdge[] = [];
    const { steps } = workflow;

    if (!steps || steps.length === 0) {
        return edges;
    }

    // Create a map of component name to node id for quick lookup
    const nodeNameToId = new Map<string, string>();
    nodes.forEach((node) => {
        if (node.data.name) {
            nodeNameToId.set(node.data.name, node.id);
        }
    });

    // Track the last connected nodes (for connecting to next step)
    let previousStepNodeIds: string[] = [];

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const currentStepNodeIds: string[] = [];

        // Get all node IDs for current step's components
        for (const componentName of step.components) {
            const nodeId = nodeNameToId.get(componentName);
            if (nodeId) {
                currentStepNodeIds.push(nodeId);
            }
        }

        // Skip if no nodes found for this step
        if (currentStepNodeIds.length === 0) {
            continue;
        }

        // Connect from previous step to current step
        if (previousStepNodeIds.length > 0) {
            // Each node from previous step connects to each node in current step
            // This handles both StepByStep and DAG modes correctly
            for (const sourceId of previousStepNodeIds) {
                for (const targetId of currentStepNodeIds) {
                    const edgeId = `e-${sourceId}-${targetId}`;
                    edges.push({
                        id: edgeId,
                        source: sourceId,
                        target: targetId,
                        type: 'custom',
                    });
                }
            }
        }

        // Update previous step nodes based on mode
        if (step.mode === 'DAG') {
            // DAG mode: all components in this step become sources for next step
            previousStepNodeIds = currentStepNodeIds;
        } else {
            // StepByStep mode: only the last component becomes source for next step
            // But if there are multiple components, they are still parallel within this step
            previousStepNodeIds = currentStepNodeIds;
        }
    }

    return edges;
};

/**
 * Rearrange nodes based on workflow steps for better visualization.
 * Nodes are arranged in columns based on their step order.
 * 
 * @param workflow - The workflow containing steps configuration
 * @param nodes - Current canvas nodes
 * @returns Updated nodes with new positions
 */
export const rearrangeNodesForWorkflow = (
    workflow: Workflow,
    nodes: FlowNode[]
): FlowNode[] => {
    const { steps } = workflow;

    if (!steps || steps.length === 0) {
        return nodes;
    }

    // Create a map of component name to step index and position within step
    const componentPositions = new Map<string, { stepIndex: number; positionInStep: number; totalInStep: number }>();

    steps.forEach((step, stepIndex) => {
        step.components.forEach((componentName, positionInStep) => {
            componentPositions.set(componentName, {
                stepIndex,
                positionInStep,
                totalInStep: step.components.length,
            });
        });
    });

    // Layout constants
    const HORIZONTAL_GAP = 380;
    const VERTICAL_GAP = 200;
    const START_X = 100;
    const START_Y = 200;

    return nodes.map((node) => {
        const position = componentPositions.get(node.data.name || '');

        if (position) {
            // Calculate vertical offset to center nodes in each step
            const verticalOffset = position.totalInStep > 1
                ? (position.positionInStep - (position.totalInStep - 1) / 2) * VERTICAL_GAP
                : 0;

            return {
                ...node,
                position: {
                    x: START_X + position.stepIndex * HORIZONTAL_GAP,
                    y: START_Y + verticalOffset,
                },
            };
        }

        return node;
    });
};

/**
 * Rearrange nodes based on dependency depth (topological order).
 * Nodes are assigned to columns based on their maximum dependency depth.
 * 
 * @param nodes - Current canvas nodes
 * @param edges - Current canvas edges
 * @returns Updated nodes with new positions
 */
export const rearrangeNodesByDependency = (
    nodes: FlowNode[],
    edges: FlowEdge[]
): FlowNode[] => {
    if (nodes.length === 0) return nodes;

    // Check if any node has a custom position saved by the user
    // If so, we should respect the user's manual layout and skip auto-layout
    const hasCustomPosition = nodes.some(node => node.data.hasCustomPosition);
    if (hasCustomPosition) {
        return nodes;
    }

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Layout configuration
    const NODE_WIDTH = 240;
    const NODE_HEIGHT = 100;
    const START_X = 100;
    const START_Y = 150;

    dagreGraph.setGraph({
        rankdir: 'LR', // Left to Right layout
        nodesep: 100,  // Vertical gap between nodes
        ranksep: 200,  // Horizontal gap between ranks (columns)
    });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    return nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        
        return {
            ...node,
            position: {
                x: START_X + nodeWithPosition.x - NODE_WIDTH / 2,
                y: START_Y + nodeWithPosition.y - NODE_HEIGHT / 2,
            },
        };
    });
};
