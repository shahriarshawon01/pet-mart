import React, { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { X, Home, Grid, Heart, MessageSquare, LayoutDashboard, PlusCircle, LogIn, UserPlus, LogOut, Search, PawPrint, ShieldCheck, UserCog } from 'lucide-react';
import { UserAvatar } from '../ui/UserAvatar';
import { Button } from '../ui/Button';
import { lockScroll, unlockScroll } from '../../lib/scroll';

export function MobileMenu({ isOpen, onClose, searchQuery, setSearchQuery, onSearchSubmit }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Close drawer on route change
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname, location.search]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    if (!isOpen) return undefined;
    document.addEventListener('keydown', handleKeyDown);
    lockScroll();
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      unlockScroll();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/login');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(e);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation menu" data-lenis-prevent>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-ink/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div 
        ref={menuRef}
        className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250 ease-out"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2.5 text-xl font-extrabold" onClick={onClose} aria-label="PetMart home">
            <img src="/brand/seba-dut-logo.jpg" alt="" width="36" height="36" className="h-9 w-9 rounded-xl object-cover" />
            <span className="text-ink">Pet<span className="text-primary">Mart</span></span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted hover:text-ink hover:bg-zinc-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Mobile Search Form */}
          <form onSubmit={handleFormSubmit} className="relative">
            <input
              type="search"
              placeholder="Search pets, supplies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 border border-border rounded-lg outline-none focus:border-primary focus:bg-white text-ink placeholder-muted"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          </form>

          {/* User Info if logged in */}
          {user && (
            <div className="p-3 bg-zinc-50 rounded-xl border border-border flex items-center gap-3">
              <UserAvatar user={user} />
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-ink truncate">{user.name}</p>
                <p className="text-xs text-muted truncate">{user.phone}</p>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1" aria-label="Mobile Navigation">
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-ink hover:bg-zinc-50 hover:text-primary transition-colors"
            >
              <Home size={18} className="text-muted" />
              <span>Home</span>
            </Link>

            <Link
              to="/browse"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-ink hover:bg-zinc-50 hover:text-primary transition-colors"
            >
              <Grid size={18} className="text-muted" />
              <span>Browse All Categories</span>
            </Link>

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-ink hover:bg-zinc-50 hover:text-primary transition-colors"
                >
                  <LayoutDashboard size={18} className="text-muted" />
                  <span>My Listings</span>
                </Link>

                <Link
                  to="/wishlist"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-ink hover:bg-zinc-50 hover:text-primary transition-colors"
                >
                  <Heart size={18} className="text-muted" />
                  <span>Saved Listings</span>
                </Link>

                <Link
                  to="/inquiries"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-ink hover:bg-zinc-50 hover:text-primary transition-colors"
                >
                  <MessageSquare size={18} className="text-muted" />
                  <span>Inquiries & Messages</span>
                </Link>

                <Link
                  to="/account/settings"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-ink hover:bg-zinc-50 hover:text-primary transition-colors"
                >
                  <UserCog size={18} className="text-muted" />
                  <span>Profile settings</span>
                </Link>
              </>
            ) : null}
          </nav>

          {/* Sell Button */}
          <div className="pt-2">
            <Button
              as="link"
              to="/create-listing"
              variant="primary"
              className="w-full justify-center shadow-sm"
              iconLeft={<PlusCircle size={18} />}
            >
              Post Free Listing
            </Button>
          </div>

          {/* Informational Links */}
          <div className="pt-4 border-t border-border space-y-1 text-xs text-muted">
            <Link to="/about" className="block py-1.5 hover:text-ink transition-colors">About PetMart</Link>
            <Link to="/safety" className="block py-1.5 hover:text-ink transition-colors">Safety Tips & Trust</Link>
            <Link to="/contact" className="block py-1.5 hover:text-ink transition-colors">Contact Support</Link>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-zinc-50">
          {user ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button as="link" to="/login" variant="outline-primary" size="sm" className="w-full">
                <LogIn size={15} /> Login
              </Button>
              <Button as="link" to="/register" variant="secondary" size="sm" className="w-full">
                <UserPlus size={15} /> Register
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default MobileMenu;

