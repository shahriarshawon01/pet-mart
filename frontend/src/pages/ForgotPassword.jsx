import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Phone, KeyRound, ShieldCheck, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AuthLayout } from '../components/layout/AuthLayout';
import { PhoneInput } from '../components/ui/PhoneInput';
import { PasswordInput } from '../components/ui/PasswordInput';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { BD_PHONE_REGEX, MIN_PASSWORD_LENGTH } from '../lib/constants';
import { fieldErrors } from '../lib/auth';
import { isBlank, toastErrors } from '../lib/validation';

/**
 * Self-service password reset:
 *   POST /auth/forgot-password { phone }        -> SMS code (same reply whether or not the number exists)
 *   POST /auth/verify-otp      { phone, otp }   -> short-lived reset token
 *   POST /auth/reset-password  { token, password }
 */
const STEPS = [
  { icon: Phone, label: 'Mobile number' },
  { icon: ShieldCheck, label: 'SMS code' },
  { icon: KeyRound, label: 'New password' },
];
const RESEND_SECONDS = 60;

function serverMessage(err, fallback) {
  if (!err.response) return 'No connection to the server. Check your internet and try again.';
  if (err.response.status === 429) return err.response.data?.message || 'Too many attempts. Please wait a minute and try again.';
  return err.response.data?.message || fallback;
}

export default function ForgotPassword() {
  useDocumentTitle('Reset password');
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const fail = (e, ids) => {
    setErrors(e);
    toastErrors(e, ids);
  };

  const requestCode = async (e) => {
    e?.preventDefault();
    if (isBlank(phone)) return fail({ phone: 'Mobile number is required.' }, { phone: 'reset-phone' });
    if (!BD_PHONE_REGEX.test(phone)) return fail({ phone: 'Mobile number must be 11 digits and start with 01.' }, { phone: 'reset-phone' });
    setErrors({});
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { phone });
      toast.success(res.data?.message || 'If this number is registered, we have sent a code by SMS.');
      setCooldown(RESEND_SECONDS);
      setStep(1);
    } catch (err) {
      toast.error(serverMessage(err, 'The code could not be sent. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) return fail({ otp: 'Enter the 6-digit code from the SMS.' }, { otp: 'reset-otp' });
    setErrors({});
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { phone, otp });
      setToken(res.data?.data?.token || '');
      setStep(2);
    } catch (err) {
      const fe = fieldErrors(err);
      if (Object.keys(fe).length) fail(fe, { otp: 'reset-otp' });
      else toast.error(serverMessage(err, 'The code could not be checked. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    const fe = {};
    if (password.length < MIN_PASSWORD_LENGTH) fe.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    if (confirm !== password) fe.confirm = 'Passwords do not match.';
    if (Object.keys(fe).length) return fail(fe, { password: 'reset-password', confirm: 'reset-confirm' });
    setErrors({});
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password updated. Please log in with your new password.');
      navigate('/login', { replace: true });
    } catch (err) {
      const errs = fieldErrors(err);
      if (errs.token) {
        toast.error('This reset has expired. Please request a new code.');
        setStep(0);
        setOtp('');
        setToken('');
      } else if (Object.keys(errs).length) {
        fail(errs, { password: 'reset-password' });
      } else {
        toast.error(serverMessage(err, 'Your password could not be updated. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We will send a 6-digit code to your mobile number."
      footer={
        <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
          <ArrowLeft size={14} aria-hidden="true" /> Back to log in
        </Link>
      }
    >
      <ol className="mb-6 flex items-center gap-2" aria-label="Progress">
        {STEPS.map(({ icon: Icon, label }, i) => (
          <li key={label} className="flex flex-1 items-center gap-2" aria-current={i === step ? 'step' : undefined}>
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                i < step ? 'bg-primary text-white' : i === step ? 'bg-primary/15 text-primary ring-2 ring-primary' : 'bg-zinc-100 text-zinc-400'
              }`}
            >
              <Icon size={15} aria-hidden="true" />
            </span>
            <span className={`hidden text-xs font-semibold sm:inline ${i === step ? 'text-ink' : 'text-muted'}`}>{label}</span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" aria-hidden="true" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <form onSubmit={requestCode} noValidate className="space-y-5">
          <PhoneInput
            id="reset-phone"
            label="Mobile number"
            required
            autoComplete="username"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
          />
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Send code
          </Button>
        </form>
      )}

      {step === 1 && (
        <form onSubmit={verifyCode} noValidate className="space-y-5">
          <p className="text-sm text-muted">
            Enter the code sent to <span className="font-semibold text-ink">{phone}</span>. It expires in 10 minutes.
          </p>
          <Input
            id="reset-otp"
            placeholder="Enter the 6-digit code"
            label="6-digit code"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            error={errors.otp}
          />
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Verify code
          </Button>
          <div className="flex items-center justify-between text-sm">
            <button type="button" className="font-semibold text-muted hover:text-ink" onClick={() => setStep(0)}>
              Change number
            </button>
            <button
              type="button"
              className="font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
              disabled={cooldown > 0 || loading}
              onClick={requestCode}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={savePassword} noValidate className="space-y-5">
          <PasswordInput
            id="reset-password"
            placeholder="Create a new password"
            label="New password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <PasswordInput
            id="reset-confirm"
            placeholder="Re-enter the new password"
            label="Confirm new password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirm}
          />
          <Button type="submit" size="lg" className="w-full" loading={loading} iconLeft={<KeyRound size={18} />}>
            Save new password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
