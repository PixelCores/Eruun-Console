export type PaaSLoginType = 'code' | 'password';

export type PaaSRole = 1 | 2 | 3 | 4;

export interface PaaSLoginRequest {
  identifier: string;
  type: PaaSLoginType;
  data: string;
}

// Eruun-Core login response: relative expiresIn (seconds) plus the user.
export interface PaaSLoginResponse {
  token: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    nickname?: string;
    avatar?: string;
    role?: number;
  };
}

interface PaaSResponse<T> {
  code: number;
  message: string;
  data: T;
}

const PAAS_ROLE_LABELS: Record<PaaSRole, string> = {
  1: 'Purchaser',
  2: 'Developer',
  3: 'Business development',
  4: 'Administrator',
};

const getAuthBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_PAAS_AUTH_BASE_URL?.trim();

  if (!configuredUrl) {
    throw new Error('PaaS authentication is not configured. Set VITE_PAAS_AUTH_BASE_URL.');
  }

  return configuredUrl.replace(/\/+$/, '');
};

const getApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_PAAS_API_BASE_URL?.trim();

  if (!configuredUrl) {
    throw new Error('PaaS API is not configured. Set VITE_PAAS_API_BASE_URL.');
  }

  return configuredUrl.replace(/\/+$/, '');
};

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'message' in payload &&
    typeof payload.message === 'string' &&
    payload.message.trim()
  ) {
    return payload.message;
  }

  return fallback;
};

const requestPaaS = async <T>(
  baseUrl: string,
  path: string,
  body?: unknown,
  accessToken?: string,
  serviceName = 'PaaS API',
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
): Promise<T> => {
  let response: Response;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      ...(method === 'GET' || body === undefined
        ? {}
        : { body: isFormData ? body : JSON.stringify(body) }),
    });
  } catch {
    throw new Error(`Unable to reach the ${serviceName}.`);
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, `${serviceName} request failed (${response.status}).`));
  }

  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('code' in payload) ||
    typeof payload.code !== 'number' ||
    !('data' in payload)
  ) {
    throw new Error(`The ${serviceName} returned an invalid response.`);
  }

  const result = payload as PaaSResponse<T>;
  if (result.code !== 0) {
    throw new Error(result.message || `${serviceName} request was rejected.`);
  }

  return result.data;
};

const requestPaaSAuth = <T>(path: string, body?: unknown, accessToken?: string) =>
  requestPaaS<T>(getAuthBaseUrl(), path, body, accessToken, 'PaaS authentication service');

export const postPaaSApi = <T>(path: string, accessToken: string, body: unknown) =>
  requestPaaS<T>(getApiBaseUrl(), path, body, accessToken);

export const putPaaSApi = <T>(path: string, accessToken: string, body: unknown) =>
  requestPaaS<T>(getApiBaseUrl(), path, body, accessToken, 'PaaS API', 'PUT');

export const deletePaaSApi = <T>(path: string, accessToken: string, body: unknown) =>
  requestPaaS<T>(getApiBaseUrl(), path, body, accessToken, 'PaaS API', 'DELETE');

export const getPaaSApi = <T>(
  path: string,
  accessToken: string,
  query: object = {},
) => {
  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  const requestPath = queryString ? `${path}?${queryString}` : path;
  return requestPaaS<T>(getApiBaseUrl(), requestPath, undefined, accessToken, 'PaaS API', 'GET');
};

export const sendLoginCode = (receiver: string) =>
  requestPaaSAuth<void>('/auth/login-code', { email: receiver });

export const loginWithPaaS = (request: PaaSLoginRequest, remember: boolean) => {
  // Eruun-Core contract: {email, password} XOR {email, code}, plus remember.
  const body =
    request.type === 'password'
      ? { email: request.identifier, password: request.data, remember }
      : { email: request.identifier, code: request.data, remember };
  return requestPaaSAuth<PaaSLoginResponse>('/auth/login', body);
};

export const logoutFromPaaS = (accessToken: string) =>
  requestPaaSAuth<void>('/auth/logout', undefined, accessToken);

export const parsePaaSRole = (value: unknown): PaaSRole | null => {
  const role = Number(value);
  return role === 1 || role === 2 || role === 3 || role === 4 ? role : null;
};

export const getPaaSRoleLabel = (role: PaaSRole) => PAAS_ROLE_LABELS[role];
