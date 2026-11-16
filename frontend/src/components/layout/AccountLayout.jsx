import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Heart, MessageSquare, PlusCircle, LogOut, UserCog } from 'lucide-react';
import { Container } from '../ui/Container';
import { UserAvatar } from '../ui/UserAvatar';

const navItems = [
  { to: '/dashboard', label: 'My Listings', icon: LayoutDashboard },
  { to: '/wishlist', label: 'Saved Pets', icon: Heart },
  { to: '/inquiries', label: 'Inquiries', icon: MessageSquare },
  { to: '/account/settings', label: 'Profile settings', icon: UserCog },
];

export function AccountLayout({ children, title, subtitle }) {
  const { user, logout } = useAuth();

  return (
    <Container className="py-6 sm:py-8">
      {/* Account Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
            {title || `Welcome back, ${user?.name ? user.name.split(' ')[0] : 'Member'}`}
          </h1>
          <p className="text-sm text-muted mt-1">
            {subtitle || `Manage your listings, inquiries, and saved items`}
          </p>
        </div>
        <NavLink
          to="/create-listing"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-xs transition-all w-full sm:w-auto"
        >
          <PlusCircle size={16} />
          <span>Post New Listing</span>
        </NavLink>
      </div>

      {/* Main Grid: Sidebar on desktop, horizontal nav on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        {/* Navigation Sidebar / Mobile Tabs */}
        <aside className="lg:col-span-1">
          {/* Mobile horizontal scroll tabs */}
          <div className="flex lg:hidden overflow-x-auto gap-2 pb-2 scrollbar-none border-b border-border mb-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${
                      isActive
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-border'
                    }`
                  }
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Desktop vertical sidebar card */}
          <div className="hidden lg:block bg-white rounded-2xl border border-border p-4 shadow-xs sticky top-24">
            {/* User Info Snippet */}
            <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl mb-4 border border-zinc-100">
              <UserAvatar user={user} />
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-ink truncate">{user?.name}</p>
                <p className="text-xs text-muted truncate">{user?.phone}</p>
              </div>
            </div>

            <nav className="space-y-1" aria-label="Account navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/dashboard'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-zinc-700 hover:bg-zinc-50 hover:text-ink'
                      }`
                    }
                  >
                    <Icon size={18} className="shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="mt-6 pt-4 border-t border-border">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="min-w-0 lg:col-span-3">
          {children}
        </div>
      </div>
    </Container>
  );
}
export default AccountLayout;

