import React from 'react';
import { Link } from 'react-router-dom';
import { PawPrint, ShieldCheck, BadgeCheck, MessageSquare } from 'lucide-react';

const POINTS = [
  { icon: ShieldCheck, text: 'Every listing is checked by a moderator before it goes live.' },
  { icon: BadgeCheck, text: 'Sellers with a verified mobile number are clearly marked.' },
  { icon: MessageSquare, text: 'Message sellers and keep track of your enquiries.' },
];

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-border bg-white shadow-lg lg:grid-cols-2">
        <div className="hero-gradient relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="hero-grid pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden="true" />
          <Link to="/" className="relative flex items-center gap-2 text-xl font-extrabold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white">
              <PawPrint size={20} aria-hidden="true" />
            </span>
            <span>
              Pet<span className="text-primary">Mart</span>
            </span>
          </Link>
          <div className="relative">
            <h2 className="text-3xl font-extrabold leading-tight">Bangladesh's moderated pet marketplace.</h2>
            <ul className="mt-8 space-y-4">
              {POINTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex gap-3 text-sm text-zinc-300">
                  <Icon size={20} className="shrink-0 text-primary" aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <p className="relative text-xs text-zinc-400">© {new Date().getFullYear()} PetMart Bangladesh</p>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mb-7">
            <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary lg:hidden">
              <PawPrint size={24} aria-hidden="true" />
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="mt-6 border-t border-border pt-5 text-center text-sm text-muted">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
