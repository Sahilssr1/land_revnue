/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0B2447', 800: '#0B2447', 900: '#071A33', 700: '#14356B' },
        teal: { DEFAULT: '#0D9488', 600: '#0D9488', 500: '#14B8A6' },
      },
    },
  },
  plugins: [],
};
