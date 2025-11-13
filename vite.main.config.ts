import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    lib: {
      entry: './electron.ts',
      formats: ['cjs'],
      fileName: 'electron',
    },
    rollupOptions: {
      external: ['electron'],
    },
  },
});
