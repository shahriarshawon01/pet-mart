import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Heart, MessageSquare, LayoutDashboard, LogOut, ChevronDown } from 'lucide-react';
import { UserAvatar } from '../ui/UserAvatar';

export function UserMenu({ transparent = false }) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 p-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${transparent ? 'hover:bg-white/10' : 'hover:bg-zinc-100'}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User account menu"
      >
        <UserAvatar user={user} className="h-9 w-9 text-sm" />
        <span className={`hidden xl:inline text-[15px] font-semibold max-w-[120px] truncate ${transparent ? 'text-white' : 'text-ink'}`}>
          {user.name.split(' ')[0]}
        </span>
        <ChevronDown size={16} className={`transition-transform duration-200 ${transparent ? 'text-white/70' : 'text-muted'} ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-border py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-4 py-2 border-b border-border/60">
            <p className="text-sm font-bold text-ink truncate">{user.name}</p>
            <p className="text-xs text-muted truncate">{user.phone}</p>
          </div>

          <div className="py-1">
            <Link
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-ink hover:bg-zinc-50 transition-colors"
              role="menuitem"
            >
              <LayoutDashboard size={16} className="text-muted" />
              <span>My Listings</span>
            </Link>

            <Link
              to="/wishlist"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-ink hover:bg-zinc-50 transition-colors"
              role="menuitem"
            >
              <Heart size={16} className="text-muted" />
              <span>Saved Listings</span>
            </Link>

            <Link
              to="/inquiries"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-ink hover:bg-zinc-50 transition-colors"
              role="menuitem"
            >
              <MessageSquare size={16} className="text-muted" />
              <span>Inquiries</span>
            </Link>

            <Link
              to="/account/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-ink hover:bg-zinc-50 transition-colors"
              role="menuitem"
            >
              <User size={16} className="text-muted" />
              <span>Profile settings</span>
            </Link>
          </div>

          <div className="pt-1 border-t border-border/60">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              role="menuitem"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default UserMenu;

