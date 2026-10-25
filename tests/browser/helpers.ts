import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { Action } from '../../src/model';
import type { Tool } from '../../src/controls';

export async function selectTool(page: Page, tool: Tool): Promise<void> {
  const toolbar = page.getByRole('toolbar', { name: 'Interaction tools' });
  if (!await toolbar.isVisible()) await page.getByRole('button', { name: 'Action icons', exact: true }).hover();
  await toolbar.locator(`[data-command="tool"][data-tool="${tool}"]`).click();
}

export async function expectPaintedRoom(page: Page): Promise<void> {
  await expect.poll(() => page.locator('#scene-mount canvas').evaluate((element) => {
    if (!(element instanceof HTMLCanvasElement)) return 0;
    const context = element.getContext('2d');
    if (!context) return 0;
    const pixels = context.getImageData(0, 0, element.width, element.height).data;
    const colors = new Set<number>();
    for (let i = 0; i < pixels.length; i += 64) {
      colors.add(pixels[i] * 65536 + pixels[i + 1] * 256 + pixels[i + 2]);
    }
    return colors.size;
  })).toBeGreaterThan(40);
}

export async function closeReading(page: Page): Promise<void> {
  for (let attempts = 0; attempts < 8; attempts++) {
    const film = page.locator('.cinematic-dialog[open]');
    if (await film.count()) {
      await film.getByRole('button', { name: /^Skip (intro|sequence)$/ }).click();
      await page.waitForTimeout(30);
      continue;
    }
    const dialog = page.locator('#panel[open]');
    if (!await dialog.count()) return;
    const close = dialog.locator('[data-command="close"]').first();
    await close.click();
    await page.waitForTimeout(30);
  }
  await expect(page.locator('#panel')).not.toBeVisible();
  await expect(page.locator('.cinematic-dialog')).toHaveCount(0);
}

export async function start(page: Page, adventure: 'original' | 'episode' = 'original'): Promise<void> {
  await page.goto(adventure === 'original' ? '/?adventure=original' : '/');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Reduce motion', { exact: true }).check();
  await page.getByLabel('Sound and ship ambience', { exact: true }).uncheck();
  await closeReading(page);
  await page.getByRole('button', { name: 'Take command', exact: true }).click();
  if (adventure === 'original') await page.getByRole('button', { name: 'Skip intro', exact: true }).click();
  else await expect(page.locator('.cinematic-dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Take the conn', exact: true }).click();
  await expect(page.locator('#room-name')).toHaveText(/.+/);
  await expectPaintedRoom(page);
}

export async function act(page: Page, action: Action): Promise<void> {
  if (action.type !== 'choose') await closeReading(page);
  if (action.type === 'travel') {
    await page.locator('.turbolift-button').click();
    await page.locator(`[data-command="travel"][data-room="${action.room}"]`).click();
    await expect(page.locator('#panel')).not.toBeVisible();
    await expectPaintedRoom(page);
  } else if (action.type === 'interact') {
    await selectTool(page, action.verb);
    await page.locator(`#hotspots [data-target="${action.target}"]`).click();
    await expect(page.locator('#panel')).toBeVisible();
  } else if (action.type === 'item') {
    await selectTool(page, 'look');
    await page.locator(`#inventory-items [data-item="${action.item}"]`).click();
    await page.locator(`#hotspots [data-target="${action.target}"]`).click();
    await expect(page.locator('#panel')).toBeVisible();
  } else {
    const choice = page.locator(`[data-command="choice"][data-interaction="${action.interaction}"][data-choice="${action.choice}"]`);
    await expect(choice).toBeEnabled();
    await choice.click();
    const confirmation = page.locator('[data-command="confirm"]');
    if (await confirmation.count()) await confirmation.click();
    await expect(page.locator('#panel')).toBeVisible();
  }
}

export async function saveBytes(page: Page, databaseName = 'star-quest-missions'): Promise<string> {
  return page.evaluate((name) => new Promise<string>((resolve, reject) => {
    const open = indexedDB.open(name, 1);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const database = open.result;
      const transaction = database.transaction('saves', 'readonly');
      const store = transaction.objectStore('saves');
      const keys = store.getAllKeys();
      const values = store.getAll();
      transaction.oncomplete = () => {
        database.close();
        resolve(JSON.stringify([keys.result, values.result]));
      };
      transaction.onerror = () => { database.close(); reject(transaction.error); };
    };
  }), databaseName);
}
