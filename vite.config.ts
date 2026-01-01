import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://65.109.140.250',
        changeOrigin: true,
        secure: false, // needed if using IP with HTTPS
        headers: {
          Host: 'zantrixgroup.com'
        }
      }
    },
  },
  preview: {
    allowedHosts: ["zantrixpos.onrender.com"],
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
