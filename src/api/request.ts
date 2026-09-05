import type { BaseResponse } from './types';
import { useSettingsStore } from '../stores/settingsStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export async function request<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const dynamicBaseUrl = useSettingsStore.getState().apiBaseUrl || API_BASE_URL;
    const url = path.startsWith('http') ? path : `${dynamicBaseUrl}${path}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
    }

    const result: BaseResponse<T> = await response.json();

    if (result.code !== 0) {
        throw new Error(result.message || 'API Error');
    }

    return result.data;
}
