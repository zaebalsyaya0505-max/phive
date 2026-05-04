import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

function resolveEnv(...keys: string[]): string {
  for (const key of keys) {
    const val = process.env[key]
    if (val) return val
  }
  return ''
}

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
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
      resolveEnv('VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL')
    ),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
      resolveEnv('VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY')
    ),
    'import.meta.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(
      resolveEnv('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL')
    ),
    'import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(
      resolveEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY')
    ),
    'import.meta.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || ''),
    'import.meta.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY || ''),
  },
})
