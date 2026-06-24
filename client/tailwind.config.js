/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Mapped to CSS variables (RGB channels) for theming + alpha support.
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
        },
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        content: {
          DEFAULT: 'rgb(var(--color-content) / <alpha-value>)',
          muted: 'rgb(var(--color-content-muted) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.40)',
        glow: '0 0 24px rgba(124, 58, 237, 0.35)',
      },
      backdropBlur: {
        glass: '16px',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #7C3AED, #14B8A6)',
        'glow-radial': 'radial-gradient(circle at 50% 0%, rgba(124,58,237,0.20), transparent 60%)',
        // Purple → Cyan → Accent loop used for animated borders/buttons.
        'neon-gradient':
          'linear-gradient(120deg, #8B5CF6, #06B6D4, #A855F7, #8B5CF6)',
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'ambient-pulse': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.06)' },
        },
      },
      animation: {
        'gradient-shift': 'gradient-shift 5s ease infinite',
        'ambient-pulse': 'ambient-pulse 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
