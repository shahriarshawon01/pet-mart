import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AuthLayout } from '../components/layout/AuthLayout';
import { PhoneInput } from '../components/ui/PhoneInput';
import { PasswordInput } from '../components/ui/PasswordInput';
import { Button } from '../components/ui/Button';
import { BD_PHONE_REGEX } from '../lib/constants';
import { fieldErrors, getRedirectTarget } from '../lib/auth';
import { isBlank, toastErrors } from '../lib/validation';

export default function Login() {
  useDocumentTitle('Log in');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (isBlank(phone)) e.phone = 'Mobile number is required.';
    else if (!BD_PHONE_REGEX.test(phone)) e.phone = 'Mobile number must be 11 digits and start with 01 (e.g. 017XXXXXXXX).';
    if (isBlank(password)) e.password = 'Password is required.';
    setErrors(e);
    if (Object.keys(e).length) toastErrors(e, { phone: 'login-phone', password: 'login-password' });
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await login(phone, password);
      toast.success('Welcome back!');
      navigate(getRedirectTarget(location), { replace: true });
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(fe);
      if (Object.keys(fe).length) {
        toastErrors(fe, { phone: 'login-phone', password: 'login-password' });
      } else {
        const msg = !err.response
          ? 'No connection to the server. Check your internet and try again.'
          : err.response.data?.message || 'Login failed. Check your mobile number and password.';
        setFormError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Log in"
      subtitle="Welcome back. Log in to message sellers and manage your listings."
      footer={
        <>
          New to PetMart?{' '}
          <Link to="/register" state={location.state} className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {formError && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
          {formError}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <PhoneInput
          id="login-phone"
          label="Mobile number"
          required
          autoComplete="username"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
        />
        <PasswordInput
          id="login-password"
          label="Password"
          required
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          labelAction={
            <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
              Forgot password?
            </Link>
          }
        />
        <Button type="submit" size="lg" className="w-full" loading={loading} iconLeft={<LogIn size={18} />}>
          Log in
        </Button>
      </form>
    </AuthLayout>
  );
}
