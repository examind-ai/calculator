import { defineConfig } from 'tsup';

// This package ships React hooks, so its entry must be a client module: the
// `"use client"` banner marks the built cjs + esm output so a Next.js App
// Router server component importing it gets a client boundary instead of a
// confusing hooks-in-server-component error.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  banner: { js: '"use client";' },
});
