/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coastal: {
          50: '#F5F8F6',
          100: '#E8F1EC',
          200: '#D1E3D9',
          300: '#A7C6B5',
          400: '#75A58E',
          500: '#4E866F',
          600: '#3A6B56',
          700: '#2D5545',
          800: '#224135',
          900: '#193027',
        },
        seafoam: {
          50: '#F0FAF5',
          100: '#D8F3DC',
          200: '#B7E4C7',
          300: '#95D5B2',
          400: '#74C69D',
          500: '#52B788',
          600: '#40916C',
          700: '#2D6A4F',
          800: '#1B4332',
          900: '#081C15',
        },
        beach: {
          50: '#FCFBF8',
          100: '#FAF6F0',
          200: '#F3EFE6',
          300: '#E9E3D5',
          400: '#DCD4C2',
          500: '#C7BC9F',
        },
        ocean: {
          50: '#F2F7F9',
          100: '#E1EDF1',
          200: '#C8D8E4',
          300: '#9BB8CD',
          400: '#52AB98',
          500: '#2B6777',
        },
        coral: {
          500: '#E76F51',
          600: '#D45D3F',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
