import { useState, type ChangeEvent } from 'react';
import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingPortal,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { ChevronDown, Clock3, Globe2, LogOut, Settings, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { useAuthStore } from '../stores/authStore';
import {
  formatTimeZoneOffset,
  TIME_ZONE_OPTIONS,
  useSettingsStore,
} from '../stores/settingsStore';
import { getMyProfile, resolveCoreUrl } from '../api/profile';
import PersonalInfoModal from './account/PersonalInfoModal';
import AccountSettingsModal from './account/AccountSettingsModal';

interface SidebarAccountPanelProps {
  collapsed: boolean;
}

const AccountAvatar = ({ avatarUrl, initial }: { avatarUrl: string; initial: string }) => {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className="h-7 w-7 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#344054] text-xs font-semibold text-white dark:bg-[#667085]">
      {initial}
    </span>
  );
};

export const SidebarAccountPanel = ({ collapsed }: SidebarAccountPanelProps) => {
  const t = useTranslations('Header');
  const navigate = useNavigate();
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);
  const locale = useSettingsStore((state) => state.locale);
  const timeZone = useSettingsStore((state) => state.timeZone);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [personalInfoOpen, setPersonalInfoOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const accessToken = session?.accessToken;
  const { data: profileData } = useSWR(
    accessToken ? ['my-profile', accessToken] : null,
    ([, token]) => getMyProfile(token),
  );

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'top-start',
    middleware: [offset(6), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });
  const { setReference, setFloating } = refs;
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'menu' });
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const handleLocaleToggle = () => {
    updateSettings({ locale: locale === 'zh-CN' ? 'en' : 'zh-CN' });
    setIsOpen(false);
  };

  const handleTimeZoneChange = (event: ChangeEvent<HTMLSelectElement>) => {
    updateSettings({ timeZone: Number(event.target.value) });
    setIsOpen(false);
  };

  const avatarInitial = session?.identifier.trim().charAt(0).toUpperCase() || '?';
  const avatarUrl = resolveCoreUrl(profileData?.user.avatar ?? '');
  const localeLabel = locale === 'zh-CN' ? t('chinese') : t('english');
  const timeZoneLabel = formatTimeZoneOffset(timeZone);

  return (
    <div className="shrink-0 border-t border-divider-regular pt-2">
      <button
        ref={setReference}
        type="button"
        disabled={isSigningOut}
        aria-label={t('account')}
        title={t('account')}
        className={`flex min-h-10 w-full items-center rounded-md px-2 py-1.5 text-text-secondary transition-colors hover:bg-state-base-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-accent-solid disabled:cursor-not-allowed disabled:opacity-60 ${collapsed ? 'justify-center' : 'gap-2'} ${isOpen ? 'bg-state-base-hover' : ''}`}
        {...getReferenceProps()}
      >
        <AccountAvatar avatarUrl={avatarUrl} initial={avatarInitial} />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-text-primary">
              {session?.identifier}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-text-quaternary transition-transform ${isOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </>
        )}
      </button>

      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={setFloating}
              style={{ ...floatingStyles, width: '14rem' }}
              className="z-50 overflow-hidden rounded-lg border border-components-panel-border bg-components-panel-bg p-1 shadow-md animate-in fade-in-0 zoom-in-95"
              {...getFloatingProps()}
            >
              <div className="flex items-center gap-2 border-b border-gray-100 px-2 py-2">
                <AccountAvatar avatarUrl={avatarUrl} initial={avatarInitial} />
                <span className="min-w-0 truncate text-sm font-medium text-text-primary">{session?.identifier}</span>
              </div>

              <div className="space-y-0.5 py-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    setPersonalInfoOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-text-secondary transition-colors hover:bg-state-base-hover focus-visible:bg-state-base-hover focus-visible:outline-none"
                >
                  <UserRound className="h-4 w-4 shrink-0 text-text-tertiary" aria-hidden="true" />
                  <span className="flex-1">{t('personalInfo')}</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    setSettingsOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-text-secondary transition-colors hover:bg-state-base-hover focus-visible:bg-state-base-hover focus-visible:outline-none"
                >
                  <Settings className="h-4 w-4 shrink-0 text-text-tertiary" aria-hidden="true" />
                  <span className="flex-1">{t('accountSettings')}</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  aria-label={`${t('language')}: ${localeLabel}`}
                  onClick={handleLocaleToggle}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-text-secondary transition-colors hover:bg-state-base-hover focus-visible:bg-state-base-hover focus-visible:outline-none"
                >
                  <Globe2 className="h-4 w-4 shrink-0 text-text-tertiary" aria-hidden="true" />
                  <span className="flex-1">{t('language')}</span>
                  <span className="text-[11px] text-text-tertiary">{localeLabel}</span>
                </button>

                <label className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary transition-colors hover:bg-state-base-hover focus-within:bg-state-base-hover">
                  <Clock3 className="h-4 w-4 shrink-0 text-text-tertiary" aria-hidden="true" />
                  <span className="flex-1">{t('timeZone')}</span>
                  <span className="relative flex items-center">
                    <select
                      value={timeZone}
                      onChange={handleTimeZoneChange}
                      aria-label={`${t('timeZone')}: ${timeZoneLabel}`}
                      className="cursor-pointer appearance-none rounded bg-transparent py-0.5 pl-1 pr-4 text-[11px] text-text-tertiary outline-none focus-visible:ring-2 focus-visible:ring-state-accent-solid"
                    >
                      {TIME_ZONE_OPTIONS.map((offsetValue) => (
                        <option key={offsetValue} value={offsetValue}>
                          {formatTimeZoneOffset(offsetValue)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-0 h-3 w-3 text-text-quaternary"
                      aria-hidden="true"
                    />
                  </span>
                </label>
              </div>

              <div className="border-t border-gray-100 pt-1">
                <button
                  type="button"
                  role="menuitem"
                  disabled={isSigningOut}
                  onClick={() => void handleSignOut()}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:bg-red-50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {isSigningOut ? t('signingOut') : t('signOut')}
                </button>
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}

      <PersonalInfoModal open={personalInfoOpen} onClose={() => setPersonalInfoOpen(false)} />
      <AccountSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};
