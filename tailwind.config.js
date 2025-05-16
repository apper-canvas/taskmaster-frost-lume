/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4f46e5',
          light: '#818cf8',
          dark: '#3730a3'
        },
        secondary: {
          DEFAULT: '#ec4899',
          light: '#f472b6',
          dark: '#be185d'
        },
        accent: '#06b6d4',
        surface: {
          50: '#f8fafc',   // Lightest
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',  // Added
          500: '#64748b',  // Added
          600: '#475569',  // Added
          700: '#334155',  // Added
          800: '#1e293b',  // Added
          900: '#0f172a'   // Darkest
        }      
      },
      
      fontFamily: {
        sans: ['Inter', 'Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Roboto', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        normal: 400, medium: 500, semibold: 600, bold: 700
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'neu-light': '5px 5px 15px #d1d9e6, -5px -5px 15px #ffffff',
        'neu-dark': '5px 5px 15px rgba(0, 0, 0, 0.3), -5px -5px 15px rgba(255, 255, 255, 0.05)'
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem'
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, var(--tw-gradient-stops))',
        'gradient-primary-soft': 'linear-gradient(120deg, var(--tw-gradient-stops))',
        'gradient-secondary': 'linear-gradient(150deg, var(--tw-gradient-stops))',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-calendar': 'linear-gradient(to right, var(--tw-gradient-stops))',
        'gradient-calendar-dark': 'linear-gradient(to right, var(--tw-gradient-stops))',
        'gradient-calendar-header': 'linear-gradient(to bottom, var(--tw-gradient-stops))',
        'gradient-card': 'linear-gradient(160deg, var(--tw-gradient-stops))',
        'gradient-calendar-day': 'linear-gradient(to bottom right, var(--tw-gradient-stops))',
        'gradient-stat-card': 'linear-gradient(135deg, var(--tw-gradient-stops))',
        'gradient-stat-primary': 'linear-gradient(120deg, var(--tw-gradient-stops))',
        'gradient-stat-secondary': 'linear-gradient(120deg, var(--tw-gradient-stops))'
      },
      gradientColorStops: theme => ({
        'primary-start': theme('colors.primary.light'),
        'primary-end': theme('colors.primary.dark'),
        'secondary-start': theme('colors.secondary.light'),
        'secondary-end': theme('colors.secondary.dark'),
        'card-start': theme('colors.white'),
        'card-end': theme('colors.surface.50'),
        'card-dark-end': theme('colors.surface.800'),
        'calendar-start': theme('colors.primary.light'),
        'calendar-mid': theme('colors.primary.DEFAULT'),
        'calendar-end': theme('colors.primary.dark'), 
        'calendar-dark-start': theme('colors.surface.700'),
        'calendar-dark-mid': theme('colors.surface.800'),
        'calendar-dark-end': theme('colors.surface.900'),
        'calendar-header-start': theme('colors.primary.light'),
        'calendar-header-end': theme('colors.primary.DEFAULT'),
        'calendar-header-dark-start': theme('colors.surface.700'),
        'calendar-header-dark-end': theme('colors.surface.900'),
        'calendar-day-hover-start': theme('colors.primary.light'),
        'calendar-day-hover-end': theme('colors.primary.DEFAULT'),
        'stat-primary-start': theme('colors.primary.light'),
        'stat-primary-mid': theme('colors.primary.DEFAULT'),
        'stat-primary-end': theme('colors.primary.dark'),
        'stat-green-start': '#4ade80',
        'stat-green-end': '#16a34a',
        'stat-yellow-start': '#facc15',
        'stat-yellow-end': '#ca8a04'
      })
    }
  },
  plugins: [],
  safelist: [
    // Ensure all category color variants are generated
    { pattern: /bg-(blue|green|red|yellow|purple|pink|indigo|teal|orange|gray)-(50|100|200|900)/ },
    { pattern: /border-(blue|green|red|yellow|purple|pink|indigo|teal|orange|gray)-(300|500|700)/ },
    { pattern: /text-(blue|green|red|yellow|purple|pink|indigo|teal|orange|gray)-(300|800)/ },
    { pattern: /dark:bg-(blue|green|red|yellow|purple|pink|indigo|teal|orange|gray)-(900)\/(\d+)/ },
    { pattern: /dark:text-(blue|green|red|yellow|purple|pink|indigo|teal|orange|gray)-(300)/ },
    { pattern: /dark:border-(blue|green|red|yellow|purple|pink|indigo|teal|orange|gray)-(700)/ },
    // Ensure all category pill styles are generated
    { pattern: /category-pill-(blue|green|red|yellow|purple|pink|indigo|teal|orange|gray)/ },
    { pattern: /bg-opacity-(\d+)/ }
  ],
}