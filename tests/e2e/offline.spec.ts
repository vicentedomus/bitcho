import { test, expect } from '@playwright/test';

// FR-005/016: tras la primera carga, sin red la app no queda en blanco — el service
// worker sirve el shell cacheado y la app arranca en DEMO, navegable.
test('offline: sigue navegable en DEMO tras primera carga', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByText('BITCHO', { exact: true })).toBeVisible();

  // Espera a que el PWA quede listo (service worker controlando la página).
  await page.waitForFunction(
    () => 'serviceWorker' in navigator && navigator.serviceWorker.controller != null,
    null,
    { timeout: 20_000 },
  );

  await context.setOffline(true);
  await page.reload().catch(() => {});
  await expect(page.getByText('BITCHO', { exact: true })).toBeVisible();
  await expect(page.getByText('Control (actual)')).toBeVisible();
  await context.setOffline(false);
});
