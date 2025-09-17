import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { copyFileSync } from 'fs';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    react(), 
    tsconfigPaths(),
    {
      name: 'copy-staticwebapp-config',
      closeBundle() {
        copyFileSync('staticwebapp.config.json', 'dist/staticwebapp.config.json');
      }
    }
  ],
  define: {
    global: "globalThis",
  },
  server: {
    port: 53000,
  },
});
