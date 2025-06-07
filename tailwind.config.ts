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
        // Background and surfaces
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-secondary": "var(--surface-secondary)",
        "surface-tertiary": "var(--surface-tertiary)",

        // Text colors
        foreground: "var(--foreground)",
        "foreground-secondary": "var(--foreground-secondary)",
        "foreground-tertiary": "var(--foreground-tertiary)",

        // Borders
        border: "var(--border)",
        "border-secondary": "var(--border-secondary)",

        // Port Alberni brand colors
        "pa-primary": {
          DEFAULT: "var(--pa-primary)",
          light: "var(--pa-primary-light)",
          dark: "var(--pa-primary-dark)",
        },
        "pa-secondary": {
          DEFAULT: "var(--pa-secondary)",
          light: "var(--pa-secondary-light)",
          dark: "var(--pa-secondary-dark)",
        },
        "pa-accent": {
          DEFAULT: "var(--pa-accent)",
          light: "var(--pa-accent-light)",
          dark: "var(--pa-accent-dark)",
        },

        // Status colors
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        info: "var(--info)",
      },
      fontFamily: {
        sans: [
          "var(--font-geist-sans)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      animation: {
        "pulse-pa": "pulse-pa 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      boxShadow: {
        glow: "0 0 20px rgba(59, 130, 246, 0.15)",
        "glow-green": "0 0 20px rgba(16, 185, 129, 0.15)",
        "glow-amber": "0 0 20px rgba(245, 158, 11, 0.15)",
      },
      backdropBlur: {
        xs: "2px",
      },
      ringColor: {
        "pa-primary": "var(--pa-primary)",
      },
      ringOffsetColor: {
        background: "var(--background)",
      },
    },
  },
  plugins: [],
};

export default config;
