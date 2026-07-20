import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0c0f",
        surface: "#15171c",
        border: "#262933",
        text: "#e7e9ee",
        muted: "#8a8f9c",
        accent: {
          DEFAULT: "#f5a524",
          muted: "#7a5416",
        },
        complete: "#3fae63",
        incomplete: "#c4453f",
      },
    },
  },
  plugins: [],
} satisfies Config;
