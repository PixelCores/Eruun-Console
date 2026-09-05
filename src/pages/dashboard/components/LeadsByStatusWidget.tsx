import React from 'react';
import WidgetCard from './WidgetCard';

const LeadsByStatusWidget: React.FC = () => {
    return (
        <WidgetCard title="Leads by Status">
            <div className="flex flex-col h-full">
                <div className="mb-6">
                    <div className="text-2xl font-bold text-gray-900">213</div>
                    <div className="text-xs text-gray-400 mt-1">in pipeline</div>
                </div>

                <div className="space-y-3 mt-auto">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 w-20">Leads</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500 w-[70%]" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 w-20">Contacted</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-400 w-[85%]" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 w-20">Qualified</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 w-[50%]" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 w-20">Inactive</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-400 w-[30%]" />
                        </div>
                    </div>
                </div>
            </div>
        </WidgetCard>
    );
};

export default LeadsByStatusWidget;
