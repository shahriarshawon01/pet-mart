import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Heart, Share2, MapPin, Eye, Clock, ShieldCheck, Phone, MessageSquare, SearchX, Info, Lock } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useWishlistToggle } from '../hooks/useWishlist';
import { useCatalog, flattenCategories } from '../hooks/useCatalog';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Textarea';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { ProductGallery } from '../components/product/ProductGallery';
import { SpecTable } from '../components/product/SpecTable';
import { SellerCard } from '../components/product/SellerCard';
import { ProductGrid } from '../components/product/ProductGrid';
import { formatDate, formatLocation, formatPrice, formatRelativeTime, maskPhone } from '../lib/format';
import { CONDITIONS, LISTING_TYPE_MAP, REPORT_REASONS, STATUS_BADGES } from '../lib/constants';

function DetailSkeleton() {
  return (
    <Container className="py-6">
      <Skeleton className="mb-4 h-4 w-60" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Skeleton className="aspect-[4/3] w-full rounded-2xl sm:aspect-[16/10]" />
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    </Container>
  );
}

export default function ProductDetail() {
  const { identifier } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { categories } = useCatalog();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [similar, setSimilar] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  const [messageOpen, setMessageOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messageError, setMessageError] = useState('');
  const [sending, setSending] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportNote, setReportNote] = useState('');
  const [reporting, setReporting] = useState(false);

  const [phoneShown, setPhoneShown] = useState(false);

  const { saved, busy: saving, toggle: toggleSave } = useWishlistToggle(product?.id, product?.is_wishlisted);

  useDocumentTitle(product?.title || 'Listing', {
    description: product?.description?.slice(0, 155),
    image: product?.images?.[0]?.image_path,
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    setPhoneShown(false);
    api
      .get(`/products/${encodeURIComponent(identifier)}`)
      .then((res) => {
        if (!active) return;
        if (res.data?.data) setProduct(res.data.data);
        else setNotFound(true);
      })
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [identifier]);

  // Similar listings from the same category
  useEffect(() => {
    if (!product?.category?.slug) return undefined;
    let active = true;
    setSimilarLoading(true);
    api
      .get('/products', { params: { category_slug: product.category.slug, per_page: 5 } })
      .then((res) => {
        if (!active) return;
        setSimilar((res.data?.data || []).filter((p) => p.id !== product.id).slice(0, 4));
      })
      .catch(() => active && setSimilar([]))
      .finally(() => active && setSimilarLoading(false));
    return () => {
      active = false;
    };
  }, [product?.id, product?.category?.slug]);

  // Attribute labels from the category schema (attribute_key -> name)
  const attributeLabels = useMemo(() => {
    const cat = flattenCategories(categories).find((c) => c.id === product?.category?.id);
    return Object.fromEntries((cat?.attributes || []).map((a) => [a.attribute_key, a.name]));
  }, [categories, product?.category?.id]);

  const isOwner = Boolean(user && product?.seller?.id === user.id);
  const isLoggedIn = Boolean(user);

  const requireLogin = (message) => {
    toast(message, {
      action: { label: 'Log in', onClick: () => navigate('/login', { state: { from: location } }) },
    });
  };

  const openMessage = () => {
    if (!isLoggedIn) return requireLogin('Log in to message the seller');
    setMessageError('');
    setMessageOpen(true);
  };

  const openReport = () => {
    if (!isLoggedIn) return requireLogin('Log in to report a listing');
    setReportOpen(true);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setMessageError('Message is required.');
      toast.error('Message is required.');
      return;
    }
    setSending(true);
    try {
      await api.post('/inquiries', { product_id: product.id, message: message.trim() });
      toast.success('Message sent. The seller will reply in your Inquiries.');
      setMessage('');
      setMessageOpen(false);
    } catch (err) {
      setMessageError(err.response?.data?.errors?.message?.[0] || err.response?.data?.message || 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  const sendReport = async (e) => {
    e.preventDefault();
    setReporting(true);
    try {
      await api.post(`/products/${product.id}/report`, {
        reason: reportReason,
        description: reportNote.trim() || undefined,
      });
      toast.success('Thanks. Our moderators will review this listing.');
      setReportOpen(false);
      setReportNote('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Report could not be sent. Please try again.');
    } finally {
      setReporting(false);
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch (err) {
      if (err?.name !== 'AbortError') toast.error('Could not share this link');
    }
  };

  if (loading) return <DetailSkeleton />;

  // Hide listings that are not live, unless the viewer owns them
  if (notFound || !product || (product.status !== 'active' && product.status !== 'sold' && !isOwner)) {
    return (
      <Container className="py-16">
        <div className="rounded-2xl border border-border bg-white">
          <EmptyState
            icon={SearchX}
            title="Listing not found"
            description="This listing may have been removed, sold, or is waiting for review."
            actionTo="/browse"
            actionLabel="Browse listings"
          />
        </div>
      </Container>
    );
  }

  const type = LISTING_TYPE_MAP[product.listing_type];
  const statusBadge = STATUS_BADGES[product.status];
  const condition = CONDITIONS.find((c) => c.value === product.condition)?.label;
  const loc = product.location || {};

  return (
    <div className="pb-28 lg:pb-12">
      <Container className="py-5 sm:py-6">
        <Breadcrumbs
          items={[
            { label: 'Browse', to: '/browse' },
            ...(product.category
              ? [{ label: product.category.name, to: `/browse?category_slug=${product.category.slug}` }]
              : []),
            { label: product.title },
          ]}
        />

        {isOwner && product.status !== 'active' && (
          <div
            className={`mt-3 flex gap-3 rounded-xl border p-4 text-sm ${
              product.status === 'rejected' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
            role="status"
          >
            <Info size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">Only you can see this listing. Status: {statusBadge?.label || product.status}.</p>
              {product.status === 'rejected' && product.rejection_reason && (
                <p className="mt-1">Reason: {product.rejection_reason}</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <div className="min-w-0 space-y-5">
            <ProductGallery images={product.images || []} title={product.title} />

            <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                {type && <Badge color={type.color}>{type.label}</Badge>}
                {product.is_featured && <Badge color="featured">★ Featured</Badge>}
                {product.is_urgent && <Badge color="red">Urgent</Badge>}
                {product.status === 'sold' && <Badge color="secondary">Sold</Badge>}
              </div>
              <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">{product.title}</h1>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-ink">
                {formatPrice(product.price, { isFree: product.is_free })}
                {product.is_negotiable && product.price ? (
                  <span className="ml-2 text-sm font-semibold text-muted">Negotiable</span>
                ) : null}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-sm text-muted">
                <span className="flex items-center gap-1.5">
                  <MapPin size={15} aria-hidden="true" /> {formatLocation(loc)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={15} aria-hidden="true" />
                  <time dateTime={product.created_at} title={formatDate(product.created_at)}>
                    {formatRelativeTime(product.created_at)}
                  </time>
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye size={15} aria-hidden="true" /> {Number(product.views || 0).toLocaleString('en-IN')} views
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSave}
                  disabled={saving}
                  aria-pressed={saved}
                  iconLeft={<Heart size={16} className={saved ? 'fill-primary text-primary' : ''} />}
                >
                  {saved ? 'Saved' : 'Save'}
                </Button>
                <Button variant="outline" size="sm" onClick={share} iconLeft={<Share2 size={16} />}>
                  Share
                </Button>
              </div>
            </section>

            {/* On small screens show the seller right after the title block */}
            <div className="lg:hidden">
              <SellerCard
                seller={product.seller}
                isLoggedIn={isLoggedIn}
                isOwner={isOwner}
                onMessage={openMessage}
                onReport={openReport}
              />
            </div>

            <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6" aria-labelledby="details-heading">
              <h2 id="details-heading" className="mb-4 text-lg font-bold text-ink">
                Details
              </h2>
              <SpecTable
                attributes={product.attributes}
                labels={attributeLabels}
                extra={[
                  { label: 'Category', value: product.sub_category?.name || product.category?.name },
                  { label: 'Listing type', value: type?.label },
                  { label: 'Condition', value: condition },
                  { label: 'Division', value: loc.division_name },
                  { label: 'District', value: loc.district_name },
                  { label: 'Area', value: loc.area_name || loc.full_address },
                ]}
              />
            </section>

            <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6" aria-labelledby="desc-heading">
              <h2 id="desc-heading" className="mb-3 text-lg font-bold text-ink">
                Description
              </h2>
              <p className="whitespace-pre-line break-words text-[15px] leading-relaxed text-zinc-700">
                {product.description || 'No description provided.'}
              </p>
            </section>

            <section className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
              <ShieldCheck size={22} className="shrink-0 text-amber-600" aria-hidden="true" />
              <div>
                <h2 className="font-bold">Safety tips</h2>
                <ul className="mt-1.5 list-disc space-y-1 pl-4">
                  <li>Meet the seller in a public place and see the pet before paying.</li>
                  <li>Never send an advance payment or deposit.</li>
                  <li>Check vaccination records and the pet's health.</li>
                </ul>
              </div>
            </section>
          </div>

          <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
            <SellerCard
              seller={product.seller}
              isLoggedIn={isLoggedIn}
              isOwner={isOwner}
              onMessage={openMessage}
              onReport={openReport}
            />
          </aside>
        </div>
      </Container>

      {(similarLoading || similar.length > 0) && (
        <Container className="pt-6">
          <h2 className="mb-5 text-xl font-extrabold tracking-tight text-ink">Similar listings</h2>
          <ProductGrid products={similar} loading={similarLoading} skeletonCount={4} />
        </Container>
      )}

      {/* Sticky action bar on mobile and tablet */}
      {!isOwner && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur lg:hidden">
          <div className="mx-auto grid max-w-xl grid-cols-2 gap-2">
            {!isLoggedIn ? (
              <Button
                as="link"
                to="/login"
                state={{ from: location }}
                variant="outline"
                iconLeft={<Lock size={16} />}
                aria-label={`Log in to view number ${maskPhone(product.seller?.phone)}`}
              >
                View number
              </Button>
            ) : phoneShown ? (
              <Button as="anchor" href={`tel:${product.seller?.phone}`} iconLeft={<Phone size={16} />}>
                Call
              </Button>
            ) : (
              <Button onClick={() => setPhoneShown(true)} iconLeft={<Phone size={16} />}>
                Show number
              </Button>
            )}
            <Button variant={isLoggedIn ? 'outline' : 'primary'} onClick={openMessage} iconLeft={<MessageSquare size={16} />}>
              Message
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={messageOpen}
        onClose={() => setMessageOpen(false)}
        title="Message the seller"
        description={product.title}
      >
        <form onSubmit={sendMessage} className="space-y-4">
          <Textarea
            label="Your message"
            id="inquiry-message"
            required
            rows={5}
            maxLength={1000}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (messageError) setMessageError('');
            }}
            error={messageError}
            hint={`${message.length}/1000 – ask about health records, price or a time to visit.`}
            placeholder="Hi, is this still available? I'd like to know…"
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setMessageOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={sending}>
              Send message
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Report this listing"
        description="Our moderators review every report."
      >
        <form onSubmit={sendReport} className="space-y-4">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink">Reason</legend>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary ${
                    reportReason === r ? 'border-red-300 bg-red-50 text-red-800' : 'border-border hover:bg-zinc-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={r}
                    checked={reportReason === r}
                    onChange={() => setReportReason(r)}
                    className="h-4 w-4 accent-red-600"
                  />
                  {r}
                </label>
              ))}
            </div>
          </fieldset>
          <Textarea
            label="More details (optional)"
            id="report-note"
            placeholder="Tell us what is wrong with this listing (optional)"
            rows={3}
            maxLength={1000}
            value={reportNote}
            onChange={(e) => setReportNote(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={reporting}>
              Submit report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
