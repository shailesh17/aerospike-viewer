/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html", // Ensure it scans the public folder if index.html is there
    "./public/index.html", // Ensure it scans the public folder if index.html is there
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "media", // or 'class'
  theme: {
    extend: {},
  },
  plugins: [],
};