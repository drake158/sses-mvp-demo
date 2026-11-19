/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'men-navy': '#1B365D',
        'men-navy-hover': '#132744',
        'men-accent': '#0284C7',
        'men-accent-hover': '#0369A1',
        'men-blue': '#0066CC',
        'men-emerald': '#00875A',
        'men-amber': '#D97706',
        'men-red': '#DC2626',
        'men-bg': '#F8FAFC',
        'gov-border': '#E2E8F0',
        'gov-surface': '#FFFFFF',
        'gov-table-head': '#F1F5F9',
        'gov-muted': '#64748B',
      },
      fontFamily: {
        heading: [
          '"Plus Jakarta Sans"',
          'Inter',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        'gov-card': '0 1px 3px rgba(15, 23, 42, 0.04)',
        'gov-card-hover': '0 8px 20px -4px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
