/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontSize: {
        // Kitchen-friendly sizes
        'kpi': ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }],
        'big': ['2.5rem', { lineHeight: '3rem', fontWeight: '800' }],
      },
    },
  },
  plugins: [],
};
