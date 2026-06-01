import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        hover: "var(--bg-hover)",
        border: "var(--border)",
        "border-subtle": "var(--border-subtle)",
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        muted: "var(--text-muted)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-fg": "var(--accent-fg)",
        success: "var(--success)",
        error: "var(--error)",
        warning: "var(--warning)",
        steel: "var(--slate)",
        "glass-fill": "var(--glass-fill)",
        "glass-fill-hi": "var(--glass-fill-hi)",
        "glass-border": "var(--glass-border)",
        brand: "var(--brand)",
        "brand-bright": "var(--brand-bright)",
        "accent-cyan": "var(--accent-cyan)",
        "node-locked": "var(--node-locked)",
        "node-active": "var(--node-active)",
        "node-complete": "var(--node-complete)",
        streak: "var(--streak)",
      },
      backgroundColor: {
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        hover: "var(--bg-hover)",
      },
      textColor: {
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        muted: "var(--text-muted)",
      },
      borderColor: {
        DEFAULT: "var(--border)",
        subtle: "var(--border-subtle)",
      },
      borderRadius: {
        card: "var(--radius-card)",
      },
      transitionDuration: {
        fast: "var(--dur-fast)",
        med: "var(--dur-med)",
        slow: "var(--dur-slow)",
      },
      transitionTimingFunction: {
        smooth: "var(--ease)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
