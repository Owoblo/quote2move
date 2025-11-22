module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
        },
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        'card-bg': 'var(--color-card-bg)',
        chip: {
          bg: 'var(--color-chip-bg)',
          text: 'var(--color-chip-text)',
          border: 'var(--color-chip-border)',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        logo: ['Plus Jakarta Sans', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.875rem', { lineHeight: '1.25rem' }],
        sm: ['0.9375rem', { lineHeight: '1.5rem' }],
        base: ['1rem', { lineHeight: '1.75rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.5rem', { lineHeight: '1.2' }],
        '2xl': ['2.25rem', { lineHeight: '1.2' }],
        'h1': ['36px', { lineHeight: '1.2', fontWeight: '700' }],
        'h2': ['16px', { lineHeight: '1.5', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }],
        'h3': ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'meta': ['14px', { lineHeight: '1.6' }],
      },
      maxWidth: {
        'container': '900px',
      },
      borderRadius: {
        'DEFAULT': '12px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        'card': '24px',
      },
      boxShadow: {
        'card': '0 12px 40px rgba(15, 23, 42, 0.08)',
        'card-hover': '0 16px 48px rgba(15, 23, 42, 0.12)',
      },
      spacing: {
        'section': '40px',
        'section-lg': '48px',
      },
    },
  },
  plugins: [],
}
