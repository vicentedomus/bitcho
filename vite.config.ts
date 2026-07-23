/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Emite dist/version.json con el commit del deploy (Vercel) o el git local.
// Alimenta el aviso de "versión nueva" del service worker (network-first).
function version(): string {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  if (sha) return sha.slice(0, 12);
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'dev';
  }
}

function versionMarker(): Plugin {
  let outDir = 'dist';
  return {
    name: 'bitcho-version',
    apply: 'build',
    configResolved(c) {
      outDir = c.build.outDir;
    },
    closeBundle() {
      writeFileSync(join(outDir, 'version.json'), JSON.stringify({ v: version() }) + '\n');
    },
  };
}

export default defineConfig({
  plugins: [react(), versionMarker()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Nombres FIJOS sin content-hash: son contractuales para el precache del SW.
    // La invalidación la dan CACHE_VERSION del SW + version.json (D5 del plan).
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
  server: { port: 3000 },
  preview: { port: 3000 },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
