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
        sans: ['var(--font-plus-jakarta-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['monospace'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
  corePlugins: {
    preflight: true,
  },
}
