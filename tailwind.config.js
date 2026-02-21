/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out',
        fadeOut: 'fadeOut 0.3s ease-in',
        slideDown: 'slideDown 0.4s ease-out',
        slideUp: 'slideUp 0.4s ease-out',
        slideInRight: 'slideInRight 0.4s ease-out',
        slideOutLeft: 'slideOutLeft 0.3s ease-in',
        shake: 'shake 0.4s ease-in-out',
        bounceIn: 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        ripple: 'ripple 0.6s ease-out',
        glow: 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        fadeOut: {
          'from': { opacity: '1' },
          'to': { opacity: '0' },
        },
        slideDown: {
          'from': { 
            opacity: '0',
            transform: 'translateY(-20px)',
          },
          'to': { 
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideUp: {
          'from': { 
            opacity: '0',
            transform: 'translateY(20px)',
          },
          'to': { 
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideInRight: {
          'from': { 
            opacity: '0',
            transform: 'translateX(20px)',
          },
          'to': { 
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        slideOutLeft: {
          'from': { 
            opacity: '1',
            transform: 'translateX(0)',
          },
          'to': { 
            opacity: '0',
            transform: 'translateX(-20px)',
          },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        bounceIn: {
          '0%': { 
            opacity: '0',
            transform: 'scale(0.8)',
          },
          '50%': { opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        ripple: {
          '0%': { 
            transform: 'scale(0)',
            opacity: '1',
          },
          '100%': { 
            transform: 'scale(4)',
            opacity: '0',
          },
        },
        glow: {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgba(30, 58, 95, 0.5)',
          },
          '50%': { 
            boxShadow: '0 0 20px rgba(30, 58, 95, 0.8)',
          },
        },
      },
    },
  },
  plugins: [],
}

