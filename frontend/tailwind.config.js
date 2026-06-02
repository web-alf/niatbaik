/** @type {import('tailwindcss').Config} */
// Ported from the inline `tailwind.config` that used to live in index.html
// (cdn.tailwindcss.com runtime). Static build now generates app.css.
module.exports = {
  content: ['./index.html', './src/**/*.jsx'],
  darkMode: 'class',
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
        pop: '0 12px 32px -8px rgba(15,23,42,.18), 0 4px 12px -2px rgba(15,23,42,.08)',
      },
      borderRadius: {
        xl2: '1rem',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
