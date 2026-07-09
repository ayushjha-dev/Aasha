'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useMobile } from '@/hooks/use-mobile';
import { useTranslation, Locale } from '@/lib/i18n-context';
import {
  Shield, Home, AlertTriangle, MapPin, Heart, Users,
  ClipboardList, Settings, LogOut, FileText, Package, Globe
} from 'lucide-react';
import { UserRole } from '@/lib/types';

interface NavItem {
  label: string;
  key: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: Record<UserRole, NavItem[]> = {
  citizen: [
    { label: 'Dashboard', key: 'citizen.portal', href: '/citizen', icon: <Home size={18} /> },
    { label: 'Report', key: 'citizen.reportIncident', href: '/citizen/report', icon: <AlertTriangle size={18} /> },
    { label: 'Shelters', key: 'citizen.findShelters', href: '/citizen/shelters', icon: <MapPin size={18} /> },
    { label: 'My Reports', key: 'citizen.myReports', href: '/citizen/incidents', icon: <ClipboardList size={18} /> },
    { label: 'Donate', key: 'citizen.donate', href: '/citizen/donations', icon: <Package size={18} /> },
  ],
  volunteer: [
    { label: 'Dashboard', key: 'volunteer.portal', href: '/volunteer', icon: <Home size={18} /> },
    { label: 'Incidents', key: 'volunteer.activeIncidents', href: '/volunteer/incidents', icon: <AlertTriangle size={18} /> },
    { label: 'Teams', key: 'volunteer.volunteerTeams', href: '/volunteer/teams', icon: <Users size={18} /> },
    { label: 'Tasks', key: 'volunteer.tasks', href: '/volunteer/tasks', icon: <ClipboardList size={18} /> },
  ],
  admin: [
    { label: 'Dashboard', key: 'admin.dashboard', href: '/admin', icon: <Home size={18} /> },
    { label: 'Incidents', key: 'admin.incidentManagement', href: '/admin/incidents', icon: <AlertTriangle size={18} /> },
    { label: 'Shelters', key: 'admin.shelterManagement', href: '/admin/shelters', icon: <MapPin size={18} /> },
    { label: 'Volunteers', key: 'admin.volunteerDirectory', href: '/admin/volunteers', icon: <Users size={18} /> },
    { label: 'Audit Log', key: 'admin.auditLog', href: '/admin/audit', icon: <FileText size={18} /> },
    { label: 'Settings', key: 'admin.settings', href: '/admin/settings', icon: <Settings size={18} /> },
  ],
};

export default function AppShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: UserRole;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useTranslation();
  const isMobile = useMobile();

  const items = navItems[role] || [];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const LanguageSelector = () => (
    <div className="flex items-center gap-1 bg-surface-primary/40 px-2 py-1 rounded border border-surface-border/50">
      <Globe size={12} className="text-text-secondary" />
      {(['en', 'hi', 'es'] as Locale[]).map((lang) => (
        <button
          key={lang}
          onClick={() => setLocale(lang)}
          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase transition-colors ${
            locale === lang ? 'text-accent bg-surface-elevated' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
  );

  // Desktop sidebar
  if (!isMobile) {
    return (
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 bg-surface-secondary border-r border-surface-border flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-2 px-4 py-4 border-b border-surface-border">
            <div className="w-7 h-7 rounded bg-accent flex items-center justify-center">
              <Shield size={14} className="text-surface-primary" />
            </div>
            <span className="font-display text-base font-semibold uppercase tracking-wide text-text-primary">
              {t('common.appName', 'Aasha')}
            </span>
          </div>

          {/* Nav links */}
          <nav className="flex-1 py-2 overflow-y-auto">
            {items.map((item) => {
              const isActive = pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent/15 text-accent'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated/50'
                  }`}
                >
                  {item.icon}
                  {t(item.key, item.label)}
                </Link>
              );
            })}
          </nav>

          {/* Language Selector */}
          <div className="px-4 py-2 border-t border-surface-border/50">
            <LanguageSelector />
          </div>

          {/* User info + logout */}
          <div className="border-t border-surface-border p-3">
            <Link
              href={`/${role}/profile`}
              className="flex items-center gap-2 mb-2 p-1 rounded hover:bg-surface-elevated/40 transition-colors group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-xs font-semibold text-text-primary group-hover:bg-accent/15 group-hover:text-accent transition-colors">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate group-hover:text-accent transition-colors">{user?.name}</p>
                <p className="text-xs text-text-muted capitalize">{user?.role}</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs text-text-secondary hover:text-incident-critical hover:bg-incident-critical/10 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              {t('common.signOut', 'Sign Out')}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    );
  }

  // Mobile layout with bottom nav
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-surface-border bg-surface-secondary flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded bg-accent flex items-center justify-center">
            <Shield size={12} className="text-surface-primary" />
          </div>
          <span className="font-display text-sm font-semibold uppercase tracking-wide text-text-primary">
            {t('common.appName', 'Aasha')}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelector />
          <Link
            href={`/${role}/profile`}
            className="w-7 h-7 rounded-full bg-surface-elevated flex items-center justify-center text-xs font-semibold text-text-primary hover:text-accent hover:bg-accent/15 transition-colors cursor-pointer"
          >
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </Link>
          <button
            onClick={handleLogout}
            className="text-text-secondary hover:text-incident-critical transition-colors cursor-pointer"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="flex-shrink-0 bg-surface-secondary border-t border-surface-border">
        <div className="flex justify-around">
          {items.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2 px-3 text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-accent'
                    : 'text-text-secondary'
                }`}
              >
                {item.icon}
                {t(item.key, item.label)}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
