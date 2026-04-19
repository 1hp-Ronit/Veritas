/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: '#f8f9fa',
        surface: '#ffffff',
        elevated: '#ffffff',
        border: '#dadce0',
        accent: '#1a73e8',
        brandAmber: '#fbbc04',
        brandBlue: '#1a73e8',
        brandRed: '#ea4335',
        brandGreen: '#34a853',
        textPrimary: '#202124',
        textSecondary: '#5f6368',
        textMuted: '#70757a',
        inputBg: '#ffffff',
      },
      fontFamily: {
        sans: ['"Google Sans"', 'Roboto', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Google Sans Mono"', 'monospace'],
      },
      borderRadius: {
        'sm': '0.375rem',
        DEFAULT: '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
        DEFAULT: '0 1px 2px 0 rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)',
        'md': '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
        'lg': '0 2px 3px 0 rgba(60,64,67,0.3), 0 6px 10px 4px rgba(60,64,67,0.15)',
      }
    },
  },
  plugins: [],
}
