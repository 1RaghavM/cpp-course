import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "hsl(var(--bg-base))",
        surface: "hsl(var(--bg-surface))",
        elevated: "hsl(var(--bg-elevated))",
        hover: "hsl(var(--bg-hover))",
        border: "hsl(var(--border))",
        "border-subtle": "hsl(var(--border-subtle))",
        primary: "hsl(var(--text-primary))",
        secondary: "hsl(var(--text-secondary))",
        muted: "hsl(var(--text-muted))",
        accent: "hsl(var(--accent))",
        "accent-hover": "hsl(var(--accent-hover))",
        success: "hsl(var(--success))",
        error: "hsl(var(--error))",
        warning: "hsl(var(--warning))",
      },
      backgroundColor: {
        base: "hsl(var(--bg-base))",
        surface: "hsl(var(--bg-surface))",
        elevated: "hsl(var(--bg-elevated))",
        hover: "hsl(var(--bg-hover))",
      },
      textColor: {
        primary: "hsl(var(--text-primary))",
        secondary: "hsl(var(--text-secondary))",
        muted: "hsl(var(--text-muted))",
      },
      borderColor: {
        DEFAULT: "hsl(var(--border))",
        subtle: "hsl(var(--border-subtle))",
      },
      fontFamily: {
        sans: [
          "var(--font-display)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "SF Mono", "Monaco", "monospace"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
