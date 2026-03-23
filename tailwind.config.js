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
        bg: "#0B0B0F",
        surface: "#12121A",
        "surface-2": "#1A1A26",
        accent: "#00FFC6",
        "accent-dim": "#00FFC620",
        blue: "#3B82F6",
        "text-primary": "#E5E7EB",
        "text-muted": "#9CA3AF",
        border: "#ffffff0f",
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "'Segoe UI'", "system-ui", "sans-serif"],
        mono: ["var(--font-dm-mono)", "Consolas", "'Courier New'", "monospace"],
        display: ["var(--font-syne)", "'Trebuchet MS'", "sans-serif"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
      },
      animation: {
        "slide-up": "slideUp 200ms ease-out",
        "fade-in": "fadeIn 200ms ease-out",
        "pop-in": "popIn 250ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "fade-out": "fadeOut 400ms ease-out forwards",
        pulse: "pulse 2s ease-in-out infinite",
        blink: "blink 1s step-end infinite",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        popIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1", transform: "scale(1)" },
          "80%": { opacity: "0.2", transform: "scale(0.97)" },
          "100%": { opacity: "0", transform: "scale(0.95)", display: "none" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 255, 198, 0.15)",
        "glow-strong": "0 0 40px rgba(0, 255, 198, 0.25)",
        "blue-glow": "0 0 20px rgba(59, 130, 246, 0.2)",
      },
      backdropBlur: {
        xs: "4px",
      },
    },
  },
  plugins: [],
};
