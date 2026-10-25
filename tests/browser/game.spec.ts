import { expect, test } from '@playwright/test';
import { walkthrough } from '../../src/campaign/walkthrough';
import { act, closeReading, start } from './helpers';

test('Enterprise-D main bridge artwork and integrated controls', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1080 });
  await start(page);
  await page.mouse.move(0, 0);
  const canvas = page.locator('#scene-mount canvas');
  await expect(canvas).toHaveScreenshot('enterprise-d-main-bridge.png', { maxDiffPixelRatio: 0.002 });
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('The bridge is not visible.');
  const clickRoom = (x: number, y: number) =>
    page.mouse.click(bounds.x + x * bounds.width / 480, bounds.y + y * bounds.height / 300);

  await clickRoom(240, 163);
  await expect(page.locator('.dialogue-text')).toContainText('PICARD');
  await closeReading(page);
  await page.getByRole('button', { name: 'Talk', exact: true }).click();
  await page.getByRole('button', { name: 'talk Worf', exact: true }).click();
  await expect(page.locator('.dialogue-text')).toContainText('witness');
  await closeReading(page);
  await page.getByRole('button', { name: 'Use', exact: true }).click();
  await clickRoom(110, 167);
  await expect(page.locator('#objective-count')).toHaveText('1/4');
  await expect(page.locator('.dialogue-text')).toContainText('Worf witnesses the transfer');
  await closeReading(page);
  await page.getByRole('button', { name: 'Look', exact: true }).click();
  await clickRoom(353, 83);
  await expect(page.locator('.dialogue-text')).toContainText('A narrow burn');
});

test('title, keyboard controls, accessibility settings and mobile layout', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await start(page);
  await expect(page.locator('#scene-mount canvas')).toBeVisible();
  await page.keyboard.press('h');
  await expect(page.locator('#hotspots')).toHaveClass(/highlight/);
  await page.keyboard.press('m');
  await expect(page.getByRole('heading', { name: 'Where to, Commander?' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('j');
  await expect(page.getByRole('heading', { name: 'Mission records' })).toBeVisible();
  await closeReading(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#scene-mount canvas')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByText('Room contents', { exact: false }).click();
  await expect(page.locator('#scene-index-items button').first()).toBeVisible();
  await test.info().attach('mobile-controls', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  expect(errors).toEqual([]);
});

for (const strategy of ['precision', 'fleet', 'sacrifice'] as const) {
  test(`plays all six chapters to the ${strategy} conclusion`, async ({ page }) => {
    test.setTimeout(240_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await start(page);
    const steps = walkthrough({
      evacuation: strategy === 'fleet' ? 'escort' : 'aboard',
      relay: strategy === 'precision' ? 'cut' : 'supervised',
      contact: strategy === 'fleet' ? 'tactical' : 'medical',
      strategy,
    });
    for (const [index, action] of steps.entries()) {
      await test.step(`${index + 1}. ${JSON.stringify(action)}`, async () => act(page, action));
    }
    await closeReading(page);
    await expect(page.locator('#ending-screen')).toBeVisible();
    await expect(page.locator('.ending-copy h1')).not.toHaveText('');
    await expect(page.getByText('Thank you for taking command.')).toBeVisible();
    await expect(page.getByRole('status')).toHaveCSS('opacity', '0');
    await test.info().attach(`${strategy}-ending`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    await page.reload();
    await page.getByRole('button', { name: 'Continue your mission', exact: true }).click();
    await expect(page.locator('#ending-screen')).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('persists progress, exports a save and rejects invalid import without losing the mission', async ({ page }) => {
  await start(page);
  for (const action of walkthrough().slice(0, 5)) await act(page, action);
  await closeReading(page);
  const room = await page.locator('#room-name').textContent();
  await page.getByRole('button', { name: 'Save and load', exact: true }).click();
  await page.locator('[data-command="save-slot"][data-slot="manual-1"]').click();
  await expect(page.getByText('Mission record saved.', { exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export current mission', exact: false }).click();
  const backup = await download;
  expect(backup.suggestedFilename()).toMatch(/^star-quest-chapter-/);
  const backupPath = await backup.path();
  if (!backupPath) throw new Error('The exported backup was not saved.');
  await closeReading(page);
  await page.reload();
  await page.getByRole('button', { name: 'Continue your mission', exact: true }).click();
  await expect(page.locator('#room-name')).toHaveText(room ?? '');
  await page.locator('#import-file').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"schema": 100}') });
  await expect(page.getByRole('heading', { name: 'This save could not be opened' })).toBeVisible();
  await closeReading(page);
  await expect(page.locator('#room-name')).toHaveText(room ?? '');
  await page.getByRole('button', { name: /Turbolift/ }).click();
  await page.locator('[data-command="travel"]').filter({ hasNot: page.locator('em', { hasText: 'CURRENT LOCATION' }) }).first().click();
  await expect(page.locator('#room-name')).not.toHaveText(room ?? '');
  await page.locator('#import-file').setInputFiles(backupPath);
  await expect(page.getByRole('heading', { name: 'Open this mission record?' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm order', exact: true }).click();
  await expect(page.locator('#room-name')).toHaveText(room ?? '');
});

test('restores a pending command decision after reloading', async ({ page }) => {
  await start(page);
  const steps = walkthrough();
  const index = steps.findIndex((action) => action.type === 'choose');
  expect(index).toBeGreaterThan(0);
  for (const action of steps.slice(0, index)) await act(page, action);
  const choice = steps[index];
  if (choice.type !== 'choose') throw new Error('The fixture has no command decision.');
  await expect(page.locator(`[data-command="choice"][data-choice="${choice.choice}"]`)).toBeEnabled();
  await page.reload();
  await page.getByRole('button', { name: 'Continue your mission', exact: true }).click();
  await expect(page.locator(`[data-command="choice"][data-choice="${choice.choice}"]`)).toBeEnabled();
  await act(page, choice);
  await closeReading(page);
  await page.keyboard.press('j');
  await page.getByRole('button', { name: 'Command decisions', exact: true }).click();
  await expect(page.locator('.decision-card')).toHaveCount(1);
});

test('a damaged manual slot does not hide the healthy checkpoint', async ({ page }) => {
  await start(page);
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('star-quest-missions', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('saves', 'readwrite');
        transaction.objectStore('saves').put({ format: 'broken' }, 'manual-1');
        transaction.oncomplete = () => { database.close(); resolve(); };
        transaction.onerror = () => { database.close(); reject(transaction.error); };
      };
    });
  });
  await page.getByRole('button', { name: 'Save and load', exact: true }).click();
  await expect(page.getByText('Record could not be read', { exact: true })).toBeVisible();
  await expect(page.locator('[data-command="load-slot"][data-slot="manual-1"]')).toBeDisabled();
  await expect(page.locator('[data-command="load-slot"][data-slot="checkpoint"]')).toBeEnabled();
  await expect(page.locator('[data-command="load-slot"][data-slot="auto"]')).toBeEnabled();
});

test('late archive reads cannot replace a newer panel', async ({ page }) => {
  await start(page);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.get;
    IDBObjectStore.prototype.get = function (query) {
      const request = original.call(this, query);
      Object.defineProperty(request, 'onsuccess', {
        set(handler: ((event: Event) => void) | null) {
          if (handler) request.addEventListener('success', (event) => {
            window.setTimeout(() => handler.call(request, event), 900);
          });
        },
      });
      return request;
    };
  });
  await page.getByRole('button', { name: 'Save and load', exact: true }).click();
  await expect(page.getByText('Reading local mission records...')).toBeVisible();
  await page.locator('#panel [data-command="close"]').click();
  await page.getByRole('button', { name: 'Controls', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Think like a Starfleet officer' })).toBeVisible();
  await page.waitForTimeout(1200);
  await expect(page.getByRole('heading', { name: 'Think like a Starfleet officer' })).toBeVisible();
});

for (const operation of ['save', 'load'] as const) {
  test(`a late manual ${operation} cannot reopen a dismissed panel`, async ({ page }) => {
    await start(page);
    await page.getByRole('button', { name: 'Save and load', exact: true }).click();
    await expect(page.locator('[data-command="load-slot"][data-slot="checkpoint"]')).toBeEnabled();
    await page.evaluate(() => {
      const original = IDBDatabase.prototype.transaction;
      IDBDatabase.prototype.transaction = function (storeNames, mode, options) {
        const transaction = original.call(this, storeNames, mode, options);
        Object.defineProperty(transaction, 'oncomplete', {
          set(handler: ((event: Event) => void) | null) {
            if (handler) transaction.addEventListener('complete', event => {
              window.setTimeout(() => handler.call(transaction, event), 900);
            });
          },
        });
        return transaction;
      };
    });
    const slot = operation === 'save' ? 'manual-1' : 'checkpoint';
    await page.locator(`[data-command="${operation}-slot"][data-slot="${slot}"]`).click();
    await page.locator('#panel [data-command="close"]').click();
    await page.getByRole('button', { name: 'Controls', exact: true }).click();
    await page.waitForTimeout(1200);
    await expect(page.getByRole('heading', { name: 'Think like a Starfleet officer' })).toBeVisible();
    if (operation === 'save') {
      await closeReading(page);
      await page.getByRole('button', { name: 'Save and load', exact: true }).click();
      await expect(page.locator('[data-command="load-slot"][data-slot="manual-1"]')).toBeEnabled();
    }
  });
}
