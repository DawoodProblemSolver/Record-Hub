import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        present: {
          light: "#ecfdf5",
          border: "#10b981",
          text: "#065f46",
          badge: "#34d399",
        },
        absent: {
          light: "#fef2f2",
          border: "#ef4444",
          text: "#991b1b",
          badge: "#f87171",
        }
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
        glow: "0 0 20px -3px rgba(99, 102, 241, 0.25)",
        glowGreen: "0 0 20px -3px rgba(16, 185, 129, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
