import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Keyboard,
  Laptop,
  LayoutDashboard,
  MoonStar,
  Palette,
  Settings2,
  ShieldCheck,
  Sparkles,
  SunMedium,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

const THEME_STORAGE_KEY = 'disaster_theme_preference_v1';

const themeOptions = [
  {
    value: 'light',
    label: 'Light',
    description: 'Bright surfaces with crisp contrast for daytime use.',
    icon: SunMedium,
  },
  {
    value: 'system',
    label: 'System',
    description: 'Automatically follow the device appearance setting.',
    icon: Laptop,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Low-light friendly view for longer admin sessions.',
    icon: MoonStar,
  },
];

const convenienceFeatures = [
  {
    icon: Keyboard,
    title: 'Keyboard shortcuts',
    description: 'Move faster through admin screens with shortcut-friendly navigation cues.',
  },
  {
    icon: Bell,
    title: 'Focused alerts',
    description: 'Keep critical updates visible without turning the workspace noisy.',
  },
  {
    icon: LayoutDashboard,
    title: 'Quick dashboard access',
    description: 'Jump back to the main overview with one click from anywhere in the admin area.',
  },
  {
    icon: Sparkles,
    title: 'Helpful guidance',
    description: 'Clear helper text and visual hints make the interface easier to scan at a glance.',
  },
];

const getStoredTheme = () => {
  if (typeof window === 'undefined') return 'system';

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return ['light', 'dark', 'system'].includes(stored) ? stored : 'system';
};

const resolveTheme = (theme) => {
  if (theme !== 'system' || typeof window === 'undefined') {
    return theme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme) => {
  if (typeof document === 'undefined') return;

  const resolvedTheme = resolveTheme(theme);
  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  document.documentElement.style.colorScheme = resolvedTheme;
};

export default function AdminSettings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [themeMode, setThemeMode] = useState('system');

  useEffect(() => {
    const initialTheme = getStoredTheme();
    setThemeMode(initialTheme);
    applyTheme(initialTheme);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    }

    applyTheme(themeMode);

    if (typeof window === 'undefined' || themeMode !== 'system') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('system');

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [themeMode]);

  const activeTheme = useMemo(
    () => themeOptions.find((option) => option.value === themeMode) ?? themeOptions[1],
    [themeMode]
  );
  const ActiveThemeIcon = activeTheme.icon;

  if (!isAdmin) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-6 rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Access denied</h1>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Only administrators can open settings for the management area.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Settings2 className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              Admin settings
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Customize the admin workspace with appearance controls and helpful shortcuts built for day-to-day use.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Appearance</h2>
                <p className="text-sm text-slate-500">
                  Choose a theme that feels comfortable for long admin sessions and quick reviews.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const active = themeMode === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setThemeMode(option.value)}
                    aria-pressed={active}
                    className={`flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition ${
                      active
                        ? 'border-blue-300 bg-blue-50 text-blue-900 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        active ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{option.label}</p>
                      <p className="mt-1 text-xs leading-5 text-current/70">{option.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <ActiveThemeIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current mode</p>
                <h2 className="text-lg font-semibold text-slate-900">{activeTheme.label}</h2>
                <p className="mt-1 text-sm text-slate-500">{activeTheme.description}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-900">Why it helps</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  A personalized theme reduces eye strain and keeps dashboards readable in bright or low-light spaces.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-900">Tip</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Switching to <span className="font-semibold">{activeTheme.label.toLowerCase()}</span> updates the whole
                  app instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {convenienceFeatures.map(({ icon: Icon, title, description }) => (
          <article key={title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Icon className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                <p className="text-sm leading-6 text-slate-500">{description}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Admin convenience</h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              This area can later host role defaults, notification preferences, or quick-access tools without changing
              the route structure.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {['Theme sync', 'Shortcut hints', 'Icon-led navigation', 'Comfort mode'].map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
