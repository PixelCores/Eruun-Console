import { getPaaSApi } from './paasAuth';

export interface GameStoreVersionSummary {
  uri?: string;
  version: string;
  tmpResourceFee?: number | null;
}

export interface GameStoreItem {
  uri: string;
  name: string;
  logo: string;
  description: string;
  languages: string[] | null;
  deployedVersion: string;
  gameVersions?: GameStoreVersionSummary[] | null;
}

export interface GameStoreScreenConfig {
  screenType: number;
  halfSupport: number;
  halfRatio: string;
}

export interface GameStoreVersion extends GameStoreVersionSummary {
  uri: string;
  changeLog: string;
  playGuide: string;
  screenConfig: GameStoreScreenConfig | null;
  languages: string[] | null;
  deployedAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface GameStoreDetail extends Omit<GameStoreItem, 'gameVersions'> {
  businessRegion: string;
  createdAt: number;
  updatedAt: number;
  screenType: number;
  screenConfig: GameStoreScreenConfig | null;
  gameVersions: GameStoreVersion[] | null;
}

export interface GameStoreResourceItem {
  uri: string;
  positionUri: string;
  img: string;
  title: string;
  description: string;
  url: string;
}

export interface GameStoreBanner {
  uri: string;
  title: string;
  description: string;
  items: GameStoreResourceItem[];
}

export interface GameStorePage {
  data: GameStoreItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface GameStoreQuery {
  page: number;
  pageSize: number;
  kwd: string;
  categoryIds: number;
  env: 'production';
  timeZone: number;
}

export interface GameStoreCategory {
  id: number;
  uri: string;
  name: string;
  parentId: number;
  parentName: string;
}

export interface GameStoreTags {
  categories: GameStoreCategory[];
}

export type GameStoreTagsQuery = Pick<GameStoreQuery, 'env' | 'timeZone'>;

export const getGameStorePage = (
  accessToken: string,
  query: GameStoreQuery,
) => getPaaSApi<GameStorePage>('/common/v1/game', accessToken, query);

export const getGameStoreDetail = (
  accessToken: string,
  uri: string,
) => getPaaSApi<GameStoreDetail>(
  `/common/v1/game/${encodeURIComponent(uri)}`,
  accessToken,
);

export const getGameStoreBanner = (
  accessToken: string,
  uri: string,
) => getPaaSApi<GameStoreBanner>(
  '/common/v1/resource-position/game-banner',
  accessToken,
  { gameUri: uri },
);

export const getGameStoreTags = (
  accessToken: string,
  query: GameStoreTagsQuery,
) => getPaaSApi<GameStoreTags>('/common/v1/game/tags', accessToken, query);
