import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: './preload.ts',
      name: 'Preload',
      fileName: 'preload',
      formats: ['cjs'],
    },
    outDir: '.vite/build',
    emptyOutDir: true,
    rollupOptions: {
      external: ['electron'],
    },
  },
});
