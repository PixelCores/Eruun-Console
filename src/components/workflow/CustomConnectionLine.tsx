import React from 'react';
import { getBezierPath, type ConnectionLineComponentProps } from '@xyflow/react';

const CustomConnectionLine: React.FC<ConnectionLineComponentProps> = ({
    fromX,
    fromY,
    toX,
    toY,
    fromPosition,
    toPosition,
}) => {
    const [edgePath] = getBezierPath({
        sourceX: fromX,
        sourceY: fromY,
        sourcePosition: fromPosition,
        targetX: toX,
        targetY: toY,
        targetPosition: toPosition,
    });

    return (
        <g>
            <path
                fill="none"
                stroke="#296DFF"
                strokeWidth={2}
                d={edgePath}
            />
            <rect
                x={toX}
                y={toY - 4}
                width={2}
                height={8}
                fill="#2970FF"
            />
        </g>
    );
};

export default CustomConnectionLine;
