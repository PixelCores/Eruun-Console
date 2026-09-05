import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Modal from '../base/Modal';
import Input from '../base/Input';
import { Button } from '../ui/Button';
import {
  changeMyPassword,
  getMyProfile,
  resolveCoreUrl,
  uploadMyAvatar,
} from '../../api/profile';
import { useAuthStore } from '../../stores/authStore';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB, matches the server limit
const AVATAR_ACCEPT = 'image/png,image/jpeg';
const MIN_PASSWORD_LENGTH = 8;

const getErrorMessage = (caughtError: unknown, fallback: string) =>
  caughtError instanceof Error && caughtError.message ? caughtError.message : fallback;

interface PasswordInputProps {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

const PasswordInput = ({ label, value, placeholder, onChange }: PasswordInputProps) => {
  const t = useTranslations('Account');
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-gray-700">{label}</span>
      <span className="relative block">
        <Input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          className="pr-10"
        />
        <button
          type="button"
          aria-label={visible ? t('hidePassword') : t('showPassword')}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 transition-colors hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-accent-solid"
        >
          {visible
            ? <EyeOff className="h-4 w-4" aria-hidden="true" />
            : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </span>
    </label>
  );
};

interface AccountSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const AccountSettingsModal = ({ open, onClose }: AccountSettingsModalProps) => {
  const t = useTranslations('Account');
  const commonT = useTranslations('Common');
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.accessToken;
  const { mutate: globalMutate } = useSWRConfig();

  const profileKey = accessToken ? ['my-profile', accessToken] : null;
  const { data: profileData } = useSWR(
    open && profileKey ? profileKey : null,
    ([, token]: readonly [string, string]) => getMyProfile(token),
  );

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarPreviewUrlRef = useRef<string | null>(null);

  const setPreviewUrl = (next: string | null) => {
    if (avatarPreviewUrlRef.current) URL.revokeObjectURL(avatarPreviewUrlRef.current);
    avatarPreviewUrlRef.current = next;
    setAvatarPreviewUrl(next);
  };

  const resetForm = () => {
    setAvatarFile(null);
    setPreviewUrl(null);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setFormError('');
    setSuccessMessage('');
  };

  // Revoke any lingering object URL when the component unmounts.
  useEffect(() => () => {
    if (avatarPreviewUrlRef.current) URL.revokeObjectURL(avatarPreviewUrlRef.current);
  }, []);

  const closeModal = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
      setFormError(t('avatarInvalidType'));
      setSuccessMessage('');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setFormError(t('avatarTooLarge'));
      setSuccessMessage('');
      return;
    }
    setFormError('');
    setSuccessMessage('');
    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const profileAvatarUrl = resolveCoreUrl(profileData?.user.avatar ?? '');
  const displayedAvatarUrl = avatarPreviewUrl ?? (profileAvatarUrl || null);
  const avatarInitial = session?.identifier.trim().charAt(0).toUpperCase() || '?';

  const handleSubmit = async () => {
    if (!accessToken || isSubmitting) return;

    const trimmedOld = oldPassword.trim();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();
    const wantsPasswordChange = Boolean(trimmedOld || trimmedNew || trimmedConfirm);

    if (!avatarFile && !wantsPasswordChange) {
      setFormError(t('nothingToUpdate'));
      return;
    }
    if (wantsPasswordChange) {
      if (!trimmedOld || !trimmedNew || !trimmedConfirm) {
        setFormError(t('passwordRequired'));
        return;
      }
      if (trimmedNew.length < MIN_PASSWORD_LENGTH) {
        setFormError(t('passwordTooShort'));
        return;
      }
      if (trimmedNew !== trimmedConfirm) {
        setFormError(t('passwordMismatch'));
        return;
      }
    }

    setIsSubmitting(true);
    setFormError('');
    setSuccessMessage('');

    let avatarSaved = false;
    if (avatarFile) {
      try {
        await uploadMyAvatar(accessToken, avatarFile);
        avatarSaved = true;
      } catch (caughtError) {
        setFormError(getErrorMessage(caughtError, t('actionFailed')));
        setIsSubmitting(false);
        return;
      }
    }

    if (wantsPasswordChange) {
      try {
        await changeMyPassword(accessToken, trimmedOld, trimmedNew);
      } catch (caughtError) {
        const message = getErrorMessage(caughtError, t('actionFailed'));
        setFormError(avatarSaved ? t('avatarSavedPasswordFailed', { message }) : message);
        if (avatarSaved && profileKey) void globalMutate(profileKey);
        setIsSubmitting(false);
        return;
      }
    }

    if (profileKey) await globalMutate(profileKey);
    resetForm();
    setSuccessMessage(t('settingsSaved'));
    setIsSubmitting(false);
  };

  return (
    <Modal
      isShow={open}
      onClose={closeModal}
      title={t('settingsTitle')}
      closeLabel={commonT('close')}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          {displayedAvatarUrl ? (
            <img
              src={displayedAvatarUrl}
              alt={t('avatarLabel')}
              className="h-16 w-16 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#344054] text-xl font-semibold text-white dark:bg-[#667085]">
              {avatarInitial}
            </span>
          )}
          <div className="min-w-0">
            <Button
              variant="secondary"
              size="small"
              disabled={isSubmitting}
              onClick={() => fileInputRef.current?.click()}
            >
              {t('changeAvatar')}
            </Button>
            <p className="mt-1.5 text-xs text-gray-500">{t('avatarHint')}</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={AVATAR_ACCEPT}
            className="sr-only"
            onChange={handleAvatarChange}
          />
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-gray-700">
            {t('registrationEmail')}
          </span>
          <Input value={session?.identifier ?? ''} disabled readOnly />
        </label>

        <PasswordInput
          label={t('currentPassword')}
          value={oldPassword}
          placeholder={t('currentPasswordPlaceholder')}
          onChange={setOldPassword}
        />
        <PasswordInput
          label={t('newPassword')}
          value={newPassword}
          placeholder={t('newPasswordPlaceholder')}
          onChange={setNewPassword}
        />
        <PasswordInput
          label={t('confirmPassword')}
          value={confirmPassword}
          placeholder={t('confirmPasswordPlaceholder')}
          onChange={setConfirmPassword}
        />

        {formError && <p role="alert" className="text-xs text-red-600">{formError}</p>}
        {successMessage && (
          <div role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {successMessage}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={closeModal} disabled={isSubmitting}>
            {commonT('cancel')}
          </Button>
          <Button loading={isSubmitting} onClick={() => void handleSubmit()}>
            {t('submit')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AccountSettingsModal;
