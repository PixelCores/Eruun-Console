import { create } from 'zustand';
import {
  loginWithPaaS,
  logoutFromPaaS,
  parsePaaSRole,
  type PaaSLoginRequest,
  type PaaSRole,
} from '../api/paasAuth';

const SESSION_STORAGE_KEY = 'eruun_paas_session';

export interface AuthSession {
  accessToken: string;
  identifier: string;
  role: PaaSRole;
  expiresAt: number;
}

interface AuthState {
  session: AuthSession | null;
  signIn: (request: PaaSLoginRequest, remember: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  clearSession: () => void;
}

const isStorageAvailable = () => typeof window !== 'undefined';

export const isSessionActive = (session: AuthSession | null) =>
  session !== null &&
  Boolean(session.accessToken) &&
  parsePaaSRole(session.role) !== null &&
  Number.isFinite(session.expiresAt) &&
  session.expiresAt * 1000 > Date.now();

const removePersistedSession = () => {
  if (!isStorageAvailable()) return;

  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
};

const readSession = (storage: Storage): AuthSession | null => {
  try {
    const rawSession = storage.getItem(SESSION_STORAGE_KEY);
    if (!rawSession) return null;

    const parsed = JSON.parse(rawSession) as Partial<AuthSession>;
    const role = parsePaaSRole(parsed.role);
    const session: AuthSession | null =
      role !== null &&
      typeof parsed.accessToken === 'string' &&
      typeof parsed.identifier === 'string' &&
      typeof parsed.expiresAt === 'number'
        ? {
            accessToken: parsed.accessToken,
            identifier: parsed.identifier,
            role,
            expiresAt: parsed.expiresAt,
          }
        : null;

    if (isSessionActive(session)) return session;
    storage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    try {
      storage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore a second storage failure while cleaning invalid session data.
    }
  }

  return null;
};

const loadPersistedSession = () => {
  if (!isStorageAvailable()) return null;

  return readSession(window.sessionStorage) ?? readSession(window.localStorage);
};

const persistSession = (session: AuthSession, remember: boolean) => {
  if (!isStorageAvailable()) return;

  try {
    const target = remember ? window.localStorage : window.sessionStorage;
    const other = remember ? window.sessionStorage : window.localStorage;
    other.removeItem(SESSION_STORAGE_KEY);
    target.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Keep the in-memory session active if storage is blocked by the browser.
  }
};

export const getSafeRedirect = (candidate: string | null) => {
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) return '/';

  try {
    const destination = new URL(candidate, window.location.origin);
    if (
      destination.origin !== window.location.origin ||
      destination.pathname === '/login' ||
      destination.pathname === '/login/'
    ) {
      return '/';
    }

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return '/';
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: loadPersistedSession(),
  signIn: async (request, remember) => {
    const response = await loginWithPaaS(request, remember);
    const role = parsePaaSRole(response?.user?.role);
    const expiresIn = Number(response?.expiresIn);
    const session: AuthSession | null =
      role !== null &&
      typeof response?.token === 'string' &&
      Boolean(response.token) &&
      Number.isFinite(expiresIn)
        ? {
            accessToken: response.token,
            identifier: request.identifier,
            role,
            expiresAt: Math.floor(Date.now() / 1000) + expiresIn,
          }
        : null;

    if (!session || !isSessionActive(session)) {
      throw new Error('The authentication response did not contain a valid session or role.');
    }

    persistSession(session, remember);
    set({ session });
  },
  signOut: async () => {
    const accessToken = get().session?.accessToken;

    try {
      if (accessToken) await logoutFromPaaS(accessToken);
    } catch {
      // Logging out locally still takes precedence if the remote session has expired or is unreachable.
    } finally {
      removePersistedSession();
      set({ session: null });
    }
  },
  clearSession: () => {
    removePersistedSession();
    set({ session: null });
  },
}));
