/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-on-dark-bg': 'var(--text-on-dark-bg)',
        'bg-content': 'var(--bg-content)',
        'card-bg': 'var(--card-bg)', // Added for card backgrounds
      },
      backgroundImage: {
        'main-gradient': 'var(--main-gradient)',
        'sidebar-gradient': 'var(--sidebar-gradient)',
        'button-gradient': 'var(--button-gradient)', /* Default pink button */
        'accent-pink-gradient': 'var(--accent-pink-gradient)',
        'accent-blue-purple-gradient': 'var(--accent-blue-purple-gradient)',
        'accent-orange-yellow-gradient': 'var(--accent-orange-yellow-gradient)',
      }
    },
  },
  plugins: [],
};
