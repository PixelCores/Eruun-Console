import React, { useState } from 'react';
import { BaseEdge, getBezierPath, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';
import { Plus } from 'lucide-react';
import { getEdgeColor, EdgeStatus } from '../../utils/edge';
import { useFlowStore } from '../../stores/flowStore';

const CustomEdge: React.FC<EdgeProps> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const status = data?._status as EdgeStatus | undefined;
    const isRunning = status === EdgeStatus.RUNNING;
    const stroke = getEdgeColor(status);

    // Gradient ID for running state
    const gradientId = `edge-gradient-${id}`;

    return (
        <>
            {isRunning && (
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#296DFF" stopOpacity="1" />
                        <stop offset="100%" stopColor="#296DFF" stopOpacity="0.3" />
                    </linearGradient>
                </defs>
            )}

            <g
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <BaseEdge
                    id={id}
                    path={edgePath}
                    markerEnd={markerEnd}
                    style={{
                        ...style,
                        stroke: isRunning ? `url(#${gradientId})` : stroke,
                        strokeWidth: 2,
                        opacity: data?._dimmed ? 0.3 : (data?._waitingRun ? 0.7 : 1),
                        strokeDasharray: data?._isTemp ? '8 8' : undefined,
                        transition: 'stroke 0.3s, opacity 0.3s',
                    }}
                />

                {/* Invisible wider path for easier hovering */}
                <path
                    d={edgePath}
                    strokeWidth={20}
                    stroke="transparent"
                    fill="none"
                    style={{ cursor: 'pointer' }}
                />

                {/* Insert Button (Visible on Hover) */}
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            pointerEvents: 'all',
                            opacity: isHovered ? 1 : 0,
                            transition: 'opacity 0.2s',
                        }}
                        className="nodrag nopan"
                    >
                        <button
                            className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:outline-none"
                            onClick={(event) => {
                                event.stopPropagation();
                                const container = document.querySelector('.react-flow');
                                if (container) {
                                    const { left, top } = container.getBoundingClientRect();
                                    useFlowStore.getState().setPanelMenu({
                                        top: event.clientY - top,
                                        left: event.clientX - left,
                                        edgeId: id,
                                    });
                                }
                            }}
                        >
                            <Plus size={10} strokeWidth={3} />
                        </button>
                    </div>
                </EdgeLabelRenderer>
            </g>
        </>
    );
};

export default CustomEdge;
