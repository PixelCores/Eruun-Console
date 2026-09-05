import React from 'react';
import WidgetCard from './WidgetCard';

const SegmentationWidget: React.FC = () => {
    return (
        <WidgetCard title="Segmentation">
            <div className="flex flex-col h-full">
                <div className="mb-6">
                    <div className="text-2xl font-bold text-gray-900">2,388</div>
                    <div className="text-xs text-gray-400 mt-1">total customers</div>
                </div>

                {/* Progress Bar */}
                <div className="flex h-2 w-full rounded-full overflow-hidden mb-6">
                    <div className="w-[45%] bg-blue-500" />
                    <div className="w-[30%] bg-orange-400" />
                    <div className="w-[25%] bg-yellow-400" />
                </div>

                {/* Legend */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>CHANNELS</span>
                        <span>NUMBER</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span className="text-sm text-gray-600">Facebook</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">2341</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                            <span className="text-sm text-gray-600">Twitter</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">1231</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                            <span className="text-sm text-gray-600">Google</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">1123</span>
                    </div>
                </div>
            </div>
        </WidgetCard>
    );
};

export default SegmentationWidget;
