import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PawPrint, Plus, Search, Menu, X } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { MobileMenu } from './MobileMenu';

export const COMPANY_LOGO = '/brand/seba-dut-logo.jpg';
export const COMPANY_NAME = 'Seba Dut';

/** Company logo + PetMart wordmark. `light` = white text for dark backgrounds. */
export function BrandLogo({ light = false, compact = false }) {
  return (
    <Link
      to="/"
      className="group flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={`PetMart by ${COMPANY_NAME} – home`}
    >
      <img
        src={COMPANY_LOGO}
        alt=""
        width="40"
        height="40"
        className={`h-10 w-10 rounded-xl object-cover shadow-sm ring-1 transition-transform duration-300 group-hover:scale-105 ${
          light ? 'ring-white/20' : 'ring-black/5'
        }`}
      />
      <span className={`h-7 w-px ${light ? 'bg-white/25' : 'bg-zinc-200'} ${compact ? 'hidden sm:block' : ''}`} aria-hidden="true" />
      <span className="flex items-center gap-1.5">
        <PawPrint size={20} className={`text-primary ${compact ? 'hidden sm:block' : ''}`} aria-hidden="true" />
        <span className={`text-xl font-extrabold tracking-tight sm:text-[1.35rem] ${light ? 'text-white' : 'text-ink'}`}>
          Pet<span className="text-primary">Mart</span>
        </span>
      </span>
    </Link>
  );
}

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/browse', label: 'Browse' },
  { to: '/safety', label: 'Safety' },
  { to: '/about', label: 'About' },
];

export function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isHome = location.pathname === '/';
  // Transparent over the dark home hero until the user scrolls
  const transparent = isHome && !scrolled && !isMobileSearchVisible;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsMobileSearchVisible(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/browse?search=${encodeURIComponent(q)}` : '/browse');
    setIsMobileSearchVisible(false);
  };

  const linkCls = ({ isActive }) =>
    `relative rounded-full px-3.5 py-2 text-[15px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
      transparent
        ? isActive
          ? 'text-white'
          : 'text-white/75 hover:text-white'
        : isActive
          ? 'text-ink'
          : 'text-zinc-600 hover:text-ink'
    } after:absolute after:inset-x-3.5 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:transition-transform after:duration-300 ${
      isActive ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'
    }`;

  const iconBtn = `h-10 w-10 place-items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
    transparent ? 'text-white hover:bg-white/10' : 'text-ink hover:bg-zinc-100'
  }`;

  return (
    <>
      <header
        className={`inset-x-0 top-0 z-40 w-full transition-[background-color,box-shadow,border-color] duration-300 ${
          isHome ? 'fixed' : 'sticky'
        } ${
          transparent
            ? 'border-b border-white/10 bg-zinc-950/45 shadow-[0_1px_24px_rgba(0,0,0,0.25)] backdrop-blur-md backdrop-saturate-150'
            : 'border-b border-zinc-200/70 bg-white/95 shadow-[0_1px_20px_rgba(0,0,0,0.06)] backdrop-blur-xl backdrop-saturate-150'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[72px] items-center justify-between gap-4">
            <div className="flex items-center gap-8">
              <BrandLogo light={transparent} compact />
              <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
                {LINKS.map((l) => (
                  <NavLink key={l.to} to={l.to} end={l.end} className={linkCls}>
                    {l.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            <form onSubmit={handleSearchSubmit} role="search" className="relative hidden max-w-xs flex-1 xl:block">
              <label htmlFor="nav-search" className="sr-only">
                Search listings
              </label>
              <Search
                size={17}
                className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${transparent ? 'text-white/60' : 'text-muted'}`}
                aria-hidden="true"
              />
              <input
                id="nav-search"
                type="search"
                placeholder="Search pets, breeds, supplies…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded-full py-2.5 pl-11 pr-4 text-[15px] outline-none transition-all duration-200 ${
                  transparent
                    ? 'bg-white/10 text-white ring-1 ring-inset ring-white/20 placeholder:text-white/55 focus:bg-white/15 focus:ring-white/40'
                    : 'bg-zinc-100/80 text-ink ring-1 ring-inset ring-transparent placeholder:text-zinc-400 focus:bg-white focus:ring-primary/40'
                }`}
              />
            </form>

            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <button
                type="button"
                onClick={() => setIsMobileSearchVisible((v) => !v)}
                className={`${iconBtn} hidden sm:grid xl:hidden`}
                aria-label={isMobileSearchVisible ? 'Close search' : 'Open search'}
                aria-expanded={isMobileSearchVisible}
              >
                {isMobileSearchVisible ? <X size={20} /> : <Search size={20} />}
              </button>

              <Link
                to="/create-listing"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-[15px] font-semibold text-white shadow-[0_6px_20px_-6px_rgba(239,78,82,0.55)] transition-all duration-200 hover:-translate-y-px hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
                <span className="hidden sm:inline">Post a listing</span>
                <span className="sm:hidden">Sell</span>
              </Link>

              <div className="hidden items-center gap-1.5 lg:flex">
                {user ? (
                  <UserMenu transparent={transparent} />
                ) : (
                  <>
                    <Link
                      to="/login"
                      className={`rounded-full px-4 py-2.5 text-[15px] font-semibold ring-1 ring-inset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        transparent
                          ? 'text-white ring-primary hover:bg-primary/20'
                          : 'text-primary ring-primary hover:bg-primary-soft'
                      }`}
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      className={`rounded-full px-4 py-2.5 text-[15px] font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                        transparent ? 'bg-white text-ink hover:bg-zinc-100' : 'bg-ink text-white hover:bg-zinc-800'
                      }`}
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className={`${iconBtn} grid lg:hidden`}
                aria-label="Open menu"
                aria-expanded={isMobileMenuOpen}
              >
                <Menu size={22} />
              </button>
            </div>
          </div>

          {isMobileSearchVisible && (
            <form onSubmit={handleSearchSubmit} role="search" className="relative pb-4 xl:hidden">
              <label htmlFor="nav-search-mobile" className="sr-only">
                Search listings
              </label>
              <Search size={17} className="pointer-events-none absolute left-4 top-[22px] -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                id="nav-search-mobile"
                type="search"
                autoFocus
                placeholder="Search pets, breeds, supplies…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full bg-zinc-100 py-3 pl-11 pr-24 text-[15px] text-ink outline-none ring-1 ring-inset ring-transparent placeholder:text-zinc-400 focus:bg-white focus:ring-primary/40"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-[22px] -translate-y-1/2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Search
              </button>
            </form>
          )}
        </div>
      </header>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
      />
    </>
  );
}

export default Navbar;
