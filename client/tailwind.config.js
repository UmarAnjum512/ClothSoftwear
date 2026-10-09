/** @type {import('tailwindcss').Config} */

// HOORIYA ARTS design tokens.
// `indigo` is re-mapped to the brand mulberry scale and `slate` to a softly
// plum-tinted neutral, so every existing utility class (bg-indigo-600,
// text-slate-500 ...) automatically picks up the HOORIYA ARTS identity.
const mulberry = {
  50: '#fbf3f7',
  100: '#f6e3ec',
  200: '#edc6d8',
  300: '#e0a0bd',
  400: '#cd6f98',
  500: '#b04677',
  600: '#8f2a58',
  700: '#74214a',
  800: '#5d1b3d',
  900: '#481632',
  950: '#2c0b1e',
};

const plumNeutral = {
  50: '#faf8f9',
  100: '#f3f0f2',
  200: '#e6e1e4',
  300: '#d1cace',
  400: '#9d949b',
  500: '#70676e',
  600: '#554d54',
  700: '#3e373d',
  800: '#2a252a',
  900: '#1c181c',
  950: '#110e11',
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      colors: {
        brand: mulberry,
        indigo: mulberry,
        slate: plumNeutral,
        gold: {
          50: '#fbf6ea',
          100: '#f5ebcc',
          200: '#ecd699',
          300: '#e1bd66',
          400: '#d4a64a',
          500: '#b8893b',
          600: '#946d2c',
          700: '#735425',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(28, 24, 28, 0.04), 0 1px 3px rgba(28, 24, 28, 0.06)',
        lift: '0 8px 24px -8px rgba(72, 22, 50, 0.18)',
      },
    },
  },
  plugins: [],
}
