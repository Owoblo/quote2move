module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D1321',
          dark: '#0D1321',
        },
        accent: {
          DEFAULT: '#00C2FF',
          light: '#33D1FF',
          dark: '#0099CC',
        },
        highlight: {
          DEFAULT: '#FF6B3D',
          light: '#FF8A66',
          dark: '#E55A2B',
        },
        background: {
          DEFAULT: '#F8F9FB',
          dark: '#0D1321',
        },
      },
      fontFamily: {
        logo: ['Poppins', 'sans-serif'],
        body: ['Inter', 'Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

