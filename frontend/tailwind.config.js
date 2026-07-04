import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  // Per-role chrome colors (Admin=brand, CS=sky2, Advertiser=violet) live in ROLE_META
  // and are applied via computed class strings. Admin's brand-* appears dozens of times
  // so it always survives purge; the sparse CS/Advertiser classes could get dropped if a
  // build ever scans partial source (the Docker stale-bundle gotcha), leaving non-admin
  // role badges/avatars with no background. Safelisting guarantees they ship every build.
  safelist: [
    'bg-brand-600', 'bg-sky2-500', 'bg-violet-600',
    'ring-brand-600', 'ring-sky2-500', 'ring-violet-600',
    'bg-brand-50', 'bg-sky2-50', 'bg-violet-50',
    'text-brand-700', 'text-sky2-600', 'text-violet-700',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#EEF2FF', 100: '#E0E7FF', 200: '#C7D2FE', 300: '#A5B4FC', 400: '#6366F1',
          500: '#3B4FAF', 600: '#2E4191', 700: '#283881', 800: '#1F2C66', 900: '#172148',
        },
        cyan2: {
          50: '#eaf7ff', 100: '#cfeefe', 200: '#a7e0fd', 300: '#74cefb', 400: '#38B6FF',
          500: '#1aa1ee', 600: '#0e83c8', 700: '#0e69a0', 800: '#125883', 900: '#114a6e',
        },
        sky2: {
          50: '#ECFAFF', 100: '#D6F3FF', 300: '#7DD0FF', 400: '#38B6FF', 500: '#1AA1ED', 600: '#0E89CC',
        },
        // Advertiser role chrome. Defined explicitly (matching Tailwind's default violet
        // shades we use) instead of silently borrowing the built-in palette via extend —
        // so it can't vanish if defaults ever change or theme.colors replaces extend.
        violet: {
          50: '#F5F3FF', 100: '#EDE9FE', 600: '#7C3AED', 700: '#6D28D9',
        },
        ink: '#1E293B',
        mute: '#64748B',
        line: '#E2E8F0',
        bg1: '#FFFFFF',
        bg2: '#F7FAFC',
        ok: '#16A34A',
        warn: '#F59E0B',
        bad: '#DC2626',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(15,23,42,.04), 0 1px 3px 0 rgba(15,23,42,.06)',
        pop: 'none', // popups use border only (per QA feedback — no shadow on popups)
      },
      borderRadius: {
        xl2: '1rem',
      },
    },
  },
  plugins: [forms, typography],
};
