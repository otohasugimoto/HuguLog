/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'baby-blue': '#E0F2F1', // Teal-50
        'baby-pink': '#FCE4EC', // Pink-50
        'baby-yellow': '#FFF9C4', // Yellow-50
        'baby-green': '#F1F8E9', // LightGreen-50
        'baby-purple': '#F3E5F5', // Purple-50
        'baby-text': '#455A64', // BlueGray-700
      }
    },
  },
  plugins: [],
}
