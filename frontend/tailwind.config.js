/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        telegram: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#24a1de',
          600: '#0088cc',
          700: '#0077b5',
          800: '#005b8a',
        },
      },
    },
  },
  plugins: [],
}
