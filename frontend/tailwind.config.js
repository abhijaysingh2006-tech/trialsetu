/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#effaf7',
          100: '#d8f2ea',
          200: '#b3e4d6',
          300: '#80cfbb',
          400: '#4bb39c',
          500: '#2a9781',
          600: '#1d7a69',
          700: '#196256',
          800: '#174f46',
          900: '#15423b',
          950: '#0a2622',
        },
        // Ayurveda-inspired accents: turmeric (haridra) & saffron (kumkuma)
        haldi: { 50: '#fff9eb', 100: '#feefc7', 400: '#f5b83d', 500: '#e69a14', 600: '#c7760e' },
        kumkum: { 500: '#c2410c', 600: '#9a3412' },
      },
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans Devanagari"', 'system-ui', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      boxShadow: { card: '0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)' },
    },
  },
  plugins: [],
};
