import {
  deletePaaSApi,
  getPaaSApi,
  postPaaSApi,
  putPaaSApi,
} from './paasAuth';

type PaaSScale = number | string;

export interface PurchaserRevenueDashboard {
  add_game_people_today: number;
  add_game_people_month: number;
  add_game_people_today_scale: PaaSScale;
  add_game_people_month_scale: PaaSScale;
  game_people_today: number;
  game_people_month: number;
  game_people_today_scale: PaaSScale;
  game_people_month_scale: PaaSScale;
  gold_cost_total: number;
  gold_cost_total_month: number;
  gold_cost_total_today_scale: PaaSScale;
  gold_cost_total_month_scale: PaaSScale;
  accumulated_profit_today: number;
  accumulated_profit_month: number;
  accumulated_profit_today_scale: PaaSScale;
  accumulated_profit_month_scale: PaaSScale;
}

export interface PurchaserRevenueDashboardQuery {
  productId?: number;
  env?: string;
  timeZone?: number;
}

export interface PurchaserAppStoreAddresses {
  ios?: string;
  android?: string;
  web?: string;
}

export interface PurchaserProductApis {
  api_post_inform?: string;
  api_get_sstoken?: string;
  api_update_sstoken?: string;
  api_get_userinfo?: string;
  api_get_score?: string;
  api_change_score?: string;
  api_get_robot?: string;
}

export interface PurchaserProductSecretUrls {
  cert?: string;
  key?: string;
  backend_cname?: string;
  backend_url?: string;
  type?: number;
  frontend_url?: string;
  front_cname?: string;
}

export interface PurchaserProduct {
  id: number;
  purchaserId?: number;
  name: string;
  currency: string;
  env: string;
  appId?: string;
  appType?: string;
  state?: number;
  description?: string;
  rechargeAmount?: number;
  coinNum?: number;
  commissionRate?: number;
  businessRegion?: string;
  appOfficialWebsite?: string;
  appStoreAddresses?: PurchaserAppStoreAddresses;
  apis?: PurchaserProductApis;
  appSecret?: string;
  appSecretUrls?: PurchaserProductSecretUrls;
  cname?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaserUserProfile {
  userUri?: string;
  headimgurl?: string;
}

export interface PurchaserProfile {
  uri?: string;
  email?: string;
  products: PurchaserProduct[];
  name?: string;
  countryCode?: string;
  tel?: string;
  contactors?: unknown[];
  company?: string;
  description?: string;
  headimgurl?: string;
  registeredAddress?: string;
  state?: number;
  hasPassword?: boolean;
  businessLicense?: string[];
  balance?: number;
  timeZone?: number;
  queryTimeZone?: number;
  userProfile?: PurchaserUserProfile;
  reviewRejectedReason?: string;
  reviewRejectedAttach?: string[];
  hasDeployedGame?: boolean;
  domainPrompt?: boolean;
  deduction?: number;
  inviteCode?: string;
}

export interface PurchaserProfileQuery {
  env: string;
  timeZone: number;
}

export interface PaaSApplicationType {
  appType: string;
  label: string;
}

export interface PurchaserProductUpdateRequest {
  id: number;
  name: string;
  rechargeAmount: number;
  currency: string;
  coinNum: number;
  commissionRate: number;
  businessRegion: string;
  apis: PurchaserProductApis;
  env: string;
  appType: string;
  appStoreAddresses: PurchaserAppStoreAddresses;
  appOfficialWebsite: string;
  appSecretUrls: PurchaserProductSecretUrls;
  description: string;
}

export interface PurchaserSecretRequest {
  productId: number;
  code: string;
}

export interface PurchaserSecretResponse {
  appId: string;
  appSecret: string;
}

export interface PurchaserTlsValidationRequest {
  domain: string;
  key: string;
  crt: string;
}

export interface PurchaserTlsValidationResponse {
  is_valid: boolean;
  expire_day: number;
}

export interface PurchaserProductSecretRequest {
  purchaserId: number;
  productId: number;
  key: string;
  crt: string;
}

export interface PurchaserProductDomainRequest {
  purchaserId: number;
  productId: number;
  frontend_url: string;
  backend_url: string;
  env: string;
}

export interface PurchaserRobot {
  id: number;
  nickName: string;
  avatar: string;
  purchaserProductId: number;
  isCrossDomain: boolean;
  env: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaserRobotListRequest {
  productId: number;
  page: number;
  pageSize: number;
  env: string;
  isCrossDomain: -1 | 0 | 1;
}

export interface PurchaserRobotListResponse {
  data: PurchaserRobot[];
  total: number;
}

export interface PurchaserRobotMutationRequest {
  nickName: string;
  avatar: string;
  productId: number;
  uri: string;
  env?: string;
  id?: number;
}

export interface PurchaserRobotDeleteRequest {
  ids: number[];
  productId: number;
  uri: string;
}

export interface PurchaserRobotImportResponse {
  fileCount: number;
  actualCount: number;
}

export interface PurchaserRobotExportResponse {
  fileName: string;
  contentType: string;
  contentBase64: string;
  data: PurchaserRobot[];
}

export interface PurchaserGameBillTotal {
  invest_gold_total: number;
  accumulated_profit: number;
  register_user_count: number;
}

export interface PurchaserGameBillTotalQuery {
  product_id: number;
  env: string;
  timeZone: number;
}

export interface PurchaserGame {
  uri: string;
  productId: number;
  icon?: string;
  gameName: string;
  gameUri: string;
  deployState: number;
  gameVersion?: string;
  eruunAppId?: string;
}

export interface PurchaserGameList {
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  data: PurchaserGame[];
}

export interface PurchaserGameListQuery {
  page: number;
  pageSize: number;
  productId: number;
  env: string;
  timeZone: number;
}

export interface PurchaserGameInstallRequest {
  gameUri: string;
  versionUri: string;
  productId: number;
  env: string;
  timeZone: number;
}

export interface PurchaserGameInstallResponse {
  uri: string;
  eruunAppId?: string;
}

export interface PurchaserTrendPoint {
  gameBillType: number;
  createTime: number;
  value: number;
}

export interface PurchaserTrendPiePoint {
  gameName: string;
  value: number;
}

export interface PurchaserGameBillTrend {
  add_game_people: number;
  gold_cost_total: number;
  coin_settlement: number;
  accumulated_profit: number;
  add_game_people_list: PurchaserTrendPoint[];
  game_people_list: PurchaserTrendPoint[];
  invest_gold_total_list: PurchaserTrendPoint[];
  gold_coin_flow_list: PurchaserTrendPoint[];
  add_game_people_pie_chart: PurchaserTrendPiePoint[];
  game_people_pie_chart: PurchaserTrendPiePoint[];
  invest_gold_pie_chart: PurchaserTrendPiePoint[];
  gold_coin_flow_pie_chart: PurchaserTrendPiePoint[];
}

export interface PurchaserGameBillTrendQuery {
  starTime: number;
  endTime: number;
  productId: number;
  gameUri?: string;
  env: string;
  timeZone: number;
}

export interface PurchaserGameBillDetail {
  game_name: string;
  product_name: string;
  add_game_people: number;
  game_people: number;
  gold_cost_total: number;
  coin_settlement: number;
  accumulated_profit: number;
  rtp: number | string;
  data: string;
}

export interface PurchaserGameBillDetailsTotal {
  add_game_people: number;
  game_people: number;
  gold_cost_total: number;
  coin_settlement: number;
  accumulated_profit: number;
  data: string;
}

export interface PurchaserGameBillDetails {
  details: PurchaserGameBillDetail[];
  totals: PurchaserGameBillDetailsTotal[];
}

export interface PurchaserGameBillDetailsQuery {
  starTime: number;
  endTime: number;
  productId: number;
  group: number;
  isDay: boolean;
  env: string;
  timeZone: number;
}

export interface PurchaserGameBillDetailsExportQuery extends PurchaserGameBillDetailsQuery {
  fileFormat: 1;
}

export interface PurchaserGameBillDetailsExport {
  url: string;
}

export const getPurchaserRevenueDashboard = (
  accessToken: string,
  query: PurchaserRevenueDashboardQuery = {},
) => postPaaSApi<PurchaserRevenueDashboard>('/purchaser/v1/game_bill/dashboard', accessToken, query);

export const getPurchaserProfile = (
  accessToken: string,
  query: PurchaserProfileQuery,
) => getPaaSApi<PurchaserProfile>('/purchaser/v1/purchaser', accessToken, query);

// TO-CONFIRM: endpoint path and body field name pending backend confirmation.
export const updatePurchaserPassword = (
  accessToken: string,
  password: string,
) => putPaaSApi<void>('/purchaser/v1/password', accessToken, { password });

// TO-CONFIRM: endpoint path, multipart field name, and response shape pending
// backend confirmation. Assumes the standard {code, message, data} envelope.
export const uploadPurchaserAvatar = (
  accessToken: string,
  file: File,
) => {
  const formData = new FormData();
  formData.append('file', file);
  return postPaaSApi<{ headimgurl?: string } | void>('/purchaser/v1/avatar', accessToken, formData);
};

export const getPaaSApplicationTypes = (
  accessToken: string,
) => getPaaSApi<{ key: string; value: PaaSApplicationType[] }>(
  '/common/v1/setting/app_type',
  accessToken,
);

export const buildPurchaserProductUpdateRequest = (
  product: PurchaserProduct,
  overrides: Partial<PurchaserProductUpdateRequest> = {},
): PurchaserProductUpdateRequest => ({
  id: product.id,
  name: product.name,
  rechargeAmount: product.rechargeAmount ?? 0,
  currency: product.currency,
  coinNum: product.coinNum ?? 0,
  commissionRate: product.commissionRate ?? 0,
  businessRegion: product.businessRegion ?? '',
  apis: product.apis ?? {},
  env: product.env,
  appType: product.appType ?? '',
  appStoreAddresses: product.appStoreAddresses ?? {},
  appOfficialWebsite: product.appOfficialWebsite ?? '',
  appSecretUrls: product.appSecretUrls ?? {},
  description: product.description ?? '',
  ...overrides,
});

export const updatePurchaserProduct = (
  accessToken: string,
  request: PurchaserProductUpdateRequest,
) => putPaaSApi<void>('/purchaser/v1/purchaser/product', accessToken, request);

export const sendPurchaserSecretCode = (
  accessToken: string,
  type: 'view' | 'generate',
) => postPaaSApi<void>('/purchaser/v1/purchaser/secret-code', accessToken, { type });

export const viewPurchaserSecret = (
  accessToken: string,
  request: PurchaserSecretRequest & {
    env: string;
    timeZone: number;
  },
) => postPaaSApi<PurchaserSecretResponse>(
  '/purchaser/v1/purchaser/view-secret',
  accessToken,
  request,
);

export const generatePurchaserSecret = (
  accessToken: string,
  request: PurchaserSecretRequest,
) => postPaaSApi<PurchaserSecretResponse>(
  '/purchaser/v1/purchaser/generate-secret',
  accessToken,
  request,
);

export const validatePurchaserTls = (
  accessToken: string,
  request: PurchaserTlsValidationRequest,
) => postPaaSApi<PurchaserTlsValidationResponse>(
  '/purchaser/v1/purchaser/product/valid-tls',
  accessToken,
  request,
);

export const createPurchaserProductSecret = (
  accessToken: string,
  request: PurchaserProductSecretRequest,
) => postPaaSApi<void>('/purchaser/v1/purchaser/product/secret', accessToken, request);

export const updatePurchaserProductDomain = (
  accessToken: string,
  request: PurchaserProductDomainRequest,
) => putPaaSApi<void>('/purchaser/v1/purchaser/product/user-domain', accessToken, request);

export const getPurchaserRobots = (
  accessToken: string,
  request: PurchaserRobotListRequest,
) => postPaaSApi<PurchaserRobotListResponse>(
  '/purchaser/v1/purchaser/product/robot/list',
  accessToken,
  request,
);

export const createPurchaserRobot = (
  accessToken: string,
  request: PurchaserRobotMutationRequest,
) => postPaaSApi<boolean>(
  '/purchaser/v1/purchaser/product/robot',
  accessToken,
  request,
);

export const updatePurchaserRobot = (
  accessToken: string,
  request: PurchaserRobotMutationRequest,
) => putPaaSApi<boolean>(
  '/purchaser/v1/purchaser/product/robot',
  accessToken,
  request,
);

export const deletePurchaserRobots = (
  accessToken: string,
  request: PurchaserRobotDeleteRequest,
) => deletePaaSApi<boolean>('/purchaser/v1/purchaser/product/robot', accessToken, request);

export const importPurchaserRobots = (
  accessToken: string,
  body: FormData,
) => postPaaSApi<PurchaserRobotImportResponse>(
  '/purchaser/v1/purchaser/product/robots',
  accessToken,
  body,
);

export const exportPurchaserRobots = (
  accessToken: string,
  productId: number,
  ids: number[],
) => postPaaSApi<PurchaserRobotExportResponse>(
  '/purchaser/v1/purchaser/product/robots/export',
  accessToken,
  { productId, ids },
);

export const getPurchaserGameBillTotal = (
  accessToken: string,
  query: PurchaserGameBillTotalQuery,
) => postPaaSApi<PurchaserGameBillTotal>('/purchaser/v1/game_bill/total', accessToken, query);

export const getPurchaserGames = (
  accessToken: string,
  query: PurchaserGameListQuery,
) => getPaaSApi<PurchaserGameList>('/purchaser/v1/order/base-list', accessToken, query);

export const installPurchaserGame = (
  accessToken: string,
  request: PurchaserGameInstallRequest,
) => postPaaSApi<PurchaserGameInstallResponse>(
  '/purchaser/v1/order/workflow',
  accessToken,
  request,
);

export const getPurchaserGameBillTrend = (
  accessToken: string,
  query: PurchaserGameBillTrendQuery,
) => postPaaSApi<PurchaserGameBillTrend>('/purchaser/v1/game_bill/trendChart', accessToken, query);

export const getPurchaserGameBillDetails = (
  accessToken: string,
  query: PurchaserGameBillDetailsQuery,
) => postPaaSApi<PurchaserGameBillDetails>('/purchaser/v1/game_bill/details', accessToken, query);

export const exportPurchaserGameBillDetails = (
  accessToken: string,
  query: PurchaserGameBillDetailsExportQuery,
) => postPaaSApi<PurchaserGameBillDetailsExport>('/purchaser/v1/game_bill/details/export', accessToken, query);
