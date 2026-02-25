import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#080B12',
        surface: '#0D1117',
        elevated: '#161B24',
        border: '#1E2733',
        'text-primary': '#E8EDF5',
        'text-secondary': '#8B9BB4',
        'text-muted': '#4A5568',
        cyan: {
          DEFAULT: '#00D4FF',
          dim: 'rgba(0, 212, 255, 0.13)',
        },
        threat: {
          critical: '#FF3B5C',
          high: '#FF6B35',
          medium: '#FFB800',
          low: '#00D4FF',
          safe: '#00FF88',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        heading: ['DM Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '6px',
        input: '4px',
        badge: '2px',
      },
      spacing: {
        '18': '4.5rem',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 212, 255, 0.15)',
        'glow-red': '0 0 20px rgba(255, 59, 92, 0.2)',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.5)', opacity: '0.5' },
        },
        'radar-pulse': {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '0.4',
            boxShadow: '0 0 0 0 rgba(0, 212, 255, 0.4)',
          },
          '50%': {
            transform: 'scale(1.1)',
            opacity: '0.8',
            boxShadow: '0 0 0 20px rgba(0, 212, 255, 0)',
          },
        },
        'radar-dot': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.3)', opacity: '0.6' },
        },
      },
      animation: {
        'live-pulse': 'pulse 2s ease-in-out infinite',
        'radar-pulse': 'radar-pulse 2s ease-in-out infinite',
        'radar-dot': 'radar-dot 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
