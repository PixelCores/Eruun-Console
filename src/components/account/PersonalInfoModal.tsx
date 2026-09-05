import { useEffect, useState, type ReactNode } from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import Modal from '../base/Modal';
import Input from '../base/Input';
import { Button } from '../ui/Button';
import { getMyProfile, updateMyProfile } from '../../api/profile';
import { useAuthStore } from '../../stores/authStore';
import { getPaaSRoleLabel, parsePaaSRole, type PaaSRole } from '../../api/paasAuth';

const DetailRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex border-b border-gray-100 last:border-b-0">
    <div className="w-32 shrink-0 bg-gray-50 px-4 py-3 text-sm text-gray-500">{label}</div>
    <div className="min-w-0 flex-1 px-4 py-3 text-sm text-gray-900">{children}</div>
  </div>
);

const SkeletonRow = () => (
  <div className="flex border-b border-gray-100 last:border-b-0">
    <div className="w-32 shrink-0 bg-gray-50 px-4 py-3">
      <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
    </div>
    <div className="min-w-0 flex-1 px-4 py-3">
      <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
    </div>
  </div>
);

interface PersonalInfoModalProps {
  open: boolean;
  onClose: () => void;
}

const PersonalInfoModal = ({ open, onClose }: PersonalInfoModalProps) => {
  const t = useTranslations('Account');
  const commonT = useTranslations('Common');
  const accessToken = useAuthStore((state) => state.session?.accessToken);

  const { data, error, isLoading, mutate } = useSWR(
    open && accessToken ? ['my-profile', accessToken] : null,
    ([, token]) => getMyProfile(token),
  );

  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.user) setNickname(data.user.nickname ?? '');
  }, [data]);

  const role = data?.user ? parsePaaSRole(data.user.role) : null;
  const roleLabel = role !== null ? getPaaSRoleLabel(role as PaaSRole) : '—';
  const tenants = data?.tenants ?? [];

  const handleSave = async () => {
    if (!accessToken || saving) return;
    const trimmed = nickname.trim();
    if (!trimmed || trimmed === data?.user.nickname) return;

    setSaving(true);
    setFormError('');
    setSaved(false);
    try {
      await updateMyProfile(accessToken, { nickname: trimmed });
      setSaved(true);
      await mutate();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : t('actionFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isShow={open}
      onClose={onClose}
      title={t('personalInfoTitle')}
      className="max-w-2xl"
      closeLabel={commonT('close')}
    >
      <div className="max-h-[70vh] overflow-y-auto">
        {isLoading && (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            {Array.from({ length: 4 }, (_, index) => <SkeletonRow key={index} />)}
          </div>
        )}

        {!isLoading && error && (
          <div className="space-y-3">
            <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {t('profileLoadError')}
            </div>
            <Button variant="secondary" size="small" onClick={() => void mutate()}>
              {commonT('retry')}
            </Button>
          </div>
        )}

        {!isLoading && !error && data && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <DetailRow label={t('email')}>{data.user.email}</DetailRow>
              <DetailRow label={t('nickname')}>
                <div className="flex items-center gap-2">
                  <Input
                    value={nickname}
                    onChange={(event) => {
                      setNickname(event.target.value);
                      setSaved(false);
                    }}
                    placeholder={t('nicknamePlaceholder')}
                  />
                  <Button
                    size="small"
                    disabled={saving || !nickname.trim() || nickname.trim() === data.user.nickname}
                    loading={saving}
                    onClick={() => void handleSave()}
                  >
                    {commonT('save')}
                  </Button>
                </div>
              </DetailRow>
              <DetailRow label={t('role')}>{roleLabel}</DetailRow>
              <DetailRow label={t('myTenants')}>
                {tenants.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tenants.map((tenant) => (
                      <span
                        key={tenant.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700"
                      >
                        {tenant.name}
                        <span className="text-[10px] text-gray-400">{tenant.role}</span>
                      </span>
                    ))}
                  </div>
                ) : '—'}
              </DetailRow>
            </div>

            {formError && <p role="alert" className="text-xs text-red-600">{formError}</p>}
            {saved && (
              <div role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {t('profileSaved')}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PersonalInfoModal;
