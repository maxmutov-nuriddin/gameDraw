import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./firebase/**/*.{ts,tsx}",
    "./game/**/*.{ts,tsx}",
    "./utils/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        mist: "#f8fafc",
        coral: "#ff6b57",
        teal: "#0f9d8a",
        navy: "#102542",
        sand: "#fff5d7"
      },
      boxShadow: {
        panel: "0 24px 60px rgba(15, 23, 42, 0.18)",
        soft: "0 12px 32px rgba(16, 37, 66, 0.12)"
      },
      backgroundImage: {
        grid: "radial-gradient(circle at center, rgba(255,255,255,0.24) 1px, transparent 1px)"
      },
      fontFamily: {
        display: [
          "var(--font-space-grotesk)"
        ],
        body: [
          "var(--font-manrope)"
        ]
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        reveal: "reveal 0.7s ease both"
      },
      keyframes: {
        float: {
          "0%, 100%": {
            transform: "translateY(0px)"
          },
          "50%": {
            transform: "translateY(-10px)"
          }
        },
        reveal: {
          "0%": {
            opacity: "0",
            transform: "translateY(12px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          }
        }
      }
    }
  },
  plugins: []
};

export default config;
