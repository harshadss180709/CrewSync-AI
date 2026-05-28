/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f4ff",
          100: "#e0e9ff",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          900: "#1e1b4b",
        },
        muse: {
          purple: "#7c3aed",
          violet: "#8b5cf6",
          pink:   "#ec4899",
          cyan:   "#06b6d4",
          gold:   "#f59e0b",
        },
        dark: {
          950: "#040408",
          900: "#080b14",
          800: "#0d1117",
          700: "#131929",
          600: "#1a2235",
          500: "#1f2a42",
          400: "#2a3855",
        },
      },
      fontFamily: {
        sans:  ["Inter", "system-ui", "sans-serif"],
        mono:  ["JetBrains Mono", "Fira Code", "monospace"],
        display:["Cal Sans","Inter","system-ui","sans-serif"],
      },
      backgroundImage: {
        "hero-gradient":   "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120,119,198,0.3), transparent)",
        "glow-purple":     "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
        "glow-cyan":       "radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)",
        "card-glass":      "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
      },
      animation: {
        "float":       "float 6s ease-in-out infinite",
        "pulse-slow":  "pulse 4s cubic-bezier(0.4,0,0.6,1) infinite",
        "glow":        "glow 2s ease-in-out infinite alternate",
        "slide-up":    "slideUp 0.5s ease forwards",
        "fade-in":     "fadeIn 0.4s ease forwards",
        "shimmer":     "shimmer 2s infinite",
      },
      keyframes: {
        float:    { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-12px)" } },
        glow:     { from: { boxShadow: "0 0 20px rgba(124,58,237,0.3)" }, to: { boxShadow: "0 0 40px rgba(124,58,237,0.6)" } },
        slideUp:  { from: { opacity: 0, transform: "translateY(20px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        shimmer:  { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      backdropBlur: { xs: "2px" },
      boxShadow: {
        "glow-sm":  "0 0 15px rgba(99,102,241,0.3)",
        "glow-md":  "0 0 30px rgba(99,102,241,0.4)",
        "glow-lg":  "0 0 60px rgba(99,102,241,0.5)",
        "glass":    "0 8px 32px 0 rgba(0,0,0,0.37)",
        "card":     "0 4px 24px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
};
