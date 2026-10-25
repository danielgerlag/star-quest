import { expect, test } from '@playwright/test';
import { closeReading, expectPaintedRoom } from './helpers';
import { pixels, savedMission } from './episode-helpers';

test('deployment serves assets, plays a scene and restores progress beneath its base path', async ({ page, baseURL }) => {
  const root = new URL('./', baseURL);
  const errors: string[] = [];
  const assets: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`);
    if (['script', 'stylesheet'].includes(response.request().resourceType())) assets.push(response.url());
  });
  await page.goto('./');
  const favicon = await page.locator('link[rel="icon"]').evaluate((link) => {
    if (!(link instanceof HTMLLinkElement)) throw new Error('The favicon link is missing.');
    return link.href;
  });
  expect(new URL(favicon).pathname).toBe(`${root.pathname}favicon.svg`);
  const icon = await page.request.get(favicon);
  expect(icon.ok()).toBe(true);
  expect(icon.headers()['content-type']).toContain('image/svg+xml');

  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Reduce motion', { exact: true }).check();
  await page.getByLabel('Sound and ship ambience', { exact: true }).uncheck();
  await closeReading(page);
  await page.getByRole('button', { name: 'Take command', exact: true }).click();
  await page.getByRole('button', { name: 'Take the conn', exact: true }).click();
  await expectPaintedRoom(page);
  await page.getByRole('button', { name: 'look Colony basin', exact: true }).click();
  await expect(page.locator('.dialogue-text')).toContainText('no corresponding debris field');
  const saved = await savedMission(page);
  expect(saved.facts).toContain('e1-colony-observed');
  await closeReading(page);
  await page.reload();
  await page.getByRole('button', { name: 'Continue your mission', exact: true }).click();
  await expectPaintedRoom(page);
  expect(await savedMission(page)).toEqual(saved);
  expect(new URL(page.url()).pathname).toBe(root.pathname);
  expect(assets.length).toBeGreaterThanOrEqual(3);
  for (const asset of assets) {
    expect(new URL(asset).origin).toBe(root.origin);
    expect(new URL(asset).pathname.startsWith(`${root.pathname}assets/`)).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('deployment retains its path when switching adventures, playing a movie and selecting chapters', async ({ page, baseURL }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await page.locator('[data-command="switch-adventure"]').click();
  await expect(page).toHaveURL(new URL('./?adventure=original', baseURL).href);
  await page.getByRole('button', { name: 'Watch intro', exact: true }).click();
  await expect(page.locator('.cinematic-dialog')).toBeVisible();
  const before = await pixels(page);
  await page.getByRole('button', { name: 'Next scene', exact: true }).click();
  expect(await pixels(page)).not.toBe(before);
  await page.getByRole('button', { name: 'Skip intro', exact: true }).click();
  await page.locator('[data-command="switch-adventure"]').click();
  await expect(page).toHaveURL(new URL('./?adventure=episode', baseURL).href);
  await page.getByRole('button', { name: 'Chapter select (testing)', exact: true }).click();
  await expect(page).toHaveURL(new URL('./?adventure=episode&testing=1', baseURL).href);
  await page.getByRole('button', { name: /^Start chapter 4:/ }).click();
  await page.getByRole('button', { name: 'Take the conn', exact: true }).click();
  await expect(page.locator('#chapter-number')).toHaveText('CHAPTER 04 / 06');
  await expectPaintedRoom(page);
  await page.reload();
  await page.getByRole('button', { name: 'Resume test mission', exact: true }).click();
  await expect(page.locator('#chapter-number')).toHaveText('CHAPTER 04 / 06');
  expect(new URL(page.url()).pathname).toBe(new URL('./', baseURL).pathname);
  expect(errors).toEqual([]);
});

test('deployment recovery links never escape the project path', async ({ page, baseURL }) => {
  for (const [label, destination] of [
    ['Open the episode adventure', './'],
    ['Open the original adventure', './?adventure=original'],
  ]) {
    await page.goto('./?adventure=unsupported');
    await expect(page.getByRole('heading', { name: 'Adventure unavailable', exact: true })).toBeVisible();
    const link = page.getByRole('link', { name: label, exact: true });
    expect(await link.evaluate((node) => {
      if (!(node instanceof HTMLAnchorElement)) throw new Error('The recovery link is missing.');
      return node.href;
    })).toBe(new URL(destination, baseURL).href);
    await link.click();
    await expect(page).toHaveURL(new URL(destination, baseURL).href);
    await expect(page.getByRole('button', { name: 'Take command', exact: true })).toBeVisible();
  }
});
