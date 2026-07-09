'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTranslation, Locale } from '@/lib/i18n-context';
import api from '@/lib/api';
import { Save, User as UserIcon, Phone, Globe, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';

export default function AdminProfilePage() {
  const { user, updateUser } = useAuth();
  const { setLocale, t } = useTranslation();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [languagePreference, setLanguagePreference] = useState<Locale>('en');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setLanguagePreference(user.languagePreference || 'en');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    try {
      const res = await api.put('/auth/me', {
        name,
        phone,
        languagePreference,
        // Admins don't need location updates typically, but pass defaults to be safe
        location: user?.location || { lat: 28.6300, lng: 77.2150 },
      });

      const updatedUser = res.data.user;
      updateUser(updatedUser);
      setLocale(languagePreference);
      setMessage('Profile updated successfully!');
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto animate-slide-up">
      <div className="mb-6">
        <p className="text-label">{t('admin.commandCenter', 'Command Center')}</p>
        <h1 className="text-heading-xl mt-1">Administrator Profile</h1>
      </div>

      <div className="grid gap-6">
        <div className="card p-5 space-y-4">
          <h2 className="text-heading-md border-b border-surface-border pb-2 flex items-center gap-2">
            <UserIcon size={18} className="text-accent" />
            Admin Account Details
          </h2>

          {error && (
            <div className="badge-critical p-3 rounded flex items-center gap-2 text-xs">
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {message && (
            <div className="badge-success p-3 rounded flex items-center gap-2 text-xs">
              <CheckCircle size={14} className="flex-shrink-0" />
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-label block mb-1">Email Address</label>
              <input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="input-field bg-surface-elevated/40 text-text-muted cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="name" className="text-label block mb-1">Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="input-field"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="text-label block mb-1">Phone Number</label>
              <input
                id="phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 00000"
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="lang" className="text-label block mb-1">Language Preference</label>
              <select
                id="lang"
                value={languagePreference}
                onChange={(e) => setLanguagePreference(e.target.value as Locale)}
                className="input-field capitalize"
              >
                <option value="en">English (EN)</option>
                <option value="hi">Hindi (HI)</option>
                <option value="es">Spanish (ES)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Save size={16} />
              {loading ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Security Warning Information */}
        <div className="card p-4 bg-incident-medium/10 border-incident-medium/30 flex gap-3 text-xs">
          <ShieldAlert size={20} className="text-incident-medium flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-text-primary mb-1">Security Alert</h4>
            <p className="text-text-secondary leading-relaxed">
              As an Administrator, you have full write privileges over platform configurations, database exports, and user directories. Ensure your credentials are secure and log out when you finish session commands.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
