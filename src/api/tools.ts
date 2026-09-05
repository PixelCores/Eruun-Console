
import type { Tool, ToolListResponse } from '../types/tool';

// Mock data
const TOOLS: Tool[] = [
    {
        id: '1',
        title: 'Google',
        description: 'A tool for performing Google searches to retrieve real-time information.',
        type: 'MCP',
        icon: 'Globe',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        author: 'google',
        stars: 124,
        installs: '76k+'
    },
    {
        id: '2',
        title: 'GitHub',
        description: 'Interact with GitHub API, manage repositories, issues and PRs.',
        type: 'MCP',
        icon: 'Code',
        color: 'text-gray-800',
        bgColor: 'bg-gray-100',
        author: 'github',
        stars: 456,
        installs: '86k+'
    },
    {
        id: '3',
        title: 'Code Analysis',
        description: 'Advanced static analysis for multiple programming languages.',
        type: 'Agent Skills',
        icon: 'Terminal',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        author: 'agent-skills',
        stars: 89,
        installs: '4.5k+'
    },
    {
        id: '4',
        title: 'Time',
        description: 'A tool to get the current time and handle timezone conversions.',
        type: 'Agent Skills',
        icon: 'Clock',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        author: 'utility',
        stars: 45,
        installs: '1.2k+'
    },
    {
        id: '5',
        title: 'Web Scraper',
        description: 'Extract content from web pages for analysis.',
        type: 'MCP',
        icon: 'SearchIcon',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        author: 'scraper-bot',
        stars: 230,
        installs: '34k+'
    },
    {
        id: '6',
        title: 'File System',
        description: 'Read and write files securely within the sandbox.',
        type: 'MCP',
        icon: 'FileText',
        color: 'text-teal-600',
        bgColor: 'bg-teal-100',
        author: 'system',
        stars: 12,
        installs: '156+'
    },
    {
        id: '7',
        title: 'Qdrant',
        description: 'Vector database integration for semantic search.',
        type: 'MCP',
        icon: 'Database',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        author: 'qdrant',
        stars: 34,
        installs: '1.1k+'
    },
    {
        id: '8',
        title: 'Kubernetes',
        description: 'Manage K8s clusters, pods, and deployments.',
        type: 'Agent Skills',
        icon: 'Settings',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
        author: 'k8s-ops',
        stars: 128,
        installs: '5.6k+'
    }
];

export const fetchTools = async (): Promise<ToolListResponse> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
        data: TOOLS,
        total: TOOLS.length
    };
};
