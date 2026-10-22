import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-cormorant)", "serif"],
        sans: ["var(--font-montserrat)", "sans-serif"],
      },
      colors: {
        aurelle: {
          bg: "#F4EFE6",
          gold: "#C1A87D",
          dark: "#131313",
          text: "#332F2A",
        },
      },
    },
  },
  plugins: [],
};

export default config;
