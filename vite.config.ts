/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The site is served from https://thevoidwatches.github.io/Exalted-Name-Generator/, so every asset path
// is prefixed with the repo name. "@" points at src, so "@/components" resolves to src/components/index.ts.
export default defineConfig({
  base: '/Exalted-Name-Generator/',
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
