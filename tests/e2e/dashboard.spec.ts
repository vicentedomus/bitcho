import { test, expect } from '@playwright/test';

// Smoke E2E móvil de las 4 vistas. Corre en LIVE (si el navegador alcanza Supabase)
// o DEMO (fallback): en ambos casos aparecen las 3 estrategias reales.

test('RESUMEN muestra las 3 estrategias reales + header', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('BITCHO', { exact: true })).toBeVisible();
  await expect(page.getByText('// ESTADO DE PORTAFOLIOS')).toBeVisible();
  await expect(page.getByText('Control (actual)')).toBeVisible();
  await expect(page.getByText('HODL-biased')).toBeVisible();
  await expect(page.getByText('Low-frequency')).toBeVisible();
  await expect(page.getByText('// COMPARATIVA')).toBeVisible();
  await page.screenshot({ path: 'test-results/01-resumen.png', fullPage: true });
});

test('vista de estrategia: estado + config real + log', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Control (actual)' }).click();
  await expect(page.getByText('// ESTADO ACTUAL')).toBeVisible();
  await expect(page.getByText(/CONFIG REAL/)).toBeVisible();
  await expect(page.getByText('UMBRAL CONF')).toBeVisible();
  await expect(page.getByText('// COMPORTAMIENTO')).toBeVisible();
  await expect(page.getByText('// LOG DE DECISIONES')).toBeVisible();
  await page.screenshot({ path: 'test-results/02-strategy.png', fullPage: true });
});

test('toggle métrica y rango no rompen', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '% P&L' }).click();
  await page.getByRole('button', { name: 'HODL-biased' }).click();
  await page.getByRole('button', { name: '24H' }).click();
  await expect(page.getByText('HODL-biased')).toBeVisible();
});
