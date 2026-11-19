/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'men-navy': '#1E3A8A',
        'men-navy-hover': '#172E6E',
        'men-accent': '#0284C7',
        'men-accent-hover': '#0369A1',
        'men-bg': '#FAFAFA',
        'gov-border': '#E5E7EB',
        'gov-surface': '#FFFFFF',
        'gov-ink': '#0F172A',
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
    },
  },
  plugins: [],
};
