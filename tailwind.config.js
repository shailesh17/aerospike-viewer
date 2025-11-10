/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/index.html", // Ensure it scans the public folder if index.html is there
    "./public/index.html", // Ensure it scans the public folder if index.html is there
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "media", // or 'class'
  theme: {
    extend: {},
  },
  plugins: [],
};