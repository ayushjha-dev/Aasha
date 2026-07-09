'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTranslation, Locale } from '@/lib/i18n-context';
import { useEffect } from 'react';
import { Shield, Heart, Users, Globe } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { locale, setLocale, t } = useTranslation();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push(`/${user.role}`);
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse-subtle text-text-secondary">{t('common.loading', 'Loading...')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-accent flex items-center justify-center">
            <Shield size={18} className="text-surface-primary" />
          </div>
          <span className="text-heading-md text-text-primary tracking-wide">{t('common.appName', 'Aasha')}</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Globe size={14} className="text-text-secondary" />
          <button
            onClick={() => setLocale('en')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              locale === 'en' ? 'text-text-primary bg-surface-elevated' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLocale('hi')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              locale === 'hi' ? 'text-text-primary bg-surface-elevated' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            HI
          </button>
          <button
            onClick={() => setLocale('es')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              locale === 'es' ? 'text-text-primary bg-surface-elevated' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            ES
          </button>
        </div>
      </header>

      {/* Main content — role selection */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          <p className="text-label text-center mb-2">{t('landing.tagline')}</p>
          <h1 className="text-heading-xl text-center mb-2">
            {t('landing.heading')}
          </h1>
          <p className="text-text-secondary text-center text-sm mb-10">
            {t('landing.subtitle')}
          </p>

          <div className="grid gap-3">
            {/* Citizen */}
            <button
              onClick={() => router.push('/login?role=citizen')}
              className="card flex items-start gap-4 p-5 text-left hover:border-accent transition-colors group cursor-pointer"
            >
              <div className="w-10 h-10 rounded bg-incident-info/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield size={20} className="text-incident-info" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-text-primary uppercase tracking-wide group-hover:text-accent transition-colors">
                  {t('landing.citizen.title')}
                </h2>
                <p className="text-text-secondary text-sm mt-0.5">
                  {t('landing.citizen.desc')}
                </p>
              </div>
            </button>

            {/* Volunteer */}
            <button
              onClick={() => router.push('/login?role=volunteer')}
              className="card flex items-start gap-4 p-5 text-left hover:border-accent transition-colors group cursor-pointer"
            >
              <div className="w-10 h-10 rounded bg-status-resolved/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Heart size={20} className="text-status-resolved" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-text-primary uppercase tracking-wide group-hover:text-accent transition-colors">
                  {t('landing.volunteer.title')}
                </h2>
                <p className="text-text-secondary text-sm mt-0.5">
                  {t('landing.volunteer.desc')}
                </p>
              </div>
            </button>

            {/* Admin */}
            <button
              onClick={() => router.push('/login?role=admin')}
              className="card flex items-start gap-4 p-5 text-left hover:border-accent transition-colors group cursor-pointer"
            >
              <div className="w-10 h-10 rounded bg-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users size={20} className="text-accent" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-text-primary uppercase tracking-wide group-hover:text-accent transition-colors">
                  {t('landing.admin.title')}
                </h2>
                <p className="text-text-secondary text-sm mt-0.5">
                  {t('landing.admin.desc')}
                </p>
              </div>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-3 border-t border-surface-border text-center">
        <p className="text-text-muted text-xs">
          {t('common.appName')} — Unified Disaster Management Platform
        </p>
      </footer>
    </div>
  );
}
