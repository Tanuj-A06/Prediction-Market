module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "cy-bg": "#050505",
        "cy-surface": "rgba(255, 255, 255, 0.03)",
        "cy-border": "rgba(255, 255, 255, 0.08)",
        "cy-accent-cyan": "#00F0FF",
        "cy-accent-purple": "#B026FF",
        "cy-text-primary": "#FFFFFF",
        "cy-text-muted": "#8A8A93",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}