/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0A1628",
          900: "#0F1F3A",
          800: "#16294D",
          700: "#1E3A66",
        },
        steel: {
          900: "#1A202C",
          800: "#232B3A",
          700: "#2D3748",
        },
        accent: {
          500: "#E8862E",
          600: "#D2741F",
          400: "#F0A054",
        },
        engineering: {
          500: "#1B9AAA",
          600: "#14808E",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
