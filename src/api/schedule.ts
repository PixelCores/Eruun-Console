import { request } from './request';
import { createApp, deleteApp, type CreateAppResponse } from './apps';

// ScheduledJobInfo is Eruun-Cli's scheduled job view (one row per
// scheduledjob component).
export interface ScheduledJobInfo {
    appId: string;
    appName: string;
    appNamespace: string;
    componentName: string;
    componentNamespace: string;
    image?: string;
    schedule?: string;
    startTime?: number;
    runPolicy?: string;
    createTime: string;
    updateTime: string;
}

export const fetchScheduledJobs = async (): Promise<ScheduledJobInfo[]> => {
    const data = await request<ScheduledJobInfo[]>('/scheduledjobs');
    return data ?? [];
};

const slugify = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'job';

// createScheduledJob creates a single-purpose application holding one
// scheduledjob component, then executes its deploy workflow so the CronJob
// is actually created on the cluster.
export const createScheduledJob = async (data: {
    name: string;
    schedule: string;
    image: string;
    command?: string;
}): Promise<CreateAppResponse> => {
    const slug = slugify(data.name);

    const app = await createApp({
        name: slug,
        alias: data.name,
        namespace: 'default',
        version: '1.0.0',
        description: `Scheduled job: ${data.name}`,
        components: [
            {
                name: slug,
                type: 'scheduledjob',
                image: data.image,
                replicas: 0,
                properties: {
                    schedule: data.schedule,
                    ...(data.command?.trim() ? { command: data.command.trim().split(/\s+/) } : {}),
                },
            },
        ],
        steps: [{ name: 'deploy', mode: 'StepByStep', components: [slug], jobType: 'deploy' }],
    });

    if (app.workflowId) {
        await request(`/applications/${app.id}/workflow/exec`, {
            method: 'POST',
            body: JSON.stringify({ workflowId: app.workflowId }),
        });
    }
    return app;
};

export const deleteScheduledJob = (appId: string) => deleteApp(appId);
