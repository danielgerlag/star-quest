import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { saveBytes } from './helpers';

async function openTitle(page: Page, reducedMotion = false): Promise<void> {
  await page.goto('/?adventure=original');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Reduce motion', { exact: true }).setChecked(reducedMotion);
  await page.getByLabel('Sound and ship ambience', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
}

async function freezeClock(page: Page): Promise<void> {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
}

async function setHidden(page: Page, hidden: boolean): Promise<void> {
  await page.evaluate((value) => {
    Object.defineProperty(document, 'hidden', { configurable: true, value });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

async function framePixels(page: Page): Promise<string> {
  return page.locator('.cinematic-stage').evaluate((canvas) => {
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error('The cinematic canvas is missing.');
    return canvas.toDataURL();
  });
}

async function castColors(page: Page) {
  return page.locator('.cinematic-stage').evaluate((canvas) => {
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error('The cinematic canvas is missing.');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('The cinematic has no renderer.');
    const pixels = context.getImageData(0, 0, 480, 300).data;
    const cast = { picard: 0, borg: 0, riker: 0, worf: 0 };
    for (let i = 0; i < pixels.length; i += 4) {
      const color = pixels[i] * 65536 + pixels[i + 1] * 256 + pixels[i + 2];
      if (color === 0xa33749) cast.picard++;
      if (color === 0x92efba) cast.borg++;
      if (color === 0x9f3449) cast.riker++;
      if (color === 0xb48b3c) cast.worf++;
    }
    return cast;
  });
}

test('plays the complete abduction in real time and hands off to one playable briefing', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?adventure=original');
  await page.getByRole('button', { name: 'Take command', exact: true }).click();
  const film = page.getByRole('dialog', { name: 'The last order', exact: true });
  await expect(film).toBeVisible();
  await expect(page.locator('#panel')).not.toBeVisible();
  await expect(page.locator('#cinematic-description')).toContainText('Two Borg drones', { timeout: 10000 });
  await expect(page.locator('#cinematic-description')).toContainText('The drones seize Picard', { timeout: 18000 });
  const captured = await castColors(page);
  expect(captured.picard).toBeGreaterThan(10);
  expect(captured.borg).toBeGreaterThan(0);
  await test.info().attach('picard-captured', { body: await film.screenshot(), contentType: 'image/png' });
  await expect(page.locator('#cinematic-description')).toContainText('Green light envelops', { timeout: 10000 });
  await expect(page.locator('#cinematic-description')).toContainText('empty command chair', { timeout: 10000 });
  const survivors = await castColors(page);
  expect(survivors.picard).toBe(0);
  expect(survivors.borg).toBe(0);
  expect(survivors.riker).toBeGreaterThan(10);
  expect(survivors.worf).toBeGreaterThan(10);
  await expect(page.getByRole('button', { name: 'Take the conn', exact: true })).toHaveCount(1);
  await expect(film).toHaveCount(0);
  await page.getByRole('button', { name: 'Take the conn', exact: true }).click();
  await page.getByRole('button', { name: 'look Chair', exact: true }).click();
  await expect(page.locator('.dialogue-text')).toContainText('PICARD');
  expect(errors).toEqual([]);
});

test('reduced motion shows six stable, readable mobile scenes without creating a save', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openTitle(page, true);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Larger reading text', { exact: true }).check();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  const before = await saveBytes(page);
  await freezeClock(page);
  await page.getByRole('button', { name: 'Watch intro', exact: true }).click();
  const still = await framePixels(page);
  await page.clock.fastForward(60000);
  expect(await framePixels(page)).toBe(still);
  for (let index = 1; index <= 6; index++) {
    await expect(page.locator('.cinematic-status')).toContainText(`STILL SCENES / ${index} / 6`);
    expect(await page.locator('.cinematic-dialog').evaluate((dialog) =>
      dialog.scrollWidth <= dialog.clientWidth && dialog.scrollHeight <= dialog.clientHeight)).toBe(true);
    if (index === 4) {
      const captured = await castColors(page);
      expect(captured.picard).toBeGreaterThan(10);
      expect(captured.borg).toBeGreaterThan(0);
      await test.info().attach('mobile-intro', { body: await page.screenshot(), contentType: 'image/png' });
    }
    await page.getByRole('button', { name: index === 6 ? 'Finish intro' : 'Next scene', exact: true }).click();
  }
  await expect(page.locator('.cinematic-dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Watch intro', exact: true })).toBeFocused();
  await expect(page.getByRole('button', { name: 'No mission in progress', exact: true })).toBeDisabled();
  expect(await saveBytes(page)).toBe(before);
});

test('replay preserves save bytes and pauses independently for user choice and hidden tabs', async ({ page }) => {
  await openTitle(page);
  await page.getByRole('button', { name: 'Take command', exact: true }).click();
  await page.getByRole('button', { name: 'Skip intro', exact: true }).click();
  await page.getByRole('button', { name: 'Take the conn', exact: true }).click();
  await page.getByRole('button', { name: 'look Chair', exact: true }).click();
  await expect(page.locator('.dialogue-text')).toContainText('PICARD');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Talk', exact: true }).click();
  await page.getByRole('button', { name: 'talk Worf', exact: true }).click();
  await expect(page.locator('.dialogue-text')).toContainText('witness');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Use', exact: true }).click();
  await page.getByRole('button', { name: 'use Command seal', exact: true }).click();
  await expect(page.locator('#objective-count')).toHaveText('1/4');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Save and load', exact: true }).click();
  await page.locator('[data-command="save-slot"][data-slot="manual-1"]').click();
  await expect(page.getByText('Mission record saved.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.locator('[data-command="title"]').click();
  const before = await saveBytes(page);
  await freezeClock(page);
  await page.getByRole('button', { name: 'Watch intro', exact: true }).click();
  await page.clock.runFor(1500);
  await page.getByRole('button', { name: 'Pause intro', exact: true }).click();
  const paused = await framePixels(page);
  await page.clock.fastForward(60000);
  expect(await framePixels(page)).toBe(paused);
  await setHidden(page, true);
  await page.clock.fastForward(60000);
  await setHidden(page, false);
  await page.clock.runFor(1000);
  await expect(page.getByRole('button', { name: 'Resume intro', exact: true })).toBeVisible();
  expect(await framePixels(page)).toBe(paused);
  await page.getByRole('button', { name: 'Resume intro', exact: true }).click();
  await page.clock.runFor(4000);
  await expect(page.locator('#cinematic-description')).toContainText('Two Borg drones');
  await setHidden(page, true);
  const hidden = await framePixels(page);
  await page.clock.fastForward(60000);
  expect(await framePixels(page)).toBe(hidden);
  await setHidden(page, false);
  await page.clock.runFor(1000);
  expect(await framePixels(page)).not.toBe(hidden);
  await expect(page.locator('#cinematic-description')).toContainText('Two Borg drones');
  await page.keyboard.press('Escape');
  await page.clock.fastForward(60000);
  await expect(page.locator('.cinematic-dialog')).toHaveCount(0);
  await expect(page.locator('#panel')).not.toBeVisible();
  expect(await saveBytes(page)).toBe(before);
  await page.getByRole('button', { name: 'Continue your mission', exact: true }).click();
  await expect(page.locator('#objective-count')).toHaveText('1/4');
});

for (const exit of [{ at: 0, key: false }, { at: 12000, key: true }, { at: 32900, key: false }]) {
  test(`exits once using ${exit.key ? 'Escape' : 'Skip'} at ${exit.at}ms and leaves no delayed callbacks`, async ({ page }) => {
    await openTitle(page);
    await freezeClock(page);
    await page.getByRole('button', { name: 'Take command', exact: true }).click();
    await expect(page.locator('.cinematic-dialog')).toBeVisible();
    await page.clock.runFor(exit.at);
    if (exit.key) await page.keyboard.press('Escape');
    else await page.getByRole('button', { name: 'Skip intro', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Take the conn', exact: true })).toHaveCount(1);
    await page.getByRole('button', { name: 'Take the conn', exact: true }).click();
    await page.clock.fastForward(60000);
    await expect(page.locator('.cinematic-dialog')).toHaveCount(0);
    await expect(page.locator('#panel')).not.toBeVisible();
    await page.keyboard.press('m');
    await expect(page.getByRole('heading', { name: 'Where to, Commander?' })).toBeVisible();
  });
}

test('reload during the opening resumes the saved mission without replaying it', async ({ page }) => {
  await openTitle(page);
  await page.getByRole('button', { name: 'Take command', exact: true }).click();
  await expect(page.locator('.cinematic-dialog')).toBeVisible();
  const before = await saveBytes(page);
  await page.reload();
  await page.getByRole('button', { name: 'Continue your mission', exact: true }).click();
  await expect(page.locator('#room-name')).toHaveText('Main Bridge');
  await expect(page.locator('.cinematic-dialog')).toHaveCount(0);
  await expect(page.locator('#panel')).not.toBeVisible();
  expect(await saveBytes(page)).toBe(before);
});

test('an opening render failure is explicit and still offers the saved mission briefing', async ({ page }) => {
  await openTitle(page);
  await page.evaluate(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: function (this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
        if (this.classList.contains('cinematic-stage')) return null;
        return Reflect.apply(getContext, this, [kind, ...args]);
      },
    });
  });
  await page.getByRole('button', { name: 'Take command', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'The opening could not play' })).toBeVisible();
  await expect(page.locator('.cinematic-dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Continue to briefing', exact: true }).click();
  await page.getByRole('button', { name: 'Take the conn', exact: true }).click();
  await expect(page.locator('#room-name')).toHaveText('Main Bridge');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Continue your mission', exact: true })).toBeEnabled();
});

test('local save failure does not block the intro or export-only play', async ({ page }) => {
  await openTitle(page);
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = () => { throw new DOMException('QA storage limit', 'QuotaExceededError'); };
  });
  await page.getByRole('button', { name: 'Take command', exact: true }).click();
  await page.getByRole('button', { name: 'Skip intro', exact: true }).click();
  await page.getByRole('button', { name: 'Take the conn', exact: true }).click();
  await expect(page.locator('#save-status')).toContainText('NOT SAVED');
  await page.getByRole('button', { name: 'Save and load', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export current mission/ }).click();
  expect((await download).suggestedFilename()).toMatch(/^star-quest-chapter-1/);
});
