/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#10001F',
        primary: '#8A2BE2', // Roxo neon
        'primary-dark': '#6A1EAD',
        secondary: '#FF00FF', // Magenta neon
        accent: '#00FFFF', // Ciano neon
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
        'float': 'float 15s infinite ease-in-out',
        'glow-pulse': 'glow-pulse 3s infinite ease-in-out',
        'gradient': 'gradient-rotate 6s ease infinite',
        'bounce-subtle': 'bounce-subtle 2s infinite ease-in-out',
        'scale-pulse': 'scale-pulse 3s infinite ease-in-out',
        'neon-border': 'neon-border 4s infinite ease-in-out',
        'shimmer': 'shimmer 3s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0) scale(1)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '50%': { transform: 'translateY(-100vh) translateX(20px) scale(1.5)' },
        },
        'glow-pulse': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(138, 43, 226, 0.4), 0 0 40px rgba(138, 43, 226, 0.2), 0 0 60px rgba(138, 43, 226, 0.1)' 
          },
          '50%': { 
            boxShadow: '0 0 30px rgba(138, 43, 226, 0.6), 0 0 60px rgba(138, 43, 226, 0.4), 0 0 90px rgba(138, 43, 226, 0.2)' 
          },
        },
        'gradient-rotate': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'scale-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'neon-border': {
          '0%, 100%': { 
            borderColor: 'rgba(138, 43, 226, 0.5)',
            boxShadow: '0 0 10px rgba(138, 43, 226, 0.3), inset 0 0 10px rgba(138, 43, 226, 0.2)' 
          },
          '50%': { 
            borderColor: 'rgba(0, 255, 255, 0.8)',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.5), inset 0 0 20px rgba(0, 255, 255, 0.3)' 
          },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}
