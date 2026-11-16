import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Info,
  Send,
} from 'lucide-react';
import api from '../services/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useCatalog } from '../hooks/useCatalog';
import { getCategoryIcon } from '../lib/categoryIcon';
import { CONDITIONS, LISTING_TYPES, LISTING_TYPE_MAP, MAX_PHOTOS } from '../lib/constants';
import { formatPrice } from '../lib/format';
import { fieldErrors } from '../lib/auth';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Checkbox } from '../components/ui/Checkbox';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import { Skeleton } from '../components/ui/Skeleton';
import { PhotoUploader } from '../components/ui/PhotoUploader';
import { LocationSearch } from '../components/ui/LocationSearch';
import { indexLocations, locationOptionLabel } from '../lib/locations';
import { scrollToElement, scrollToTop } from '../lib/scroll';

const STEPS = ['Category', 'Details', 'Location', 'Photos', 'Review'];

const EMPTY = {
  category_id: '',
  listing_type: 'sell',
  title: '',
  description: '',
  price: '',
  is_free: false,
  is_negotiable: false,
  condition: '',
  attributes: {},
  division_id: '',
  district_id: '',
  area_id: '',
  full_address: '',
};

function Stepper({ step }) {
  return (
    <ol className="flex items-center gap-1.5 sm:gap-2" aria-label="Progress">
      {STEPS.map((label, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <li key={label} className="flex flex-1 items-center gap-1.5 sm:gap-2" aria-current={current ? 'step' : undefined}>
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold transition ${
                done ? 'bg-primary text-white' : current ? 'bg-ink text-white' : 'bg-zinc-200 text-zinc-500'
              }`}
            >
              {done ? <Check size={15} aria-hidden="true" /> : i + 1}
            </span>
            <span className={`hidden text-xs font-semibold md:inline ${current ? 'text-ink' : 'text-muted'}`}>{label}</span>
            {i < STEPS.length - 1 && <span className={`h-0.5 flex-1 rounded ${done ? 'bg-primary' : 'bg-zinc-200'}`} aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

export default function CreateListing() {
  useDocumentTitle('Post a listing');
  const { categories, locations, loading: catalogLoading } = useCatalog();
  const [step, setStep] = useState(0);
  const [data, setData] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const [photos, setPhotos] = useState([]);
  const readyPhotos = photos.filter((ph) => ph.status === 'done' && ph.value);
  const uploading = photos.some((ph) => ph.status === 'uploading');

  // Clear the photo error once the user changes their photos
  useEffect(() => {
    setErrors((e) => (e.images ? { ...e, images: undefined } : e));
  }, [photos]);

  const set = (patch) => {
    setData((d) => ({ ...d, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      Object.keys(patch).forEach((k) => delete next[k]);
      return next;
    });
  };

  // Leaf categories (children) plus root categories that have no children
  const choices = useMemo(
    () =>
      categories.flatMap((c) =>
        c.children?.length ? c.children.map((ch) => ({ ...ch, parent: c })) : [{ ...c, parent: null }],
      ),
    [categories],
  );
  const selected = choices.find((c) => String(c.id) === String(data.category_id));
  const attributeDefs = selected?.attributes?.length ? selected.attributes : selected?.parent?.attributes || [];

  const locIndex = useMemo(() => indexLocations(locations), [locations]);
  const districts = locIndex.districtsOf(data.division_id);
  const areas = locIndex.areasOf(data.district_id);
  const pickLocation = (loc) => {
    set(locIndex.selectionFor(loc.id));
    setErrors((e) => ({ ...e, division_id: undefined, district_id: undefined }));
  };
  const nameOf = (list, id) => list?.find((x) => String(x.id) === String(id))?.name;

  // Only "required" checks on the client. Length/format limits are left to the server (and maxLength on inputs).
  const errorsForStep = (s) => {
    const e = {};
    const blank = (v) => String(v ?? '').trim() === '';
    if (s === 0) {
      if (!data.category_id) e.category_id = 'Category is required. Choose what you are listing.';
      if (!data.listing_type) e.listing_type = 'Listing type is required.';
    }
    if (s === 1) {
      if (blank(data.title)) e.title = 'Title is required.';
      if (blank(data.description)) e.description = 'Description is required.';
      attributeDefs.forEach((a) => {
        if (a.is_required && blank(data.attributes[a.attribute_key])) e[`attr_${a.attribute_key}`] = `${a.name} is required.`;
      });
    }
    if (s === 2) {
      if (!data.division_id) e.division_id = 'Division is required.';
      if (districts.length && !data.district_id) e.district_id = 'District is required.';
    }
    if (s === 3) {
      if (uploading) e.images = 'Please wait – your photos are still uploading.';
      else if (photos.some((ph) => ph.status === 'error')) e.images = 'Some photos failed to upload. Retry or remove them.';
      else if (!readyPhotos.length) e.images = 'At least one photo is required.';
    }
    return e;
  };

  // Field key -> element id, used to focus the first problem
  const fieldId = (key) =>
    ({ category_id: 'category-group', listing_type: 'type-group', division_id: 'division', district_id: 'district', images: 'photo-uploader' })[
      key
    ] || (key.startsWith('attr_') ? `attr-${key.slice(5)}` : key);

  const showErrors = (e) => {
    const messages = Object.values(e).filter(Boolean);
    if (!messages.length) return;
    if (messages.length === 1) toast.error(messages[0]);
    else
      toast.error(`${messages.length} fields need your attention`, {
        description: messages.map((m) => `• ${m}`).join('\n'),
        classNames: { description: 'whitespace-pre-line' },
      });
    const first = Object.keys(e)[0];
    setTimeout(() => {
      const el = document.getElementById(fieldId(first));
      scrollToElement(el, { center: true });
      el?.focus?.({ preventScroll: true });
    }, 50);
  };

  const validateStep = (s) => {
    const e = errorsForStep(s);
    setErrors(e);
    if (Object.keys(e).length) {
      showErrors(e);
      return false;
    }
    return true;
  };

  const next = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    scrollToTop();
  };
  const back = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
    scrollToTop();
  };

  // Which step a server-side field belongs to
  const stepOfField = (key) => {
    if (/^(category_id|listing_type)/.test(key)) return 0;
    if (/^(title|description|price|condition|is_|attributes)/.test(key)) return 1;
    if (/^(division_id|district_id|area_id|full_address)/.test(key)) return 2;
    if (/^images/.test(key)) return 3;
    return step;
  };

  const submit = async () => {
    for (let s = 0; s < 4; s += 1) {
      const e = errorsForStep(s);
      if (Object.keys(e).length) {
        setStep(s);
        setErrors(e);
        showErrors(e);
        return;
      }
    }
    setSubmitting(true);
    const attrs = Object.fromEntries(Object.entries(data.attributes).filter(([, v]) => String(v ?? '').trim() !== ''));
    const payload = {
      title: data.title.trim(),
      description: data.description.trim(),
      category_id: Number(data.category_id),
      listing_type: data.listing_type,
      price: data.is_free ? 0 : data.price === '' ? null : Number(data.price),
      is_free: data.is_free,
      is_negotiable: data.is_free ? false : data.is_negotiable,
      condition: data.condition || null,
      division_id: data.division_id ? Number(data.division_id) : null,
      district_id: data.district_id ? Number(data.district_id) : null,
      area_id: data.area_id ? Number(data.area_id) : null,
      full_address: data.full_address.trim() || null,
      images: readyPhotos.map((ph) => ph.value),
      attributes: Object.keys(attrs).length ? attrs : undefined,
    };
    try {
      const res = await api.post('/products', payload);
      setDone(res.data?.data || {});
      toast.success('Listing submitted for review');
      scrollToTop();
    } catch (err) {
      const raw = fieldErrors(err);
      if (Object.keys(raw).length) {
        // Map server keys (e.g. "images.0", "attributes.breed") onto our field keys
        const mapped = {};
        Object.entries(raw).forEach(([k, msg]) => {
          if (k.startsWith('images')) mapped.images = msg;
          else if (k.startsWith('attributes.')) mapped[`attr_${k.slice(11)}`] = msg;
          else mapped[k] = msg;
        });
        setErrors(mapped);
        setStep(stepOfField(Object.keys(raw)[0]));
        showErrors(mapped);
      } else if (err.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
      } else if (!err.response) {
        toast.error('No connection to the server. Check your internet and try again.');
      } else {
        toast.error(err.response?.data?.message || 'Your listing could not be submitted. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Container className="py-12 sm:py-20">
        <div className="mx-auto max-w-lg rounded-3xl border border-border bg-white p-8 text-center shadow-sm sm:p-10">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 size={34} aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold text-ink">Submitted for review</h1>
          <p className="mt-2 text-sm text-muted">
            Our moderators will check your listing. You'll see it go live in My Listings once it's approved.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button as="link" to="/dashboard">
              Go to My Listings
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setData(EMPTY);
                setPhotos([]);
                setStep(0);
                setDone(null);
              }}
            >
              Post another
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  const type = LISTING_TYPE_MAP[data.listing_type];

  return (
    <Container className="py-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Post a listing</h1>
          <p className="mt-1 text-sm text-muted">It's free. Our moderators review every listing before it goes live.</p>
        </div>

        <div className="mb-6 rounded-2xl border border-border bg-white px-4 py-4 sm:px-6">
          <Stepper step={step} />
          <p className="mt-3 text-xs font-semibold text-muted md:hidden">
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-8">
          {/* Step 1: category */}
          {step === 0 && (
            <div className="space-y-8">
              <fieldset id="category-group" tabIndex={-1} className="scroll-mt-28 focus:outline-none">
                <legend className="mb-3 text-base font-bold text-ink">
                  What are you listing? <span className="text-red-500">*</span>
                </legend>
                {catalogLoading ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {choices.map((c) => {
                      const Icon = getCategoryIcon(c.slug);
                      const active = String(c.id) === String(data.category_id);
                      return (
                        <label
                          key={c.id}
                          className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary ${
                            active ? 'border-primary bg-primary/5' : 'border-border hover:border-zinc-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="category"
                            className="sr-only"
                            checked={active}
                            onChange={() => set({ category_id: c.id, attributes: {} })}
                          />
                          <Icon size={26} className={active ? 'text-primary' : 'text-zinc-500'} aria-hidden="true" />
                          <span className="text-sm font-semibold text-ink">{c.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {errors.category_id && (
                  <p className="mt-2 text-xs font-medium text-red-600" role="alert">
                    {errors.category_id}
                  </p>
                )}
              </fieldset>

              <fieldset id="type-group" tabIndex={-1} className="focus:outline-none">
                <legend className="mb-3 text-base font-bold text-ink">Listing type</legend>
                <div className="flex flex-wrap gap-2">
                  {LISTING_TYPES.map((t) => {
                    const active = data.listing_type === t.value;
                    return (
                      <label
                        key={t.value}
                        className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary ${
                          active ? 'border-ink bg-ink text-white' : 'border-border text-zinc-700 hover:border-zinc-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="listing_type"
                          value={t.value}
                          className="sr-only"
                          checked={active}
                          onChange={() => set({ listing_type: t.value, is_free: t.value === 'adopt' ? data.is_free : false })}
                        />
                        {t.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          )}

          {/* Step 2: details */}
          {step === 1 && (
            <div className="space-y-5">
              <Input
                id="title"
                label="Title"
                required
                maxLength={255}
                placeholder="e.g. Persian kitten, 2 months, vaccinated"
                value={data.title}
                onChange={(e) => set({ title: e.target.value })}
                error={errors.title}
                hint="A short, clear title helps buyers find your listing."
              />
              <Textarea
                id="description"
                label="Description"
                required
                rows={6}
                placeholder="Temperament, health, diet, reason for listing, or the item's condition…"
                value={data.description}
                onChange={(e) => set({ description: e.target.value })}
                error={errors.description}
              />

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  id="price"
                  label="Price (৳)"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder={data.is_free ? 'Free' : 'e.g. 15000'}
                  disabled={data.is_free}
                  value={data.is_free ? '' : data.price}
                  onChange={(e) => set({ price: e.target.value })}
                  error={errors.price}
                  hint="Leave empty to show “Negotiable”."
                />
                <Select
                  id="condition"
                  label="Condition"
                  placeholder="Not applicable"
                  value={data.condition}
                  onChange={(e) => set({ condition: e.target.value })}
                  options={CONDITIONS}
                  hint="For supplies and accessories."
                />
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                <Checkbox
                  id="is_free"
                  label="Free (adoption / giveaway)"
                  checked={data.is_free}
                  onChange={(e) => set({ is_free: e.target.checked, price: e.target.checked ? '' : data.price })}
                />
                <Checkbox
                  id="is_negotiable"
                  label="Price is negotiable"
                  checked={data.is_negotiable}
                  disabled={data.is_free}
                  onChange={(e) => set({ is_negotiable: e.target.checked })}
                />
              </div>

              {attributeDefs.length > 0 && (
                <fieldset className="rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
                  <legend className="px-1 text-sm font-bold text-primary">{selected?.name} details</legend>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {attributeDefs.map((a) => {
                      const id = `attr-${a.attribute_key}`;
                      const value = data.attributes[a.attribute_key] ?? '';
                      const onChange = (v) => {
                        set({ attributes: { ...data.attributes, [a.attribute_key]: v } });
                        setErrors((e) => ({ ...e, [`attr_${a.attribute_key}`]: undefined }));
                      };
                      const error = errors[`attr_${a.attribute_key}`];
                      if (a.type === 'select' && Array.isArray(a.options)) {
                        return (
                          <Select
                            key={a.id}
                            id={id}
                            label={a.name}
                            required={a.is_required}
                            placeholder={`Select ${a.name.toLowerCase()}`}
                            options={a.options.map((o) => ({ value: o, label: o }))}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            error={error}
                          />
                        );
                      }
                      if (a.type === 'boolean') {
                        return (
                          <Select
                            key={a.id}
                            id={id}
                            label={a.name}
                            required={a.is_required}
                            placeholder="Select"
                            options={[
                              { value: 'Yes', label: 'Yes' },
                              { value: 'No', label: 'No' },
                            ]}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            error={error}
                          />
                        );
                      }
                      return (
                        <Input
                          key={a.id}
                          id={id}
                          label={a.name}
                          required={a.is_required}
                          type={a.type === 'number' ? 'number' : 'text'}
                          placeholder={a.placeholder || `Enter ${a.name.replace(/\s*\(.*\)\s*/, '').toLowerCase()}`}
                          value={value}
                          onChange={(e) => onChange(e.target.value)}
                          error={error}
                        />
                      );
                    })}
                  </div>
                </fieldset>
              )}
            </div>
          )}

          {/* Step 3: location */}
          {step === 2 && (
            <div className="space-y-5">
              <LocationSearch index={locIndex} onPick={pickLocation} />
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <span className="h-px flex-1 bg-border" />
                or choose step by step
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Select
                  id="division"
                  label="Division"
                  required
                  placeholder="Select division"
                  options={locIndex.divisions.map((d) => ({ value: d.id, label: locationOptionLabel(d) }))}
                  value={data.division_id}
                  onChange={(e) => set({ division_id: e.target.value, district_id: '', area_id: '' })}
                  error={errors.division_id}
                />
                <Select
                  id="district"
                  label="District"
                  required={districts.length > 0}
                  placeholder={data.division_id ? 'Select district' : 'Choose a division first'}
                  disabled={!data.division_id || districts.length === 0}
                  options={districts.map((d) => ({ value: d.id, label: locationOptionLabel(d) }))}
                  value={data.district_id}
                  onChange={(e) => set({ district_id: e.target.value, area_id: '' })}
                  error={errors.district_id}
                />
                <Select
                  id="area"
                  label="Area"
                  placeholder={areas.length ? 'Select area (optional)' : 'No areas listed – use the landmark field'}
                  disabled={!data.district_id || areas.length === 0}
                  options={areas.map((a) => ({ value: a.id, label: locationOptionLabel(a) }))}
                  value={data.area_id}
                  onChange={(e) => set({ area_id: e.target.value })}
                />
                <Input
                  id="address"
                  label="Street or landmark (optional)"
                  maxLength={255}
                  placeholder="e.g. Sector 4, near the park"
                  value={data.full_address}
                  onChange={(e) => set({ full_address: e.target.value })}
                  error={errors.full_address}
                />
              </div>
              <p className="flex gap-2 text-xs text-muted">
                <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                Don't include your house number. Buyers can ask for the exact address when they contact you.
              </p>
            </div>
          )}

          {/* Step 4: photos */}
          {step === 3 && (
            <div id="photo-uploader" tabIndex={-1} className="focus:outline-none">
              <PhotoUploader photos={photos} setPhotos={setPhotos} max={MAX_PHOTOS} error={errors.images} />
            </div>
          )}

          {/* Step 5: review */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex flex-col gap-5 sm:flex-row">
                <div className="w-full shrink-0 overflow-hidden rounded-xl border border-border sm:w-56">
                  <ImageWithFallback src={readyPhotos[0]?.preview} alt="Cover photo" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {selected?.name} · {type?.label}
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold text-ink">{data.title}</h2>
                  <p className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
                    {formatPrice(data.is_free ? 0 : data.price, { isFree: data.is_free })}
                    {data.is_negotiable && !data.is_free && data.price ? (
                      <span className="ml-2 text-sm font-semibold text-muted">Negotiable</span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {[nameOf(locations.areas, data.area_id), nameOf(locations.districts, data.district_id), nameOf(locations.divisions, data.division_id)]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl bg-zinc-50 p-4 text-sm sm:grid-cols-2">
                {[
                  ['Condition', CONDITIONS.find((c) => c.value === data.condition)?.label],
                  ['Photos', `${readyPhotos.length}`],
                  ...attributeDefs.map((a) => [a.name, data.attributes[a.attribute_key]]),
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-muted">{k}</dt>
                      <dd className="text-right font-semibold text-ink">{v}</dd>
                    </div>
                  ))}
              </dl>

              <div>
                <h3 className="mb-1 text-sm font-bold text-ink">Description</h3>
                <p className="whitespace-pre-line break-words text-sm text-zinc-700">{data.description}</p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                {STEPS.slice(0, 4).map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setStep(i)}
                    className="rounded-full border border-border px-3 py-1 font-semibold text-zinc-600 hover:border-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Edit {label.toLowerCase()}
                  </button>
                ))}
              </div>

              <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
                By submitting you confirm the details are accurate and the listing follows our{' '}
                <Link to="/terms" className="font-semibold underline">
                  Terms
                </Link>
.
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={back} disabled={step === 0 || submitting} iconLeft={<ArrowLeft size={16} />}>
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next} iconRight={<ArrowRight size={16} />}>
                Continue
              </Button>
            ) : (
              <Button onClick={submit} loading={submitting} iconLeft={<Send size={16} />}>
                Submit for review
              </Button>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}
