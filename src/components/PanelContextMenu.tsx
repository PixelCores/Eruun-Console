/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useEffect, useState } from 'react';
import { useFlowStore } from '../stores/flowStore';
import { Plus, Play, Clipboard, Download, Upload, ChevronRight } from 'lucide-react';
import BlockSelector from './BlockSelector';
import { componentsToNodes } from '../utils/componentToNode';
import { nodesToDSL } from '../utils/nodeToComponent';
import type { Component } from '../types/app';

interface PanelContextMenuProps {
    onImportError?: () => void;
}

const PanelContextMenu: React.FC<PanelContextMenuProps> = ({ onImportError }) => {
    const { panelMenu, setPanelMenu, addNode, insertNodeOnEdge, nodes } = useFlowStore();
    const ref = useRef<HTMLDivElement>(null);
    const [showAddBlock, setShowAddBlock] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setShowAddBlock(true);
        }, 300); // 300ms delay
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setShowAddBlock(false);
        }, 150); // 150ms delay
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setPanelMenu(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [setPanelMenu]);

    if (!panelMenu) return null;

    const handleAddBlock = (type: string, data?: any) => {
        if (type === 'template' && Array.isArray(data)) {
            // Use componentsToNodes to properly convert API data to FlowNodes
            const convertedNodes = componentsToNodes(data as Component[]);

            // Add each converted node with position offset from context menu location
            convertedNodes.forEach((node, index) => {
                const id = Math.random().toString(36).substr(2, 9);
                addNode({
                    ...node,
                    id,
                    position: {
                        x: panelMenu.left + (index % 3) * 320,  // 3 columns layout
                        y: panelMenu.top + Math.floor(index / 3) * 150  // Row offset
                    },
                });
            });
            setPanelMenu(null);
            return;
        }

        const id = Math.random().toString(36).substr(2, 9);
        const newNode = {
            id,
            type: 'custom',
            position: { x: panelMenu.left + 50, y: panelMenu.top + 50 }, // Offset slightly
            data: {
                label: type.toUpperCase(),
                description: `New ${type} node`,
                icon: 'box',
                componentType: (type === 'component' ? 'webservice' : type) as any,
            },
        };

        if (panelMenu.edgeId) {
            insertNodeOnEdge(panelMenu.edgeId, newNode);
        } else {
            addNode(newNode);
        }
        setPanelMenu(null);
    };

    const handleExportDSL = () => {
        // Use the new nodesToDSL utility function for complete export
        const dsl = nodesToDSL(nodes, {
            name: 'project-export',
            alias: 'project',
            version: '1.0.0',
            project: '',
            description: 'Exported Project',
        });

        const blob = new Blob([JSON.stringify(dsl, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dsl.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setPanelMenu(null);
    };

    const handleImportDSL = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const dsl = JSON.parse(content);

                if (dsl.component && Array.isArray(dsl.component)) {
                    // Convert DSL components to API Component format for componentsToNodes
                    const apiComponents: Component[] = dsl.component.map((comp: any, index: number) => {
                        // Build the component in API format
                        const apiComponent: Component = {
                            id: index + 1,
                            appId: '',
                            name: comp.name || 'Component',
                            namespace: '',
                            replicas: comp.replicas || 1,
                            type: comp.type || 'webservice',
                            image: comp.image,
                            properties: {
                                image: comp.image,
                                ports: comp.properties?.ports || null,
                                env: comp.properties?.env || null,
                                conf: comp.properties?.conf || null,
                                secret: comp.properties?.secret || null,
                                command: comp.properties?.command || null,
                                labels: comp.properties?.labels || null,
                            },
                            traits: {},
                            createTime: new Date().toISOString(),
                            updateTime: new Date().toISOString(),
                        };

                        // Convert traits if present
                        if (comp.traits) {
                            // Convert envs
                            if (comp.traits.envs) {
                                apiComponent.traits.envs = comp.traits.envs.map((env: any) => ({
                                    name: env.name,
                                    valueFrom: env.valueFrom ? {
                                        secret: env.valueFrom.secret,
                                        field: env.valueFrom.field,
                                    } : undefined,
                                }));
                            }

                            // Convert probes
                            if (comp.traits.probes) {
                                apiComponent.traits.probes = comp.traits.probes.map((probe: any) => ({
                                    type: probe.type,
                                    initialDelaySeconds: probe.initialDelaySeconds,
                                    periodSeconds: probe.periodSeconds,
                                    timeoutSeconds: probe.timeoutSeconds,
                                    exec: probe.exec,
                                }));
                            }

                            // Convert storage
                            if (comp.traits.storage) {
                                apiComponent.traits.storage = comp.traits.storage.map((storage: any) => ({
                                    type: storage.type,
                                    name: storage.name,
                                    mountPath: storage.mountPath,
                                    subPath: storage.subPath,
                                    size: storage.size,
                                    sourceName: storage.sourceName,
                                }));
                            }

                            // Convert sidecar
                            if (comp.traits.sidecar) {
                                apiComponent.traits.sidecar = comp.traits.sidecar.map((sidecar: any) => ({
                                    name: sidecar.name,
                                    image: sidecar.image,
                                    command: sidecar.command,
                                    traits: sidecar.traits ? {
                                        envs: sidecar.traits.envs?.map((env: any) => ({
                                            name: env.name,
                                            valueFrom: env.valueFrom ? {
                                                secret: env.valueFrom.secret,
                                                field: env.valueFrom.field,
                                            } : undefined,
                                        })),
                                        storage: sidecar.traits.storage?.map((s: any) => ({
                                            type: s.type,
                                            name: s.name,
                                            mountPath: s.mountPath,
                                            subPath: s.subPath,
                                            size: s.size,
                                            sourceName: s.sourceName,
                                        })),
                                    } : undefined,
                                }));
                            }

                            // Convert init containers
                            if (comp.traits.init) {
                                apiComponent.traits.init = comp.traits.init.map((init: any) => ({
                                    name: init.name,
                                    properties: init.properties ? {
                                        image: init.properties.image,
                                        env: init.properties.env,
                                        command: init.properties.command,
                                    } : undefined,
                                    traits: init.traits ? {
                                        envs: init.traits.envs?.map((env: any) => ({
                                            name: env.name,
                                            valueFrom: env.valueFrom ? {
                                                secret: env.valueFrom.secret,
                                                field: env.valueFrom.field,
                                            } : undefined,
                                        })),
                                        storage: init.traits.storage?.map((s: any) => ({
                                            type: s.type,
                                            name: s.name,
                                            mountPath: s.mountPath,
                                            subPath: s.subPath,
                                            size: s.size,
                                            sourceName: s.sourceName,
                                        })),
                                    } : undefined,
                                }));
                            }
                        }

                        return apiComponent;
                    });

                    // Use componentsToNodes to properly convert to FlowNodes
                    const convertedNodes = componentsToNodes(apiComponents);

                    // Add each converted node with position offset from context menu location
                    convertedNodes.forEach((node, index) => {
                        const id = Math.random().toString(36).substr(2, 9);
                        addNode({
                            ...node,
                            id,
                            position: {
                                x: panelMenu.left + (index % 3) * 320,
                                y: panelMenu.top + Math.floor(index / 3) * 150,
                            },
                        });
                    });
                }
            } catch (error) {
                console.error('Failed to import DSL:', error);
                onImportError?.();
            }
        };
        reader.readAsText(file);
        // Reset the file input so the same file can be imported again
        event.target.value = '';
        setPanelMenu(null);
    };

    return (
        <div
            className="absolute z-[9] w-[200px] rounded-lg border-[0.5px] border-components-panel-border bg-components-panel-bg-blur shadow-lg backdrop-blur-sm"
            style={{
                left: panelMenu.left,
                top: panelMenu.top,
            }}
            ref={ref}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div className="p-1">
                {/* Add Node */}
                <div
                    className="relative flex h-8 cursor-pointer items-center justify-between rounded-lg px-3 text-sm text-text-secondary hover:bg-state-base-hover"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span>Add Node</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-text-tertiary" />

                    {/* Submenu for Block Selector */}
                    {showAddBlock && (
                        <div className="absolute left-full top-0 ml-1 z-50">
                            <BlockSelector onSelect={handleAddBlock} onClose={() => { }} />
                        </div>
                    )}
                </div>



                {/* Run */}
                <div className="flex h-8 cursor-pointer items-center justify-between rounded-lg px-3 text-sm text-text-secondary hover:bg-state-base-hover">
                    <div className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        <span>Run</span>
                    </div>
                    <span className="text-xs text-text-tertiary">Alt+R</span>
                </div>
            </div>

            <div className="my-1 h-[0.5px] bg-components-panel-border" />

            <div className="p-1">
                {/* Paste */}
                <div className="flex h-8 cursor-not-allowed items-center justify-between rounded-lg px-3 text-sm text-text-secondary opacity-50">
                    <div className="flex items-center gap-2">
                        <Clipboard className="h-4 w-4" />
                        <span>Paste</span>
                    </div>
                    <span className="text-xs text-text-tertiary">Ctrl+V</span>
                </div>
            </div>

            <div className="my-1 h-[0.5px] bg-components-panel-border" />

            <div className="p-1">
                {/* Export */}
                <div
                    className="flex h-8 cursor-pointer items-center justify-between rounded-lg px-3 text-sm text-text-secondary hover:bg-state-base-hover"
                    onClick={handleExportDSL}
                >
                    <div className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        <span>Export</span>
                    </div>
                </div>

                {/* Import DSL */}
                <div
                    className="flex h-8 cursor-pointer items-center justify-between rounded-lg px-3 text-sm text-text-secondary hover:bg-state-base-hover"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        <span>Import DSL</span>
                    </div>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".json"
                    onChange={handleImportDSL}
                />
            </div>

        </div>
    );
};

export default PanelContextMenu;
