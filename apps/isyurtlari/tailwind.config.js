/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'gold-500': '#d4af37',
        'navy-800': '#1a2a4e',
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-space-grotesk)', 'ui-serif', 'serif'],
        mono: ['monospace'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'base': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'xl': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        '2xl': ['24px', { lineHeight: '32px', fontWeight: '600' }],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
  corePlugins: {
    preflight: true,
  },
}
