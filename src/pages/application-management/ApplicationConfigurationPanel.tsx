import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Bot,
  Code2,
  Copy,
  Eye,
  Globe2,
  KeyRound,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react';
import {
  buildPurchaserProductUpdateRequest,
  createPurchaserProductSecret,
  generatePurchaserSecret,
  sendPurchaserSecretCode,
  updatePurchaserProduct,
  updatePurchaserProductDomain,
  validatePurchaserTls,
  viewPurchaserSecret,
  type PurchaserProduct,
  type PurchaserProductApis,
} from '../../api/paasBilling';
import ConfirmDialog from '../../components/base/ConfirmDialog';
import Modal from '../../components/base/Modal';
import Input from '../../components/base/Input';
import { Button } from '../../components/ui/Button';
import RobotManagementPanel from './RobotManagementPanel';

type ConfigurationTab = 'secret' | 'callbacks' | 'domain' | 'robots';
type SecretAction = 'view' | 'generate';
type DirtySection = 'callbacks' | 'domain';

const CALLBACK_FIELDS = [
  'api_get_sstoken',
  'api_update_sstoken',
  'api_get_userinfo',
  'api_get_score',
  'api_change_score',
] as const;

type CallbackField = (typeof CALLBACK_FIELDS)[number];
type CallbackForm = Record<CallbackField, string>;

interface DomainForm {
  scheme: 'http://' | 'https://';
  frontend: string;
  backend: string;
  certificate: File | null;
  privateKey: File | null;
}

interface ApplicationConfigurationPanelProps {
  accessToken: string;
  product: PurchaserProduct;
  purchaserUri: string;
  onDirtyChange: (dirty: boolean) => void;
  onProductUpdated: () => Promise<unknown>;
}

const isAbsoluteHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const isDomainUrl = (value: string) => {
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:')
      && Boolean(url.hostname)
      && (url.pathname === '/' || url.pathname === '')
      && !url.search
      && !url.hash
    );
  } catch {
    return false;
  }
};

const stripScheme = (value: string | undefined) => (
  value?.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '') ?? ''
);

const toBase64 = (value: string) => btoa(value);

const ConfigurationMessage = ({
  error,
  message,
}: {
  error: string;
  message: string;
}) => {
  if (!error && !message) return null;

  return (
    <p
      role={error ? 'alert' : 'status'}
      className={`rounded-lg px-3 py-2 text-xs ${
        error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
      }`}
    >
      {error || message}
    </p>
  );
};

const FieldLabel = ({
  children,
  required = false,
}: {
  children: React.ReactNode;
  required?: boolean;
}) => (
  <span className="mb-1.5 block text-xs font-medium text-gray-700">
    {required && <span className="mr-1 text-red-500">*</span>}
    {children}
  </span>
);

const SecretManagementPanel = ({
  accessToken,
  product,
  onProductUpdated,
}: Pick<
  ApplicationConfigurationPanelProps,
  'accessToken' | 'product' | 'onProductUpdated'
>) => {
  const t = useTranslations('ApplicationManagement');
  const [secretAction, setSecretAction] = useState<SecretAction | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isSendingCode, setSendingCode] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [plainSecret, setPlainSecret] = useState('');
  const [copyMessage, setCopyMessage] = useState('');

  useEffect(() => {
    if (secondsRemaining <= 0) return undefined;
    const timer = window.setInterval(() => {
      setSecondsRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsRemaining]);

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(t('copied'));
    } catch {
      setCopyMessage(t('copyFailed'));
    }
  };

  const openSecretModal = (action: SecretAction) => {
    setSecretAction(action);
    setVerificationCode('');
    setModalError('');
    setPlainSecret('');
    setSecondsRemaining(0);
  };

  const closeSecretModal = () => {
    if (isSubmitting || isSendingCode) return;
    setSecretAction(null);
    setVerificationCode('');
    setModalError('');
    setPlainSecret('');
    setSecondsRemaining(0);
  };

  const sendCode = async () => {
    if (!secretAction || secondsRemaining > 0) return;
    setSendingCode(true);
    setModalError('');
    try {
      await sendPurchaserSecretCode(accessToken, secretAction);
      setSecondsRemaining(60);
    } catch (caughtError) {
      setModalError(caughtError instanceof Error ? caughtError.message : t('actionFailed'));
    } finally {
      setSendingCode(false);
    }
  };

  const submitSecretAction = async () => {
    if (!secretAction) return;
    if (!verificationCode.trim()) {
      setModalError(t('verificationCodeRequired'));
      return;
    }
    setSubmitting(true);
    setModalError('');
    try {
      const request = { productId: product.id, code: verificationCode.trim() };
      const response = secretAction === 'view'
        ? await viewPurchaserSecret(accessToken, {
          ...request,
          env: product.env,
          timeZone: 8,
        })
        : await generatePurchaserSecret(accessToken, request);
      if (secretAction === 'generate') await onProductUpdated();
      setPlainSecret(response.appSecret);
    } catch (caughtError) {
      setModalError(caughtError instanceof Error ? caughtError.message : t('actionFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const appId = product.appId?.trim() || t('unavailable');
  const maskedSecret = product.appSecret?.trim() || '••••••••••••••••••••••••';

  return (
    <div className="px-4 py-5 lg:px-6 lg:py-6">
      <div className="max-w-2xl">
        <h3 className="text-sm font-semibold text-gray-900">{t('secretManagement')}</h3>
        <p className="mt-1 text-xs leading-5 text-gray-500">{t('secretManagementDescription')}</p>

        <dl className="mt-6 divide-y divide-gray-100 rounded-lg border border-gray-200">
          <div className="grid gap-2 px-4 py-4 sm:grid-cols-[140px_minmax(0,1fr)_auto] sm:items-center">
            <dt className="text-xs font-medium text-gray-500">{t('appSecret')}</dt>
            <dd className="break-all font-mono text-sm text-gray-900">{maskedSecret}</dd>
            <div className="flex flex-wrap gap-2">
              <Button size="small" variant="secondary" onClick={() => openSecretModal('view')}>
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('viewSecret')}
                </span>
              </Button>
              <Button size="small" variant="warning" onClick={() => openSecretModal('generate')}>
                <span className="inline-flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('resetSecret')}
                </span>
              </Button>
            </div>
          </div>
          <div className="grid gap-2 px-4 py-4 sm:grid-cols-[140px_minmax(0,1fr)_auto] sm:items-center">
            <dt className="text-xs font-medium text-gray-500">{t('appId')}</dt>
            <dd className="break-all font-mono text-sm text-gray-900">{appId}</dd>
            <Button
              size="small"
              variant="secondary"
              disabled={appId === t('unavailable')}
              onClick={() => void copyValue(appId)}
            >
              <span className="inline-flex items-center gap-1.5">
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                {t('copy')}
              </span>
            </Button>
          </div>
        </dl>
        {copyMessage && <p role="status" className="mt-3 text-xs text-gray-500">{copyMessage}</p>}
      </div>

      <Modal
        isShow={secretAction !== null}
        onClose={closeSecretModal}
        closeLabel={t('close')}
        title={t(secretAction === 'generate' ? 'resetSecretTitle' : 'viewSecretTitle')}
        dismissible={!isSubmitting && !isSendingCode}
      >
        <div className="space-y-4">
          {plainSecret ? (
            <>
              <p className="text-sm leading-6 text-gray-600">
                {t(secretAction === 'generate' ? 'newSecretNotice' : 'secretNotice')}
              </p>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="break-all font-mono text-sm font-medium text-gray-900">{plainSecret}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => void copyValue(plainSecret)}>
                  {t('copySecret')}
                </Button>
                <Button onClick={closeSecretModal}>{t('done')}</Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm leading-6 text-gray-600">{t('secretVerificationDescription')}</p>
              {secretAction === 'generate' && (
                <div
                  role="note"
                  className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700"
                >
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p className="text-xs leading-5">{t('confirmResetSecret')}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  placeholder={t('verificationCodePlaceholder')}
                  autoComplete="one-time-code"
                  disabled={isSubmitting || isSendingCode}
                />
                <Button
                  variant="secondary"
                  loading={isSendingCode}
                  disabled={secondsRemaining > 0 || isSubmitting}
                  onClick={() => void sendCode()}
                  className="shrink-0"
                >
                  {secondsRemaining > 0
                    ? t('resendCodeIn', { seconds: secondsRemaining })
                    : t('sendCode')}
                </Button>
              </div>
              {modalError && <p role="alert" className="text-xs text-red-600">{modalError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  disabled={isSubmitting || isSendingCode}
                  onClick={closeSecretModal}
                >
                  {t('cancel')}
                </Button>
                <Button
                  variant={secretAction === 'generate' ? 'destructive' : 'primary'}
                  loading={isSubmitting}
                  disabled={isSendingCode}
                  onClick={() => void submitSecretAction()}
                >
                  {t(secretAction === 'generate' ? 'resetSecret' : 'viewSecret')}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

const CallbackConfigurationPanel = ({
  accessToken,
  product,
  onDirty,
  onProductUpdated,
}: Pick<ApplicationConfigurationPanelProps, 'accessToken' | 'product' | 'onProductUpdated'> & {
  onDirty: (dirty: boolean) => void;
}) => {
  const t = useTranslations('ApplicationManagement');
  const [form, setForm] = useState<CallbackForm>(() => ({
    api_get_sstoken: product.apis?.api_get_sstoken ?? '',
    api_update_sstoken: product.apis?.api_update_sstoken ?? '',
    api_get_userinfo: product.apis?.api_get_userinfo ?? '',
    api_get_score: product.apis?.api_get_score ?? '',
    api_change_score: product.apis?.api_change_score ?? '',
  }));
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const updateField = (field: CallbackField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    onDirty(true);
    setError('');
    setMessage('');
  };

  const saveCallbacks = async () => {
    const normalized = Object.fromEntries(
      CALLBACK_FIELDS.map((field) => [field, form[field].trim()]),
    ) as CallbackForm;
    if (CALLBACK_FIELDS.some((field) => !isAbsoluteHttpUrl(normalized[field]))) {
      setError(t('callbackUrlInvalid'));
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const apis: PurchaserProductApis = { ...product.apis, ...normalized };
      await updatePurchaserProduct(
        accessToken,
        buildPurchaserProductUpdateRequest(product, { apis }),
      );
      await onProductUpdated();
      onDirty(false);
      setMessage(t('callbacksSaved'));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t('actionFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 py-5 lg:px-6 lg:py-6">
      <div className="max-w-3xl">
        <h3 className="text-sm font-semibold text-gray-900">{t('callbackConfiguration')}</h3>
        <p className="mt-1 text-xs leading-5 text-gray-500">{t('callbackConfigurationDescription')}</p>
        <div className="mt-6 space-y-5">
          {CALLBACK_FIELDS.map((field) => (
            <label key={field} className="block">
              <FieldLabel required>{t(field)}</FieldLabel>
              <Input
                value={form[field]}
                onChange={(event) => updateField(field, event.target.value)}
                placeholder="https://api.example.com/path"
                inputMode="url"
              />
              <span className="mt-1.5 block text-xs leading-5 text-gray-400">
                {t(`${field}Hint`)}
              </span>
            </label>
          ))}
          <ConfigurationMessage error={error} message={message} />
          <Button loading={isSaving} onClick={() => void saveCallbacks()}>{t('saveChanges')}</Button>
        </div>
      </div>
    </div>
  );
};

const DomainBindingPanel = ({
  accessToken,
  product,
  onDirty,
  onProductUpdated,
}: Pick<ApplicationConfigurationPanelProps, 'accessToken' | 'product' | 'onProductUpdated'> & {
  onDirty: (dirty: boolean) => void;
}) => {
  const t = useTranslations('ApplicationManagement');
  const secretUrls = product.appSecretUrls;
  const [form, setForm] = useState<DomainForm>(() => ({
    scheme: secretUrls?.frontend_url?.startsWith('https://') || secretUrls?.type === 1
      ? 'https://'
      : 'http://',
    frontend: stripScheme(secretUrls?.frontend_url),
    backend: stripScheme(secretUrls?.backend_url),
    certificate: null,
    privateKey: null,
  }));
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pendingScheme, setPendingScheme] = useState<DomainForm['scheme'] | null>(null);

  const cnameValues = useMemo(() => product.cname?.split(',').map((value) => value.trim()) ?? [], [
    product.cname,
  ]);
  const frontendCname = secretUrls?.front_cname?.trim() || cnameValues[0] || t('unavailable');
  const backendCname = secretUrls?.backend_cname?.trim() || cnameValues[1] || t('unavailable');

  const markChanged = () => {
    onDirty(true);
    setError('');
    setMessage('');
  };

  const applyScheme = (scheme: DomainForm['scheme']) => {
    setForm((current) => ({
      ...current,
      scheme,
      ...(scheme === 'http://' ? { certificate: null, privateKey: null } : {}),
    }));
    markChanged();
  };

  const changeScheme = (scheme: DomainForm['scheme']) => {
    if (
      form.scheme === 'https://'
      && scheme === 'http://'
      && secretUrls?.type === 1
    ) {
      setPendingScheme(scheme);
      return;
    }
    applyScheme(scheme);
  };

  const confirmSchemeChange = () => {
    if (!pendingScheme) return;
    applyScheme(pendingScheme);
    setPendingScheme(null);
  };

  const saveDomain = async () => {
    const frontendHost = stripScheme(form.frontend);
    const backendHost = stripScheme(form.backend);
    const frontendUrl = `${form.scheme}${frontendHost}`;
    const backendUrl = `${form.scheme}${backendHost}`;
    if (!frontendHost || !backendHost || !isDomainUrl(frontendUrl) || !isDomainUrl(backendUrl)) {
      setError(t('domainUrlInvalid'));
      return;
    }
    if (frontendUrl.toLowerCase() === backendUrl.toLowerCase()) {
      setError(t('domainsMustDiffer'));
      return;
    }
    if (!product.purchaserId) {
      setError(t('missingPurchaserId'));
      return;
    }
    if (form.scheme === 'https://' && (!form.certificate || !form.privateKey)) {
      setError(t('tlsFilesRequired'));
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    let certificate = '';
    let privateKey = '';
    let currentStep = t('domainStepUpdateProduct');
    try {
      if (form.scheme === 'https://' && form.certificate && form.privateKey) {
        certificate = toBase64(await form.certificate.text());
        privateKey = toBase64(await form.privateKey.text());
        currentStep = t('domainStepValidateTls');
        const validation = await validatePurchaserTls(accessToken, {
          domain: backendUrl,
          crt: certificate,
          key: privateKey,
        });
        if (!validation.is_valid) throw new Error(t('tlsValidationFailed'));
        currentStep = t('domainStepStoreTls');
        await createPurchaserProductSecret(accessToken, {
          purchaserId: product.purchaserId,
          productId: product.id,
          crt: certificate,
          key: privateKey,
        });
      }

      const appSecretUrls = {
        ...secretUrls,
        cert: certificate,
        key: privateKey,
        type: form.scheme === 'https://' ? 1 : 0,
        frontend_url: frontendUrl,
        backend_url: backendUrl,
        front_cname: secretUrls?.front_cname ?? '',
        backend_cname: secretUrls?.backend_cname ?? '',
      };
      currentStep = t('domainStepUpdateProduct');
      await updatePurchaserProduct(
        accessToken,
        buildPurchaserProductUpdateRequest(product, { appSecretUrls }),
      );
      currentStep = t('domainStepBindDomains');
      await updatePurchaserProductDomain(accessToken, {
        purchaserId: product.purchaserId,
        productId: product.id,
        frontend_url: frontendUrl,
        backend_url: backendUrl,
        env: product.env,
      });
      await onProductUpdated();
      onDirty(false);
      setMessage(t('domainSaved'));
      setForm((current) => ({ ...current, certificate: null, privateKey: null }));
    } catch (caughtError) {
      const cause = caughtError instanceof Error ? caughtError.message : t('actionFailed');
      setError(t('domainStepFailed', { step: currentStep, cause }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 py-5 lg:px-6 lg:py-6">
      <div className="max-w-3xl">
        <h3 className="text-sm font-semibold text-gray-900">{t('domainBinding')}</h3>
        <p className="mt-1 text-xs leading-5 text-gray-500">{t('domainBindingDescription')}</p>

        <div className="mt-6 space-y-6">
          <fieldset>
            <legend className="text-xs font-medium text-gray-700">{t('protocol')}</legend>
            <div className="mt-2 flex gap-2">
              {(['https://', 'http://'] as const).map((scheme) => (
                <button
                  key={scheme}
                  type="button"
                  onClick={() => changeScheme(scheme)}
                  className={`rounded-lg border px-4 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    form.scheme === scheme
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {scheme.replace('://', '').toUpperCase()}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <FieldLabel required>{t('frontendDomain')}</FieldLabel>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-200 bg-gray-50 px-3 text-xs text-gray-500">
                  {form.scheme}
                </span>
                <Input
                  value={form.frontend}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, frontend: stripScheme(event.target.value) }));
                    markChanged();
                  }}
                  className="rounded-l-none"
                  placeholder="app.example.com"
                />
              </div>
            </label>
            <label className="block">
              <FieldLabel required>{t('backendDomain')}</FieldLabel>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-200 bg-gray-50 px-3 text-xs text-gray-500">
                  {form.scheme}
                </span>
                <Input
                  value={form.backend}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, backend: stripScheme(event.target.value) }));
                    markChanged();
                  }}
                  className="rounded-l-none"
                  placeholder="api.example.com"
                />
              </div>
            </label>
          </div>

          <div className="grid gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-gray-500">{t('frontendCname')}</p>
              <p className="mt-1 break-all font-mono text-xs text-gray-800">{frontendCname}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">{t('backendCname')}</p>
              <p className="mt-1 break-all font-mono text-xs text-gray-800">{backendCname}</p>
            </div>
          </div>

          {form.scheme === 'https://' && (
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <FieldLabel required>{t('certificateFile')}</FieldLabel>
                <input
                  type="file"
                  accept=".crt,.cer,.pem,application/x-pem-file"
                  onChange={(event) => {
                    setForm((current) => ({ ...current, certificate: event.target.files?.[0] ?? null }));
                    markChanged();
                  }}
                  className="block w-full rounded-lg border border-gray-200 bg-white text-xs text-gray-500 file:mr-3 file:border-0 file:border-r file:border-gray-200 file:bg-gray-50 file:px-3 file:py-2.5 file:text-xs file:font-medium file:text-gray-700"
                />
              </label>
              <label className="block">
                <FieldLabel required>{t('privateKeyFile')}</FieldLabel>
                <input
                  type="file"
                  accept=".key,.pem,application/x-pem-file"
                  onChange={(event) => {
                    setForm((current) => ({ ...current, privateKey: event.target.files?.[0] ?? null }));
                    markChanged();
                  }}
                  className="block w-full rounded-lg border border-gray-200 bg-white text-xs text-gray-500 file:mr-3 file:border-0 file:border-r file:border-gray-200 file:bg-gray-50 file:px-3 file:py-2.5 file:text-xs file:font-medium file:text-gray-700"
                />
              </label>
              <p className="text-xs leading-5 text-gray-500 md:col-span-2">{t('tlsFileNotice')}</p>
            </div>
          )}

          <ConfigurationMessage error={error} message={message} />
          <Button loading={isSaving} onClick={() => void saveDomain()}>{t('saveChanges')}</Button>
        </div>
      </div>
      <ConfirmDialog
        isOpen={pendingScheme !== null}
        title={t('disableTlsTitle')}
        description={t('confirmDisableTls')}
        confirmLabel={t('disableTls')}
        cancelLabel={t('cancel')}
        tone="warning"
        onConfirm={confirmSchemeChange}
        onCancel={() => setPendingScheme(null)}
      />
    </div>
  );
};

const ApplicationConfigurationPanel = ({
  accessToken,
  product,
  purchaserUri,
  onDirtyChange,
  onProductUpdated,
}: ApplicationConfigurationPanelProps) => {
  const t = useTranslations('ApplicationManagement');
  const [activeTab, setActiveTab] = useState<ConfigurationTab>('secret');
  const [pendingTab, setPendingTab] = useState<ConfigurationTab | null>(null);
  const dirtySections = useRef<Record<DirtySection, boolean>>({
    callbacks: false,
    domain: false,
  });

  const setSectionDirty = (section: DirtySection, dirty: boolean) => {
    dirtySections.current = { ...dirtySections.current, [section]: dirty };
    onDirtyChange(dirtySections.current.callbacks || dirtySections.current.domain);
  };

  const changeTab = (nextTab: ConfigurationTab) => {
    if (nextTab === activeTab) return;
    const dirtySection = activeTab === 'callbacks' || activeTab === 'domain' ? activeTab : null;
    if (
      dirtySection
      && dirtySections.current[dirtySection]
    ) {
      setPendingTab(nextTab);
      return;
    }
    if (dirtySection) setSectionDirty(dirtySection, false);
    setActiveTab(nextTab);
  };

  const confirmTabChange = () => {
    if (!pendingTab) return;
    const dirtySection = activeTab === 'callbacks' || activeTab === 'domain' ? activeTab : null;
    if (dirtySection) setSectionDirty(dirtySection, false);
    setActiveTab(pendingTab);
    setPendingTab(null);
  };

  const tabs: Array<{
    id: ConfigurationTab;
    label: string;
    icon: typeof KeyRound;
  }> = [
    { id: 'secret', label: t('secretManagement'), icon: KeyRound },
    { id: 'callbacks', label: t('callbackConfiguration'), icon: Code2 },
    { id: 'domain', label: t('domainBinding'), icon: Globe2 },
    { id: 'robots', label: t('robotManagement'), icon: Bot },
  ];

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto border-b border-gray-200">
        <div role="tablist" aria-label={t('configurationTabs')} className="flex min-w-max px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => changeTab(tab.id)}
                className={`relative inline-flex h-12 items-center gap-2 px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                  isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
                {isActive && <span className="absolute inset-x-3 bottom-0 h-0.5 bg-blue-600" />}
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel">
        {activeTab === 'secret' && (
          <SecretManagementPanel
            accessToken={accessToken}
            product={product}
            onProductUpdated={onProductUpdated}
          />
        )}
        {activeTab === 'callbacks' && (
          <CallbackConfigurationPanel
            accessToken={accessToken}
            product={product}
            onDirty={(dirty) => setSectionDirty('callbacks', dirty)}
            onProductUpdated={onProductUpdated}
          />
        )}
        {activeTab === 'domain' && (
          <DomainBindingPanel
            accessToken={accessToken}
            product={product}
            onDirty={(dirty) => setSectionDirty('domain', dirty)}
            onProductUpdated={onProductUpdated}
          />
        )}
        {activeTab === 'robots' && (
          <RobotManagementPanel
            accessToken={accessToken}
            product={product}
            purchaserUri={purchaserUri}
          />
        )}
      </div>
      <ConfirmDialog
        isOpen={pendingTab !== null}
        title={t('discardChangesTitle')}
        description={t('confirmDiscardChanges')}
        confirmLabel={t('discardChanges')}
        cancelLabel={t('cancel')}
        tone="warning"
        onConfirm={confirmTabChange}
        onCancel={() => setPendingTab(null)}
      />
    </section>
  );
};

export default ApplicationConfigurationPanel;
