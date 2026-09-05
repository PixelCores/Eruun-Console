import { deletePaaSApi, getPaaSApi, postPaaSApi } from './paasAuth';

export type InferenceStatus = 'pending' | 'deploying' | 'running' | 'failed' | 'stopped';

export interface InferenceService {
    id: string;
    tenantId: string;
    modelId: string;
    modelVersionId: string;
    name: string;
    image: string;
    replicas: number;
    status: InferenceStatus;
    endpoint: string;
    cliAppId: string;
    error: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface DeployInferenceRequest {
    name: string;
    modelId: string;
    modelVersionId: string;
    replicas: number;
}

export const deployInferenceService = (
    accessToken: string,
    tenantId: string,
    request: DeployInferenceRequest,
) => postPaaSApi<{ service: InferenceService }>(
    `/tenants/${tenantId}/inference-services`,
    accessToken,
    request,
);

export const listInferenceServices = (accessToken: string, tenantId: string) =>
    getPaaSApi<{ services: InferenceService[] }>(
        `/tenants/${tenantId}/inference-services`,
        accessToken,
    );

export const deleteInferenceService = (accessToken: string, tenantId: string, serviceId: string) =>
    deletePaaSApi<{ deleted: boolean }>(
        `/tenants/${tenantId}/inference-services/${serviceId}`,
        accessToken,
        undefined,
    );
