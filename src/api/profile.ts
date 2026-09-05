import { getPaaSApi, postPaaSApi, putPaaSApi } from './paasAuth';
import type { Tenant } from '../stores/tenantStore';

// Eruun-Core user profile (see /api/v1/users/me).
export interface UserProfile {
    id: string;
    email: string;
    nickname: string;
    avatar: string;
    role: number;
}

export interface MyProfileResponse {
    user: UserProfile;
    tenants: Tenant[];
}

export const getMyProfile = (accessToken: string) =>
    getPaaSApi<MyProfileResponse>('/users/me', accessToken);

export const updateMyProfile = (
    accessToken: string,
    updates: { nickname?: string; avatar?: string },
) => putPaaSApi<{ user: UserProfile }>('/users/me', accessToken, updates);

export const changeMyPassword = (
    accessToken: string,
    oldPassword: string,
    newPassword: string,
) => putPaaSApi<{ changed: boolean }>(
    '/users/me/password',
    accessToken,
    { oldPassword, newPassword },
);

export const uploadMyAvatar = (accessToken: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return postPaaSApi<{ avatar: string }>('/users/me/avatar', accessToken, formData);
};

// resolveCoreUrl turns a Core-relative path (e.g. /avatars/x.png) into an
// absolute URL against the configured Core origin.
export const resolveCoreUrl = (path: string) => {
    if (!path) return '';
    if (/^https?:\/\//.test(path)) return path;
    const origin = (import.meta.env.VITE_PAAS_API_BASE_URL ?? '')
        .trim()
        .replace(/\/api\/v1\/?$/, '');
    return `${origin}${path}`;
};
