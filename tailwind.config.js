/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      colors: {
        base: '#F4F5F7',
        fmp: {
          DEFAULT: '#2E5AAC',
          light: '#4A78D1',
          dark: '#1E3F80',
          muted: '#E7EEFB',
          50: '#F3F7FE',
          100: '#E7EEFB',
          200: '#C7D8F4',
          300: '#9FBAE9',
          400: '#6E96DA',
          500: '#4A78D1',
          600: '#2E5AAC',
          700: '#24488C',
          800: '#1E3F80',
          900: '#173164',
        },
        success: {
          DEFAULT: '#16A34A',
          light: '#DCFCE7',
          dark: '#166534',
        },
        warning: {
          DEFAULT: '#D97706',
          light: '#FEF3C7',
          dark: '#92400E',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
          dark: '#991B1B',
        },
        info: {
          DEFAULT: '#0EA5E9',
          light: '#E0F2FE',
          dark: '#075985',
        },
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(15,23,42,0.04), 0 4px 12px -2px rgba(15,23,42,0.06)',
        'card-hover':
          '0 4px 8px -2px rgba(15,23,42,0.08), 0 12px 24px -8px rgba(15,23,42,0.12)',
        glow: '0 10px 30px -10px rgba(46,90,172,0.55)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-right': {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.6' },
          '80%,100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-right': 'slide-right 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pop-in': 'pop-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s linear infinite',
        'pulse-ring': 'pulse-ring 1.8s ease-out infinite',
      },
    },
  },
  plugins: [],
};
