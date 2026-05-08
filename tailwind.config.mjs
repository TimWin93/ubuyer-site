/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:           '#04091A',
          surface:      '#080F24',
          'surface-2':  '#0C1530',
          border:       '#1A2B4A',
          'border-2':   '#243A60',
          text:         '#E4ECFF',
          muted:        '#6680A8',
          accent:       '#3D8EF8',
          'accent-2':   '#4DD9FF',
          'accent-hover':'#2B7AE8',
          'accent-dim': 'rgba(61,142,248,0.15)',
          'glow':       'rgba(61,142,248,0.3)',
          'glow-2':     'rgba(77,217,255,0.2)',
          'cta':        '#10B981',
          'cta-hover':  '#059669',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card:       '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(26,43,74,0.8)',
        'card-glow':'0 0 24px rgba(61,142,248,0.12), 0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(61,142,248,0.2)',
        btn:        '0 0 20px rgba(61,142,248,0.4), 0 2px 8px rgba(0,0,0,0.4)',
        'btn-hover':'0 0 32px rgba(61,142,248,0.6), 0 4px 16px rgba(0,0,0,0.5)',
        'btn-cta':       '0 0 20px rgba(16,185,129,0.35), 0 2px 8px rgba(0,0,0,0.4)',
        'btn-cta-hover': '0 0 32px rgba(16,185,129,0.55), 0 4px 16px rgba(0,0,0,0.5)',
        inner:      'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      backgroundImage: {
        'hero-radial':    'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(61,142,248,0.15) 0%, transparent 70%)',
        'accent-radial':  'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(61,142,248,0.1) 0%, transparent 70%)',
        'card-gradient':  'linear-gradient(135deg, rgba(12,21,48,0.9) 0%, rgba(8,15,36,0.95) 100%)',
        'glow-border':    'linear-gradient(135deg, rgba(61,142,248,0.3) 0%, rgba(77,217,255,0.1) 100%)',
      },
      animation: {
        'fade-up':    'fadeUp 0.5s ease forwards',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'counter':    'counter 2s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%':       { opacity: '1' },
        },
      },
    },
  },
  safelist: [
    'rotate-45', '-rotate-45',
    'translate-y-2', '-translate-y-2',
    'opacity-0',
  ],
  plugins: [],
};
