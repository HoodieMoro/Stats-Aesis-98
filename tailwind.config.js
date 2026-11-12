/** @type {import('tailwindcss').Config} */
export default {
  content: { relative: true, files: ['./index.html', './src/**/*.{ts,tsx}'] },
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'] },
      colors: {
        ink: {
          50: '#f7f7f8', 100: '#efeff1', 200: '#e2e2e6', 300: '#cbcbd1', 400: '#9c9ca5',
          500: '#71717a', 600: '#52525b', 700: '#3a3a40', 800: '#26262b', 900: '#18181b', 950: '#0e0e10',
        },
        ball: { 50: '#fff7ed', 100: '#ffedd5', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c' },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16,16,20,.04), 0 4px 16px rgba(16,16,20,.06)',
        lift: '0 2px 6px rgba(16,16,20,.06), 0 18px 40px rgba(16,16,20,.10)',
      },
    },
  },
  plugins: [],
};
