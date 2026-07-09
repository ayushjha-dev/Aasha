'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTranslation, Locale } from '@/lib/i18n-context';
import api from '@/lib/api';
import { MapPin, Save, User as UserIcon, Phone, Globe, AlertCircle, CheckCircle, Award } from 'lucide-react';
import dynamic from 'next/dynamic';

const ProfileMap = dynamic(() => import('@/components/map/profile-map'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full bg-surface-primary rounded flex items-center justify-center border border-surface-border">
      <p className="text-text-muted text-sm animate-pulse-subtle">Loading map...</p>
    </div>
  ),
});

const SKILL_OPTIONS = [
  { value: 'medical', label: 'First Aid & Medical Support' },
  { value: 'transport', label: 'Logistics & Transportation' },
  { value: 'rescue', label: 'Search & Rescue' },
  { value: 'general', label: 'General Volunteer Support' },
  { value: 'communication', label: 'Translation & Communications' },
];

export default function VolunteerProfilePage() {
  const { user, updateUser } = useAuth();
  const { setLocale, t } = useTranslation();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [languagePreference, setLanguagePreference] = useState<Locale>('en');
  const [skills, setSkills] = useState<string[]>([]);
  const [lat, setLat] = useState(28.6250);
  const [lng, setLng] = useState(77.2200);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setLanguagePreference(user.languagePreference || 'en');
      setSkills(user.skills || []);
      if (user.location) {
        setLat(user.location.lat || 28.6250);
        setLng(user.location.lng || 77.2200);
      }
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
        location: { lat, lng },
        languagePreference,
        skills,
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

  const handleSkillChange = (skill: string) => {
    setSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleLocationChange = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto animate-slide-up">
      <div className="mb-6">
        <p className="text-label">{t('volunteer.portal', 'Volunteer Portal')}</p>
        <h1 className="text-heading-xl mt-1">My Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
        {/* Left Column - Personal Info + Skills */}
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <h2 className="text-heading-md border-b border-surface-border pb-2 flex items-center gap-2">
              <UserIcon size={18} className="text-accent" />
              Volunteer Information
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
          </div>

          {/* Skills Checklist card */}
          <div className="card p-5 space-y-3">
            <h2 className="text-heading-md border-b border-surface-border pb-2 flex items-center gap-2">
              <Award size={18} className="text-accent" />
              Specialization Skills
            </h2>
            <p className="text-xs text-text-muted mb-2">
              Select all emergency response capabilities that you have. These help dispatcher teams deploy you to appropriate incident coordinates.
            </p>
            <div className="space-y-2">
              {SKILL_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2.5 text-xs text-text-primary cursor-pointer hover:bg-surface-elevated/20 p-1.5 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={skills.includes(opt.value)}
                    onChange={() => handleSkillChange(opt.value)}
                    className="rounded border-surface-border text-accent focus:ring-accent"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save size={16} />
            {loading ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </div>

        {/* Right Column - Map Location selection */}
        <div className="card p-5 flex flex-col space-y-4">
          <h2 className="text-heading-md border-b border-surface-border pb-2 flex items-center gap-2">
            <MapPin size={18} className="text-accent" />
            Active Standby Coordinates
          </h2>
          <p className="text-xs text-text-secondary">
            Drag the pin or click on the map to set your standby location. Dispatchers use this location to calculate your distance to nearby active emergency alerts.
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-surface-elevated/50 p-2 rounded border border-surface-border/50">
              <span className="text-[10px] text-text-muted block uppercase">Latitude</span>
              <span className="font-mono text-text-primary font-semibold">{lat.toFixed(6)}</span>
            </div>
            <div className="bg-surface-elevated/50 p-2 rounded border border-surface-border/50">
              <span className="text-[10px] text-text-muted block uppercase">Longitude</span>
              <span className="font-mono text-text-primary font-semibold">{lng.toFixed(6)}</span>
            </div>
          </div>

          <div className="flex-1 h-[380px] rounded overflow-hidden border border-surface-border">
            <ProfileMap lat={lat} lng={lng} onLocationChange={handleLocationChange} />
          </div>
        </div>
      </form>
    </div>
  );
}
