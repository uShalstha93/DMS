/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#16222E', soft: '#223445', line: '#2E4256' },
        paper: '#F4F6F5',
        rule: '#D9DFDC',
        ledger: { DEFAULT: '#0E7C66', dark: '#0A5F4E', tint: '#E3F2EE' },
        stamp: { DEFAULT: '#B3261E', tint: '#FBEAE8' },
        amber: { DEFAULT: '#A86A12', tint: '#FAF0DC' },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        serif: ['"IBM Plex Serif"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
