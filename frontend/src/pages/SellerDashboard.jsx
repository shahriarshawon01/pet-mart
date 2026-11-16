import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, CheckCircle2, Trash2, PackageOpen, Clock, XCircle, BadgeCheck, BarChart3, ExternalLink } from 'lucide-react';
import api from '../services/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AccountLayout } from '../components/layout/AccountLayout';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import { Skeleton } from '../components/ui/Skeleton';
import { formatPrice, formatRelativeTime } from '../lib/format';
import { STATUS_BADGES } from '../lib/constants';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Live' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'sold', label: 'Sold' },
];

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted">
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${tone}`}>
          <Icon size={15} aria-hidden="true" />
        </span>
        {label}
      </div>
      <p className="mt-2 text-2xl font-extrabold text-ink">{value}</p>
    </div>
  );
}

export default function SellerDashboard() {
  useDocumentTitle('My listings');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState('all');
  const [confirm, setConfirm] = useState(null); // { type: 'sold' | 'delete', item }
  const [working, setWorking] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    api
      .get('/my-listings')
      .then((res) => setListings(res.data?.data || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const counts = useMemo(() => {
    const c = { all: listings.length, active: 0, pending: 0, rejected: 0, sold: 0, views: 0 };
    listings.forEach((l) => {
      if (c[l.status] !== undefined) c[l.status] += 1;
      c.views += Number(l.views || 0);
    });
    return c;
  }, [listings]);

  const visible = tab === 'all' ? listings : listings.filter((l) => l.status === tab);

  const runAction = async () => {
    if (!confirm) return;
    const { type, item } = confirm;
    setWorking(true);
    try {
      if (type === 'sold') {
        await api.post(`/products/${item.id}/mark-sold`);
        setListings((ls) => ls.map((l) => (l.id === item.id ? { ...l, status: 'sold' } : l)));
        toast.success('Marked as sold');
      } else {
        await api.delete(`/products/${item.id}`);
        setListings((ls) => ls.filter((l) => l.id !== item.id));
        toast.success('Listing deleted');
      }
      setConfirm(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <AccountLayout>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard icon={BadgeCheck} label="Live" value={counts.active} tone="bg-emerald-100 text-emerald-700" />
        <StatCard icon={Clock} label="Pending" value={counts.pending} tone="bg-amber-100 text-amber-700" />
        <StatCard icon={CheckCircle2} label="Sold" value={counts.sold} tone="bg-zinc-100 text-zinc-700" />
        <StatCard icon={XCircle} label="Rejected" value={counts.rejected} tone="bg-red-100 text-red-700" />
        <StatCard icon={BarChart3} label="Total views" value={counts.views.toLocaleString('en-IN')} tone="bg-blue-100 text-blue-700" />
      </div>

      <div className="rounded-2xl border border-border bg-white">
        <div className="flex gap-1 overflow-x-auto border-b border-border px-3 pt-3" role="tablist" aria-label="Filter by status">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={`-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                tab === t.value ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {t.label}
              <span className="ml-1.5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-600">{counts[t.value]}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <EmptyState icon={PackageOpen} title="Your listings could not be loaded" action={load} actionLabel="Try again" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title={tab === 'all' ? 'You have no listings yet' : `No ${TABS.find((t) => t.value === tab)?.label.toLowerCase()} listings`}
            description={tab === 'all' ? 'Post your first pet or item. It only takes a few minutes.' : undefined}
            actionTo={tab === 'all' ? '/create-listing' : undefined}
            action={tab === 'all' ? undefined : () => setTab('all')}
            actionLabel={tab === 'all' ? 'Post a listing' : 'Show all'}
          />
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((item) => {
              const badge = STATUS_BADGES[item.status] || { label: item.status, color: 'secondary' };
              return (
                <li key={item.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <div className="w-24 shrink-0 overflow-hidden rounded-xl sm:w-28">
                      <ImageWithFallback src={item.primary_image} alt={item.title} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge color={badge.color}>{badge.label}</Badge>
                        <span className="text-xs text-muted">{item.category?.name}</span>
                      </div>
                      <h3 className="mt-1 line-clamp-2 font-bold text-ink">{item.title}</h3>
                      <p className="mt-0.5 text-sm font-bold text-ink">
                        {formatPrice(item.price, { isFree: item.is_free })}
                      </p>
                      <p className="mt-0.5 flex items-center gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <Eye size={12} aria-hidden="true" /> {item.views || 0} views
                        </span>
                        <span>{formatRelativeTime(item.created_at)}</span>
                      </p>
                      {item.status === 'rejected' && (
                        <p className="mt-1 text-xs text-red-700">
                          Not approved.{' '}
                          <Link to={`/product/${item.slug || item.id}`} className="font-semibold underline">
                            See the reason
                          </Link>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                    <Button as="link" to={`/product/${item.slug || item.id}`} variant="outline" size="sm" iconLeft={<ExternalLink size={14} />}>
                      View
                    </Button>
                    {item.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirm({ type: 'sold', item })}
                        iconLeft={<CheckCircle2 size={14} />}
                      >
                        Mark sold
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => setConfirm({ type: 'delete', item })}
                      iconLeft={<Trash2 size={14} />}
                      aria-label={`Delete ${item.title}`}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(confirm)}
        onClose={() => !working && setConfirm(null)}
        onConfirm={runAction}
        loading={working}
        variant={confirm?.type === 'delete' ? 'danger' : 'primary'}
        title={confirm?.type === 'delete' ? 'Delete this listing?' : 'Mark as sold?'}
        message={
          confirm?.type === 'delete'
            ? `“${confirm?.item?.title}” will be removed permanently.`
            : `“${confirm?.item?.title}” will be shown as sold and buyers won't be able to contact you about it.`
        }
        confirmLabel={confirm?.type === 'delete' ? 'Delete' : 'Mark sold'}
      />
    </AccountLayout>
  );
}
