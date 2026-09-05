import type { FlowNode, FlowEdge, Traits } from '../types/flow';
import type { Component } from '../types/app';

interface ComponentReferences {
    secretRefs: string[];
    configRefs: string[];
}

/**
 * Extract referenced component names from a single traits object
 */
function extractRefsFromTraits(traits: Component['traits'] | Traits | undefined): ComponentReferences {
    const refs: ComponentReferences = { secretRefs: [], configRefs: [] };

    if (!traits) return refs;

    // Check envs for secret references
    if (traits.envs) {
        traits.envs.forEach(env => {
            if (env.valueFrom?.secret?.name) {
                refs.secretRefs.push(env.valueFrom.secret.name);
            }
        });
    }

    // Check storage for config references (type: "config" with sourceName)
    if (traits.storage) {
        traits.storage.forEach(storage => {
            if (storage.type === 'config' && storage.sourceName) {
                refs.configRefs.push(storage.sourceName);
            }
        });
    }

    // Check init containers
    if (traits.init) {
        traits.init.forEach(initContainer => {
            if (initContainer.traits) {
                const nestedRefs = extractRefsFromTraits(initContainer.traits);
                refs.secretRefs.push(...nestedRefs.secretRefs);
                refs.configRefs.push(...nestedRefs.configRefs);
            }
        });
    }

    // Check sidecar containers
    if (traits.sidecar) {
        traits.sidecar.forEach(sidecar => {
            if (sidecar.traits) {
                const nestedRefs = extractRefsFromTraits(sidecar.traits);
                refs.secretRefs.push(...nestedRefs.secretRefs);
                refs.configRefs.push(...nestedRefs.configRefs);
            }
        });
    }

    return refs;
}

/**
 * Extract all referenced component names from a component's traits
 */
export function extractComponentReferences(component: Component): ComponentReferences {
    const refs: ComponentReferences = { secretRefs: [], configRefs: [] };

    if (!component.traits) return refs;

    const traitsRefs = extractRefsFromTraits(component.traits);
    refs.secretRefs.push(...traitsRefs.secretRefs);
    refs.configRefs.push(...traitsRefs.configRefs);

    // Deduplicate
    refs.secretRefs = [...new Set(refs.secretRefs)];
    refs.configRefs = [...new Set(refs.configRefs)];

    return refs;
}

/**
 * Generate edges based on component references.
 * Creates edges from referenced components (config/secret) to referencing components (store/webservice).
 * 
 * @param nodes - Current canvas nodes
 * @param components - Original component data from API
 * @returns New edges array based on component references
 */
export function generateEdgesFromReferences(
    nodes: FlowNode[],
    components: Component[]
): FlowEdge[] {
    const edges: FlowEdge[] = [];

    // Create a map of component name to node id
    const nameToNodeId = new Map<string, string>();
    nodes.forEach(node => {
        if (node.data.name) {
            nameToNodeId.set(node.data.name, node.id);
        }
    });

    // For each component, find its references and create edges
    components.forEach(component => {
        const refs = extractComponentReferences(component);
        const targetNodeId = nameToNodeId.get(component.name);

        if (!targetNodeId) return;

        // Create edges from secret references
        refs.secretRefs.forEach(secretName => {
            const sourceNodeId = nameToNodeId.get(secretName);
            if (sourceNodeId && sourceNodeId !== targetNodeId) {
                const edgeId = `ref-${sourceNodeId}-${targetNodeId}`;
                // Avoid duplicates
                if (!edges.find(e => e.id === edgeId)) {
                    edges.push({
                        id: edgeId,
                        source: sourceNodeId,
                        target: targetNodeId,
                        type: 'custom',
                    });
                }
            }
        });

        // Create edges from config references
        refs.configRefs.forEach(configName => {
            const sourceNodeId = nameToNodeId.get(configName);
            if (sourceNodeId && sourceNodeId !== targetNodeId) {
                const edgeId = `ref-${sourceNodeId}-${targetNodeId}`;
                // Avoid duplicates
                if (!edges.find(e => e.id === edgeId)) {
                    edges.push({
                        id: edgeId,
                        source: sourceNodeId,
                        target: targetNodeId,
                        type: 'custom',
                    });
                }
            }
        });
    });

    return edges;
}

/**
 * Generate edges based on node data (traits).
 * This function extracts references directly from node.data.traits,
 * making it work for both API-loaded components and template-loaded components.
 * 
 * @param nodes - Current canvas nodes
 * @returns New edges array based on node data references
 */
export function generateEdgesFromNodes(nodes: FlowNode[]): FlowEdge[] {
    const edges: FlowEdge[] = [];

    // Create a map of component name to node id
    const nameToNodeId = new Map<string, string>();
    nodes.forEach(node => {
        if (node.data.name) {
            nameToNodeId.set(node.data.name, node.id);
        }
    });

    // For each node, find its references and create edges
    nodes.forEach(node => {
        const traits = node.data.traits as Traits | undefined;
        const refs = extractRefsFromTraits(traits);
        const targetNodeId = node.id;

        // Deduplicate refs
        const secretRefs = [...new Set(refs.secretRefs)];
        const configRefs = [...new Set(refs.configRefs)];

        // Create edges from secret references
        secretRefs.forEach(secretName => {
            const sourceNodeId = nameToNodeId.get(secretName);
            if (sourceNodeId && sourceNodeId !== targetNodeId) {
                const edgeId = `ref-${sourceNodeId}-${targetNodeId}`;
                if (!edges.find(e => e.id === edgeId)) {
                    edges.push({
                        id: edgeId,
                        source: sourceNodeId,
                        target: targetNodeId,
                        type: 'custom',
                    });
                }
            }
        });

        // Create edges from config references
        configRefs.forEach(configName => {
            const sourceNodeId = nameToNodeId.get(configName);
            if (sourceNodeId && sourceNodeId !== targetNodeId) {
                const edgeId = `ref-${sourceNodeId}-${targetNodeId}`;
                if (!edges.find(e => e.id === edgeId)) {
                    edges.push({
                        id: edgeId,
                        source: sourceNodeId,
                        target: targetNodeId,
                        type: 'custom',
                    });
                }
            }
        });
    });

    return edges;
}

/**
 * Generate edges based on workflow step order.
 * Creates edges from components in step N to components in step N+1.
 * 
 * @param nodes - Current canvas nodes
 * @param workflow - Workflow containing steps with component names
 * @returns Edges array based on workflow step progression
 */
export function generateEdgesFromWorkflow(
    nodes: FlowNode[],
    workflow: { steps: { components: string[] }[] } | undefined
): FlowEdge[] {
    const edges: FlowEdge[] = [];

    if (!workflow?.steps || workflow.steps.length < 2) return edges;

    // Create a map of component name to node id
    const nameToNodeId = new Map<string, string>();
    nodes.forEach(node => {
        if (node.data.name) {
            nameToNodeId.set(node.data.name, node.id);
        }
    });

    // Create edges between consecutive steps
    for (let i = 0; i < workflow.steps.length - 1; i++) {
        const currentStep = workflow.steps[i];
        const nextStep = workflow.steps[i + 1];

        // For each component in current step, create edge to each component in next step
        currentStep.components.forEach(sourceCompName => {
            const sourceNodeId = nameToNodeId.get(sourceCompName);
            if (!sourceNodeId) return;

            nextStep.components.forEach(targetCompName => {
                const targetNodeId = nameToNodeId.get(targetCompName);
                if (!targetNodeId || targetNodeId === sourceNodeId) return;

                // Skip workflow edges between config/secret resources to keep them in the same column (parallel)
                const sourceNode = nodes.find(n => n.id === sourceNodeId);
                const targetNode = nodes.find(n => n.id === targetNodeId);
                if (sourceNode?.data.componentType === 'config-secret' &&
                    targetNode?.data.componentType === 'config-secret') {
                    return;
                }

                const edgeId = `wf-${sourceNodeId}-${targetNodeId}`;
                if (!edges.find(e => e.id === edgeId)) {
                    edges.push({
                        id: edgeId,
                        source: sourceNodeId,
                        target: targetNodeId,
                        type: 'custom',
                    });
                }
            });
        });
    }

    return edges;
}

/**
 * Generate all edges from both component references and workflow stages.
 * Priority: Reference-based edges first, then workflow-based edges only for nodes without incoming reference edges.
 * 
 * @param nodes - Current canvas nodes
 * @param workflow - Optional workflow with steps
 * @returns Combined edges array
 */
export function generateAllEdges(
    nodes: FlowNode[],
    workflow?: { steps: { components: string[] }[] }
): FlowEdge[] {
    // Get reference-based edges (config/secret → store/webservice)
    const refEdges = generateEdgesFromNodes(nodes);

    // Track nodes that already have incoming reference edges
    const nodesWithIncomingRefEdges = new Set<string>();
    refEdges.forEach(edge => {
        nodesWithIncomingRefEdges.add(edge.target);
    });

    // Get workflow-based edges (step N → step N+1)
    const wfEdges = generateEdgesFromWorkflow(nodes, workflow);

    // Start with all reference edges
    const allEdges: FlowEdge[] = [...refEdges];

    // Only add workflow edges for targets that don't have incoming reference edges
    wfEdges.forEach(wfEdge => {
        // Check if target node already has incoming reference edges
        const targetHasRefEdges = nodesWithIncomingRefEdges.has(wfEdge.target);

        // Only add workflow edge if target doesn't have reference edges
        if (!targetHasRefEdges) {
            // Also avoid duplicate workflow edges
            const exists = allEdges.some(
                e => e.source === wfEdge.source && e.target === wfEdge.target
            );
            if (!exists) {
                allEdges.push(wfEdge);
            }
        }
    });

    return allEdges;
}
