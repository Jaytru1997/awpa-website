/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.{ejs}",
    "./public/css/**/*.{css,scss}",
    "./public/js/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        red: {
          900: "#F03938",
          800: "#F45B5C",
          600: "#F89E9F",
          400: "#FBCBCB",
          200: "#FDE9E9",
        },
        blue: {
          900: "#0147B7",
          800: "#2569D1",
          600: "#689EEE",
          400: "#B2CCF8",
          200: "#E1ECFE",
        },
        "light-blue": {
          900: "#079FCE",
          800: "#30B6DA",
          600: "#7DDAED",
          400: "#B9ECF7",
          200: "#E3F8FD",
        },
        "dark-blue": {
          900: "#121F41",
          800: "#2D3A63",
          600: "#6874A0",
          400: "#A9B0D1",
          200: "#E3E6F4",
        },
        grey: {
          900: "#2B2B2B",
          800: "#505050",
          600: "#7A7A7A",
          400: "#B5B5B5",
          200: "#F5F5F5",
        },
        light: "#F5F5F5",
        dark: "#2B2B2B",
        white: "#FFFFFF",
        black: "#000000",
      },
      fontFamily: {
        roboto: ["Roboto Condensed", "sans-serif"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
      },
      spacing: {
        72: "18rem",
        84: "21rem",
        96: "24rem",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        soft: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        deep: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
      screens: {
        xs: "475px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "2rem",
          lg: "4rem",
          xl: "5rem",
          "2xl": "6rem",
        },
      },
      typography: {
        DEFAULT: {
          css: {
            color: "#2B2B2B",
            a: {
              color: "#0147B7",
              "&:hover": {
                color: "#2569D1",
              },
            },
            h1: {
              fontWeight: "700",
              color: "#121F41",
            },
            h2: {
              fontWeight: "600",
              color: "#2D3A63",
            },
            h3: {
              fontWeight: "600",
              color: "#2D3A63",
            },
            "h4,h5,h6": {
              fontWeight: "600",
              color: "#2D3A63",
            },
          },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
  darkMode: "class",
};
