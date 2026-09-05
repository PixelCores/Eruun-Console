import { getPaaSApi } from './paasAuth';
import type { Model, ModelListResponse, ModelType } from '../types/model';

// Eruun-Core catalog model (see /api/v1/models).
export interface CatalogModel {
    id: string;
    tenantId?: string;
    name: string;
    provider: string;
    type: ModelType;
    description: string;
    tags: string[];
    icon: string;
    sourceUrl: string;
    createdAt: number;
}

interface ModelListPage {
    data: CatalogModel[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

// Type-driven card styling, replacing the hardcoded mock values.
const TYPE_STYLE: Record<ModelType, { icon: string; color: string; bgColor: string }> = {
    LLM: { icon: 'Box', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    Vision: { icon: 'Layers', color: 'text-orange-600', bgColor: 'bg-orange-100' },
    Audio: { icon: 'Radio', color: 'text-green-600', bgColor: 'bg-green-100' },
    Embedding: { icon: 'Cpu', color: 'text-red-600', bgColor: 'bg-red-100' },
};

const toModel = (catalog: CatalogModel): Model => {
    const style = TYPE_STYLE[catalog.type] ?? TYPE_STYLE.LLM;
    return {
        id: catalog.id,
        title: catalog.name,
        description: catalog.description,
        type: catalog.type,
        icon: style.icon,
        color: style.color,
        bgColor: style.bgColor,
        provider: catalog.provider,
        // Popularity metrics arrive with the deploy flow (Phase 2).
        stars: 0,
        downloads: '0',
    };
};

export const fetchModels = async (accessToken: string, kwd?: string): Promise<ModelListResponse> => {
    const page = await getPaaSApi<ModelListPage>('/models', accessToken, {
        ...(kwd ? { kwd } : {}),
        page: 1,
        pageSize: 100,
    });
    return {
        data: page.data.map(toModel),
        total: page.totalCount,
    };
};

// Model version as returned by the catalog detail endpoint.
export interface CatalogModelVersion {
    id: string;
    version: string;
    artifactUri: string;
    parameters: string;
    contextLength: number;
    quantization: string;
    sizeMb: number;
    changeLog: string;
    createdAt: number;
}

export interface ModelDetailResponse {
    model: CatalogModel;
    versions: CatalogModelVersion[];
}

export const fetchModelDetail = (accessToken: string, modelId: string) =>
    getPaaSApi<ModelDetailResponse>(`/models/${modelId}`, accessToken);
