import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShieldCheck,
  BadgeCheck,
  Megaphone,
  ArrowRight,
  ChevronDown,
  Camera,
  ClipboardCheck,
  MessageSquare,
  Users,
  HandHeart,
  PackageSearch,
  PawPrint,
} from 'lucide-react';
import api from '../services/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useCatalog } from '../hooks/useCatalog';
import { useSiteSettings, setting } from '../hooks/useSiteSettings';
import { getCategoryIcon } from '../lib/categoryIcon';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { ProductGrid } from '../components/product/ProductGrid';
import { PromoBanners } from '../components/layout/PromoBanners';
import { indexLocations } from '../lib/locations';

function SectionHeader({ title, subtitle, to, linkLabel = 'View all' }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
      <div className="min-w-0">
        <h2 className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {to && (
        <Link
          to={to}
          className="inline-flex items-center gap-1 rounded text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {linkLabel} <ArrowRight size={15} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

const TRUST = [
  { icon: ShieldCheck, label: 'Every listing checked by moderators' },
  { icon: BadgeCheck, label: 'Verified seller numbers' },
  { icon: Megaphone, label: 'Free to post' },
];

const STEPS = {
  buyers: [
    { icon: Search, title: 'Search', text: 'Filter by category, breed, location and budget.' },
    { icon: MessageSquare, title: 'Contact the seller', text: 'Send a message or call once you have logged in.' },
    { icon: HandHeart, title: 'Meet safely', text: 'View the pet in person before you pay anything.' },
  ],
  sellers: [
    { icon: Camera, title: 'Create a listing', text: 'Add clear photos, price, location and pet details.' },
    { icon: ClipboardCheck, title: 'Get approved', text: 'Our moderators review each listing before it goes live.' },
    { icon: Users, title: 'Hear from buyers', text: 'Reply to enquiries from your dashboard.' },
  ],
};

export default function Home() {
  useDocumentTitle('Buy, sell and adopt pets in Bangladesh');
  const navigate = useNavigate();
  const { categories, locations, loading: catalogLoading } = useCatalog();
  const locIndex = useMemo(() => indexLocations(locations), [locations]);
  const { settings } = useSiteSettings();
  const [products, setProducts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [form, setForm] = useState({ search: '', category_slug: '', location: '' });

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/products', { params: { per_page: 8 } }),
      // Featured is optional: the section hides itself if this fails or is empty
      api.get('/products', { params: { featured: 1, per_page: 4 } }).catch(() => null),
    ])
      .then(([recentRes, featuredRes]) => {
        if (!active) return;
        setProducts(recentRes.data?.data || []);
        setFeatured(featuredRes?.data?.data || []);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // Show leaf categories (e.g. Dogs, Cats) plus roots that have no children
  const tiles = useMemo(
    () => categories.flatMap((c) => (c.children?.length ? c.children : [c])),
    [categories],
  );
  const recent = products.slice(0, 8);

  const onSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (form.search.trim()) params.set('search', form.search.trim());
    if (form.category_slug) params.set('category_slug', form.category_slug);
    if (form.location) {
      const [level, id] = form.location.split(':');
      const division = level === 'district' ? locIndex.get(id)?.parent_id : id;
      if (division) params.set('division_id', division);
      if (level === 'district') params.set('district_id', id);
    }
    navigate(`/browse${params.toString() ? `?${params}` : ''}`);
  };

  const fieldCls =
    'h-12 w-full appearance-none rounded-xl bg-transparent px-4 text-[15px] text-ink outline-none transition placeholder:text-zinc-400 focus:bg-zinc-50';

  // Hero text and banner come from admin General Settings, with built-in fallbacks
  const heroTitle = setting(settings, 'home_hero_title', 'Find & Sell Pets, Animals & Supplies Safely');
  const heroSubtitle = setting(
    settings,
    'home_hero_subtitle',
    'Browse verified breeders, adoption posts, stud services and quality pet accessories across Bangladesh.',
  );
  const heroBadge = setting(settings, 'home_hero_badge', 'Verified pet & goods marketplace in Bangladesh');
  const heroBanner = setting(settings, 'home_hero_banner', null);
  const titleWords = heroTitle.trim().split(/\s+/);
  const titleLead = titleWords.slice(0, -1).join(' ');
  const titleLast = titleWords[titleWords.length - 1];

  return (
    <div className="pb-4">
      {/* Hero – sits under the fixed navbar */}
      <section className="hero-gradient relative isolate overflow-hidden pt-[72px] text-white">
        {heroBanner ? (
          <>
            <img
              src={heroBanner}
              alt=""
              className="hero-banner absolute inset-0 -z-20 h-full w-full object-cover"
              fetchpriority="high"
            />
            {/* Keep text readable on any photo */}
            <div className="hero-photo-tint absolute inset-0 -z-10" aria-hidden="true" />
          </>
        ) : (
          <>
            <div className="hero-grid pointer-events-none absolute inset-0 -z-10 opacity-[0.07]" aria-hidden="true" />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" aria-hidden="true" />
          </>
        )}

        <Container className="relative pb-20 pt-12 sm:pb-24 sm:pt-16">
          <div className="hero-fade mx-auto text-center">
            <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-[#ffc2c4] ring-1 ring-inset ring-white/15 backdrop-blur">
              <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="truncate">{heroBadge}</span>
            </span>
            <h1 className="mt-5 text-[2rem] font-extrabold leading-tight tracking-tight text-balance sm:text-[2.6rem] lg:text-[2.75rem] xl:text-[3rem]">
              {titleLead}{titleLead ? ' ' : ''}
              <span className="bg-gradient-to-r from-[#ffb0b2] via-[#ff7a7e] to-primary bg-clip-text text-transparent">{titleLast}</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-200/90 sm:text-lg">{heroSubtitle}</p>
          </div>

          <form
            role="search"
            onSubmit={onSearch}
            className="hero-fade hero-fade-delay mx-auto mt-9 grid w-full max-w-4xl grid-cols-1 gap-1 rounded-2xl bg-white p-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.7fr)_1px_minmax(0,1fr)_1px_minmax(0,1fr)_auto] lg:items-center"
          >
            <div className="relative sm:col-span-2 lg:col-span-1">
              <label htmlFor="hero-search" className="sr-only">
                What are you looking for?
              </label>
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
              <input
                id="hero-search"
                type="search"
                placeholder="Search dogs, kittens, breeds, cages, food…"
                value={form.search}
                onChange={(e) => setForm({ ...form, search: e.target.value })}
                className={`${fieldCls} pl-11`}
              />
            </div>
            <span className="hidden h-7 bg-zinc-200 lg:block" aria-hidden="true" />
            <div className="border-t border-zinc-100 sm:border-t-0">
              <label htmlFor="hero-category" className="sr-only">
                Category
              </label>
              <select
                id="hero-category"
                value={form.category_slug}
                onChange={(e) => setForm({ ...form, category_slug: e.target.value })}
                className={`${fieldCls} cursor-pointer`}
              >
                <option value="">All categories</option>
                {tiles.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <span className="hidden h-7 bg-zinc-200 lg:block" aria-hidden="true" />
            <div className="border-t border-zinc-100 sm:border-t-0">
              <label htmlFor="hero-location" className="sr-only">
                Location
              </label>
              <select
                id="hero-location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className={`${fieldCls} cursor-pointer`}
              >
                <option value="">All of Bangladesh</option>
                {locIndex.divisions.map((d) => (
                  <optgroup key={d.id} label={`${d.name} division`}>
                    <option value={`division:${d.id}`}>All of {d.name} division</option>
                    {locIndex.districtsOf(d.id).map((dist) => (
                      <option key={dist.id} value={`district:${dist.id}`}>
                        {dist.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full rounded-xl px-7 sm:col-span-2 lg:col-span-1"
              iconLeft={<Search size={18} />}
            >
              Search
            </Button>
          </form>

          <ul className="hero-fade hero-fade-delay-2 mx-auto mt-7 flex max-w-3xl flex-col items-center justify-center gap-3 text-sm text-zinc-300 sm:flex-row sm:flex-wrap sm:gap-x-8">
            {TRUST.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon size={17} className="text-primary" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </Container>

        <a
          href="#categories"
          className="hero-fade hero-fade-delay-2 absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-zinc-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Explore categories
          <ChevronDown size={20} className="scroll-cue" aria-hidden="true" />
        </a>
      </section>

      <PromoBanners position="home_top" className="pt-6" />

      {/* Categories */}
      <Container id="categories" className="scroll-mt-[72px] pb-5 pt-6 sm:pt-7">
        <SectionHeader title="Browse by category" to="/browse" linkLabel="All listings" />
        {catalogLoading ? (
          <div className="flex gap-3 overflow-hidden sm:grid sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 min-w-44 rounded-xl" />
            ))}
          </div>
        ) : (
          <ul className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-5">
            {tiles.map((cat) => {
              const Icon = getCategoryIcon(cat.slug);
              return (
                <li key={cat.id} className="snap-start">
                  <Link
                    to={`/browse?category_slug=${cat.slug}`}
                    className="group flex h-full min-w-44 items-center gap-3 rounded-xl border border-border bg-white px-3 py-2.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition duration-200 group-hover:bg-primary group-hover:text-white">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-semibold leading-tight text-ink">{cat.name}</span>
                    <ArrowRight
                      size={15}
                      className="shrink-0 -translate-x-1 text-zinc-300 opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:text-primary-hover group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Container>

      {/* Featured */}
      {!loading && featured.length > 0 && (
        <Container className="pb-10 pt-1">
          <SectionHeader title="Featured listings" to="/browse" />
          <ProductGrid products={featured} imageAspect="aspect-[3/2]" />
        </Container>
      )}

      {/* Recent */}
      <Container className="pb-12 sm:pb-16">
        <SectionHeader title="Recently added" subtitle="New listings approved by our moderators." to="/browse" />
        {error ? (
          <div className="rounded-2xl border border-border bg-white">
            <EmptyState
              icon={PackageSearch}
              title="Listings could not be loaded"
              description="Please refresh the page or try again in a moment."
              action={() => window.location.reload()}
              actionLabel="Refresh"
            />
          </div>
        ) : !loading && recent.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white">
            <EmptyState
              icon={PackageSearch}
              title="No listings yet"
              description="Be the first to post a pet or item."
              actionTo="/create-listing"
              actionLabel="Post a listing"
            />
          </div>
        ) : (
          <ProductGrid products={recent} loading={loading} skeletonCount={8} />
        )}
      </Container>

      <PromoBanners position="home_middle" className="pb-12 sm:pb-16" />

      {/* How it works */}
      <section className="border-y border-border bg-white">
        <Container className="py-12 sm:py-16">
          <h2 className="text-center text-xl font-extrabold tracking-tight text-ink sm:text-2xl">How PetMart works</h2>
          <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
            {[
              ['For buyers', STEPS.buyers],
              ['For sellers', STEPS.sellers],
            ].map(([heading, steps]) => (
              <div key={heading}>
                <h3 className="mb-5 text-xs font-bold uppercase tracking-wider text-primary">{heading}</h3>
                <ol className="space-y-5">
                  {steps.map(({ icon: Icon, title, text }, i) => (
                    <li key={title} className="flex gap-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-zinc-100 text-ink">
                        <Icon size={20} aria-hidden="true" />
                      </span>
                      <div>
                        <p className="font-bold text-ink">
                          <span className="text-muted">{i + 1}.</span> {title}
                        </p>
                        <p className="text-sm text-muted">{text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA + safety */}
      <Container className="grid grid-cols-1 gap-5 py-12 sm:py-16 lg:grid-cols-[1.4fr_1fr]">
        <div className="hero-gradient relative overflow-hidden rounded-3xl p-7 text-white sm:p-10">
          <PawPrint size={160} className="pointer-events-none absolute -bottom-8 -right-6 text-white/10" aria-hidden="true" />
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Have a pet or item to list?</h2>
          <p className="mt-2 max-w-md text-white/80">
            Posting is free. Add photos and details, and we'll review your listing before it goes live.
          </p>
          <Button as="link" to="/create-listing" size="lg" className="mt-6 shadow-[0_10px_30px_-10px_rgba(239,78,82,0.8)]" iconRight={<ArrowRight size={18} />}>
            Post your listing
          </Button>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-7 sm:p-8">
          <ShieldCheck size={28} className="text-amber-600" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-extrabold text-ink">Stay safe when buying</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-700">
            <li>Meet in a public place and see the pet in person.</li>
            <li>Never pay an advance or deposit before meeting.</li>
            <li>Ask for vaccination records and health papers.</li>
          </ul>
          <Link
            to="/safety"
            className="mt-4 inline-flex items-center gap-1 rounded text-sm font-semibold text-amber-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            Read all safety tips <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </Container>
    </div>
  );
}
