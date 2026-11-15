module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        ink: '#17243a',
        canvas: '#f5f7fb',
        brand: {
          50: '#eef3ff',
          100: '#dce6ff',
          500: '#4969e8',
          600: '#3855cc',
          700: '#2d45a8'
        }
      },
      boxShadow: {
        card: '0 12px 35px rgba(23, 36, 58, 0.07)',
        float: '0 24px 70px rgba(14, 24, 48, 0.22)'
      }
    }
  },
  plugins: []
};
