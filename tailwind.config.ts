import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        border: "hsl(var(--border))",
        primary: "hsl(var(--primary))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        danger: "hsl(var(--danger))",
        muted: "hsl(var(--muted))"
      },
      boxShadow: {
        glass: "0 24px 80px rgba(15, 23, 42, 0.18)",
        panel: "0 20px 50px rgba(15, 23, 42, 0.08)",
        float: "0 18px 40px rgba(79, 70, 229, 0.18)",
        soft: "0 10px 30px rgba(15, 23, 42, 0.06)"
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(circle at top left, rgba(79, 70, 229, 0.24), transparent 35%), radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.18), transparent 32%)",
        "page-gradient":
          "linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(255, 255, 255, 0) 28%), radial-gradient(circle at 85% 10%, rgba(14, 165, 233, 0.12), transparent 24%), radial-gradient(circle at 20% 80%, rgba(168, 85, 247, 0.12), transparent 22%)",
        "sidebar-gradient":
          "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.86) 100%)",
        "dark-sidebar-gradient":
          "linear-gradient(180deg, rgba(15,23,42,0.94) 0%, rgba(2,6,23,0.88) 100%)"
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        display: ["Sora", "Manrope", "sans-serif"]
      },
      maxWidth: {
        "screen-3xl": "1800px"
      }
    }
  },
  plugins: []
} satisfies Config;
