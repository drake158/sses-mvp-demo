/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'men-navy': '#1B365D',
        'men-blue': '#0066CC',
        'men-emerald': '#00875A',
        'men-amber': '#D97706',
        'men-red': '#DC2626',
        'men-bg': '#F8FAFC',
      },
      fontFamily: {
        sans: [
          'Inter',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
