import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Camera, Trash2, Save, KeyRound, MapPin, X, Phone, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../hooks/useCatalog';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AccountLayout } from '../components/layout/AccountLayout';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { PasswordInput } from '../components/ui/PasswordInput';
import { Button } from '../components/ui/Button';
import { UserAvatar } from '../components/ui/UserAvatar';
import { LocationSearch } from '../components/ui/LocationSearch';
import { indexLocations } from '../lib/locations';
import { ACCEPTED_TYPES, MAX_UPLOAD_BYTES, prepareImage } from '../lib/image';
import { fieldErrors } from '../lib/auth';
import { isBlank, toastErrors } from '../lib/validation';
import { MIN_PASSWORD_LENGTH } from '../lib/constants';

const BIO_MAX = 500;

function Section({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-border bg-white shadow-xs">
      <header className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-base font-bold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export default function ProfileSettings() {
  useDocumentTitle('Profile settings');
  const { user, setUser } = useAuth();
  const { locations } = useCatalog();
  const locIndex = useMemo(() => indexLocations(locations), [locations]);
  const fileRef = useRef(null);

  const [details, setDetails] = useState({ name: '', email: '', bio: '', location_id: '' });
  const [detailErrors, setDetailErrors] = useState({});
  const [savingDetails, setSavingDetails] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDetails({
      name: user.name || '',
      email: user.email || '',
      bio: user.bio || '',
      location_id: user.location_id ? String(user.location_id) : '',
    });
  }, [user]);

  const locationPath = details.location_id
    ? locIndex.path(details.location_id).map((l) => l.name).reverse().join(', ')
    : '';

  const saveProfile = async (patch) => {
    const res = await api.put('/auth/me', patch);
    if (res.data?.data) setUser(res.data.data);
    return res;
  };

  const openPicker = () => {
    if (!photoBusy) fileRef.current?.click();
  };

  const uploadPhoto = async (original) => {
    if (photoBusy) return;
    if (!ACCEPTED_TYPES.includes(original.type)) {
      toast.error('Choose a JPG, PNG or WebP photo.');
      return;
    }
    setPhotoBusy(true);
    try {
      const file = await prepareImage(original);
      if (file.size > MAX_UPLOAD_BYTES) throw new Error('This photo is larger than 5 MB.');
      const form = new FormData();
      form.append('image', file);
      form.append('purpose', 'avatar');
      const up = await api.post('/uploads/images', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 });
      await saveProfile({ image: up.data.data.path });
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(err.response?.data?.errors?.image?.[0] || err.response?.data?.message || err.message || 'The photo could not be uploaded.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const onPhotoPicked = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) uploadPhoto(file);
  };

  const removePhoto = async () => {
    setPhotoBusy(true);
    try {
      await saveProfile({ image: null });
      toast.success('Profile photo removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'The photo could not be removed.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const submitDetails = async (e) => {
    e.preventDefault();
    const errs = {};
    if (isBlank(details.name) || details.name.trim().length < 2) errs.name = 'Enter your name (at least 2 characters).';
    if (details.email && !/^\S+@\S+\.\S+$/.test(details.email)) errs.email = 'Enter a valid email address, or leave it empty.';
    if (details.bio.length > BIO_MAX) errs.bio = `Keep your bio under ${BIO_MAX} characters.`;
    setDetailErrors(errs);
    if (Object.keys(errs).length) return toastErrors(errs, { name: 'ps-name', email: 'ps-email', bio: 'ps-bio' });

    setSavingDetails(true);
    try {
      await saveProfile({
        name: details.name.trim(),
        email: details.email.trim() || null,
        bio: details.bio.trim() || null,
        location_id: details.location_id ? Number(details.location_id) : null,
      });
      toast.success('Profile saved');
    } catch (err) {
      const fe = fieldErrors(err);
      setDetailErrors(fe);
      if (Object.keys(fe).length) toastErrors(fe, { name: 'ps-name', email: 'ps-email', bio: 'ps-bio' });
      else toast.error(err.response?.data?.message || 'Your profile could not be saved.');
    } finally {
      setSavingDetails(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (isBlank(pw.current_password)) errs.current_password = 'Enter your current password.';
    if (pw.password.length < MIN_PASSWORD_LENGTH) errs.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    else if (pw.password !== pw.password_confirmation) errs.password_confirmation = 'The new passwords do not match.';
    setPwErrors(errs);
    if (Object.keys(errs).length) return toastErrors(errs, { current_password: 'ps-current', password: 'ps-new', password_confirmation: 'ps-confirm' });

    setSavingPw(true);
    try {
      await api.post('/auth/change-password', pw);
      setPw({ current_password: '', password: '', password_confirmation: '' });
      toast.success('Password changed. Your other devices have been signed out.');
    } catch (err) {
      const fe = fieldErrors(err);
      setPwErrors(fe);
      if (Object.keys(fe).length) toastErrors(fe, { current_password: 'ps-current', password: 'ps-new' });
      else toast.error(err.response?.data?.message || 'Your password could not be changed.');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <AccountLayout title="Profile settings" subtitle="Your photo and details help buyers and sellers trust you.">
      <div className="space-y-6">
        <Section title="Profile photo" description="Optional. Shown next to your listings and messages.">
          <div
            role="button"
            tabIndex={0}
            aria-label={user?.image ? 'Change profile photo' : 'Upload profile photo'}
            aria-disabled={photoBusy}
            onClick={openPicker}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openPicker();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) uploadPhoto(file);
            }}
            className={`group flex flex-col items-start gap-5 rounded-xl border-2 border-dashed p-4 transition sm:flex-row sm:items-center ${
              dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/60 hover:bg-zinc-50'
            } ${photoBusy ? 'cursor-progress' : 'cursor-pointer'} focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30`}
          >
            <div className="relative">
              <UserAvatar user={user} className="h-24 w-24 text-2xl" />
              <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-primary text-white shadow-sm transition group-hover:scale-110" aria-hidden="true">
                <Camera size={15} />
              </span>
              {photoBusy && (
                <span className="absolute inset-0 grid place-items-center rounded-full bg-ink/50 text-white">
                  <Loader2 size={22} className="animate-spin" aria-hidden="true" />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-ink">
                {photoBusy ? 'Uploading…' : user?.image ? 'Click to change your photo' : 'Click to upload a photo'}
              </p>
              <p className="mt-0.5 text-sm text-muted">or drag and drop it here</p>
              <p className="mt-2 text-xs text-muted">JPG, PNG or WebP, up to 5 MB. A clear photo of your face or shop logo works best.</p>
              {user?.image && !photoBusy && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto();
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                  iconLeft={<Trash2 size={14} />}
                >
                  Remove photo
                </Button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              className="hidden"
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
              onChange={onPhotoPicked}
            />
          </div>
        </Section>

        <Section title="Personal details">
          <form onSubmit={submitDetails} noValidate className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Input
                id="ps-name"
                label="Name"
                required
                maxLength={100}
                placeholder="Your full name or shop name"
                value={details.name}
                onChange={(e) => setDetails({ ...details, name: e.target.value })}
                error={detailErrors.name}
              />
              <Input
                id="ps-email"
                type="email"
                label="Email (optional)"
                maxLength={150}
                placeholder="name@example.com"
                value={details.email}
                onChange={(e) => setDetails({ ...details, email: e.target.value })}
                error={detailErrors.email}
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-ink">Mobile number</span>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-zinc-50 px-3 py-2.5 text-sm text-zinc-600">
                <Phone size={15} className="text-muted" aria-hidden="true" />
                {user?.phone}
              </div>
              <p className="text-xs text-muted">This is how you log in. To change it, contact support.</p>
            </div>

            <div>
              {details.location_id ? (
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-ink">Location</span>
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5">
                    <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
                      <MapPin size={15} className="shrink-0 text-primary" aria-hidden="true" />
                      <span className="truncate">{locationPath || 'Selected location'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setDetails({ ...details, location_id: '' })}
                      className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-ink"
                      aria-label="Clear location"
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ) : (
                <LocationSearch
                  id="ps-location"
                  index={locIndex}
                  label="Location (optional)"
                  placeholder="Type your area or district, e.g. Mirpur"
                  onPick={(l) => setDetails({ ...details, location_id: String(l.id) })}
                />
              )}
              {detailErrors.location_id && <p className="mt-1 text-xs font-medium text-red-500">{detailErrors.location_id}</p>}
            </div>

            <div>
              <Textarea
                id="ps-bio"
                label="About you (optional)"
                rows={4}
                maxLength={BIO_MAX}
                placeholder="e.g. Registered cat breeder in Dhaka since 2019. All kittens are vaccinated."
                value={details.bio}
                onChange={(e) => setDetails({ ...details, bio: e.target.value })}
                error={detailErrors.bio}
              />
              <p className="mt-1 text-right text-xs text-muted">{details.bio.length}/{BIO_MAX}</p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" loading={savingDetails} iconLeft={<Save size={16} />}>
                Save details
              </Button>
            </div>
          </form>
        </Section>

        <Section title="Change password" description="Changing your password signs you out on your other devices.">
          <form onSubmit={submitPassword} noValidate className="space-y-5">
            <PasswordInput
              id="ps-current"
              placeholder="Enter your current password"
              label="Current password"
              autoComplete="current-password"
              value={pw.current_password}
              onChange={(e) => setPw({ ...pw, current_password: e.target.value })}
              error={pwErrors.current_password}
            />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <PasswordInput
                id="ps-new"
                placeholder="Create a new password"
                label="New password"
                autoComplete="new-password"
                value={pw.password}
                onChange={(e) => setPw({ ...pw, password: e.target.value })}
                error={pwErrors.password}
              />
              <PasswordInput
                id="ps-confirm"
                placeholder="Re-enter the new password"
                label="Confirm new password"
                autoComplete="new-password"
                value={pw.password_confirmation}
                onChange={(e) => setPw({ ...pw, password_confirmation: e.target.value })}
                error={pwErrors.password_confirmation}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="secondary" loading={savingPw} iconLeft={<KeyRound size={16} />}>
                Change password
              </Button>
            </div>
          </form>
        </Section>
      </div>
    </AccountLayout>
  );
}
