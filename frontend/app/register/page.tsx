'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Shield, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

const SKILL_OPTIONS = ['medical', 'search & rescue', 'logistics', 'transport', 'general'];

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-pulse-subtle text-text-secondary">Loading...</div></div>}>
      <RegisterPageInner />
    </Suspense>
  );
}

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const role = searchParams.get('role') || 'citizen';

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    skills: [] as string[],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleSkill = (skill: string) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role,
        skills: role === 'volunteer' ? form.skills : [],
      });
      router.push(`/${role}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleLabels: Record<string, string> = {
    citizen: 'Citizen',
    volunteer: 'Volunteer',
    admin: 'Administrator',
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-surface-border">
        <button onClick={() => router.push('/')} className="text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-accent flex items-center justify-center">
            <Shield size={14} className="text-surface-primary" />
          </div>
          <span className="text-heading-md text-text-primary tracking-wide">Aasha</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <p className="text-label text-center mb-1">
            {roleLabels[role] || 'User'} Registration
          </p>
          <h1 className="text-heading-lg text-center mb-6">Create Account</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="badge-critical p-3 rounded text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="text-label block mb-1.5">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                className="input-field"
                placeholder="Your full name"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="text-label block mb-1.5">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="input-field"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="text-label block mb-1.5">Phone (optional)</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                className="input-field"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-label block mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  className="input-field pr-10"
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="text-label block mb-1.5">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="input-field"
                placeholder="Repeat password"
                required
              />
            </div>

            {/* Volunteer skill tags */}
            {role === 'volunteer' && (
              <div>
                <label className="text-label block mb-2">Specializations</label>
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors ${
                        form.skills.includes(skill)
                          ? 'bg-accent text-surface-primary'
                          : 'bg-surface-elevated text-text-secondary hover:text-text-primary border border-surface-border'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-text-secondary text-sm text-center mt-6">
            Already have an account?{' '}
            <Link href={`/login?role=${role}`} className="text-accent hover:text-accent-hover font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
