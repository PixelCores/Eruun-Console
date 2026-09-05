import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslations } from 'next-intl';
import {
  Activity,
  ArrowRight,
  Check,
  Cloud,
  Eye,
  EyeOff,
  Gamepad2,
  KeyRound,
  LockKeyhole,
  Mail,
  Rocket,
  ShieldCheck,
} from 'lucide-react';
import gameCloudHero from '../../assets/login-game-cloud-hero.png';
import { sendLoginCode } from '../../api/paasAuth';
import { getSafeRedirect, isSessionActive, useAuthStore } from '../../stores/authStore';
import './LoginPage.css';

type LoginMode = 'password' | 'email-code';

type LoginNotice = {
  kind: 'error' | 'success';
  message: string;
};

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const LoginPage = () => {
  const t = useTranslations('Login');
  const [loginMode, setLoginMode] = useState<LoginMode>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [remember, setRemember] = useState(false);
  const [notice, setNotice] = useState<LoginNotice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeCooldown, setCodeCooldown] = useState(0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const session = useAuthStore((state) => state.session);
  const signIn = useAuthStore((state) => state.signIn);
  const redirect = searchParams.get('redirect');
  const capabilityItems = [
    { icon: Rocket, title: t('capabilityDelivery'), description: t('capabilityDeliveryDescription') },
    { icon: Cloud, title: t('capabilityInfrastructure'), description: t('capabilityInfrastructureDescription') },
    { icon: Activity, title: t('capabilityOperations'), description: t('capabilityOperationsDescription') },
  ];

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

  const selectLoginMode = (mode: LoginMode) => {
    setLoginMode(mode);
    setNotice(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const identifier = email.trim();
    const data = loginMode === 'password' ? password : verificationCode;

    if (!isValidEmail(identifier)) {
      setNotice({ kind: 'error', message: t('invalidEmail') });
      return;
    }

    if (loginMode === 'email-code' && !/^\d{6}$/.test(verificationCode)) {
      setNotice({ kind: 'error', message: t('invalidCode') });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      await signIn(
        {
          identifier,
          type: loginMode === 'password' ? 'password' : 'code',
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
      setNotice({ kind: 'success', message: t('codeSent') });
    } catch (error) {
      setNotice({
        kind: 'error',
        message: error instanceof Error ? error.message : t('codeFailed'),
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-story" aria-label={t('platformLabel')}>
        <div className="login-story__cloud login-story__cloud--one" aria-hidden="true" />
        <div className="login-story__cloud login-story__cloud--two" aria-hidden="true" />

        <div className="login-brand">
          <img className="login-brand__logo" src="/logo_icon.svg" alt="" />
          <span>Eruun Console</span>
        </div>

        <div className="login-story__content">
          <div className="login-eyebrow">
            <Gamepad2 size={16} aria-hidden="true" />
            {t('eyebrow')}
          </div>
          <h1>{t('headline')}</h1>
          <p>{t('intro')}</p>

          <div className="login-capabilities">
            {capabilityItems.map(({ icon: Icon, title, description }) => (
              <div className="login-capability" key={title}>
                <div className="login-capability__heading">
                  <span className="login-capability__icon">
                    <Icon size={17} aria-hidden="true" />
                  </span>
                  <strong>{title}</strong>
                  <Check className="login-capability__check" size={15} aria-hidden="true" />
                </div>
                <small>{description}</small>
              </div>
            ))}
          </div>
        </div>

        <img className="login-story__art" src={gameCloudHero} alt="" aria-hidden="true" />
      </section>

      <section className="login-panel">
        <div className="login-brand login-brand--mobile">
          <img className="login-brand__logo" src="/logo_icon.svg" alt="" />
          <span>Eruun Console</span>
        </div>

        <div className="login-card">
          <span className="login-card__badge">
            <ShieldCheck size={15} aria-hidden="true" />
            {t('secureAccess')}
          </span>

          <div className="login-method" role="group" aria-label={t('signInMethod')}>
            <button
              type="button"
              className={loginMode === 'password' ? 'is-active' : undefined}
              aria-pressed={loginMode === 'password'}
              onClick={() => selectLoginMode('password')}
              disabled={isSubmitting}
            >
              <LockKeyhole size={16} aria-hidden="true" />
              {t('password')}
            </button>
            <button
              type="button"
              className={loginMode === 'email-code' ? 'is-active' : undefined}
              aria-pressed={loginMode === 'email-code'}
              onClick={() => selectLoginMode('email-code')}
              disabled={isSubmitting}
            >
              <Mail size={16} aria-hidden="true" />
              {t('emailCode')}
            </button>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-field" htmlFor="email">
              <span>{t('email')}</span>
              <span className="login-field__control">
                <Mail size={18} aria-hidden="true" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </span>
            </label>

            {loginMode === 'password' ? (
              <label className="login-field" htmlFor="password">
                <span>{t('password')}</span>
                <span className="login-field__control">
                  <LockKeyhole size={18} aria-hidden="true" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder={t('passwordPlaceholder')}
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    className="login-field__toggle"
                    type="button"
                    aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((visible) => !visible)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>
            ) : (
              <label className="login-field" htmlFor="verification-code">
                <span>{t('verificationCode')}</span>
                <span className="login-field__control">
                  <KeyRound size={18} aria-hidden="true" />
                  <input
                    id="verification-code"
                    name="verificationCode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder={t('codePlaceholder')}
                    pattern="[0-9]{4}"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 4))}
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    className="login-field__send"
                    type="button"
                    onClick={handleSendCode}
                    disabled={isSubmitting || isSendingCode || codeCooldown > 0}
                  >
                    {isSendingCode ? t('sending') : codeCooldown > 0 ? t('resendIn', { seconds: codeCooldown }) : t('sendCode')}
                  </button>
                </span>
              </label>
            )}

            <div className="login-form__options">
              <label className="login-checkbox">
                <input
                  type="checkbox"
                  name="remember"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  disabled={isSubmitting}
                />
                <span>{t('remember')}</span>
              </label>
            </div>

            <button className="login-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('signingIn') : loginMode === 'password' ? t('signIn') : t('continueEmail')}
              <ArrowRight size={18} aria-hidden="true" />
            </button>

            {notice && (
              <div className={`login-notice login-notice--${notice.kind}`} role="status">
                <ShieldCheck size={17} aria-hidden="true" />
                <span>{notice.message}</span>
              </div>
            )}
          </form>

        </div>

        <p className="login-panel__footer">{t('footer')}</p>
      </section>
    </main>
  );
};

export default LoginPage;
