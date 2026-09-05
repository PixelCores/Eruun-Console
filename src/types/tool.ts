export type ToolType = 'MCP' | 'Agent Skills';

export interface Tool {
    id: string;
    title: string;
    description: string;
    type: ToolType;
    icon: string; // Store icon name as string for API compatibility
    color: string;
    bgColor: string;
    author: string;
    stars: number;
    installs: string;
}

export interface ToolListResponse {
    data: Tool[];
    total: number;
}
