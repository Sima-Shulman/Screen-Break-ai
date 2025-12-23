/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./popup/index.html",
    "./popup/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}