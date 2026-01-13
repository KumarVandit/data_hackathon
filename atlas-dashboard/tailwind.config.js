/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./frontend/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        atlas: {
          primary: '#6366f1', // indigo-500
          secondary: '#8b5cf6', // violet-500
          accent: '#ec4899', // pink-500
          dark: '#1e293b', // slate-800
          darker: '#0f172a', // slate-900
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
