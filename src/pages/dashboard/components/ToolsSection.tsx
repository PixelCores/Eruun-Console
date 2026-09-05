import React, { useState, useEffect } from 'react';
import { Search, Globe, Code, Clock, Search as SearchIcon, FileText, Database, Terminal, Settings, Star, Download } from 'lucide-react';
import type { Tool, ToolType } from '../../../types/tool';
import { fetchTools } from '../../../api/tools';

const ICON_MAP: Record<string, React.ElementType> = {
    'Globe': Globe,
    'Code': Code,
    'Clock': Clock,
    'SearchIcon': SearchIcon,
    'FileText': FileText,
    'Database': Database,
    'Terminal': Terminal,
    'Settings': Settings,
};

const ToolsSection: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'All' | ToolType>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [tools, setTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTools = async () => {
            try {
                const response = await fetchTools();
                setTools(response.data);
            } catch (error) {
                console.error('Failed to load tools:', error);
            } finally {
                setLoading(false);
            }
        };

        loadTools();
    }, []);

    const filteredTools = tools.filter(tool => {
        const matchesTab = activeTab === 'All' || tool.type === activeTab;
        const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const getIcon = (iconName: string) => {
        return ICON_MAP[iconName] || Settings;
    };

    return (
        <div className="relative h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <h1 className="text-sm font-medium text-gray-900">Agent Tools</h1>
                    <span className="text-xs text-gray-400">{tools.length} AVAILABLE</span>
                </div>
                <div className="flex items-center gap-4">
                    {/* Tab Filters */}
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                        {['All', 'MCP', 'Agent Skills'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as 'All' | ToolType)}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === tab
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search tools..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
            ) : (
                <div className="flex flex-wrap gap-6">
                    {filteredTools.map((tool) => {
                        const IconComponent = getIcon(tool.icon);
                        return (
                            <div key={tool.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col cursor-pointer relative w-[290px] h-[160px] group hover:border-blue-200 transition-colors">

                                {/* Header: Icon + Title + Type Badge */}
                                <div className="flex items-start gap-3 mb-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 p-2 ${tool.bgColor}`}>
                                        <IconComponent className={`w-full h-full ${tool.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 text-sm truncate mb-0.5">
                                            {tool.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span className="truncate">{tool.author}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Position Type Badge at top right */}
                                <div className="absolute top-6 right-6">
                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-100">
                                        {tool.type}
                                    </span>
                                </div>

                                {/* Description */}
                                <p className="text-xs text-gray-600 mb-2 line-clamp-2 flex-1">
                                    {tool.description}
                                </p>

                                {/* Footer Info */}
                                <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto">
                                    <span className="flex items-center gap-1">
                                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                        {tool.stars}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Download className="w-3 h-3" />
                                        {tool.installs}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default ToolsSection;
