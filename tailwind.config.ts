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
        orbitron: ["Orbitron", "sans-serif"],
        exo: ["Exo 2", "sans-serif"],
      },
      colors: {
        primary: "#F59E0B",
        cta: "#8B5CF6",
        surface: "#1E293B",
        "surface-2": "#0F172A",
      },
      maxWidth: {
        "480px": "480px",
      },
      animation: {
        "spin-slow": "spin 8s linear infinite",
        "float": "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
