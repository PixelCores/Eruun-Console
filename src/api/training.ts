import { deletePaaSApi, getPaaSApi, postPaaSApi } from './paasAuth';

export type TrainingStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export interface TrainingJob {
    id: string;
    tenantId: string;
    name: string;
    baseModelId: string;
    modelVersionId: string;
    datasetUri: string;
    image: string;
    command: string;
    status: TrainingStatus;
    cliAppId: string;
    cliTaskId: string;
    outputUri: string;
    publishedModelId?: string;
    error: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTrainingJobRequest {
    name: string;
    baseModelId: string;
    modelVersionId: string;
    datasetUri: string;
    command: string;
}

export const createTrainingJob = (
    accessToken: string,
    tenantId: string,
    request: CreateTrainingJobRequest,
) => postPaaSApi<{ job: TrainingJob }>(
    `/tenants/${tenantId}/training-jobs`,
    accessToken,
    request,
);

export const listTrainingJobs = (accessToken: string, tenantId: string) =>
    getPaaSApi<{ jobs: TrainingJob[] }>(
        `/tenants/${tenantId}/training-jobs`,
        accessToken,
    );

export const cancelTrainingJob = (accessToken: string, tenantId: string, jobId: string) =>
    postPaaSApi<{ job: TrainingJob }>(
        `/tenants/${tenantId}/training-jobs/${jobId}/cancel`,
        accessToken,
        {},
    );

export interface PublishTrainingJobRequest {
    name: string;
    version: string;
    description?: string;
    type?: 'LLM' | 'Vision' | 'Audio' | 'Embedding';
}

export const publishTrainingJob = (
    accessToken: string,
    tenantId: string,
    jobId: string,
    request: PublishTrainingJobRequest,
) => postPaaSApi<{ model: unknown; version: unknown }>(
    `/tenants/${tenantId}/training-jobs/${jobId}/publish`,
    accessToken,
    request,
);

export const deleteTrainingJob = (accessToken: string, tenantId: string, jobId: string) =>
    deletePaaSApi<{ deleted: boolean }>(
        `/tenants/${tenantId}/training-jobs/${jobId}`,
        accessToken,
        undefined,
    );
