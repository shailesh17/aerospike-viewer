import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), ''); // Load .env from project root
    return {
      root: '.', // Project root is the current directory
      publicDir: 'public', // Static assets are in ./public
      server: {
        port: 5173, // Standard Vite dev server port
        host: '0.0.0.0',
        fs: {
          deny: ['.history/**'], // Ignore .history directories
        },
        proxy: {
          '/api': {
            target: 'http://localhost:8080',
            changeOrigin: true,
          },
        },
      },
      build: {
        outDir: 'dist', // Output to ./dist
        emptyOutDir: true,
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'public/index.html'), // Entry HTML file
          },
        },
      },
      plugins: [react()], // Vite automatically uses postcss.config.js if present
      define: {
        'process.env.API_KEY': JSON.stringify(env.API_KEY), // Assuming API_KEY is used
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY), // Assuming GEMINI_API_KEY is used
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        }
      }
    };
});
