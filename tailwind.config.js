/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        inspector: {
          bg: '#1e1e2e',
          surface: '#282840',
          border: '#3b3b5c',
          text: '#cdd6f4',
          muted: '#6c7086',
          accent: '#89b4fa',
          success: '#a6e3a1',
          warning: '#f9e2af',
          error: '#f38ba8',
        },
      },
      fontSize: {
        '2xs': '0.625rem',
      },
    },
  },
  plugins: [],
};
