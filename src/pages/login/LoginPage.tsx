import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff, Play } from 'lucide-react';
import { sendLoginCode } from '../../api/paasAuth';
import { getSafeRedirect, isSessionActive, useAuthStore } from '../../stores/authStore';

type Step = 'email' | 'credential';
type CredentialMode = 'password' | 'email-code';

type LoginNotice = {
  kind: 'error' | 'success';
  message: string;
};

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
    />
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
    />
  </svg>
);

/** 跳转到后端 OAuth 2.0 授权起点（/auth/oauth2/:provider/start） */
const startOAuth = (provider: 'github' | 'google') => {
  const base = (
    import.meta.env.VITE_PAAS_AUTH_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    '/api/v1'
  ).replace(/\/+$/, '');
  window.location.href = `${base}/auth/oauth2/${provider}/start`;
};

const LoginPage = () => {
  const t = useTranslations('Login');
  const [step, setStep] = useState<Step>('email');
  const [credentialMode, setCredentialMode] = useState<CredentialMode>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [remember, setRemember] = useState(false);
  const [notice, setNotice] = useState<LoginNotice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeCooldown, setCodeCooldown] = useState(0);
  const [showSignUpHint, setShowSignUpHint] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const session = useAuthStore((state) => state.session);
  const signIn = useAuthStore((state) => state.signIn);
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    if (isSessionActive(session)) {
      navigate(getSafeRedirect(redirect), { replace: true });
    }
  }, [navigate, redirect, session]);

  useEffect(() => {
    if (codeCooldown === 0) return;

    const timer = window.setTimeout(() => {
      setCodeCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [codeCooldown]);

  const handleEmailContinue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidEmail(email.trim())) {
      setNotice({ kind: 'error', message: t('invalidEmail') });
      return;
    }
    setNotice(null);
    setStep('credential');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const identifier = email.trim();
    const data = credentialMode === 'password' ? password : verificationCode;

    if (credentialMode === 'email-code' && !/^\d{6}$/.test(verificationCode)) {
      setNotice({ kind: 'error', message: t('invalidCode') });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      await signIn(
        {
          identifier,
          type: credentialMode === 'password' ? 'password' : 'code',
          data,
        },
        remember,
      );
      navigate(getSafeRedirect(redirect), { replace: true });
    } catch (error) {
      setNotice({
        kind: 'error',
        message: error instanceof Error ? error.message : t('signInFailed'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendCode = async () => {
    const receiver = email.trim();
    if (!isValidEmail(receiver)) {
      setNotice({ kind: 'error', message: t('requestEmailFirst') });
      return;
    }

    setIsSendingCode(true);
    setNotice(null);

    try {
      await sendLoginCode(receiver);
      setCodeCooldown(60);
      setNotice({ kind: 'success', message: t('codeSentTo', { email: receiver }) });
    } catch (error) {
      setNotice({
        kind: 'error',
        message: error instanceof Error ? error.message : t('codeFailed'),
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const switchCredentialMode = (mode: CredentialMode) => {
    setCredentialMode(mode);
    setNotice(null);
  };

  const inputClass =
    'h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-state-accent-solid focus:ring-2 focus:ring-state-accent-solid/20 disabled:opacity-60';

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
          <div className="px-8 pb-8 pt-10">
            {/* 标题区 */}
            <h1 className="text-center text-2xl font-semibold tracking-tight text-gray-900">
              {t('signInTitle')}
            </h1>
            <p className="mt-2 text-center text-sm text-gray-500">
              {t('welcomeBack')}
            </p>

            {step === 'email' ? (
              <form onSubmit={handleEmailContinue} className="mt-8 space-y-5">
                {/* 第三方登录 */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => startOAuth('github')}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <GitHubIcon />
                    GitHub
                  </button>
                  <button
                    type="button"
                    onClick={() => startOAuth('google')}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <GoogleIcon />
                    Google
                  </button>
                </div>

                {/* 分隔线 */}
                <div className="flex items-center gap-4" aria-hidden="true">
                  <span className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs text-gray-400">{t('or')}</span>
                  <span className="h-px flex-1 bg-gray-200" />
                </div>

                {/* 邮箱 */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                    {t('email')}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder={t('emailPlaceholder')}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={inputClass}
                    required
                  />
                </div>

                {notice && (
                  <p
                    role="status"
                    className={`text-sm ${
                      notice.kind === 'error' ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {notice.message}
                  </p>
                )}

                <button
                  type="submit"
                  className="flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-state-accent-solid text-sm font-semibold text-white transition hover:bg-state-accent-solid-hover"
                >
                  {t('continueAction')}
                  <Play size={13} fill="currentColor" aria-hidden="true" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {/* 已确认的邮箱 */}
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3.5 py-2.5">
                  <span className="truncate text-sm text-gray-700">{email}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setNotice(null);
                    }}
                    className="ml-3 shrink-0 text-sm font-medium text-state-accent-solid hover:underline"
                    disabled={isSubmitting}
                  >
                    {t('changeEmail')}
                  </button>
                </div>

                {credentialMode === 'password' ? (
                  <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                      {t('password')}
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder={t('passwordPlaceholder')}
                        minLength={8}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className={`${inputClass} pr-11`}
                        disabled={isSubmitting}
                        required
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword((visible) => !visible)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        disabled={isSubmitting}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label htmlFor="verification-code" className="block text-sm font-medium text-gray-900">
                      {t('verificationCode')}
                    </label>
                    <div className="relative">
                      <input
                        id="verification-code"
                        name="verificationCode"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder={t('codePlaceholder')}
                        pattern="[0-9]{6}"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(event) =>
                          setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                        className={`${inputClass} pr-24`}
                        disabled={isSubmitting}
                        required
                      />
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={isSubmitting || isSendingCode || codeCooldown > 0}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-state-accent-solid hover:underline disabled:text-gray-400 disabled:no-underline"
                      >
                        {isSendingCode
                          ? t('sending')
                          : codeCooldown > 0
                            ? t('resendIn', { seconds: codeCooldown })
                            : t('sendCode')}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                      disabled={isSubmitting}
                      className="h-4 w-4 rounded border-gray-300 accent-indigo-600"
                    />
                    {t('remember')}
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      switchCredentialMode(
                        credentialMode === 'password' ? 'email-code' : 'password',
                      )
                    }
                    className="text-sm font-medium text-state-accent-solid hover:underline"
                    disabled={isSubmitting}
                  >
                    {credentialMode === 'password' ? t('useEmailCode') : t('usePassword')}
                  </button>
                </div>

                {notice && (
                  <p
                    role="status"
                    className={`text-sm ${
                      notice.kind === 'error' ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {notice.message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-state-accent-solid text-sm font-semibold text-white transition hover:bg-state-accent-solid-hover disabled:opacity-60"
                >
                  {isSubmitting ? t('signingIn') : t('signIn')}
                  {!isSubmitting && <Play size={13} fill="currentColor" aria-hidden="true" />}
                </button>
              </form>
            )}
          </div>

          {/* 底部注册条 */}
          <div className="rounded-b-2xl border-t border-gray-100 bg-gray-50/60 px-8 py-4 text-center text-xs text-gray-500">
            {showSignUpHint ? (
              <span className="text-gray-600">{t('signUpUnavailable')}</span>
            ) : (
              <>
                {t('noAccount')}{' '}
                <button
                  type="button"
                  onClick={() => setShowSignUpHint(true)}
                  className="font-medium text-state-accent-solid hover:underline"
                >
                  {t('signUp')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
