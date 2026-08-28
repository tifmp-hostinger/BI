import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Outfit',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
        serif: ['"Noto Serif"', 'Georgia', '"Times New Roman"', 'serif'],
      },
      colors: {
        // TEMA ESCURO "SaaS" (branch visual-saas): os NOMES dos tokens não
        // mudam — só os valores. `ink` vira texto claro, `paper` vira
        // superfície escura, e todo componente que já falava em tokens
        // atravessa a reforma sem edição.
        canvas: 'var(--fmp-cream)',
        // Cartões: bg-white foi trocado por bg-card nos componentes — não dá
        // para reapontar `white`, porque text-white (botões) e white/10
        // (overlays do menu) precisam continuar brancos de verdade.
        card: '#17151A',
        fmp: {
          DEFAULT: '#EE2A42',
          light: '#43222A',
          dark: '#FF3B55',
          pressed: '#C81F35',
          muted: 'rgba(238,42,66,0.14)',
          50: '#3A1F26',
          100: '#43222A',
          200: '#552833',
          300: '#F08E9A',
          400: '#EE2A42',
          500: '#EE2A42',
          600: '#FF3B55',
          700: '#B81E32',
          800: '#9A1B2A',
          900: '#7B1621',
        },
        ink: {
          DEFAULT: '#F2EFEA',
          2: '#C9C5BE',
          3: '#97929B',
        },
        cream: '#EFEEEA',
        paper: '#1D1A20',
        sand: '#BFBAA4',
        // *-light são FUNDOS de chip (agora tingidos escuros) e *-dark são o
        // TEXTO sobre esses chips (agora claros) — os papéis se mantêm.
        success: {
          DEFAULT: '#2ECC71',
          light: '#16301F',
          dark: '#7FD8A4',
        },
        warning: {
          DEFAULT: '#F0A32E',
          light: '#33270E',
          dark: '#E8B95C',
        },
        danger: {
          DEFAULT: '#FF4D63',
          light: '#43222A',
          dark: '#FF8B9A',
        },
        info: {
          DEFAULT: '#38BDF8',
          light: '#122C3D',
          dark: '#7CC5EE',
        },
        dark: {
          DEFAULT: '#000000',
          2: '#0C0B0E',
          3: '#26232B',
        },
        line: {
          DEFAULT: '#2B2830',
          2: '#3A3641',
        },
      },
      fontSize: {
        '2xs': ['0.75rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        // Raios de PRODUTO: os 16/28/44px institucionais liam "brochura";
        // SaaS moderno trabalha em 6-14px, com pill só para chips.
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        pill: '999px',
      },
      boxShadow: {
        // Elevação escura: um fio de luz no topo (inset) + sombra profunda —
        // é o que separa cartão de fundo quando ambos são escuros.
        card: 'inset 0 1px 0 rgba(255,255,255,.04), 0 8px 24px rgba(0,0,0,.45)',
        'card-hover':
          'inset 0 1px 0 rgba(255,255,255,.06), 0 12px 32px rgba(0,0,0,.55)',
        'glow': '0 0 20px rgba(238,42,66,.35)',
        soft: 'inset 0 1px 0 rgba(255,255,255,.04), 0 8px 24px rgba(0,0,0,.45)',
        md: '0 12px 32px rgba(0,0,0,.5)',
        lg: '0 24px 56px rgba(0,0,0,.6)',
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
  plugins: [containerQueries],
};
