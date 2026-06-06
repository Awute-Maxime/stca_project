/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'tcit-green': '#006A4E',
        'tcit-dark': '#004A35',
        'tcit-red': '#D21034',
        'tcit-gold': '#FFDF00'
      }
    }
  },
  plugins: [],
  corePlugins: {
    // Évite conflits avec Ant Design
    preflight: false
  }
}
