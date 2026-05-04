import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@/lib/utils": path.resolve(__dirname, "./src/shared/lib/utils"),
      "@/lib/supabase": path.resolve(__dirname, "./src/shared/lib/supabase"),
      "@/hooks": path.resolve(__dirname, "./src/shared/hooks"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
