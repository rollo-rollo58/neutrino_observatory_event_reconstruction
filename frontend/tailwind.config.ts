import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui'] },
      colors: {
        abyss: '#07121b',
        panel: '#101f2b',
        sea: '#4de0c1',
        signal: '#f7b667',
        muted: '#7895a6',
      },
      boxShadow: { sonar: '0 0 38px rgba(77,224,193,0.09)' },
    },
  },
  plugins: [],
};

export default config;
