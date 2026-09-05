import { request } from './request';

export interface SystemSetting {
    type: string;
    value: any;
    createTime?: string;
    updateTime?: string;
}

export const fetchSettings = async (): Promise<SystemSetting[]> => {
    try {
        const data = await request<{ settings: SystemSetting[] }>('/settings');
        return data.settings || [];
    } catch (error) {
        console.error('Error fetching settings:', error);
        return [];
    }
};

export const fetchSettingByType = async (type: string): Promise<SystemSetting | null> => {
    try {
        return await request<SystemSetting>(`/settings/${type}`);
    } catch (error) {
        console.error(`Error fetching setting ${type}:`, error);
        return null;
    }
};

export const createSetting = async (type: string, value: any): Promise<SystemSetting> => {
    return request<SystemSetting>('/settings', {
        method: 'POST',
        body: JSON.stringify({ type, value }),
    });
};

export const updateSetting = async (type: string, value: any): Promise<SystemSetting> => {
    return request<SystemSetting>(`/settings/${type}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
    });
};

export const deleteSetting = async (type: string): Promise<void> => {
    return request<void>(`/settings/${type}`, {
        method: 'DELETE',
    });
};
