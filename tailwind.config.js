/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/index.html', './app/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        sunken: 'rgb(var(--sunken) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        'line-strong': 'rgb(var(--line-strong) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-2': 'rgb(var(--ink-2) / <alpha-value>)',
        'ink-3': 'rgb(var(--ink-3) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-on': 'rgb(var(--accent-on) / <alpha-value>)',
        heat: 'rgb(var(--heat) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"Segoe UI Variable Text"',
          'system-ui',
          'Roboto',
          '"Helvetica Neue"',
          'sans-serif',
        ],
        display: ['Fraunces', 'Georgia', '"Times New Roman"', 'serif'],
      },
      fontSize: {
        // size, { line-height, letter-spacing }
        micro: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.06em' }],
        caption: ['0.75rem', { lineHeight: '1.0625rem', letterSpacing: '0.01em' }],
        footnote: ['0.8125rem', { lineHeight: '1.1875rem', letterSpacing: '0.005em' }],
        body: ['0.9375rem', { lineHeight: '1.45rem', letterSpacing: '0' }],
        callout: ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.005em' }],
        title3: ['1.1875rem', { lineHeight: '1.5rem', letterSpacing: '-0.014em' }],
        title2: ['1.4375rem', { lineHeight: '1.75rem', letterSpacing: '-0.02em' }],
        title1: ['1.75rem', { lineHeight: '2rem', letterSpacing: '-0.024em' }],
        display1: ['2.25rem', { lineHeight: '2.375rem', letterSpacing: '-0.03em' }],
        display2: ['2.75rem', { lineHeight: '2.75rem', letterSpacing: '-0.034em' }],
      },
      borderRadius: {
        xs: '6px',
        sm: '9px',
        DEFAULT: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '26px',
      },
      spacing: {
        gutter: '20px',
        18: '4.5rem',
      },
      boxShadow: {
        // warm, tinted, single light source from above
        raise: '0 1px 2px rgb(var(--shadow) / 0.05), 0 6px 20px -12px rgb(var(--shadow) / 0.28)',
        lift: '0 2px 6px rgb(var(--shadow) / 0.06), 0 18px 40px -20px rgb(var(--shadow) / 0.4)',
        sheet: '0 -2px 8px rgb(var(--shadow) / 0.05), 0 -24px 60px -24px rgb(var(--shadow) / 0.45)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.23, 1, 0.32, 1)',
        'in-out': 'cubic-bezier(0.77, 0, 0.175, 1)',
        drawer: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
}
