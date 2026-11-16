import React from 'react';
import { Link } from 'react-router-dom';
import { PawPrint, Shield, Phone, Mail, CheckCircle2, Facebook } from 'lucide-react';
import { useSiteSettings, setting } from '../../hooks/useSiteSettings';

// Keep only characters that are valid in a tel: link
const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, '')}`;

export function Footer() {
  // All text in the help column (and the about/copyright lines) is managed in Admin → General Settings
  const { settings } = useSiteSettings();
  const phone = setting(settings, 'contact_phone', null);
  const email = setting(settings, 'contact_email', null);
  const facebook = setting(settings, 'facebook_url', null);
  const helpTitle = setting(settings, 'footer_help_title', 'Help & Verification');
  const noticeTitle = setting(settings, 'footer_notice_title', '');
  const noticeText = setting(settings, 'footer_notice_text', '');
  const about = setting(
    settings,
    'footer_about',
    "Bangladesh's dedicated, moderated marketplace for verified pet breeders, adoption listings, veterinary supplies and secondhand pet essentials.",
  );
  const copyright = setting(settings, 'footer_copyright', 'PetMart Bangladesh');

  return (
    <footer className="bg-ink text-zinc-300 mt-auto border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Responsive Grid: 1 col mobile, 2 col tablet, 4 col desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Brand & About */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-2 text-primary font-bold text-xl">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                <PawPrint size={20} />
              </div>
              <span className="text-white text-lg font-extrabold tracking-tight">
                Pet<span className="text-primary">Mart</span> BD
              </span>
            </Link>
            <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-400">{about}</p>
            <div className="flex items-center gap-2 text-xs text-primary font-medium">
              <CheckCircle2 size={16} />
              <span>Admin-moderated for animal safety</span>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Popular Categories
            </h3>
            <ul className="space-y-2.5 text-sm" role="list">
              <li>
                <Link
                  to="/browse?category_slug=dogs"
                  className="hover:text-primary transition-colors inline-block"
                >
                  Dogs & Puppies
                </Link>
              </li>
              <li>
                <Link
                  to="/browse?category_slug=cats"
                  className="hover:text-primary transition-colors inline-block"
                >
                  Cats & Kittens
                </Link>
              </li>
              <li>
                <Link
                  to="/browse?category_slug=birds"
                  className="hover:text-primary transition-colors inline-block"
                >
                  Birds & Parrots
                </Link>
              </li>
              <li>
                <Link
                  to="/browse?category_slug=fish-aquatics"
                  className="hover:text-primary transition-colors inline-block"
                >
                  Aquarium & Fish
                </Link>
              </li>
              <li>
                <Link
                  to="/browse?category_slug=pet-supplies"
                  className="hover:text-primary transition-colors inline-block"
                >
                  Pet Food & Accessories
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Trust & Safety, Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Trust & Platform
            </h3>
            <ul className="space-y-2.5 text-sm" role="list">
              <li>
                <Link to="/about" className="hover:text-primary transition-colors inline-block">
                  About PetMart
                </Link>
              </li>
              <li>
                <Link to="/safety" className="hover:text-primary transition-colors inline-block">
                  Safety Tips & Guidelines
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors inline-block">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-primary transition-colors inline-block">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-primary transition-colors inline-block">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Verification (managed from General Settings) */}
          <div className="space-y-4">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">{helpTitle}</h3>
            {(phone || email || facebook) && (
              <div className="space-y-3 text-sm">
                {phone && (
                  <a href={telHref(phone)} className="flex items-center gap-2.5 text-zinc-300 transition-colors hover:text-primary">
                    <Phone size={16} className="shrink-0 text-primary" aria-hidden="true" />
                    <span>{phone}</span>
                  </a>
                )}
                {email && (
                  <a href={`mailto:${email}`} className="flex items-center gap-2.5 break-all text-zinc-300 transition-colors hover:text-primary">
                    <Mail size={16} className="shrink-0 text-primary" aria-hidden="true" />
                    <span>{email}</span>
                  </a>
                )}
                {facebook && (
                  <a
                    href={facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-zinc-300 transition-colors hover:text-primary"
                  >
                    <Facebook size={16} className="shrink-0 text-primary" aria-hidden="true" />
                    <span>Facebook</span>
                  </a>
                )}
              </div>
            )}
            {(noticeTitle || noticeText) && (
              <div className="rounded-xl border border-zinc-700/60 bg-zinc-800/80 p-3 text-xs text-zinc-300">
                {noticeTitle && (
                  <div className="mb-1 flex items-center gap-2 font-semibold text-white">
                    <Shield size={16} className="text-primary" aria-hidden="true" />
                    {noticeTitle}
                  </div>
                )}
                {noticeText && <p className="whitespace-pre-line">{noticeText}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} {copyright}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/safety" className="hover:text-zinc-200 transition-colors">Safety</Link>
            <Link to="/terms" className="hover:text-zinc-200 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-zinc-200 transition-colors">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default Footer;

