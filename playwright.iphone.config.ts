import { defineConfig } from '@playwright/test';

// E2E móvil. Emulación tipo iPhone sobre Chromium (el navegador disponible en el
// entorno). Corre contra el preview de Vite (build estático).
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  expect: { timeout: 12_000 },
  use: {
    browserName: 'chromium',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    baseURL: 'http://localhost:3000',
    // El entorno trae chromium-1194 pre-instalado; apuntamos al binario real
    // para no depender de la versión que este @playwright/test intentaría bajar.
    launchOptions: {
      executablePath:
        process.env.PW_CHROMIUM ||
        '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    },
  },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
