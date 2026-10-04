'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  LayoutDashboard, FlaskConical, Siren, Boxes, Languages, TabletSmartphone, Sparkles, Stamp, ShieldCheck, ScrollText,
  Share2, SlidersHorizontal, Gauge, Network, Wifi, WifiOff, Bell, RotateCcw, PlayCircle, ShieldAlert, LogOut, Leaf,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useClocks, useT } from '@/lib/hooks';
import { canRoute, ROLES } from '@/lib/rbac';
import type { TKey } from '@/lib/i18n';
import type { RoleId } from '@/lib/types';
import { Login } from './Login';
import { DemoTour } from './DemoTour';

const NAV: { sec: TKey; items: { href: string; key: TKey; icon: ReactNode }[] }[] = [
  { sec: 'sec_operate', items: [
    { href: '/', key: 'nav_dashboard', icon: <LayoutDashboard size={16} /> },
    { href: '/studies', key: 'nav_studies', icon: <FlaskConical size={16} /> },
    { href: '/capture', key: 'nav_capture', icon: <TabletSmartphone size={16} /> },
  ] },
  { sec: 'sec_safety', items: [
    { href: '/safety', key: 'nav_safety', icon: <Siren size={16} /> },
    { href: '/batches', key: 'nav_batches', icon: <Boxes size={16} /> },
    { href: '/coding', key: 'nav_coding', icon: <Languages size={16} /> },
    { href: '/ai', key: 'nav_ai', icon: <Sparkles size={16} /> },
  ] },
  { sec: 'sec_govern', items: [
    { href: '/ethics', key: 'nav_ethics', icon: <Stamp size={16} /> },
    { href: '/consent', key: 'nav_consent', icon: <ShieldCheck size={16} /> },
    { href: '/audit', key: 'nav_audit', icon: <ScrollText size={16} /> },
    { href: '/scorecard', key: 'nav_scorecard', icon: <Gauge size={16} /> },
  ] },
  { sec: 'sec_system', items: [
    { href: '/interop', key: 'nav_interop', icon: <Share2 size={16} /> },
    { href: '/rules', key: 'nav_rules', icon: <SlidersHorizontal size={16} /> },
    { href: '/about', key: 'nav_about', icon: <Network size={16} /> },
  ] },
];

function useOnline() {
  const sim = useStore((s) => s.simulateOffline);
  const [net, setNet] = useState(true);
  useEffect(() => {
    setNet(navigator.onLine);
    const on = () => setNet(true), off = () => setNet(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return net && !sim;
}

export function Shell({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const init = useStore((s) => s.init);
  const ready = useStore((s) => s.ready);
  const authed = useStore((s) => s.authed);

  useEffect(() => {
    setMounted(true);
    init();
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, [init]);

  if (!mounted || !ready) {
    return (
      <div className="motif flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-brand-700"><Leaf className="animate-pulse" /> Loading TrialSetu · generating synthetic portfolio…</div>
      </div>
    );
  }
  if (!authed) return <Login />;
  return <Frame>{children}</Frame>;
}

function Frame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const role = useStore((s) => s.role);
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const setRole = useStore((s) => s.setRole);
  const users = useStore((s) => s.users);
  const log = useStore((s) => s.log);
  const resetDemo = useStore((s) => s.resetDemo);
  const logout = useStore((s) => s.logout);
  const setTour = useStore((s) => s.setTour);
  const queue = useStore((s) => s.syncQueue.length);
  const online = useOnline();
  const { clocks } = useClocks(30000);
  const hot = useMemo(() => clocks.filter((c) => c.status === 'red' || c.status === 'overdue').length, [clocks]);
  const allowed = canRoute(role, pathname);
  const lastLogged = useRef('');

  // Role-scoped access logging: every route view (allowed or denied) is appended to the audit chain.
  useEffect(() => {
    const key = `${role}|${pathname}`;
    if (lastLogged.current === key) return;
    lastLogged.current = key;
    useStore.getState().log({ action: allowed ? 'ACCESS' : 'ACCESS_DENIED', entity: 'route', entityId: pathname, detail: `${allowed ? 'Allowed' : 'Denied'} by RBAC policy for role "${role}"` });
  }, [pathname, role, allowed]);

  const me = users.find((u) => u.role === role);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-brand-900/10 bg-brand-950 text-brand-50 lg:flex">
        <Link href="/" className="flex items-center gap-2.5 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-haldi-400 to-haldi-600 text-white shadow"><Leaf size={20} /></div>
          <div>
            <div className="text-base font-semibold leading-tight">TrialSetu</div>
            <div className="text-[10px] uppercase tracking-wider text-brand-300">AIIA · NPvCC</div>
          </div>
        </Link>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {NAV.map((g) => {
            const items = g.items.filter((i) => canRoute(role, i.href));
            if (!items.length) return null;
            return (
              <div key={g.sec} className="mt-3">
                <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-brand-400">{t(g.sec)}</div>
                {items.map((i) => {
                  const active = i.href === '/' ? pathname === '/' : pathname.startsWith(i.href);
                  return (
                    <Link key={i.href} href={i.href} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition ${active ? 'bg-brand-800 text-white' : 'text-brand-100/80 hover:bg-brand-900 hover:text-white'}`}>
                      {i.icon}<span className="flex-1">{t(i.key)}</span>
                      {i.href === '/safety' && hot > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{hot}</span>}
                      {i.href === '/capture' && queue > 0 && <span className="rounded-full bg-haldi-500 px-1.5 text-[10px] font-bold text-white">{queue}</span>}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-brand-900 px-4 py-3 text-[10px] leading-relaxed text-brand-300">
          🇮🇳 {t('hosting')}<br />{t('synthetic')}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white/90 px-4 py-2 backdrop-blur">
          <div className="mr-auto min-w-0">
            <div className="truncate text-xs text-slate-500">{t('appTagline')}</div>
            <div className="truncate text-sm font-medium text-slate-800">{me?.name} · <span className="text-slate-500">{me?.title}</span></div>
          </div>

          <button onClick={() => { setTour(0); }} className="btn-haldi" title="Guided 3-minute demo"><PlayCircle size={15} /> {t('demoTour')}</button>

          <label className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs" title={t('switchRole')}>
            <span className="text-slate-500">{t('role')}:</span>
            <select value={role} onChange={(e) => setRole(e.target.value as RoleId)} className="bg-transparent font-medium text-slate-800 outline-none" data-testid="role-select">
              {(Object.keys(ROLES) as RoleId[]).map((r) => <option key={r} value={r}>{lang === 'hi' ? ROLES[r].labelHi : ROLES[r].label}</option>)}
            </select>
          </label>

          <div className="flex overflow-hidden rounded-lg border border-slate-200 text-xs font-medium">
            <button onClick={() => setLang('en')} className={`px-2 py-1 ${lang === 'en' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600'}`}>EN</button>
            <button onClick={() => setLang('hi')} className={`px-2 py-1 ${lang === 'hi' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600'}`}>हिं</button>
          </div>

          <span className={`pill ${online ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-800 text-white ring-slate-900'}`} title="Connectivity">
            {online ? <Wifi size={12} /> : <WifiOff size={12} />}{online ? t('online') : t('offline')}{queue > 0 && ` · ${queue} queued`}
          </span>

          <Link href="/safety" className={`relative rounded-lg p-1.5 ${hot ? 'text-red-600' : 'text-slate-500'} hover:bg-slate-100`} title="Critical statutory clocks">
            <Bell size={18} />
            {hot > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{hot}</span>}
          </Link>
          <button onClick={() => { if (confirm('Regenerate the synthetic dataset? Clocks will be re-anchored to now.')) resetDemo(); }} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" title="Reset demo data"><RotateCcw size={16} /></button>
          <button onClick={() => { logout(); router.push('/'); }} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" title="Sign out"><LogOut size={16} /></button>
        </header>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-1.5 lg:hidden">
          {NAV.flatMap((g) => g.items).filter((i) => canRoute(role, i.href)).map((i) => (
            <Link key={i.href} href={i.href} className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs ${pathname === i.href ? 'bg-brand-600 text-white' : 'text-slate-600'}`}>{i.icon}{t(i.key)}</Link>
          ))}
        </nav>

        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 md:p-6">
          <Suspense fallback={<div className="text-sm text-slate-500">Loading…</div>}>
            {allowed ? children : (
              <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
                <ShieldAlert className="mx-auto mb-3 text-red-500" size={36} />
                <h2 className="text-lg font-semibold">Access denied for role “{ROLES[role].label}”</h2>
                <p className="mt-2 text-sm text-slate-600">RBAC policy blocks <code className="mono">{pathname}</code> for this role. This attempt has been recorded in the hash-chained audit log (ACCESS_DENIED).</p>
                <Link href="/" className="btn-primary mt-4">Back to dashboard</Link>
              </div>
            )}
          </Suspense>
        </main>
        <footer className="border-t border-slate-200 bg-white px-6 py-2 text-[11px] text-slate-500">
          TrialSetu · SIH 2026 · PS SIH26046 (Ministry of Ayush / AIIA) · Prototype — {t('synthetic')} · MedDRA®/WHODrug are licensed and not bundled.
        </footer>
      </div>
      <DemoTour />
    </div>
  );
}
