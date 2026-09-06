import { getPaaSApi, postPaaSApi } from './paasAuth';
import { DEFAULT_TIME_ZONE, type RuntimeEnvironment } from '../stores/settingsStore';

export type MessageLevel = 1 | 2 | 3 | 4;

export interface MessageInfo {
  id: number;
  title: string;
  level: MessageLevel;
  content: string;
  readed: boolean;
  createdAt: number;
}

export interface PaginatedMessages {
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  data: MessageInfo[];
}

export interface MessageListQuery {
  createdAtStart: number;
  createdAtEnd: number;
  page: number;
  pageSize: number;
  env: RuntimeEnvironment;
  timeZone: number;
}

export const MESSAGE_PAGE_SIZE = 20;
export const MESSAGE_TIME_ZONE = DEFAULT_TIME_ZONE;

export const getMessageDateWindow = (now = new Date(), timeZone = MESSAGE_TIME_ZONE) => {
  const offsetMilliseconds = timeZone * 60 * 60 * 1000;
  const zonedNow = new Date(now.getTime() + offsetMilliseconds);
  const year = zonedNow.getUTCFullYear();
  const month = zonedNow.getUTCMonth();
  const day = zonedNow.getUTCDate();

  return {
    createdAtStart: Math.floor((Date.UTC(year, month, day - 7, 0, 0, 0) - offsetMilliseconds) / 1000),
    createdAtEnd: Math.floor((Date.UTC(year, month, day, 23, 59, 59) - offsetMilliseconds) / 1000),
  };
};

export const listMessages = (
  accessToken: string,
  query: MessageListQuery,
) => getPaaSApi<PaginatedMessages>('/common/v1/messages', accessToken, query);

export const getUnreadMessageCount = (accessToken: string) =>
  getPaaSApi<number>('/common/v1/messages/unread-num', accessToken);

export const markMessageRead = (accessToken: string, id: number) =>
  postPaaSApi<void>('/common/v1/messages/read', accessToken, { id });

export const markAllMessagesRead = (accessToken: string) =>
  postPaaSApi<void>('/common/v1/messages/read-all', accessToken, undefined);
