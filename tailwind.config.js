/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#1a1a1a',
        primary: '#6a6a6a', // Cinza médio
        'primary-dark': '#4a4a4a',
        secondary: '#4a4a4a', // Cinza escuro
        accent: '#8a8a8a', // Cinza claro
        text: {
          primary: '#E0E0E0',
          secondary: '#A0A0A0',
        },
      },
      fontFamily: {
        // Pretty, modern geometric font for UI
        poppins: [
          'Poppins',
          'ui-sans-serif',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif'
        ]
      },
      screens: {
        'xs': '475px',
      },
      animation: {
        // Animações removidas para design neutro
      },
      keyframes: {
        // Keyframes removidos para design neutro
      },
    },
  },
  plugins: [],
}
