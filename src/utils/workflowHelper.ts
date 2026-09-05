import type { FlowNode, FlowEdge } from '../types/flow';
import type { WorkflowStepCreateRequest } from '../api/apps';

// Threshold for grouping nodes in the same visual column (in pixels)
const X_POSITION_THRESHOLD = 100;

/**
 * Convert nodes and edges to workflow steps structure.
 * Nodes are grouped by their visual X-position (column).
 * Nodes with similar X positions (within threshold) are considered parallel
 * and placed in the same workflow step with mode: "DAG".
 */
export const nodesAndEdgesToWorkflow = (
    nodes: FlowNode[],
    _edges: FlowEdge[] // Kept for API compatibility; grouping is now based on X-position
): WorkflowStepCreateRequest[] => {
    // If no nodes, return empty
    if (nodes.length === 0) return [];

    // Map node id to name
    const idToName = new Map<string, string>();
    nodes.forEach(node => {
        if (node.data.name) {
            idToName.set(node.id, node.data.name);
        }
    });

    // Group nodes by X-position (visual column)
    // First, sort nodes by X-position
    const sortedNodes = [...nodes].sort((a, b) => {
        const xA = a.position?.x ?? 0;
        const xB = b.position?.x ?? 0;
        return xA - xB;
    });

    // Group nodes into columns based on X-position threshold
    const columns: FlowNode[][] = [];
    let currentColumn: FlowNode[] = [];
    let currentColumnX: number | null = null;

    sortedNodes.forEach(node => {
        const nodeX = node.position?.x ?? 0;

        if (currentColumnX === null) {
            // First node starts the first column
            currentColumn = [node];
            currentColumnX = nodeX;
        } else if (Math.abs(nodeX - currentColumnX) <= X_POSITION_THRESHOLD) {
            // Node is within threshold, add to current column
            currentColumn.push(node);
        } else {
            // Node is beyond threshold, start a new column
            if (currentColumn.length > 0) {
                columns.push(currentColumn);
            }
            currentColumn = [node];
            currentColumnX = nodeX;
        }
    });

    // Don't forget the last column
    if (currentColumn.length > 0) {
        columns.push(currentColumn);
    }

    // Convert columns to workflow steps
    // Each column becomes a step with mode: "DAG" for parallel execution
    const steps: WorkflowStepCreateRequest[] = columns.map((column, index) => {
        const componentNames = column
            .map(node => idToName.get(node.id))
            .filter(Boolean) as string[];

        return {
            name: `step-${index + 1}`,
            mode: 'DAG' as const,
            components: componentNames,
        };
    });

    // Filter out empty steps (steps with no named components)
    return steps.filter(step => step.components.length > 0);
};
