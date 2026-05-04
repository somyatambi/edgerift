/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0f1c', // Deep Navy/Black
        surface: '#121829', // Slightly lighter for cards
        primary: '#00ffc8', // Success Green
        accent: '#3b82f6', // Chart Blue
        textMain: '#f8fafc',
        textMuted: '#94a3b8'
      },
    },
  },
  plugins: [],
}