import React, { useState, useEffect } from 'react';
import { Box, Wrench, LayoutTemplate } from 'lucide-react';
import { fetchTemplates } from '../api/apps';
import type { App } from '../types/app';

type TabKey = 'blocks' | 'tmp';

interface BlockSelectorProps {
    onSelect: (type: string, data?: unknown) => void;
    onClose: () => void;
}

const BlockSelector: React.FC<BlockSelectorProps> = ({ onSelect }) => {
    const [activeTab, setActiveTab] = useState<TabKey>('blocks');
    const [templates, setTemplates] = useState<App[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'tmp') {
            const loadTemplates = async () => {
                setIsLoading(true);
                try {
                    const data = await fetchTemplates();
                    setTemplates(data);
                } catch (error) {
                    console.error('Failed to load templates:', error);
                } finally {
                    setIsLoading(false);
                }
            };
            loadTemplates();
        }
    }, [activeTab]);

    const handleTemplateClick = async (template: App) => {
        try {
            // Fetch components for the selected template
            const components = await import('../api/apps').then(mod => mod.fetchAppComponents(template.id));
            onSelect('template', components);
        } catch (error) {
            console.error('Failed to load template components:', error);
        }
    };

    const tabs: { key: TabKey; name: string }[] = [
        { key: 'blocks', name: 'Component' },
        { key: 'tmp', name: 'Tmp' },
    ];

    const blocks = [
        { type: 'component', title: 'Component', category: 'Node' },
        { type: 'job', title: 'Job', category: 'Node' },
        { type: 'config-secret', title: 'Config/Secret', category: 'Node' },
    ];

    return (
        <div className="w-[320px] rounded-lg border-[0.5px] border-components-panel-border bg-components-panel-bg shadow-lg overflow-hidden flex flex-col">
            {/* Tabs */}
            <div className="relative flex bg-background-section-burn pl-1 pt-1 border-b border-components-panel-border">
                {tabs.map((tab) => (
                    <div
                        key={tab.key}
                        className={`
                            system-sm-medium relative mr-0.5 flex h-8 items-center rounded-t-lg px-3 cursor-pointer text-xs font-medium
                            ${activeTab === tab.key
                                ? 'bg-components-panel-bg text-text-accent border-t border-x border-components-panel-border -mb-[1px] pb-[1px]'
                                : 'text-text-tertiary hover:text-text-secondary'
                            }
                        `}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.name}
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-2 max-h-[300px]">
                {activeTab === 'blocks' && (
                    <div className="space-y-2">
                        <div className="text-xs font-medium text-text-tertiary px-2">Node</div>
                        {blocks.filter(b => b.category === 'Node').map(block => (
                            <div
                                key={block.type}
                                className="flex h-8 w-full cursor-pointer items-center rounded-lg px-2 hover:bg-state-base-hover"
                                onClick={() => onSelect(block.type)}
                            >
                                <Box className="mr-2 h-4 w-4 text-text-secondary" />
                                <span className="text-sm text-text-secondary">{block.title}</span>
                            </div>
                        ))}

                        <div className="text-xs font-medium text-text-tertiary px-2 mt-2">Other</div>
                        {blocks.filter(b => b.category === 'Other').map(block => (
                            <div
                                key={block.type}
                                className="flex h-8 w-full cursor-pointer items-center rounded-lg px-2 hover:bg-state-base-hover"
                                onClick={() => onSelect(block.type)}
                            >
                                <Wrench className="mr-2 h-4 w-4 text-text-secondary" />
                                <span className="text-sm text-text-secondary">{block.title}</span>
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'tmp' && (
                    <div className="space-y-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-20 text-sm text-text-tertiary">
                                Loading...
                            </div>
                        ) : templates.length > 0 ? (
                            templates.map(template => (
                                <div
                                    key={template.id}
                                    className="flex h-8 w-full cursor-pointer items-center rounded-lg px-2 hover:bg-state-base-hover"
                                    onClick={() => handleTemplateClick(template)}
                                >
                                    <LayoutTemplate className="mr-2 h-4 w-4 text-text-secondary" />
                                    <span className="text-sm text-text-secondary flex-1 truncate">{template.alias || template.name}</span>
                                    {template.version && (
                                        <span className="text-xs text-text-tertiary ml-2">{template.version}</span>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-20 text-sm text-text-tertiary">
                                No templates found
                            </div>
                        )}
                    </div>
                )}
                {activeTab !== 'blocks' && activeTab !== 'tmp' && (
                    <div className="flex items-center justify-center h-20 text-sm text-text-tertiary">
                        Coming soon...
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlockSelector;
