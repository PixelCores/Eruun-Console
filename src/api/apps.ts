import type { App, AppListResponse, AppFilters, Component, Workflow, ComponentsResponse, WorkflowsResponse, RestartAppResponse, WorkflowCallback } from '../types/app';
import { request } from './request';

export const fetchApps = async (
    page: number = 1,
    limit: number = 12,
    filters?: AppFilters
): Promise<AppListResponse> => {
    try {
        const data = await request<{ applications: App[] }>('/applications');
        let apps: App[] = data.applications || [];

        // Apply filters
        if (filters?.search) {
            const searchLower = filters.search.toLowerCase();
            apps = apps.filter(
                app =>
                    app.name.toLowerCase().includes(searchLower) ||
                    app.alias.toLowerCase().includes(searchLower) ||
                    app.description.toLowerCase().includes(searchLower)
            );
        }

        // Pagination
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedApps = apps.slice(start, end);

        return {
            data: paginatedApps,
            total: apps.length,
            page,
            limit,
            hasMore: end < apps.length,
        };
    } catch (error) {
        console.error('Error fetching apps:', error);
        // Return empty result on error
        return {
            data: [],
            total: 0,
            page,
            limit,
            hasMore: false,
        };
    }
};

export const fetchTemplates = async (): Promise<App[]> => {
    try {
        const data = await request<{ applications: App[] }>('/applications/templates');
        return data.applications || [];
    } catch (error) {
        console.error('Error fetching templates:', error);
        return [];
    }
};

export const fetchAppComponents = async (appId: string): Promise<Component[]> => {
    try {
        const data = await request<ComponentsResponse>(`/applications/${appId}/components`);
        return data.components || [];
    } catch (error) {
        console.error('Error fetching app components:', error);
        return [];
    }
};

export const fetchApp = async (id: string): Promise<App> => {
    try {
        // Since backend doesn't support single app fetch, we fetch all and filter
        const data = await request<{ applications: App[] }>('/applications');
        const app = (data.applications || []).find((a: App) => a.id === id);

        if (!app) {
            throw new Error('Application not found');
        }

        return app;
    } catch (error) {
        console.error('Error fetching app:', error);
        throw error;
    }
};

export interface CreateAppRequest {
    name: string;
    namespace: string;
    version: string;
    description: string;
    alias?: string;
    project?: string;
    icon?: string;
    templateEnabled?: boolean;
    components?: ComponentCreateRequest[];
    component?: ComponentCreateRequest[]; // legacy support
    steps?: WorkflowStepCreateRequest[];
    workflow?: WorkflowStepCreateRequest[]; // legacy support
}

export interface ComponentCreateRequest {
    name: string;
    type: 'config' | 'secret' | 'store' | 'webservice' | 'job' | 'scheduledjob';
    image?: string;
    replicas: number;
    properties?: {
        ports?: { port: number; expose: boolean }[];
        env?: Record<string, string>;
        conf?: Record<string, string>;
        secret?: Record<string, string>;
        schedule?: string;
        command?: string[];
        runPolicy?: string;
        startTime?: number;
    };
    traits?: {
        storage?: {
            name: string;
            type: string;
            mountPath: string;
            tmpCreate?: boolean;
            size?: string;
        }[];
        envFrom?: {
            type: string;
            sourceName: string;
        }[];
    };
}

export interface WorkflowStepCreateRequest {
    name: string;
    mode: 'StepByStep' | 'DAG';
    components: string[];
    jobType?: string;
    workflowType?: string;
}

export interface CreateAppResponse {
    id: string;
    name: string;
    alias: string;
    project: string;
    description: string;
    createTime: string;
    updateTime: string;
    icon: string;
    workflowId: string;
}

export const createApp = async (data: CreateAppRequest): Promise<CreateAppResponse> => {
    const payload: Record<string, unknown> = {
        ...data,
        // Eruun-Cli expects the legacy field names.
        component: data.components || data.component || [],
        workflow: data.steps || data.workflow || [],
    };
    delete payload.components;
    delete payload.steps;

    return request<CreateAppResponse>('/applications', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};

export const deleteApp = async (id: string): Promise<void> => {
    return request<void>(`/applications/${id}`, {
        method: 'DELETE',
    });
};

export const deleteAppResources = async (id: string): Promise<void> => {
    return request<void>(`/applications/${id}/resources`, {
        method: 'DELETE',
    });
};

export const duplicateApp = async (id: string): Promise<App> => {
    // TODO: Implement duplicate API call
    console.log('Duplicate app:', id);
    throw new Error('Duplicate not implemented');
};

export const exportApp = async (id: string): Promise<Blob> => {
    try {
        // 1. Fetch App details
        const app = await fetchApp(id);

        // 2. Fetch App Components
        const componentsSpy = await fetchAppComponents(id);

        // 3. Fetch App Workflows
        const workflowsSpy = await fetchWorkflows(id);
        const activeWorkflow = workflowsSpy.find(w => w.id === app.workflowId) || workflowsSpy[0];

        // 4. Transform to CreateAppRequest/DSL format
        const dsl: CreateAppRequest = {
            name: app.name,
            namespace: app.namespace || 'default',
            version: app.version || '0.0.1',
            description: app.description || '',
            alias: app.alias,
            project: app.project,
            icon: app.icon,
            templateEnabled: app.templateEnabled,
            // Map components
            component: componentsSpy.map(comp => ({
                name: comp.name,
                type: comp.type,
                image: comp.image,
                replicas: comp.replicas,
                properties: {
                    ports: comp.properties.ports || undefined,
                    env: comp.properties.env || undefined,
                    conf: comp.properties.conf || undefined,
                    secret: comp.properties.secret || undefined,
                },
                traits: {
                    storage: comp.traits.storage?.map(s => ({
                        name: s.name,
                        type: s.type,
                        mountPath: s.mountPath,
                        size: s.size,
                    })),
                    envFrom: undefined
                }
            })),
            // Map workflow steps
            workflow: activeWorkflow ? activeWorkflow.steps.map(step => ({
                name: step.name,
                mode: step.mode,
                components: step.components
            })) : []
        };

        // 5. Convert to Blob
        const jsonStr = JSON.stringify(dsl, null, 2);
        return new Blob([jsonStr], { type: 'application/json' });
    } catch (error) {
        console.error('Error exporting app:', error);
        throw error;
    }
};

export const fetchWorkflows = async (appId: string): Promise<Workflow[]> => {
    try {
        const data = await request<WorkflowsResponse>(`/applications/${appId}/workflows`);
        return data.workflows || [];
    } catch (error) {
        console.error('Error fetching workflows:', error);
        return [];
    }
};

// Execute workflow and get task ID
export interface ExecuteWorkflowResponse {
    taskId: string;
}

export const executeWorkflow = async (appId: string, workflowId: string): Promise<ExecuteWorkflowResponse> => {
    return request<ExecuteWorkflowResponse>(`/applications/${appId}/workflow/exec`, {
        method: 'POST',
        body: JSON.stringify({ workflowId }),
    });
};

// Task status types
export interface TaskComponentStatus {
    name: string;
    type: string;
    status: 'waiting' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout' | 'reject' | 'prepare' | 'pending' | 'cleaning';
    startTime?: number;
    endTime?: number;
}

export interface TaskStatusResponse {
    taskId: string;
    status: string;
    workflowId: string;
    workflowName: string;
    appId: string;
    type: string;
    components: TaskComponentStatus[];
}

export const getTaskStatus = async (taskId: string): Promise<TaskStatusResponse> => {
    return request<TaskStatusResponse>(`/workflow/tasks/${taskId}/status`);
};

// Get application components status
export const getAppComponentsStatus = async (appId: string): Promise<TaskStatusResponse> => {
    return request<TaskStatusResponse>(`/applications/${appId}/components/status`);
};

// Cancel workflow execution
export const cancelWorkflow = async (appId: string, taskId: string): Promise<void> => {
    return request<void>(`/applications/${appId}/workflow/cancel`, {
        method: 'POST',
        body: JSON.stringify({ taskId }),
    });
};

// Task history types
export interface TaskHistoryItem {
    id?: string;
    taskId?: string;
    task_id?: string;
    name?: string;
    status: 'waiting' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout' | 'reject' | 'prepare' | 'pending' | 'cleaning';
    startTime?: string | number;
    endTime?: string | number;
    start_time?: string | number;
    end_time?: string | number;
    createTime?: string;
    updateTime?: string;
    workflowId: string;
    workflowName: string;
    workflowDisplayName?: string;
    type?: string;
}

export interface TaskHistoryResponse {
    tasks: TaskHistoryItem[];
}

// Fetch task history for an application
export const fetchTaskHistory = async (appId: string): Promise<TaskHistoryItem[]> => {
    try {
        const data = await request<TaskHistoryResponse>(`/applications/${appId}/workflow/tasks`);
        return data.tasks || [];
    } catch (error) {
        console.error('Error fetching task history:', error);
        return [];
    }
};

// Task stages types
export interface TaskStage {
    id: number;
    name: string;
    type: string;
    status: 'waiting' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout' | 'reject' | 'prepare' | 'pending' | 'cleaning';
    startTime?: number;
    endTime?: number;
    info?: string;
    error?: string;
}

export interface TaskStagesResponse {
    taskId: string;
    status: string;
    workflowId: string;
    workflowName: string;
    appId: string;
    type: string;
    stages: TaskStage[];
}

// Fetch task stages/details
export const fetchTaskStages = async (taskId: string): Promise<TaskStagesResponse | null> => {
    try {
        return request<TaskStagesResponse>(`/workflow/tasks/${taskId}/stages`);
    } catch (error) {
        console.error('Error fetching task stages:', error);
        return null;
    }
};


export interface TryApplicationComponent {
    name: string;
    type: string;
    replicas: number;
    image?: string;
    properties: {
        ports?: { port: number }[] | null;
        env?: Record<string, string> | null;
        conf?: Record<string, string> | null;
        secret?: Record<string, string> | null;
        command?: string[] | null;
        labels?: Record<string, string> | null;
    };
    traits?: unknown;
}

export interface TryApplicationRequest {
    id: string;
    name: string;
    alias: string;
    version: string;
    project: string;
    description: string;
    namespace?: string;
    icon?: string;
    templateEnabled?: boolean;
    components?: TryApplicationComponent[];
    component?: TryApplicationComponent[]; // legacy support
    steps?: WorkflowStepCreateRequest[];
    workflow?: WorkflowStepCreateRequest[]; // legacy support
}


export interface SaveApplicationRequest extends TryApplicationRequest {
    namespace: string;
}

export const extractTryErrorMessage = (result: unknown): string | null => {
    if (result == null) return null;
    if (typeof result === 'string') return result.trim() ? result : null;
    if (Array.isArray(result)) {
        const items = result.filter((x) => typeof x === 'string' && x.trim()) as string[];
        return items.length ? items.join('; ') : null;
    }
    if (typeof result === 'object') {
        const record = result as Record<string, unknown>;
        const keys = ['error', 'errors', 'errorMessage', 'errMsg', 'detail', 'details', 'message'];
        for (const key of keys) {
            const value = record[key];
            if (typeof value === 'string' && value.trim()) return value;
            if (Array.isArray(value)) {
                const strings = value.filter((x) => typeof x === 'string' && x.trim()) as string[];
                if (strings.length) return strings.join('; ');
            }
        }
    }
    return null;
};

export const tryApplication = async (data: TryApplicationRequest): Promise<unknown> => {
    const payload = {
        ...data,
        components: data.components || data.component || [],
        steps: data.steps || data.workflow || [],
    };
    delete payload.component;
    delete payload.workflow;

    return request<unknown>('/applications/try', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};

export const saveApplication = async (data: SaveApplicationRequest): Promise<unknown> => {
    const payload = {
        ...data,
        components: data.components || data.component || [],
        steps: data.steps || data.workflow || [],
    };
    delete payload.component;
    delete payload.workflow;

    return request<unknown>('/applications', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};


export interface UpdateAppVersionComponent {
    name: string;
    image: string;
}

export interface UpdateAppVersionRequest {
    version: string;
    strategy: string;
    components: UpdateAppVersionComponent[];
    description: string;
    callback?: WorkflowCallback;
}

export const updateApplicationVersion = async (appId: string, data: UpdateAppVersionRequest): Promise<unknown> => {
    return request<unknown>(`/applications/${appId}/version`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export interface ConvertAppResponse {
    components: Component[];
    valid: boolean;
}

export const convertApplication = async (yaml: string, validate: boolean = true): Promise<ConvertAppResponse> => {
    return request<ConvertAppResponse>('/applications/convert', {
        method: 'POST',
        body: JSON.stringify({ yaml, validate }),
    });
};
export const restartApplication = async (appId: string, callback?: WorkflowCallback): Promise<RestartAppResponse> => {
    return request<RestartAppResponse>(`/applications/${appId}/restart`, {
        method: 'POST',
        body: callback ? JSON.stringify({ callback }) : undefined,
    });
};
