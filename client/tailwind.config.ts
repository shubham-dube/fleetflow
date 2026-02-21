import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class' as const,
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        // Base palette
        bg: {
          base: '#0A0C12',
          surface: '#10131C',
          card: '#151A26',
          elevated: '#1C2132',
          border: '#232840',
          hover: '#1E2438',
        },
        // Accent
        cyan: {
          50: '#E0FBFF',
          100: '#B3F5FF',
          200: '#80EEFF',
          300: '#4DE6FF',
          400: '#1ADFFF',
          500: '#00D4FF',
          600: '#00A8CC',
          700: '#007A99',
          800: '#004D66',
          900: '#001F33',
        },
        // Status colors
        status: {
          available: '#10B981',
          onTrip: '#3B82F6',
          inShop: '#F59E0B',
          retired: '#EF4444',
          draft: '#6B7280',
          completed: '#8B5CF6',
          dispatched: '#3B82F6',
          inTransit: '#06B6D4',
          cancelled: '#EF4444',
          onDuty: '#10B981',
          offDuty: '#6B7280',
          suspended: '#EF4444',
          valid: '#10B981',
          expiringSoon: '#F59E0B',
          expired: '#EF4444',
        },
        // Text
        text: {
          primary: '#F0F4FF',
          secondary: '#8A94B0',
          muted: '#4A5272',
          accent: '#00D4FF',
        },
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 0h1v40H0zM40 0h1v40h-1zM0 0h40v1H0zM0 40h40v1H0z' fill='%23232840' fill-opacity='0.4'/%3E%3C/svg%3E\")",
        'radial-glow': 'radial-gradient(ellipse at top left, rgba(0,212,255,0.08) 0%, transparent 60%)',
      },
      borderRadius: {
        lg: '0.625rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.25s ease-out',
        shimmer: 'shimmer 2s infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        glow: '0 0 20px rgba(0,212,255,0.15)',
        'glow-sm': '0 0 10px rgba(0,212,255,0.1)',
        card: '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config