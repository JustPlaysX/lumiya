import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Türkis/Cyan-Akzent für Lumiya
        lumiya: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // Dunkle Flächen (Slate/Navy)
        ink: {
          900: '#0a0f1c',
          850: '#0d1424',
          800: '#111a2e',
          700: '#16223a',
          600: '#1e2d49',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(34, 211, 238, 0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
