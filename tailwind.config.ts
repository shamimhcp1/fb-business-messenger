import type { Config } from "tailwindcss";

const config: Config = {
  prefix: "tw-",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./styles/**/*.{css}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
