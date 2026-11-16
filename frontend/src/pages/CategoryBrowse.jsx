import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, LayoutGrid, List, SearchX, RotateCcw } from 'lucide-react';
import api from '../services/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useDebounce } from '../hooks/useDebounce';
import { useCatalog, flattenCategories } from '../hooks/useCatalog';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { ProductGrid } from '../components/product/ProductGrid';
import { PromoBanners } from '../components/layout/PromoBanners';
import { FilterPanel } from '../components/filters/FilterPanel';
import { FilterDrawer } from '../components/filters/FilterDrawer';
import { SortSelect } from '../components/filters/SortSelect';
import { ActiveFilterChips } from '../components/filters/ActiveFilterChips';
import { LISTING_TYPE_MAP, PER_PAGE } from '../lib/constants';
import { scrollToTop } from '../lib/scroll';
import { indexLocations } from '../lib/locations';

const FILTER_KEYS = ['category_slug', 'listing_type', 'division_id', 'district_id', 'area_id', 'min_price', 'max_price'];
const VIEW_KEY = 'petmart_browse_view';

function readView() {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

export default function CategoryBrowse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories, locations } = useCatalog();
  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  // URL is the single source of truth for filters
  const values = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);
  const page = Math.max(1, parseInt(values.page || '1', 10) || 1);

  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [view, setView] = useState(readView);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState(values);

  const [keyword, setKeyword] = useState(values.search || '');
  const debouncedKeyword = useDebounce(keyword, 400);

  const activeCategory = flatCategories.find((c) => c.slug === values.category_slug);
  const pageTitle = activeCategory ? activeCategory.name : values.search ? `Results for “${values.search}”` : 'All listings';
  useDocumentTitle(activeCategory ? `${activeCategory.name} for sale and adoption` : 'Browse pets and supplies');

  const updateParams = useCallback(
    (partial, { resetPage = true } = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(partial).forEach(([k, v]) => {
            if (v === '' || v === null || v === undefined) next.delete(k);
            else next.set(k, String(v));
          });
          if (resetPage && !('page' in partial)) next.delete('page');
          return next;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  // Keep the keyword box in sync when the URL changes from elsewhere (navbar search, back button)
  useEffect(() => {
    setKeyword(values.search || '');
  }, [values.search]);

  useEffect(() => {
    if ((values.search || '') !== debouncedKeyword.trim()) {
      updateParams({ search: debouncedKeyword.trim() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword]);

  // Fetch whenever the query string changes
  const queryString = searchParams.toString();
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    const params = { per_page: PER_PAGE, page };
    ['search', 'sort', ...FILTER_KEYS].forEach((k) => {
      if (values[k]) params[k] = values[k];
    });
    api
      .get('/products', { params })
      .then((res) => {
        if (!active) return;
        setProducts(res.data?.data || []);
        setMeta(res.data?.meta || null);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString, reloadKey]);

  const changeView = (v) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* storage unavailable – keep in memory only */
    }
  };

  const clearAll = () => {
    setKeyword('');
    setSearchParams(values.sort ? { sort: values.sort } : {});
  };

  const goToPage = (p) => {
    updateParams({ page: p > 1 ? p : '' }, { resetPage: false });
    scrollToTop();
  };

  const chips = useMemo(() => {
    const list = [];
    if (values.search) list.push({ key: 'search', label: `“${values.search}”`, clear: { search: '' } });
    if (values.category_slug)
      list.push({
        key: 'cat',
        label: activeCategory?.name || values.category_slug,
        clear: { category_slug: '' },
      });
    if (values.listing_type)
      list.push({
        key: 'type',
        label: LISTING_TYPE_MAP[values.listing_type]?.label || values.listing_type,
        clear: { listing_type: '' },
      });
    const locIndex = indexLocations(locations);
    if (values.area_id) {
      list.push({ key: 'area', label: locIndex.get(values.area_id)?.name || 'Area', clear: { area_id: '' } });
    }
    if (values.district_id) {
      list.push({ key: 'dist', label: locIndex.get(values.district_id)?.name || 'District', clear: { district_id: '', area_id: '' } });
    }
    if (values.division_id) {
      const d = locIndex.get(values.division_id);
      list.push({ key: 'div', label: d ? `${d.name} division` : 'Division', clear: { division_id: '', district_id: '', area_id: '' } });
    }
    if (values.min_price || values.max_price) {
      const label = `৳ ${values.min_price || '0'} – ${values.max_price ? `৳ ${values.max_price}` : 'any'}`;
      list.push({ key: 'price', label, clear: { min_price: '', max_price: '' } });
    }
    return list;
  }, [values, activeCategory, locations]);

  const filterCount = chips.filter((c) => c.key !== 'search').length;
  const total = meta?.total ?? products.length;

  const openDrawer = () => {
    setDraft(values);
    setDrawerOpen(true);
  };
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const applyDraft = () => {
    const partial = {};
    FILTER_KEYS.forEach((k) => {
      partial[k] = draft[k] || '';
    });
    updateParams(partial);
    setDrawerOpen(false);
  };

  return (
    <div className="pb-16">
      <div className="border-b border-border bg-white">
        <Container className="py-6 sm:py-8">
          <Breadcrumbs
            items={[
              { label: 'Browse', to: activeCategory ? '/browse' : undefined },
              ...(activeCategory ? [{ label: activeCategory.name }] : []),
            ]}
          />
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{pageTitle}</h1>
          <p className="mt-1 text-sm text-muted">
            {activeCategory?.description || 'Pets, adoption posts and supplies from sellers across Bangladesh.'}
          </p>

          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              updateParams({ search: keyword.trim() });
            }}
            className="relative mt-5 max-w-2xl"
          >
            <label htmlFor="browse-search" className="sr-only">
              Search listings
            </label>
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="browse-search"
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search breeds, items, keywords…"
              className="w-full rounded-xl border border-border bg-zinc-50 py-3 pl-11 pr-4 text-sm text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
          </form>
        </Container>
      </div>

      <Container className="pt-6">
        <PromoBanners position="browse_top" wrap={false} className="mb-6" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block" aria-label="Filters">
            <div className="sticky top-24 rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold text-ink">
                  <SlidersHorizontal size={17} aria-hidden="true" /> Filters
                </h2>
                {filterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="flex items-center gap-1 rounded text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <RotateCcw size={13} aria-hidden="true" /> Reset
                  </button>
                )}
              </div>
              <FilterPanel
                idPrefix="side"
                values={values}
                onChange={updateParams}
                categories={categories}
                locations={locations}
              />
            </div>
          </aside>

          <section aria-labelledby="results-heading" className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 id="results-heading" className="text-sm text-muted" aria-live="polite">
                {loading ? (
                  'Loading listings…'
                ) : (
                  <>
                    <span className="font-bold text-ink">{total.toLocaleString('en-IN')}</span>{' '}
                    {total === 1 ? 'listing' : 'listings'} found
                  </>
                )}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                  onClick={openDrawer}
                  iconLeft={<SlidersHorizontal size={15} />}
                >
                  Filters{filterCount > 0 ? ` (${filterCount})` : ''}
                </Button>
                <SortSelect value={values.sort} onChange={(v) => updateParams({ sort: v === 'latest' ? '' : v })} />
                <div className="hidden overflow-hidden rounded-lg border border-border sm:flex" role="group" aria-label="Layout">
                  {[
                    ['grid', LayoutGrid, 'Grid view'],
                    ['list', List, 'List view'],
                  ].map(([v, Icon, label]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => changeView(v)}
                      aria-label={label}
                      aria-pressed={view === v}
                      className={`p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                        view === v ? 'bg-ink text-white' : 'bg-white text-muted hover:text-ink'
                      }`}
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-5">
              <ActiveFilterChips chips={chips} onRemove={(clear) => updateParams(clear)} onClearAll={clearAll} />
            </div>

            {error ? (
              <div className="rounded-2xl border border-border bg-white">
                <EmptyState
                  icon={SearchX}
                  title="We couldn't load listings"
                  description="Check your connection and try again."
                  action={() => setReloadKey((k) => k + 1)}
                  actionLabel="Try again"
                />
              </div>
            ) : !loading && products.length === 0 ? (
              <div className="rounded-2xl border border-border bg-white">
                <EmptyState
                  icon={SearchX}
                  title="No listings match your filters"
                  description="Try a different keyword, widen the price range or choose another location."
                  action={chips.length ? clearAll : undefined}
                  actionLabel={chips.length ? 'Clear filters' : 'Post a listing'}
                  actionTo={chips.length ? undefined : '/create-listing'}
                />
              </div>
            ) : (
              <ProductGrid
                products={products}
                loading={loading}
                skeletonCount={6}
                layout={view}
                columns="grid-cols-1 min-[440px]:grid-cols-2 xl:grid-cols-3"
              />
            )}

            {!loading && !error && meta && (
              <Pagination currentPage={meta.current_page} lastPage={meta.last_page} onPageChange={goToPage} />
            )}
          </section>
        </div>
      </Container>

      <FilterDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        onApply={applyDraft}
        onReset={() => setDraft({})}
        activeCount={filterCount}
      >
        <FilterPanel
          idPrefix="drawer"
          values={draft}
          onChange={(partial) => setDraft((d) => ({ ...d, ...partial }))}
          categories={categories}
          locations={locations}
        />
      </FilterDrawer>
    </div>
  );
}
