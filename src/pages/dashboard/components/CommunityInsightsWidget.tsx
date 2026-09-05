import React from 'react';
import { useResizeWidth } from '../../../hooks/useResizeWidth';

// Reusable Dot Grid Component
const HeatmapGrid: React.FC<{ activeColor: string; density?: number }> = ({ activeColor, density = 0.5 }) => {
    const [containerRef, width] = useResizeWidth<HTMLDivElement>();
    const rows = 7;
    // 每个小圆点 10px (w-2.5)，gap-2 (8px)，总宽度每列约 18px
    const cols = width ? Math.max(15, Math.min(50, Math.floor((width + 8) / 18))) : 24;
    const totalDots = rows * cols;

    // 使用确定性伪随机，防止在窗口调整大小或组件重新渲染时热力点乱闪
    const dots = React.useMemo(() => {
        const result = [];
        for (let i = 0; i < totalDots; i++) {
            // 简单的确定性伪随机公式
            const x = Math.sin(i + 1) * 10000;
            const pseudoRandom = x - Math.floor(x);
            result.push(pseudoRandom < density);
        }
        return result;
    }, [totalDots, density]);

    return (
        <div
            ref={containerRef}
            className="grid gap-2 transition-all duration-300"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
            {dots.map((filled, index) => (
                <div
                    key={index}
                    className={`w-2.5 h-2.5 rounded-full ${filled ? '' : 'bg-gray-100'}`}
                    style={{ backgroundColor: filled ? activeColor : undefined }}
                />
            ))}
        </div>
    );
};


// Individual Card Component
interface InsightCardProps {
    title: string;
    value: string;
    description: string;
    heatmapColor: string;
    density?: number;
}

const InsightCard: React.FC<InsightCardProps> = ({ title, value, description, heatmapColor, density }) => {
    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col h-full">
            {/* Title */}
            <h3 className="text-sm font-medium text-gray-500 mb-4">
                {title}
            </h3>

            {/* Value */}
            <div className="text-3xl font-bold text-gray-900 mb-2">
                {value}
            </div>

            {/* Description */}
            <div className="flex-1">
                <p className="text-xs text-gray-400 leading-relaxed max-w-[280px]">
                    {description}
                </p>
            </div>

            {/* Heatmap Area */}
            <div className="mt-auto mb-6">
                <HeatmapGrid activeColor={heatmapColor} density={density} />
            </div>

            {/* Footer Link */}
            <div className="mt-auto">
                <a href="#" className="text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors flex items-center gap-1">
                    See full insights &rarr;
                </a>
            </div>
        </div>
    );
};

const CommunityInsightsWidget: React.FC = () => {
    return (
        <div className="grid grid-cols-3 gap-6">
            <InsightCard
                title="TASK"
                value="2,345"
                description="RECENT TASKS (LAST 4 WEEKS) ACROSS ALL WORKFLOWS"
                heatmapColor="#fdba74" // Light Orange
                density={0.55}
            />
            <InsightCard
                title="SCHEDULING"
                value="48"
                description="ACTIVE SCHEDULING JOBS ACROSS ERUUN CLUSTERS"
                heatmapColor="#f97316" // Orange
                density={0.75}
            />
            <InsightCard
                title="JOBS"
                value="12.5k"
                description="TOTAL JOBS EXECUTED IN THE PAST YEAR"
                heatmapColor="#fb923c" // Medium Orange
                density={0.45}
            />
        </div>
    );
};

export default CommunityInsightsWidget;
