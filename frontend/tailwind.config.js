/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef3fa', 100: '#d9e4f2', 200: '#b3c9e4', 300: '#84a6d1',
          400: '#4d7ab8', 500: '#2c5a9c', 600: '#1a437f', 700: '#14356b',
          DEFAULT: '#0b2447', 800: '#0b2447', 900: '#071a33', 950: '#040f1e',
        },
        teal: {
          50: '#effaf8', 100: '#d7f2ee', 200: '#b0e4dc', 300: '#7ed0c4',
          400: '#4cb5a8', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e',
          DEFAULT: '#0d9488',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-system', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(11, 36, 71, 0.06), 0 4px 16px rgba(11, 36, 71, 0.06)',
        glass: '0 8px 30px rgba(11, 36, 71, 0.10)',
        lift: '0 2px 4px rgba(11, 36, 71, 0.06), 0 12px 28px rgba(11, 36, 71, 0.12)',
      },
      borderRadius: { '4xl': '2rem' },
      keyframes: {
        pageIn: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        modalIn: { '0%': { opacity: '0', transform: 'translateY(10px) scale(0.97)' }, '100%': { opacity: '1', transform: 'translateY(0) scale(1)' } },
        toastIn: { '0%': { opacity: '0', transform: 'translateX(12px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
      },
      animation: {
        'page-in': 'pageIn 0.35s ease-out both',
        'modal-in': 'modalIn 0.25s ease-out both',
        'toast-in': 'toastIn 0.25s ease-out both',
        shimmer: 'shimmer 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
