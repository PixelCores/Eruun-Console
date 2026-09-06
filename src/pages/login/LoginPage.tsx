import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff, Github, Mail, Play } from 'lucide-react';
import { sendLoginCode } from '../../api/paasAuth';
import { getSafeRedirect, isSessionActive, useAuthStore } from '../../stores/authStore';

type Step = 'email' | 'credential';
type CredentialMode = 'password' | 'email-code';

type LoginNotice = {
  kind: 'error' | 'success';
  message: string;
};

/**
 * 登录卡片调色板 —— 白色风格（布局/字号/间距与参考图 1:1，配色适配白底）。
 * 品牌紫 #6D5DE7 取样自参考图；页面为固定浅色设计，不随暗色主题切换。
 */
const palette = {
  card: 'bg-white',
  cardBorder: 'border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.06)]',
  oauthButton:
    'bg-white border-gray-300 hover:bg-gray-50 text-gray-700',
  dividerLine: 'bg-gray-200',
  dividerText: 'text-gray-400',
  label: 'text-gray-900',
  input:
    'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#6D5DE7] focus:ring-2 focus:ring-[#6D5DE7]/20',
  accent: 'bg-[#6D5DE7] hover:bg-[#5D4FD6] text-white',
  accentText: 'text-[#6D5DE7]',
  cardFooter: 'bg-gray-50 border-t border-gray-100',
  cardFooterText: 'text-gray-500',
  subtitle: 'text-gray-500',
  emailChip: 'bg-gray-100 text-gray-700',
  noticeError: 'text-red-600',
  noticeSuccess: 'text-green-600',
} as const;

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

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
  </svg>
);

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.317 4.37a19.79 19.79 0 00-4.885-1.515.074.074 0 00-.079.037 12.36 12.36 0 00-.608 1.25 18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.319 13.58.099 18.058a.082.082 0 00.031.056 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.042-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.078-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.007.128 12.3 12.3 0 01-1.873.891.077.077 0 00-.041.107c.36.698.764 1.363 1.225 1.993a.076.076 0 00.084.029 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.029-.029zM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.211 0 2.176 1.095 2.157 2.419 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.095 2.157 2.419 0 1.333-.946 2.419-2.157 2.419z" />
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

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

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

  const inputClass = `h-11 w-full rounded-lg border px-3.5 text-sm outline-none transition disabled:opacity-60 ${palette.input}`;

  return (
    <main className="flex min-h-screen flex-col bg-white">
      {/* 居中深色卡片（参考图 1:1；页面主体白色） */}
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-[384px]">
          <div className={`overflow-hidden rounded-2xl ${palette.card} ${palette.cardBorder}`}>
            <div className="px-8 pb-7 pt-9">
              <h1 className="text-center text-2xl font-bold tracking-tight text-gray-900">
                {t('signInTitle')}
              </h1>
              <p className={`mt-2 text-center text-sm ${palette.subtitle}`}>
                {t('welcomeBack')}
              </p>

              {step === 'email' ? (
                <form onSubmit={handleEmailContinue}>
                  {/* 第三方登录 */}
                  <div className="mt-8 flex gap-3">
                    <button
                      type="button"
                      onClick={() => startOAuth('github')}
                      className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition ${palette.oauthButton}`}
                    >
                      <GitHubIcon />
                      GitHub
                    </button>
                    <button
                      type="button"
                      onClick={() => startOAuth('google')}
                      className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition ${palette.oauthButton}`}
                    >
                      <GoogleIcon />
                      Google
                    </button>
                  </div>

                  {/* 分隔线 */}
                  <div className="my-7 flex items-center gap-4" aria-hidden="true">
                    <span className={`h-px flex-1 ${palette.dividerLine}`} />
                    <span className={`text-xs ${palette.dividerText}`}>{t('or')}</span>
                    <span className={`h-px flex-1 ${palette.dividerLine}`} />
                  </div>

                  {/* 邮箱 */}
                  <div>
                    <label htmlFor="email" className={`block text-sm font-semibold ${palette.label}`}>
                      {t('email')}
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder={t('emailFieldPlaceholder')}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className={`${inputClass} mt-2`}
                      required
                    />
                  </div>

                  {notice && (
                    <p
                      role="status"
                      className={`mt-4 text-sm ${notice.kind === 'error' ? palette.noticeError : palette.noticeSuccess}`}
                    >
                      {notice.message}
                    </p>
                  )}

                  <button
                    type="submit"
                    className={`mt-7 flex h-12 w-full items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition ${palette.accent}`}
                  >
                    {t('continueAction')}
                    <Play size={13} fill="currentColor" aria-hidden="true" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSubmit}>
                  {/* 已确认的邮箱 */}
                  <div className={`mt-8 flex items-center justify-between rounded-lg px-3.5 py-2.5 ${palette.emailChip}`}>
                    <span className="truncate text-sm">{email}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('email');
                        setNotice(null);
                      }}
                      className={`ml-3 shrink-0 text-sm font-medium hover:underline ${palette.accentText}`}
                      disabled={isSubmitting}
                    >
                      {t('changeEmail')}
                    </button>
                  </div>

                  {credentialMode === 'password' ? (
                    <div className="mt-5">
                      <label htmlFor="password" className={`block text-sm font-semibold ${palette.label}`}>
                        {t('password')}
                      </label>
                      <div className="relative mt-2">
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
                    <div className="mt-5">
                      <label htmlFor="verification-code" className={`block text-sm font-semibold ${palette.label}`}>
                        {t('verificationCode')}
                      </label>
                      <div className="relative mt-2">
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
                          className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium hover:underline disabled:no-underline disabled:text-gray-400 ${palette.accentText}`}
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

                  <div className="mt-4 flex items-center justify-between">
                    <label className={`flex items-center gap-2 text-sm ${palette.cardFooterText}`}>
                      <input
                        type="checkbox"
                        name="remember"
                        checked={remember}
                        onChange={(event) => setRemember(event.target.checked)}
                        disabled={isSubmitting}
                        className="h-4 w-4 rounded border-gray-300 bg-white accent-[#6D5DE7]"
                      />
                      {t('remember')}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCredentialMode((mode) => (mode === 'password' ? 'email-code' : 'password'));
                        setNotice(null);
                      }}
                      className={`text-sm font-medium hover:underline ${palette.accentText}`}
                      disabled={isSubmitting}
                    >
                      {credentialMode === 'password' ? t('useEmailCode') : t('usePassword')}
                    </button>
                  </div>

                  {notice && (
                    <p
                      role="status"
                      className={`mt-4 text-sm ${notice.kind === 'error' ? palette.noticeError : palette.noticeSuccess}`}
                    >
                      {notice.message}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`mt-6 flex h-12 w-full items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition disabled:opacity-60 ${palette.accent}`}
                  >
                    {isSubmitting ? t('signingIn') : t('signIn')}
                    {!isSubmitting && <Play size={13} fill="currentColor" aria-hidden="true" />}
                  </button>
                </form>
              )}
            </div>

            {/* 卡片底部注册条 */}
            <div className={`px-8 py-4 text-center text-sm ${palette.cardFooter} ${palette.cardFooterText}`}>
              {showSignUpHint ? (
                <span>{t('signUpUnavailable')}</span>
              ) : (
                <>
                  {t('noAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => setShowSignUpHint(true)}
                    className={`font-medium hover:underline ${palette.accentText}`}
                  >
                    {t('signUp')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 页面底部（白色主体上） */}
      <footer className="pb-10 text-center">
        <nav className="flex items-center justify-center gap-3 text-sm text-gray-500">
          <a href="#" className="transition hover:text-gray-700">{t('terms')}</a>
          <span aria-hidden="true" className="text-gray-300">·</span>
          <a href="#" className="transition hover:text-gray-700">{t('privacy')}</a>
          <span aria-hidden="true" className="text-gray-300">·</span>
          <a href="#" className="transition hover:text-gray-700">{t('download')}</a>
        </nav>
        <div className="mt-5 flex items-center justify-center gap-5 text-gray-500">
          <a href="#" aria-label="Twitter" className="transition hover:text-gray-700"><TwitterIcon /></a>
          <a href="#" aria-label="GitHub" className="transition hover:text-gray-700"><Github size={22} strokeWidth={1.6} /></a>
          <a href="#" aria-label="Discord" className="transition hover:text-gray-700"><DiscordIcon /></a>
          <a href="#" aria-label="Email" className="transition hover:text-gray-700"><Mail size={22} strokeWidth={1.6} /></a>
        </div>
        <p className="mt-6 text-sm text-gray-400">{t('copyright')}</p>
      </footer>
    </main>
  );
};

export default LoginPage;
