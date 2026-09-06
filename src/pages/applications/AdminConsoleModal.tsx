import { useEffect, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Modal from '../../components/base/Modal';
import type { PurchaserOrder } from '../../api/orders';
import { getSafeExternalUrl } from '../../utils/url';
import CopyButton from './CopyButton';

interface AdminConsoleFrameProps {
  url: string;
  name: string;
}

const AdminConsoleFrame = ({ url, name }: AdminConsoleFrameProps) => {
  const t = useTranslations('Applications');
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);

  // Browsers do not reliably surface X-Frame-Options rejections, so after a
  // few seconds without onLoad we offer the external fallback link.
  useEffect(() => {
    if (loaded) return undefined;
    const timer = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(timer);
  }, [loaded]);

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" aria-hidden="true" />
          <p className="text-sm text-gray-500">{t('adminConsoleLoading')}</p>
          {slow && (
            <p className="text-sm text-gray-500">
              {t('adminConsoleLoadSlow')}{' '}
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                {t('adminConsoleOpenExternal')}
              </a>
            </p>
          )}
        </div>
      )}
      <iframe
        src={url}
        title={t('adminConsoleTitle', { name })}
        onLoad={() => setLoaded(true)}
        className="h-full w-full"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
        allow="clipboard-read; clipboard-write"
        referrerPolicy="no-referrer"
      />
    </>
  );
};

interface AdminConsoleModalProps {
  order: PurchaserOrder | null;
  onClose: () => void;
}

const AdminConsoleModal = ({ order, onClose }: AdminConsoleModalProps) => {
  const t = useTranslations('Applications');
  const commonT = useTranslations('Common');

  const adminUrl = getSafeExternalUrl(order?.adminUrl);
  const gameName = order?.game?.name || order?.productName || '';

  return (
    <Modal
      isShow={order !== null}
      onClose={onClose}
      title={t('adminConsoleTitle', { name: gameName })}
      className="max-w-6xl"
      closeLabel={commonT('close')}
      headerActions={adminUrl ? (
        <>
          <CopyButton text={adminUrl} />
          <a
            href={adminUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={t('adminConsoleOpenExternal')}
            title={t('adminConsoleOpenExternal')}
            className="rounded-full p-1 transition-colors hover:bg-gray-100"
          >
            <ExternalLink className="h-5 w-5 text-gray-500" aria-hidden="true" />
          </a>
        </>
      ) : undefined}
    >
      <div className="relative h-[75vh] overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        {adminUrl ? (
          // Keying by URL remounts the frame (and resets its loading state)
          // whenever another order is opened.
          <AdminConsoleFrame key={adminUrl} url={adminUrl} name={gameName} />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-gray-500">
            {t('adminConsoleUnavailable')}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AdminConsoleModal;
