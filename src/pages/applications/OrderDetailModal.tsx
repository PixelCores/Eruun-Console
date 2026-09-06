import { useState, type ReactNode } from 'react';
import { CheckCircle2, Monitor, Smartphone } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import Modal from '../../components/base/Modal';
import ConfirmDialog from '../../components/base/ConfirmDialog';
import { installPurchaserGame } from '../../api/paasBilling';
import type { PurchaserOrder } from '../../api/orders';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import CopyButton from './CopyButton';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  zh: '中文',
  'zh-CN': '中文',
  'zh-TW': '繁體中文',
  ja: '日本語',
  ko: '한국어',
  th: 'ไทย',
  vi: 'Tiếng Việt',
  id: 'Bahasa Indonesia',
};

const formatTimestamp = (
  timestamp: number,
  format: ReturnType<typeof useFormatter>,
) => (timestamp > 0
  ? format.dateTime(new Date(timestamp * 1000), {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
  : '—');

const DetailRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex border-b border-gray-100 last:border-b-0">
    <div className="w-28 shrink-0 bg-gray-50 px-4 py-3 text-sm text-gray-500">{label}</div>
    <div className="min-w-0 flex-1 px-4 py-3 text-sm text-gray-900">{children}</div>
  </div>
);

interface OrderDetailModalProps {
  order: PurchaserOrder | null;
  onClose: () => void;
  onUpdated: () => void;
  onOpenAdminConsole?: (order: PurchaserOrder) => void;
}

const OrderDetailModal = ({ order, onClose, onUpdated, onOpenAdminConsole }: OrderDetailModalProps) => {
  const t = useTranslations('Applications');
  const commonT = useTranslations('Common');
  const format = useFormatter();
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const environment = useSettingsStore((state) => state.environment);
  const timeZone = useSettingsStore((state) => state.timeZone);
  const [confirmingUpdate, setConfirmingUpdate] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const gameName = order?.game?.name || order?.productName || '';
  const logo = order?.icon || order?.game?.logo;
  const latestVersion = order?.game?.gameVersions?.[0];
  const canUpdate = order?.hasNewVersion === 1 && Boolean(latestVersion) && Boolean(order?.game);
  const screenType = order?.latestScreenConfig?.screenType;

  const handleUpdate = async () => {
    if (!accessToken || !order?.game || !latestVersion) return;
    setUpdating(true);
    setUpdateError(null);
    try {
      await installPurchaserGame(accessToken, {
        gameUri: order.game.uri,
        versionUri: latestVersion.uri,
        productId: order.productId,
        env: environment,
        timeZone,
      });
      setConfirmingUpdate(false);
      onUpdated();
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : t('actionError'));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Modal
        isShow={order !== null}
        onClose={onClose}
        title={t('detailTitle', { name: gameName })}
        className="max-w-2xl"
        closeLabel={commonT('close')}
      >
        {order && (
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <DetailRow label={t('detailIcon')}>
                {logo
                  ? <img src={logo} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  : '—'}
              </DetailRow>
              <DetailRow label={t('detailInstanceId')}>
                <span className="inline-flex items-center gap-2">
                  <span className="font-mono text-xs">{order.uri}</span>
                  <CopyButton text={order.uri} />
                </span>
              </DetailRow>
              <DetailRow label={t('detailAppName')}>{order.productName}</DetailRow>
              <DetailRow label={t('detailLanguages')}>
                {order.latestLanguages?.length ? (
                  <ul className="space-y-1">
                    {order.latestLanguages.map((language) => (
                      <li key={language} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                        {LANGUAGE_NAMES[language] ?? language}
                      </li>
                    ))}
                  </ul>
                ) : '—'}
              </DetailRow>
              <DetailRow label={t('detailScreen')}>
                {screenType === 1 || screenType === 2 ? (
                  <span className="inline-flex items-center gap-1.5">
                    {screenType === 1
                      ? <Smartphone className="h-4 w-4 text-gray-600" aria-hidden="true" />
                      : <Monitor className="h-4 w-4 text-gray-600" aria-hidden="true" />}
                    {screenType === 1 ? t('portrait') : t('landscape')}
                  </span>
                ) : '—'}
              </DetailRow>
              <DetailRow label={t('detailHalfRatio')}>
                {order.latestScreenConfig?.halfRatio || '—'}
              </DetailRow>
              <DetailRow label={t('detailAddedAt')}>{formatTimestamp(order.createdAt, format)}</DetailRow>
              <DetailRow label={t('detailVersion')}>
                <span className="inline-flex items-center gap-2">
                  <span>{order.deployedVersion || '—'}</span>
                  {canUpdate && (
                    <button
                      type="button"
                      onClick={() => { setUpdateError(null); setConfirmingUpdate(true); }}
                      className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-500"
                    >
                      {t('update')}
                    </button>
                  )}
                </span>
              </DetailRow>
              <DetailRow label={t('detailUpdatedAt')}>{formatTimestamp(order.updatedAt, format)}</DetailRow>
              <DetailRow label={t('detailH5Links')}>
                <div className="space-y-1.5">
                  {[
                    { label: t('fullscreenUrl'), url: order.accessUrl },
                    { label: t('halfScreenUrl'), url: order.halfScreenAccessUrl },
                  ].filter((item) => item.url).map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className="shrink-0 text-gray-500">{item.label}:</span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-0 truncate text-blue-600 hover:underline"
                      >
                        {item.url}
                      </a>
                      <CopyButton text={item.url!} />
                    </div>
                  ))}
                  {!order.accessUrl && !order.halfScreenAccessUrl && '—'}
                </div>
              </DetailRow>
              <DetailRow label={t('detailAdminConsole')}>
                {order.adminUrl ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenAdminConsole?.(order)}
                      className="shrink-0 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-500"
                    >
                      {t('adminConsoleOpen')}
                    </button>
                    <span className="min-w-0 truncate text-gray-500">{order.adminUrl}</span>
                    <CopyButton text={order.adminUrl} />
                  </div>
                ) : '—'}
              </DetailRow>
              <DetailRow label={t('detailSocket')}>
                {order.socketUrl ? (
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 truncate font-mono text-xs">{order.socketUrl}</span>
                    <CopyButton text={order.socketUrl} />
                  </span>
                ) : '—'}
              </DetailRow>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={confirmingUpdate}
        title={t('updateTitle')}
        description={t('updateDescription', { version: latestVersion?.version ?? '' })}
        confirmLabel={t('update')}
        cancelLabel={commonT('cancel')}
        tone="warning"
        loading={updating}
        error={updateError ?? undefined}
        onConfirm={() => void handleUpdate()}
        onCancel={() => setConfirmingUpdate(false)}
      />
    </>
  );
};

export default OrderDetailModal;
