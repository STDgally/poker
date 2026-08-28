import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        felt: '#0b4d3a',
        feltDark: '#083a2b',
      },
    },
  },
  plugins: [],
};

export default config;
