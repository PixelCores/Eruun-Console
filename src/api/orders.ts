import { getPaaSApi, postPaaSApi } from './paasAuth';
import type { RuntimeEnvironment, TimeZoneOffset } from '../stores/settingsStore';

export interface PurchaserOrderGameVersion {
  uri: string;
  version: string;
}

export interface PurchaserOrderGame {
  uri: string;
  name: string;
  logo?: string;
  accessUrl?: string;
  description?: string;
  gameVersions?: PurchaserOrderGameVersion[];
}

export interface PurchaserOrderScreenConfig {
  screenType: number;
  halfSupport: number;
  halfRatio: string;
}

export interface PurchaserOrder {
  uri: string;
  productName: string;
  productId: number;
  icon?: string;
  paidAt: number;
  createdAt: number;
  updatedAt: number;
  deployedAt: number;
  deployedVersion: string;
  hasNewVersion: number;
  deployState: number;
  env: string;
  accessUrl?: string;
  halfScreenAccessUrl?: string;
  socketUrl?: string;
  adminUrl?: string;
  latestLanguages?: string[];
  latestScreenConfig?: PurchaserOrderScreenConfig;
  game?: PurchaserOrderGame;
}

export interface PaginatedPurchaserOrders {
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  data: PurchaserOrder[];
}

// Note: the backend expects the single-p spelling 'stoped' for stopped orders.
export type PurchaserOrderListState = 'running' | 'exception' | 'stoped';

export interface PurchaserOrderListQuery {
  page: number;
  pageSize: number;
  kwd: string;
  env: RuntimeEnvironment;
  state?: PurchaserOrderListState;
}

export const ORDER_PAGE_SIZE = 20;

export const listPurchaserOrders = (
  accessToken: string,
  query: PurchaserOrderListQuery,
) => getPaaSApi<PaginatedPurchaserOrders>('/purchaser/v1/order', accessToken, query);

export type PurchaserOrderAction = 'start' | 'stop' | 'restart' | 'destroy' | 'reset';

export interface PurchaserOrderActionRequest {
  uris: string[];
  env: RuntimeEnvironment;
  timeZone: TimeZoneOffset;
}

export const runPurchaserOrderAction = (
  accessToken: string,
  action: PurchaserOrderAction,
  request: PurchaserOrderActionRequest,
) => postPaaSApi<void>(`/purchaser/v1/order/${action}`, accessToken, request);

export const ORDER_STATE_RUNNING = 3;
export const ORDER_STATE_EXCEPTION = 4;
export const ORDER_STATE_STOPPED = 5;

export type OrderRuntimeState = 'running' | 'exception' | 'stopped' | 'unknown';

export const getOrderRuntimeState = (deployState: number): OrderRuntimeState => {
  if (deployState === ORDER_STATE_RUNNING) return 'running';
  if (deployState === ORDER_STATE_EXCEPTION) return 'exception';
  if (deployState === ORDER_STATE_STOPPED) return 'stopped';
  return 'unknown';
};
