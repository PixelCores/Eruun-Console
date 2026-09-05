
import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Save, Play, ListChecks, AlertCircle, Loader2, CheckCircle2, XCircle, X, ArrowUpCircle, RotateCcw, Trash2, Upload, FileText } from 'lucide-react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    Panel,
    useViewport,
    BackgroundVariant,
    PanOnScrollMode,
} from '@xyflow/react';
import type { NodeTypes, ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Viewport type definition
type Viewport = { x: number; y: number; zoom: number };

import { useFlowStore } from '../stores/flowStore';
import CustomNode from './CustomNode';
import CanvasControl from './CanvasControl';
import { ControlMode } from '../types/flow';
import type { FlowNode, FlowEdge, ComponentStatus, Traits } from '../types/flow';
import type { App, Workflow, Component, WorkflowCallback } from '../types/app';
import PanelContextMenu from './PanelContextMenu';
import CustomEdge from './workflow/CustomEdge';
import CustomConnectionLine from './workflow/CustomConnectionLine';
import WorkflowChecklist from './workflow/WorkflowChecklist';
import type { NodeWithIssues } from './workflow/WorkflowChecklist';
import WorkflowPanel from './workflow/WorkflowPanel';
import CallbackModal from './workflow/CallbackModal';
import ShortcutTooltip from './base/ShortcutTooltip';
import Modal from './base/Modal';
import LogPanel from './workflow/LogPanel';
import { rearrangeNodesForWorkflow, rearrangeNodesByDependency } from '../utils/workflowConnection';
import { generateAllEdges } from '../utils/componentReferences';
import { nodesAndEdgesToWorkflow } from '../utils/workflowHelper';
import { fetchWorkflows, executeWorkflow, getAppComponentsStatus, cancelWorkflow, tryApplication, saveApplication, extractTryErrorMessage, updateApplicationVersion, deleteAppResources, convertApplication, restartApplication } from '../api/apps';
import { nodesToDSL } from '../utils/nodeToComponent';
import { convertComponentToNode } from '../utils/componentToNode';
import { isEventTargetInputArea } from '../utils/keyboard';

import { useShortcuts } from '../hooks/useShortcuts';
import { useShortcutsStore, matchesShortcut } from '../stores/shortcutsStore';
import GuidedTour from './GuidedTour';
import { useEducationInit } from '../hooks/useEducationInit';

// Zoom configuration constants
const MIN_ZOOM = 0.1;  // 10%
const MAX_ZOOM = 2.0;  // 200%
const ZOOM_STEP = 0.01; // 1% per scroll

const nodeTypes: NodeTypes = {
    custom: CustomNode,
};

const edgeTypes = {
    custom: CustomEdge,
};

const defaultEdgeOptions = {
    type: 'custom',
};

const ZoomIndicator = () => {
    const { zoom } = useViewport();
    return (
        <div style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#64748b',
            pointerEvents: 'none',
            zIndex: 5
        }}>
            {Math.round(zoom * 100)}%
        </div>
    );
};

interface FlowCanvasProps {
    appId?: string;
    app?: App;
    components?: Component[];
    refreshKey?: number;
    onSaved?: () => void | Promise<void>;
    onShowApiDocs?: () => void;
}

const FlowCanvas: React.FC<FlowCanvasProps> = ({ appId, app, components, refreshKey, onSaved, onShowApiDocs }) => {
    const t = useTranslations('Workflow');
    useShortcuts();
    useEducationInit();
    const { shortcuts, shortcutsEnabled } = useShortcutsStore();
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        setSelectedNode,
        controlMode,
        setPanelMenu,
        setNodes,
        setEdges,
        isPreviewMode,
        setPreviewMode,
        taskId,
        setTaskId,
        setComponentStatuses,
        clearPreviewState,
    } = useFlowStore();

    const [viewport, setViewportState] = useState<Viewport>({ x: 0, y: 0, zoom: 1.0 });
    const [showChecklist, setShowChecklist] = useState(false);
    const [showWorkflowPanel, setShowWorkflowPanel] = useState(false);
    const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
    const [hasAppliedInitialWorkflow, setHasAppliedInitialWorkflow] = useState(false);
    const [hasAppliedWithWorkflow, setHasAppliedWithWorkflow] = useState(false); // Track if we applied edges with workflow data
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishError, setPublishError] = useState<string | null>(null);
    const [workflowResult, setWorkflowResult] = useState<{ type: 'success' | 'error'; message: string; details?: string[] } | null>(null);
    const [workflowSucceeded, setWorkflowSucceeded] = useState(false); // Track if workflow completed successfully (independent of toast)
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showRestartModal, setShowRestartModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveResult, setSaveResult] = useState<{ type: 'success' | 'error'; message: string; details?: string[] } | null>(null);

    // Callback Modal States
    const [showCallbackModal, setShowCallbackModal] = useState(false);
    const [callbackConfig, setCallbackConfig] = useState<WorkflowCallback | null>(null);

    // Upgrade Mode States
    interface UpgradeDiff {
        name: string;
        image: string;
        oldImage?: string;
        changeType: 'new' | 'update';
        changes: string[];  // List of what changed
    }
    const [saveMode, setSaveMode] = useState<'save' | 'upgrade'>('save');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [upgradeChanges, setUpgradeChanges] = useState<UpgradeDiff[]>([]);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [isConverting, setIsConverting] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const reactFlowInstanceRef = useRef<ReactFlowInstance<FlowNode, FlowEdge> | null>(null);
    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Reset internal workflow state when external refresh happens
    useEffect(() => {
        if (refreshKey === undefined || refreshKey === 0) return;
        // Only clear currentWorkflow to force re-fetch, but don't reset layout
        setCurrentWorkflow(null);
    }, [refreshKey]);

    // Auto-fetch workflow on initial load
    useEffect(() => {
        if (!appId || currentWorkflow) return;

        const loadWorkflow = async () => {
            try {
                const workflows = await fetchWorkflows(appId);
                if (workflows && workflows.length > 0) {
                    // Set the first (most recent) workflow
                    setCurrentWorkflow(workflows[0]);
                }
            } catch (error) {
                console.error('Failed to fetch workflows:', error);
            }
        };

        loadWorkflow();
    }, [appId, currentWorkflow]);

    // Handle workflow selection
    const handleSelectWorkflow = useCallback((workflow: Workflow) => {
        if (isPreviewMode) return;

        // Rearrange nodes based on workflow steps
        const rearrangedNodes = rearrangeNodesForWorkflow(workflow, nodes);
        setNodes(rearrangedNodes);

        // Generate edges from both component references and workflow stages
        const newEdges = generateAllEdges(rearrangedNodes, workflow);
        setEdges(newEdges);

        // Update current workflow
        setCurrentWorkflow(workflow);

        // Close the panel after applying
        setShowWorkflowPanel(false);
    }, [nodes, setNodes, setEdges, isPreviewMode]);

    // Start polling for task status
    const startPolling = useCallback((_taskIdToPolling?: string) => {
        // Clear any existing polling
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        const pollStatus = async () => {
            if (!appId) return;

            try {
                // Use new API: /workflow/:appId/components/status
                const status = await getAppComponentsStatus(appId);

                // Helper to map API status to frontend status
                const mapApiStatus = (apiStatus: string): ComponentStatus['status'] => {
                    const s = apiStatus.toLowerCase();
                    if (s === 'not deploy') return 'waiting';
                    if (s === 'pending') return 'pending';
                    if (s === 'cleaning') return 'cleaning';
                    if (s === 'running') return 'completed'; // Show as completed (green check) for Running (steady state)
                    if (s === 'succeeded' || s === 'completed') return 'completed';
                    if (s === 'failed' || s === 'error') return 'failed';
                    return 'waiting';
                };

                // Update component statuses
                const statusMap: Record<string, ComponentStatus> = {};
                status.components.forEach((comp) => {
                    if (comp.name) {
                        statusMap[comp.name.trim()] = {
                            name: comp.name.trim(),
                            type: comp.type,
                            status: mapApiStatus(comp.status),
                            startTime: comp.startTime,
                            endTime: comp.endTime,
                        };
                    }
                });

                // Handle shared components: they won't be returned by the API
                // Mark their status based on workflow stage progression
                const currentNodes = useFlowStore.getState().nodes;
                const sharedComponents: { name: string; type: string }[] = [];
                currentNodes.forEach((node) => {
                    const name = node.data.name ? String(node.data.name).trim() : undefined;
                    if (name && !statusMap[name] && (node.data.traits as Traits)?.share) {
                        sharedComponents.push({
                            name,
                            type: String(node.data.componentType || 'config'),
                        });
                    }
                });

                if (sharedComponents.length > 0 && currentWorkflow) {
                    // Determine status per shared component based on its workflow step
                    for (const sc of sharedComponents) {
                        // Find the workflow step containing this shared component
                        const step = currentWorkflow.steps.find(s =>
                            s.components.includes(sc.name)
                        );

                        let shouldComplete = false;
                        if (step) {
                            // Get sibling (non-shared) components in the same step
                            const siblings = step.components.filter(c => c !== sc.name);
                            if (siblings.length === 0) {
                                // Only shared component in this step, mark completed
                                shouldComplete = true;
                            } else {
                                // Check if all sibling components have reached running/completed
                                shouldComplete = siblings.every(siblingName => {
                                    const s = statusMap[siblingName]?.status;
                                    return s === 'completed' || s === 'running';
                                });
                            }
                        } else {
                            // Not in any workflow step: mark completed if all API-returned
                            // components have reached running/completed, or if the task itself is done
                            const ts = status.status?.toLowerCase();
                            const allApiComponentsDone = status.components &&
                                status.components.length > 0 &&
                                status.components.every(c => {
                                    const cs = c.status?.toLowerCase();
                                    return cs === 'running' || cs === 'completed' || cs === 'succeeded';
                                });
                            shouldComplete = allApiComponentsDone ||
                                ts === 'succeeded' || ts === 'completed' || ts === 'running';
                        }

                        statusMap[sc.name] = {
                            name: sc.name,
                            type: sc.type,
                            status: shouldComplete ? 'completed' : 'waiting',
                        };
                    }
                } else if (sharedComponents.length > 0) {
                    // No workflow available — fallback: mark as waiting
                    for (const sc of sharedComponents) {
                        statusMap[sc.name] = {
                            name: sc.name,
                            type: sc.type,
                            status: 'waiting',
                        };
                    }
                }

                setComponentStatuses(statusMap);

                // Handle workflow completion
                const taskStatus = status.status?.toLowerCase();
                const allRunning = status.components &&
                    status.components.length > 0 &&
                    status.components.every(c => c.status?.toLowerCase() === 'running');

                console.log('Poll status check:', { taskStatus, allRunning });

                if (taskStatus === 'succeeded' || taskStatus === 'completed' || taskStatus === 'running' || allRunning) {
                    console.log('Workflow success detected, showing prompt');
                    setWorkflowResult({
                        type: 'success',
                        message: 'Workflow executed successfully!',
                    });
                    setWorkflowSucceeded(true);

                    // Stop polling
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }

                    // Exit preview mode after 10 seconds
                    setTimeout(async () => {
                        clearPreviewState();
                        setWorkflowResult(null);
                        setWorkflowSucceeded(false);
                        // Refresh page data to sync status
                        await onSaved?.();
                    }, 10000);
                } else if (taskStatus === 'failed' || taskStatus === 'error') {
                    setWorkflowResult({
                        type: 'error',
                        message: 'Workflow execution failed',
                        details: ['One or more components failed to deploy.'],
                    });

                    // Stop polling
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }
                }

            } catch (error) {
                console.error('Failed to poll status:', error);
            }
        };

        // Initial poll
        pollStatus();

        // Set up interval for every 2 seconds
        pollingIntervalRef.current = setInterval(pollStatus, 2000);
    }, [appId, setComponentStatuses]);

    // Handle publish confirmation
    const handlePublishConfirm = useCallback(async () => {
        if (!appId || !currentWorkflow) return;

        setIsPublishing(true);
        setPublishError(null);

        try {
            const response = await executeWorkflow(appId, currentWorkflow.id);

            // Clear old component statuses before entering preview mode
            setComponentStatuses({});

            // Enter preview mode
            setPreviewMode(true);
            setTaskId(response.taskId);

            // Close modal
            setShowPublishModal(false);

            // Start polling for status (using appId from scope)
            startPolling();
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to execute workflow';
            setPublishError(errorMsg);

            // If task is already running, try to fetch current taskId to allow cancellation
            if (errorMsg.toLowerCase().includes('running')) {
                try {
                    const status = await getAppComponentsStatus(appId);
                    if (status.taskId) {
                        setTaskId(status.taskId);
                    }
                } catch (err) {
                    console.error('Failed to auto-fetch taskId on running error:', err);
                }
            }
        } finally {
            setIsPublishing(false);
        }
    }, [appId, currentWorkflow, setPreviewMode, setTaskId, startPolling]);

    // Handle cancel workflow
    const handleCancelWorkflow = useCallback(async () => {
        if (!appId || !taskId) return;

        setIsCancelling(true);

        try {
            await cancelWorkflow(appId, taskId);

            // Stop polling
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }

            // Exit preview mode
            clearPreviewState();
            setShowCancelModal(false);
            setPublishError(null);
            setWorkflowResult({
                type: 'success',
                message: 'Workflow cancelled successfully',
            });
        } catch (error) {
            console.error('Failed to cancel workflow:', error);
            setWorkflowResult({
                type: 'error',
                message: 'Failed to cancel workflow',
                details: [error instanceof Error ? error.message : 'Unknown error'],
            });
        } finally {
            setIsCancelling(false);
        }
    }, [appId, taskId, clearPreviewState]);

    const handleSave = useCallback(async () => {
        if (!appId || !app) return;

        setIsSaving(true);
        setSaveResult(null);

        try {
            const dsl = nodesToDSL(nodes, {
                name: app.name,
                alias: app.alias,
                version: app.version,
                project: app.project,
                description: app.description,
            });

            // Calculate workflow based on current edges
            const workflow = nodesAndEdgesToWorkflow(nodes, edges);

            const payload = {
                id: app.id || appId,
                ...dsl,
                icon: app.icon,
                templateEnabled: app.templateEnabled,
                workflow, // Add workflow to payload
                ...(callbackConfig && { callback: callbackConfig }), // Add callback config if set
            };

            const tryResult = await tryApplication(payload);
            const tryError = extractTryErrorMessage(tryResult);
            if (tryError) {
                setSaveResult({
                    type: 'error',
                    message: 'Save validation failed',
                    details: [tryError],
                });
                return;
            }

            await saveApplication({
                ...payload,
                namespace: app.namespace || 'default',
            });
            await onSaved?.();

            setSaveResult({
                type: 'success',
                message: 'Saved successfully!',
            });
        } catch (error) {
            setSaveResult({
                type: 'error',
                message: 'Save failed',
                details: [error instanceof Error ? error.message : 'Unknown error'],
            });
        } finally {
            setIsSaving(false);
        }
    }, [appId, app, nodes, edges, onSaved, callbackConfig]);

    // Ctrl/Cmd + S to trigger Save (same as button)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!shortcutsEnabled) return;

            if (isEventTargetInputArea(e.target as HTMLElement)) {
                return;
            }

            const saveShortcut = shortcuts.find(s => s.id === 'save-flow');
            if (saveShortcut?.enabled && matchesShortcut(e, saveShortcut.keys)) {
                e.preventDefault();

                // Disable Ctrl+S in upgrade mode
                if (saveMode === 'upgrade') {
                    return;
                }

                if (!appId || !app || isSaving || e.repeat) return;
                void handleSave();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [appId, app, isSaving, handleSave, saveMode, shortcuts, shortcutsEnabled]);

    // Handle Upgrade Publish
    const handleUpgradePublish = useCallback(() => {
        if (!app || !nodes) return;

        const changes: UpgradeDiff[] = [];

        nodes.forEach(node => {
            if (['webservice', 'worker', 'job', 'store'].includes(node.data.componentType || '')) {
                const nodeName = node.data.name;
                const newImage = node.data.image || '';

                if (!nodeName) return;

                // Find original component
                const originalComponent = components?.find(c => c.name === nodeName);
                const changeDetails: string[] = [];

                if (!originalComponent) {
                    // New component
                    changes.push({
                        name: nodeName,
                        image: newImage,
                        changeType: 'new',
                        changes: ['New component'],
                    });
                    return;
                }

                // Compare image
                const oldImage = originalComponent?.properties?.image || originalComponent?.image || '';
                if (oldImage !== newImage) {
                    changeDetails.push(`Image: ${oldImage || '(none)'} → ${newImage || '(none)'}`);
                }

                // Compare replicas
                const oldReplicas = originalComponent?.replicas ?? 1;
                const newReplicas = node.data.replicas ?? 1;
                if (oldReplicas !== newReplicas) {
                    changeDetails.push(`Replicas: ${oldReplicas} → ${newReplicas}`);
                }

                // Compare ports
                const oldPorts = originalComponent?.properties?.ports?.map(p => p.port).sort().join(',') || '';
                const newPorts = node.data.ports?.sort().join(',') || '';
                if (oldPorts !== newPorts) {
                    changeDetails.push(`Ports changed`);
                }

                // Compare environment variables (content, not just count)
                const oldEnv = originalComponent?.properties?.env || {};
                const newEnvArray = node.data.environmentVariables || [];
                const newEnv: Record<string, string> = {};
                newEnvArray.forEach(e => { if (e.key) newEnv[e.key] = e.value || ''; });
                if (JSON.stringify(oldEnv) !== JSON.stringify(newEnv)) {
                    changeDetails.push(`Environment variables changed`);
                }

                // Compare traits
                const oldTraits = originalComponent?.traits;
                const newTraits = node.data.traits;
                if (JSON.stringify(oldTraits || {}) !== JSON.stringify(newTraits || {})) {
                    changeDetails.push(`Traits configuration changed`);
                }

                if (changeDetails.length > 0) {
                    changes.push({
                        name: nodeName,
                        image: newImage,
                        oldImage: oldImage,
                        changeType: 'update',
                        changes: changeDetails,
                    });
                }
            }
        });

        setUpgradeChanges(changes);
        setShowUpgradeModal(true);

    }, [nodes, app, components]);

    const handleConfirmUpgrade = async () => {
        if (!appId || !app) return;

        setIsUpgrading(true);
        try {
            await updateApplicationVersion(appId, {
                version: app.version || "1.0.0",
                strategy: "rolling",
                components: upgradeChanges.map(({ oldImage, ...rest }) => rest),
                description: `Update components: ${upgradeChanges.map(c => c.name).join(', ')}`
            });

            setSaveResult({
                type: 'success',
                message: 'Application upgraded successfully!'
            });
            setShowUpgradeModal(false);

            await onSaved?.();

        } catch (error) {
            setSaveResult({
                type: 'error',
                message: 'Upgrade failed',
                details: [error instanceof Error ? error.message : 'Unknown error'],
            });
        } finally {
            setIsUpgrading(false);
        }
    };

    // Auto-dismiss save toast
    useEffect(() => {
        if (!saveResult) return;
        const timeout = setTimeout(() => setSaveResult(null), 3000);
        return () => clearTimeout(timeout);
    }, [saveResult]);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
            clearPreviewState();
        };
    }, [clearPreviewState]);

    // Auto-apply edges when nodes are loaded or workflow changes
    useEffect(() => {
        if (!appId || nodes.length === 0) return;

        // Don't rearrange nodes in preview mode
        if (isPreviewMode) return;

        // Apply layout when:
        // 1. Initial load and haven't applied yet
        // 2. Workflow just became available but we haven't applied with workflow yet
        const shouldApply = !hasAppliedInitialWorkflow ||
            (currentWorkflow && !hasAppliedWithWorkflow);

        if (!shouldApply) return;

        // Generate edges from both component references and workflow stages
        const newEdges = generateAllEdges(nodes, currentWorkflow ?? undefined);

        // Rearrange nodes based on component type
        const rearrangedNodes = rearrangeNodesByDependency(nodes, newEdges);

        // Apply the new layout and edges
        setNodes(rearrangedNodes);
        setEdges(newEdges);

        setHasAppliedInitialWorkflow(true);
        if (currentWorkflow) {
            setHasAppliedWithWorkflow(true);
        }
    }, [appId, nodes.length, hasAppliedInitialWorkflow, hasAppliedWithWorkflow, currentWorkflow, setNodes, setEdges]);

    // Generate workflow issues from nodes
    const getWorkflowIssues = useCallback((): NodeWithIssues[] => {
        const issues: NodeWithIssues[] = [];

        nodes.forEach((node) => {
            const nodeIssues: { message: string }[] = [];

            // Check required fields based on node type
            if (node.data.componentType === 'webservice' || node.data.componentType === 'store' || node.data.componentType === 'job') {
                if (!node.data.image) {
                    nodeIssues.push({ message: 'Image cannot be empty' });
                }
                const replicas = node.data.replicas;
                if (replicas === undefined || replicas < 1) {
                    nodeIssues.push({ message: 'Replicas must be at least 1' });
                }
            }

            // Check if name is empty
            if (!node.data.name) {
                nodeIssues.push({ message: 'Name cannot be empty' });
            }

            if (nodeIssues.length > 0) {
                issues.push({
                    id: node.id,
                    name: node.data.name || node.data.label || 'Unnamed Node',
                    type: node.data.componentType === 'config-secret' ? 'list' : 'reply',
                    issues: nodeIssues,
                });
            }
        });

        return issues;
    }, [nodes, edges]);

    const workflowIssues = getWorkflowIssues();

    // Track viewport changes
    const onMove = useCallback((_event: unknown, viewport: Viewport) => {
        setViewportState(viewport);
    }, []);

    const isAppRunning = components && components.length > 0 && components.every(c => c.status === 'Running');

    const [isRestarting, setIsRestarting] = useState(false);

    const handleRestart = useCallback(() => {
        if (!appId || isRestarting) return;
        setShowRestartModal(true);
    }, [appId, isRestarting]);

    const handleRestartConfirm = async () => {
        if (!appId) return;
        setIsRestarting(true);
        setShowRestartModal(false);
        try {
            const result = await restartApplication(appId);
            const hasFailures = result.failedResources && result.failedResources.length > 0;

            setSaveResult({
                type: hasFailures ? 'error' : 'success',
                message: hasFailures ? 'Restart completed with failures' : 'Application restarted successfully',
                details: hasFailures ? result.failedResources : undefined
            });

            // Refresh statuses
            await onSaved?.();
        } catch (error) {
            console.error('Restart failed:', error);
            setSaveResult({
                type: 'error',
                message: 'Restart failed',
                details: [error instanceof Error ? error.message : 'Unknown error']
            });
        } finally {
            setIsRestarting(false);
        }
    };

    const handleDelete = useCallback(async () => {
        if (!appId || !app) return;
        setIsDeleting(true);
        try {
            await deleteAppResources(appId);
            setComponentStatuses({});
            setSaveResult({
                type: 'success',
                message: 'Resources deleted (Undeployed) successfully',
            });
            setShowDeleteModal(false);
            // Refresh page data to sync status
            await onSaved?.();
        } catch (error) {
            console.error('Delete failed:', error);
            setSaveResult({
                type: 'error',
                message: 'Delete failed',
                details: [error instanceof Error ? error.message : 'Unknown error'],
            });
        } finally {
            setIsDeleting(false);
        }
    }, [appId, app, setComponentStatuses, onSaved]);

    // Custom wheel handler for 1% zoom step
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (event: WheelEvent) => {
            // Check if it's a zoom gesture (Ctrl/Cmd + scroll)
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();

                if (!reactFlowInstanceRef.current) return;

                const { x, y, zoom } = viewport;
                const rect = container.getBoundingClientRect();

                // Calculate mouse position relative to the container
                const mouseX = event.clientX - rect.left;
                const mouseY = event.clientY - rect.top;

                // Determine zoom direction
                const delta = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
                const newZoom = Math.min(Math.max(zoom + delta, MIN_ZOOM), MAX_ZOOM);

                // Calculate new viewport position to zoom towards mouse position
                const scale = newZoom / zoom;
                const newX = mouseX - (mouseX - x) * scale;
                const newY = mouseY - (mouseY - y) * scale;

                reactFlowInstanceRef.current.setViewport({ x: newX, y: newY, zoom: newZoom }, { duration: 0 });
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [viewport]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (isPreviewMode) return;
        setIsDraggingOver(true);
    }, [isPreviewMode]);

    const handleDragLeave = useCallback(() => {
        setIsDraggingOver(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);
        if (isPreviewMode) return;

        const files = e.dataTransfer.files;
        if (files.length === 0) return;

        const file = files[0];
        // Allow yaml, yml or even basic txt if it contains yaml
        if (!file.name.match(/\.(yaml|yml|txt)$/i)) {
            setSaveResult({
                type: 'error',
                message: 'Invalid file type',
                details: ['Please drop a .yaml or .yml file.'],
            });
            return;
        }

        setIsConverting(true);
        try {
            const yamlText = await file.text();
            const result = await convertApplication(yamlText);

            if (result.components && result.components.length > 0) {
                // Determine insertion position - maybe center of viewport or just fixed
                const dropX = 100;
                const dropY = 100;

                const newNodes = result.components.map((comp, index) => {
                    return convertComponentToNode(comp, {
                        x: dropX + index * 300,
                        y: dropY,
                    });
                });

                // Add to existing nodes
                setNodes([...nodes, ...newNodes]);

                setSaveResult({
                    type: 'success',
                    message: `Successfully imported ${result.components.length} components from ${file.name}!`,
                });
            } else {
                setSaveResult({
                    type: 'error',
                    message: 'No components found',
                    details: ['The YAML file did not contain any convertable components.'],
                });
            }
        } catch (error) {
            console.error('YAML conversion failed:', error);
            setSaveResult({
                type: 'error',
                message: 'Import failed',
                details: [error instanceof Error ? error.message : 'Unknown error during conversion'],
            });
        } finally {
            setIsConverting(false);
        }
    }, [nodes, setNodes, isPreviewMode]);

    const handlePaneContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
        event.preventDefault();
        const container = document.querySelector('.react-flow');
        if (container) {
            const { left, top } = container.getBoundingClientRect();
            setPanelMenu({
                top: event.clientY - top,
                left: event.clientX - left,
            });
        }
    }, [setPanelMenu]);

    const onNodeClick = useCallback((_: React.MouseEvent, node: FlowNode) => {
        setSelectedNode(node.id);
    }, [setSelectedNode]);

    const onPaneClick = useCallback((_event: React.MouseEvent) => {
        if (isPreviewMode) return;
        setSelectedNode(null);
    }, [isPreviewMode, setSelectedNode]);

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '100%', position: 'relative' }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            data-tour="canvas-area"
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={isPreviewMode ? undefined : onNodesChange}
                onEdgesChange={isPreviewMode ? undefined : onEdgesChange}
                onConnect={isPreviewMode ? undefined : onConnect}
                onNodeClick={isPreviewMode ? undefined : onNodeClick}
                onPaneClick={isPreviewMode ? undefined : onPaneClick}
                onPaneContextMenu={isPreviewMode ? undefined : handlePaneContextMenu}
                onMove={onMove}
                onInit={(instance) => {
                    reactFlowInstanceRef.current = instance;
                }}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                connectionLineComponent={CustomConnectionLine}
                defaultViewport={{ x: 0, y: 0, zoom: 1.0 }} // Default to 100%
                fitView={false}
                deleteKeyCode={null} // Disable default delete to use custom shortcuts
                panOnScroll={controlMode === ControlMode.Pointer}
                panOnDrag={controlMode === ControlMode.Hand || [1, 2]}
                selectionOnDrag={isPreviewMode ? false : controlMode === ControlMode.Pointer}
                panOnScrollMode={PanOnScrollMode.Free} // Free pan on scroll
                minZoom={MIN_ZOOM}
                maxZoom={MAX_ZOOM}
                zoomOnScroll={false} // Disabled to use custom 1% zoom step
                zoomOnPinch={true}
                zoomOnDoubleClick={false}
                nodesDraggable={!isPreviewMode}
                nodesConnectable={!isPreviewMode}
                elementsSelectable={!isPreviewMode}
                edgesFocusable={!isPreviewMode}
                selectNodesOnDrag={!isPreviewMode}
            >
                <Background color="#94a3b8" gap={20} size={1} variant={BackgroundVariant.Dots} />
                <Controls />
                <MiniMap />
                <CanvasControl />
                <PanelContextMenu
                    onImportError={() => {
                        setSaveResult({
                            type: 'error',
                            message: t('invalidDslFile'),
                        });
                    }}
                />
                <Panel position="top-right">
                    <div className="flex items-center gap-2">
                        {/* Save/Upgrade/Workflow Group */}
                        <div className="flex items-center gap-2">
                            <div data-tour="save-button" className="flex h-8 items-center rounded-lg border-[0.5px] border-components-button-secondary-border bg-components-button-secondary-bg p-0.5 shadow-xs">
                                {/* Save Button */}
                                <ShortcutTooltip
                                    label="Save"
                                    shortcutKeys={shortcuts.find(s => s.id === 'save-flow')?.keys}
                                >
                                    <button
                                        onClick={() => setSaveMode('save')}
                                        disabled={!appId || !app}
                                        className={`flex h-full items-center rounded-md px-3 text-[12px] font-medium transition-all border-none cursor-pointer ${saveMode === 'save'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700 bg-transparent'
                                            } ${(!appId || !app) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <Save className="mr-1 h-3.5 w-3.5" />
                                        Save
                                    </button>
                                </ShortcutTooltip>

                                {/* Upgrade Button */}
                                <ShortcutTooltip label="Upgrade mode">
                                    <button
                                        onClick={() => setSaveMode('upgrade')}
                                        className={`flex h-full items-center rounded-md px-3 text-[12px] font-medium transition-all border-none cursor-pointer ${saveMode === 'upgrade'
                                            ? 'bg-white text-orange-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700 bg-transparent'
                                            }`}
                                    >
                                        Upgrade
                                    </button>
                                </ShortcutTooltip>

                                <div className="mx-1 h-3.5 w-[1px] bg-divider-regular"></div>

                                {/* Workflow Button + Dropdown Panel */}
                                <div className="relative">
                                    <ShortcutTooltip label="Workflow versions">
                                        <button
                                            onClick={() => setShowWorkflowPanel(!showWorkflowPanel)}
                                            className={`flex h-full items-center rounded-md px-3 text-[12px] font-medium transition-all border-none cursor-pointer bg-transparent ${showWorkflowPanel
                                                ? 'text-blue-600'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            Workflow
                                        </button>
                                    </ShortcutTooltip>
                                    {appId && (
                                        <WorkflowPanel
                                            isOpen={showWorkflowPanel}
                                            onClose={() => setShowWorkflowPanel(false)}
                                            appId={appId}
                                            onSelectWorkflow={handleSelectWorkflow}
                                            selectedWorkflowId={currentWorkflow?.id}
                                        />
                                    )}
                                </div>

                                {/* Callback Button + Dropdown Panel */}
                                <div className="relative">
                                    <ShortcutTooltip label="Configure callbacks">
                                        <button
                                            onClick={() => setShowCallbackModal(!showCallbackModal)}
                                            className={`flex h-full items-center rounded-md px-3 text-[12px] font-medium transition-all border-none cursor-pointer bg-transparent ${callbackConfig
                                                ? 'text-green-600'
                                                : showCallbackModal
                                                    ? 'text-blue-600'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            Callback
                                        </button>
                                    </ShortcutTooltip>
                                    <CallbackModal
                                        isOpen={showCallbackModal}
                                        onClose={() => setShowCallbackModal(false)}
                                        callback={callbackConfig}
                                        onSave={setCallbackConfig}
                                    />
                                </div>
                            </div>
                            {/* App Control Group (Restart/Delete) */}
                            {appId && components && components.length > 0 && (
                                <div className="flex h-8 items-center rounded-lg border-[0.5px] border-components-button-secondary-border bg-components-button-secondary-bg p-0.5 shadow-xs">
                                    <ShortcutTooltip label="Restart application">
                                        <button
                                            onClick={handleRestart}
                                            disabled={isRestarting}
                                            className={`flex h-full items-center rounded-md px-3 text-[12px] font-medium transition-all border-none cursor-pointer text-gray-500 hover:text-blue-600 bg-transparent ${isRestarting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {isRestarting ? (
                                                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                                            )}
                                            Restart
                                        </button>
                                    </ShortcutTooltip>
                                    <ShortcutTooltip label="Delete application">
                                        <button
                                            onClick={() => setShowDeleteModal(true)}
                                            className="flex h-full items-center rounded-md px-3 text-[12px] font-medium transition-all border-none cursor-pointer text-gray-500 hover:text-red-600 bg-transparent"
                                        >
                                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                                            Delete
                                        </button>
                                    </ShortcutTooltip>
                                </div>
                            )}

                            {/* Workflow Checklist Button */}
                            <div className="relative flex h-8 items-center">
                                <ShortcutTooltip label="Workflow checklist">
                                    <button
                                        onClick={() => setShowChecklist(!showChecklist)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border-[0.5px] border-components-button-secondary-border bg-components-button-secondary-bg text-text-secondary hover:bg-state-base-hover cursor-pointer"
                                    >
                                        <ListChecks className="h-4 w-4" />
                                    </button>
                                </ShortcutTooltip>
                                {workflowIssues.length > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                                        {workflowIssues.reduce((sum, n) => sum + n.issues.length, 0)}
                                    </span>
                                )}
                            </div>

                            {/* API Docs Button */}
                            {onShowApiDocs && (
                                <ShortcutTooltip label="API Documentation">
                                    <button
                                        onClick={onShowApiDocs}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border-[0.5px] border-components-button-secondary-border bg-components-button-secondary-bg text-text-secondary hover:bg-state-base-hover cursor-pointer"
                                    >
                                        <FileText className="h-4 w-4" />
                                    </button>
                                </ShortcutTooltip>
                            )}

                            {/* Rightmost Publish Button (Dynamic) */}
                            <div className="flex h-8 items-center">
                                {saveMode === 'save' ? (
                                    <ShortcutTooltip label="Publish application">
                                        <button
                                            onClick={() => setShowPublishModal(true)}
                                            disabled={isPreviewMode}
                                            className={`flex h-8 items-center rounded-lg px-3 text-[13px] font-medium border-none ${isPreviewMode
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-components-button-primary-bg text-components-button-primary-text hover:bg-components-button-primary-hover cursor-pointer'
                                                }`}
                                        >
                                            <Play className="mr-1 h-4 w-4" />
                                            Publish
                                        </button>
                                    </ShortcutTooltip>
                                ) : (
                                    <ShortcutTooltip label="Upgrade publish">
                                        <button
                                            onClick={handleUpgradePublish}
                                            disabled={!appId || !app || isUpgrading || !isAppRunning}
                                            className={`flex h-8 items-center rounded-lg px-3 text-[13px] font-medium border-none ${!appId || !app || isUpgrading || !isAppRunning
                                                ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                                                : 'bg-orange-600 hover:bg-orange-700 text-white cursor-pointer'
                                                }`}
                                        >
                                            {isUpgrading ? (
                                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                            ) : (
                                                <ArrowUpCircle className="mr-1 h-4 w-4" />
                                            )}
                                            Publish
                                        </button>
                                    </ShortcutTooltip>
                                )}
                            </div>

                            {/* Exit Preview Mode Button */}
                            {isPreviewMode && (
                                <div className="flex h-8 items-center">
                                    <button
                                        onClick={async () => {
                                            // If workflow completed successfully, exit directly without cancel confirmation
                                            if (workflowSucceeded || workflowResult?.type === 'success') {
                                                clearPreviewState();
                                                setWorkflowResult(null);
                                                setWorkflowSucceeded(false);
                                                await onSaved?.();
                                            } else {
                                                setShowCancelModal(true);
                                            }
                                        }}
                                        className="flex h-8 items-center rounded-lg bg-gray-600 px-3 text-[13px] font-medium text-white hover:bg-gray-700 border-none cursor-pointer"
                                    >
                                        Exit Preview
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </Panel>

                {/* Workflow Checklist Panel */}
                <WorkflowChecklist
                    isOpen={showChecklist}
                    onClose={() => setShowChecklist(false)}
                    nodes={workflowIssues}
                />



                <ZoomIndicator />
            </ReactFlow>

            {/* Log Panel */}
            <LogPanel appId={appId || ''} />

            {/* Publish Confirmation Modal */}
            <Modal
                isShow={showPublishModal}
                onClose={() => {
                    setShowPublishModal(false);
                    setPublishError(null);
                }}
                title="Publish Workflow"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Are you sure you want to publish this workflow?
                    </p>

                    {currentWorkflow ? (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                                    <Play size={14} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {currentWorkflow.alias || currentWorkflow.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {(currentWorkflow.steps?.length ?? 0)} steps
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="flex items-center gap-2 text-yellow-700">
                                <AlertCircle size={16} />
                                <span className="text-sm">No workflow selected. Please select a workflow first.</span>
                            </div>
                        </div>
                    )}

                    {publishError && (
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-red-700 min-w-0">
                                    <AlertCircle size={16} className="shrink-0" />
                                    <span className="text-sm truncate">{publishError}</span>
                                </div>
                                {publishError.toLowerCase().includes('running') && taskId && (
                                    <button
                                        onClick={handleCancelWorkflow}
                                        disabled={isCancelling}
                                        className="ml-2 flex-shrink-0 flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-red-600 bg-red-100/50 hover:bg-red-200/50 rounded-md transition-colors disabled:opacity-50 border-none cursor-pointer"
                                    >
                                        {isCancelling ? (
                                            <Loader2 size={12} className="animate-spin" />
                                        ) : (
                                            <X size={12} />
                                        )}
                                        Cancel Workflow
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => {
                                setShowPublishModal(false);
                                setPublishError(null);
                            }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePublishConfirm}
                            disabled={!currentWorkflow || isPublishing}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 ${!currentWorkflow || isPublishing
                                ? 'bg-blue-300 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                                }`}
                        >
                            {isPublishing && <Loader2 size={14} className="animate-spin" />}
                            {isPublishing ? 'Publishing...' : 'Confirm'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Cancel Workflow Confirmation Modal */}
            <Modal
                isShow={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                title="Cancel Workflow"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Are you sure you want to cancel the workflow execution? This action cannot be undone.
                    </p>

                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-2 text-yellow-700">
                            <AlertCircle size={16} />
                            <span className="text-sm">Running components will be stopped.</span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setShowCancelModal(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                            Continue Running
                        </button>
                        <button
                            onClick={handleCancelWorkflow}
                            disabled={isCancelling}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 ${isCancelling
                                ? 'bg-red-300 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 cursor-pointer'
                                }`}
                        >
                            {isCancelling && <Loader2 size={14} className="animate-spin" />}
                            {isCancelling ? 'Cancelling...' : 'Cancel Workflow'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Resources Confirmation Modal */}
            <Modal
                isShow={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Resources"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Are you sure you want to stop the workflow and delete all resources for <span className="font-medium text-gray-900">"{app?.name}"</span>?
                    </p>

                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2 text-red-700">
                            <AlertCircle size={16} />
                            <span className="text-sm">This action will undeploy the application. All running containers will be stopped.</span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 ${isDeleting
                                ? 'bg-red-300 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 cursor-pointer'
                                }`}
                        >
                            {isDeleting && <Loader2 size={14} className="animate-spin" />}
                            {isDeleting ? 'Deleting...' : 'Delete Resources'}
                        </button>
                    </div>
                </div>
            </Modal>
            {/* Restart Confirmation Modal */}
            <Modal
                isShow={showRestartModal}
                onClose={() => setShowRestartModal(false)}
                title="Restart Selection"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Are you sure you want to restart the application <span className="font-medium text-gray-900">"{app?.name}"</span>?
                    </p>

                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 text-blue-700">
                            <RotateCcw size={16} />
                            <span className="text-sm">All components will be restarted to apply changes.</span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setShowRestartModal(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleRestartConfirm}
                            disabled={isRestarting}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 ${isRestarting
                                ? 'bg-blue-300 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                                }`}
                        >
                            {isRestarting && <Loader2 size={14} className="animate-spin" />}
                            {isRestarting ? 'Restarting...' : 'Restart'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Workflow Result Toast */}
            {workflowResult && (
                <div
                    className={`fixed top-24 right-6 z-[1000] max-w-sm rounded-lg shadow-lg border p-4 animate-in slide-in-from-right ${workflowResult.type === 'success'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                        }`}
                >
                    <div className="flex items-start gap-3">
                        {workflowResult.type === 'success' ? (
                            <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                            <XCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${workflowResult.type === 'success' ? 'text-green-800' : 'text-red-800'
                                }`}>
                                {workflowResult.message}
                            </p>
                            {workflowResult.details && workflowResult.details.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                    {workflowResult.details.map((detail, index) => (
                                        <li key={index} className="text-xs text-red-600">
                                            {detail}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {workflowResult.type === 'success' && (
                                <p className="mt-1 text-xs text-green-600">
                                    Exiting preview mode in 10 seconds...
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                setWorkflowResult(null);
                                if (workflowResult.type === 'error') {
                                    clearPreviewState();
                                    setWorkflowSucceeded(false);
                                }
                            }}
                            className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors cursor-pointer border-none bg-transparent"
                        >
                            <X size={14} className={workflowResult.type === 'success' ? 'text-green-500' : 'text-red-500'} />
                        </button>
                    </div>
                </div>
            )}

            {/* Save Result Toast */}
            {saveResult && (
                <div
                    className={`fixed top-20 right-6 z-[100] max-w-sm rounded-lg shadow-lg border p-4 animate-in slide-in-from-right ${saveResult.type === 'success'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                        }`}
                >
                    <div className="flex items-start gap-3">
                        {saveResult.type === 'success' ? (
                            <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                            <XCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${saveResult.type === 'success' ? 'text-green-800' : 'text-red-800'
                                }`}>
                                {saveResult.message}
                            </p>
                            {saveResult.details && saveResult.details.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                    {saveResult.details.map((detail, index) => (
                                        <li key={index} className="text-xs text-red-600">
                                            {detail}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button
                            onClick={() => setSaveResult(null)}
                            className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors cursor-pointer border-none bg-transparent"
                        >
                            <X size={14} className={saveResult.type === 'success' ? 'text-green-500' : 'text-red-500'} />
                        </button>
                    </div>
                </div>
            )}
            {/* Upgrade Confirmation Modal */}
            <Modal
                isShow={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                title="Publish Updates"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        The following components will be updated. Please confirm the changes.
                    </p>

                    <div className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-200 max-h-[300px] overflow-auto">
                        {upgradeChanges.length > 0 ? (
                            upgradeChanges.map((change, idx) => (
                                <div key={idx} className="p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-900">{change.name}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${change.changeType === 'new'
                                            ? 'text-green-600 bg-green-50 border-green-100'
                                            : 'text-blue-600 bg-blue-50 border-blue-100'
                                            }`}>
                                            {change.changeType === 'new' ? 'New' : 'Update'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 text-xs text-gray-600 bg-white p-2 rounded border border-gray-100">
                                        {change.changes.map((detail, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                                                <span className="break-all">{detail}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                No changes detected.
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={() => setShowUpgradeModal(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmUpgrade}
                        disabled={isUpgrading || upgradeChanges.length === 0}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 ${isUpgrading || upgradeChanges.length === 0
                            ? 'bg-orange-300 cursor-not-allowed'
                            : 'bg-orange-600 hover:bg-orange-700 cursor-pointer'
                            }`}
                    >
                        {isUpgrading && <Loader2 size={14} className="animate-spin" />}
                        {isUpgrading ? 'Publishing...' : 'Confirm Update'}
                    </button>
                </div>
            </Modal>

            {/* Drag and Drop Overlay */}
            {isDraggingOver && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(59, 130, 246, 0.05)',
                    border: '2px dashed #3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                    pointerEvents: 'none',
                    borderRadius: '8px',
                    margin: '10px'
                }}>
                    <div style={{
                        background: '#fff',
                        padding: '24px 48px',
                        borderRadius: '16px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: '#eff6ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Upload size={32} color="#3b82f6" />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
                                Import Components
                            </div>
                            <div style={{ fontSize: '14px', color: '#64748b' }}>
                                Drop YAML file here to convert and add to workflow
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Converting Loader */}
            {isConverting && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 101,
                }}>
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                        <span className="text-sm font-medium text-gray-600">Converting components...</span>
                    </div>
                </div>
            )}
            <GuidedTour />
        </div>
    );
};

export default FlowCanvas;
