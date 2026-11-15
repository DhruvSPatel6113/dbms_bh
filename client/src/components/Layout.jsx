import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  AlertCircle, BarChart3, BookOpen, ChevronRight, CircleHelp, LayoutDashboard,
  LibraryBig, LogOut, Menu, Monitor, RefreshCw, Shield, Truck, Users, X
} from 'lucide-react';

const navItems = [
  { name: 'Books catalog', path: '/books', icon: BookOpen },
  { name: 'Members', path: '/members', icon: Users },
  { name: 'Circulation', path: '/circulation', icon: RefreshCw },
  { name: 'Fines', path: '/fines', icon: AlertCircle },
  { name: 'Software licenses', path: '/software', icon: Monitor },
  { name: 'Dealers & vendors', path: '/dealers', icon: Truck },
  { name: 'Staff directory', path: '/staff', icon: Shield, adminOnly: true },
  { name: 'Reports & analytics', path: '/reports', icon: BarChart3 }
];

const pageNames = {
  '/books': 'Books catalog',
  '/members': 'Members',
  '/circulation': 'Circulation desk',
  '/fines': 'Fines',
  '/software': 'Software licenses',
  '/dealers': 'Dealers & vendors',
  '/staff': 'Staff directory',
  '/reports': 'Reports & analytics',
  '/profile': 'My profile'
};

function Avatar({ name, className = '' }) {
  const initials = (name || 'Staff').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return <span className={`flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-brand-700 ${className}`}>{initials}</span>;
}

export default function Layout({ children, user, onLogout }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const title = pageNames[location.pathname] || 'Library workspace';
  const visibleNav = navItems.filter((item) => !item.adminOnly || user?.designation === 'Admin');

  const navigation = (
    <>
      <div className="px-4 pb-3 pt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Workspace</div>
      <nav className="space-y-1 px-3" aria-label="Main navigation">
        {visibleNav.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${
              isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {({ isActive }) => (
              <>
                <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="flex-1">{name}</span>
                {isActive && <ChevronRight className="h-4 w-4 text-brand-500" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[258px] flex-col border-r border-slate-200/80 bg-white lg:flex">
        <NavLink to="/books" className="flex items-center gap-3 px-6 py-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-brand-600 text-white shadow-md shadow-brand-600/20">
            <LibraryBig className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-display text-[17px] font-extrabold tracking-tight text-ink">Stacks</span>
            <span className="mt-0.5 block text-[11px] font-medium text-slate-400">Library workspace</span>
          </span>
        </NavLink>
        <div className="mx-4 h-px bg-slate-100" />
        {navigation}
        <div className="mt-auto p-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <CircleHelp className="h-4 w-4 text-brand-600" /> Need a hand?
            </div>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">Your library tools are ready when you are.</p>
          </div>
          <NavLink to="/profile" className="mt-3 flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50">
            <Avatar name={user?.name} className="h-9 w-9 text-xs" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-slate-800">{user?.name || 'Staff member'}</span>
              <span className="mt-0.5 block truncate text-xs text-slate-500">{user?.designation || 'Librarian'}</span>
            </span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </NavLink>
          <button onClick={onLogout} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} className="absolute inset-0 bg-slate-950/40" />
          <aside className="relative flex h-full w-[min(300px,85vw)] flex-col bg-white shadow-float">
            <div className="flex items-center justify-between px-5 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-brand-600 text-white"><LibraryBig className="h-5 w-5" /></span>
                <span className="font-display text-lg font-extrabold text-ink">Stacks</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            {navigation}
            <NavLink to="/profile" onClick={() => setMobileMenuOpen(false)} className="mt-auto flex items-center gap-3 border-t border-slate-100 p-5">
              <Avatar name={user?.name} className="h-9 w-9 text-xs" />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{user?.name}</span><span className="text-xs text-slate-500">My profile</span></span>
            </NavLink>
          </aside>
        </div>
      )}

      <div className="min-h-screen lg:pl-[258px]">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-[72px] items-center justify-between px-4 sm:px-7 lg:px-9">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation" className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"><Menu className="h-5 w-5" /></button>
              <div className="min-w-0">
                <p className="hidden text-[10px] font-bold uppercase tracking-[0.17em] text-slate-400 sm:block">Library workspace</p>
                <h1 className="mt-0.5 truncate font-display text-base font-extrabold tracking-tight text-ink sm:text-lg">{title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-xs font-semibold text-slate-700">{new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">Have a great day</p>
              </div>
              <NavLink to="/profile" aria-label="Open your profile" className="flex items-center gap-2 rounded-full p-1 pr-2 transition hover:bg-slate-50">
                <Avatar name={user?.name} className="h-9 w-9 text-xs" />
                <span className="hidden max-w-32 text-left sm:block">
                  <span className="block truncate text-xs font-bold text-slate-800">{user?.name || 'Staff member'}</span>
                  <span className="mt-0.5 block text-[10px] text-slate-400">View profile</span>
                </span>
              </NavLink>
              <button onClick={onLogout} aria-label="Sign out" title="Sign out" className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 lg:hidden"><LogOut className="h-4 w-4" /></button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-7 sm:py-8 lg:px-9">
          <div className="mb-5 hidden items-center gap-2 text-xs text-slate-400 sm:flex">
            <LayoutDashboard className="h-3.5 w-3.5" /> Workspace <ChevronRight className="h-3 w-3" />
            <span className="font-semibold text-slate-600">{title}</span>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
