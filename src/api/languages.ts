import { request } from './request';

export interface ProgrammingLanguage {
    id: string;
    code: string;
    name: string;
    version: string;
    enabled: boolean;
    cpuReq?: string;
    memReq?: string;
    createTime: string;
    updateTime: string;
}

export interface CreateLanguageRequest {
    name: string;
    version: string;
    enabled: boolean;
    cpuReq?: string;
    memReq?: string;
}

export interface UpdateLanguageRequest {
    name?: string;
    version?: string;
    enabled?: boolean;
    cpuReq?: string;
    memReq?: string;
}

export async function listLanguages(): Promise<ProgrammingLanguage[]> {
    const res = await request<{ languages: ProgrammingLanguage[] }>('/programming-languages');
    return res.languages || [];
}

export async function createLanguage(req: CreateLanguageRequest): Promise<ProgrammingLanguage> {
    return request<ProgrammingLanguage>('/programming-languages', {
        method: 'POST',
        body: JSON.stringify(req),
    });
}

export async function updateLanguage(id: string, req: UpdateLanguageRequest): Promise<ProgrammingLanguage> {
    return request<ProgrammingLanguage>(`/programming-languages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(req),
    });
}

export async function deleteLanguage(id: string): Promise<string> {
    const res = await request<{ id: string }>(`/programming-languages/${id}`, {
        method: 'DELETE',
    });
    return res.id;
}
