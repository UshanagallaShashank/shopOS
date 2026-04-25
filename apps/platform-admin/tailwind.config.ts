import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ShopOS brand colors
        brand: { red: "#E94560", navy: "#1A1A2E" },
      },
    },
  },
  plugins: [],
}
export default config
