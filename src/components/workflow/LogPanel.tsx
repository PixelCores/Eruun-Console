import React, { useEffect, useRef } from 'react';
import { X, Trash2, Loader2, SquareTerminal, Container } from 'lucide-react';
import { useFlowStore } from '../../stores/flowStore';
import { cn } from '../../utils/cn';

interface LogPanelProps {
    appId: string;
}

const LogPanel: React.FC<LogPanelProps> = ({ appId }) => {
    const {
        showLogPanel,
        setShowLogPanel,
        logComponentName,
        logs,
        appendLog,
        clearLogs,
        selectedNodeId
    } = useFlowStore();

    const scrollRef = useRef<HTMLDivElement>(null);
    const [isStreaming, setIsStreaming] = React.useState(false);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    // Streaming Connection management
    useEffect(() => {
        let eventSource: EventSource | null = null;
        let retryCount = 0;
        const maxRetries = 3;

        if (showLogPanel && logComponentName && appId) {
            // Clear previous logs when switching components
            clearLogs();

            const connectEventSource = () => {
                // Use EventSource for SSE - it's the native browser API for Server-Sent Events
                const url = `/api/v1/applications/${appId}/components/${logComponentName}/logs`;
                console.log('[LogPanel] Connecting to EventSource:', url);
                setIsStreaming(true);

                eventSource = new EventSource(url);

                eventSource.onopen = () => {
                    console.log('[LogPanel] EventSource connection opened');
                    retryCount = 0; // Reset retry count on successful connection
                };

                eventSource.onmessage = (event) => {
                    // SSE data events - each message has a 'data' field
                    if (event.data) {
                        appendLog(event.data);
                    }
                };

                eventSource.onerror = (error) => {
                    console.error('[LogPanel] EventSource error:', error);

                    if (eventSource) {
                        // Check if the connection was closed
                        if (eventSource.readyState === EventSource.CLOSED) {
                            eventSource.close();
                            setIsStreaming(false);

                            // Only retry if we haven't exceeded max retries
                            if (retryCount < maxRetries) {
                                retryCount++;
                                appendLog(`[Info] Connection closed, retrying (${retryCount}/${maxRetries})...`);
                                setTimeout(connectEventSource, 2000); // Retry after 2 seconds
                            } else {
                                appendLog('[Error] Connection closed after max retries. Backend may be unavailable.');
                            }
                        } else if (eventSource.readyState === EventSource.CONNECTING) {
                            // Reconnecting is handled automatically by EventSource
                            console.log('[LogPanel] EventSource reconnecting...');
                        }
                    }
                };
            };

            connectEventSource();

            return () => {
                console.log('[LogPanel] Closing EventSource connection');
                if (eventSource) {
                    eventSource.close();
                }
                setIsStreaming(false);
            };
        }
    }, [showLogPanel, logComponentName, appId, appendLog, clearLogs]);

    if (!showLogPanel) return null;

    // Sidebar width is 200px, property panel width is ~420px (400px panel + 20px margin)
    // When a node is selected, leave space for the property panel on the right
    // Add 5px (approximately 1.25rem = 5 in tailwind) margin on all sides
    return (
        <div
            className={cn(
                "fixed bg-white border border-gray-200 z-40 flex shadow-lg transition-all duration-300 rounded-2xl overflow-hidden",
                selectedNodeId ? "right-[430px]" : "right-[10px]"
            )}
            style={{
                left: 'calc(200px + 10px)', // Sidebar width + 10px margin
                bottom: '10px', // 10px margin from bottom
                height: '280px',
                animation: 'slideUp 0.3s ease-out forwards'
            }}
        >
            {/* Left Sidebar - Container List */}
            <div className="w-48 border-r border-gray-200 bg-gray-50/80 flex flex-col shrink-0">
                {/* Sidebar Header */}
                <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                    <Container size={16} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Containers</span>
                </div>

                {/* Container List */}
                <div className="flex-1 overflow-auto p-2">
                    {/* Show current component as the selected container */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-sm font-medium truncate">{logComponentName}</span>
                    </div>

                    {/* Placeholder for more containers - could be fetched from API */}
                    <p className="mt-4 px-3 text-xs text-gray-400">
                        Showing logs from this component
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <SquareTerminal size={16} className="text-blue-600" />
                            <span className="text-sm font-semibold text-gray-900">Container Output</span>
                        </div>

                        {isStreaming && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 border border-green-200">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-xs text-green-700">Live</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={clearLogs}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors border-none bg-transparent cursor-pointer"
                            title="Clear logs"
                        >
                            <Trash2 size={13} />
                            Clear
                        </button>
                        <button
                            onClick={() => setShowLogPanel(false)}
                            className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500 transition-colors border-none bg-transparent cursor-pointer"
                            title="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Log Content */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-auto p-4 font-mono text-[12px] leading-relaxed bg-white"
                >
                    {logs.length > 0 ? (
                        <div className="flex flex-col">
                            {logs.map((line, idx) => (
                                <div
                                    key={idx}
                                    className="whitespace-pre-wrap break-all text-gray-700 py-0.5 hover:bg-gray-50 px-2 -mx-2"
                                >
                                    <span className="inline-block w-8 text-gray-400 select-none text-right mr-4">
                                        {idx + 1}
                                    </span>
                                    {line}
                                </div>
                            ))}
                            {/* Streaming indicator at the bottom */}
                            {isStreaming && (
                                <div className="flex items-center gap-2 mt-2 text-blue-500 opacity-60 italic text-xs px-2">
                                    <Loader2 size={12} className="animate-spin" />
                                    Streaming logs...
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                            <div className="p-3 bg-gray-100 rounded-full">
                                <SquareTerminal size={32} className="opacity-30 text-gray-900" />
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-sm font-medium">Waiting for logs...</p>
                                <p className="text-xs">Connecting to {logComponentName} stream</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CSS Animation */}
            <style>{`
                @keyframes slideUp {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default LogPanel;
