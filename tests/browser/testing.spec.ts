import { expect, test } from '@playwright/test';
import { campaign } from '../../src/campaign';
import { walkthrough } from '../../src/campaign/walkthrough';
import { act, closeReading, expectPaintedRoom, saveBytes, start } from './helpers';

test('chapter select jumps forward and backward into playable chapter starts', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?adventure=original&testing=1');
  await expect(page.getByRole('heading', { name: 'Chapter select', exact: true })).toBeVisible();
  for (const chapter of campaign.chapters) {
    await test.step(`Start chapter ${chapter.id}`, async () => {
      await page.getByRole('button', { name: `Start chapter ${chapter.id}: ${chapter.title}`, exact: true }).click();
      await expect(page.locator('#panel[open]').getByRole('heading', { name: chapter.title, exact: true })).toBeVisible();
      await expect(page.locator('.cinematic-dialog')).toHaveCount(0);
      await page.getByRole('button', { name: 'Take the conn', exact: true }).click();
      await expect(page.locator('#room-name')).toHaveText(chapter.rooms[0].name);
      await expect(page.locator('#objective-count')).toHaveText(`0/${chapter.objectives.length}`);
      await expect(page.locator('#inventory-items [data-item="padd"]')).toBeVisible();
      await expectPaintedRoom(page);
      await page.getByRole('button', { name: 'Chapter select', exact: true }).click();
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.locator('.dialog-body').evaluate((body) => body.scrollWidth <= body.clientWidth)).toBe(true);
  await test.info().attach('mobile-chapter-select', { body: await page.screenshot(), contentType: 'image/png' });
  await page.getByRole('button', { name: /^Start chapter 1:/ }).click();
  await page.getByRole('button', { name: 'Take the conn', exact: true }).click();
  await expect(page.locator('#room-name')).toHaveText('Main Bridge');
  await expect(page.locator('#inventory-items button')).toHaveCount(2);
  await page.getByRole('button', { name: 'look Chair', exact: true }).click();
  await expect(page.locator('.dialogue-text')).toContainText('PICARD');
  expect(errors).toEqual([]);
});

test('test chapter jumps, manual saves and reload never overwrite normal mission records', async ({ page }) => {
  await start(page);
  await act(page, { type: 'interact', target: 'c1-chair', verb: 'look' });
  await closeReading(page);
  await page.getByRole('button', { name: 'Save and load', exact: true }).click();
  await page.locator('[data-command="save-slot"][data-slot="manual-1"]').click();
  await expect(page.getByText('Mission record saved.', { exact: true })).toBeVisible();
  await closeReading(page);
  const normal = await saveBytes(page);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Chapter select (testing)', exact: true }).click();
  await expect(page).toHaveURL(/testing=1/);
  await expect(page.getByRole('heading', { name: 'Chapter select', exact: true })).toBeVisible();
  const history = { evacuation: 'escort', relay: 'supervised', contact: 'tactical', strategy: 'sacrifice' };
  for (const [key, value] of Object.entries(history)) {
    await page.locator(`#chapter-test-options select[name="${key}"]`).selectOption(value);
  }
  await page.getByRole('button', { name: /^Start chapter 6:/ }).click();
  await page.getByRole('button', { name: 'Take the conn', exact: true }).click();
  await expect(page.locator('#save-status')).toContainText('TEST PROGRESS SAVED');
  await page.keyboard.press('j');
  await page.getByRole('button', { name: 'Command decisions', exact: true }).click();
  for (const [key, value] of Object.entries(history)) {
    await expect(page.locator('.decision-card h3').filter({ hasText: campaign.commitmentLabels[key][value] })).toBeVisible();
  }
  await closeReading(page);
  await page.getByRole('button', { name: 'Save and load', exact: true }).click();
  await expect(page.getByText('TEST MISSION ARCHIVE', { exact: true })).toBeVisible();
  await page.locator('[data-command="save-slot"][data-slot="manual-1"]').click();
  await expect(page.getByText('Mission record saved.', { exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export current mission/ }).click();
  expect((await download).suggestedFilename()).toBe('star-quest-test-chapter-6.json');
  await closeReading(page);
  const testRecords = await saveBytes(page, 'star-quest-testing');
  expect(await saveBytes(page)).toBe(normal);
  await page.reload();
  await page.getByRole('button', { name: 'Resume test mission', exact: true }).click();
  await expect(page.locator('#chapter-number')).toHaveText('CHAPTER 06 / 06');
  expect(await saveBytes(page, 'star-quest-testing')).toBe(testRecords);
  expect(await saveBytes(page)).toBe(normal);
  await page.getByRole('button', { name: 'Return to normal play', exact: true }).click();
  await expect(page).not.toHaveURL(/testing=1/);
  await page.getByRole('button', { name: 'Continue your mission', exact: true }).click();
  await expect(page.locator('#room-name')).toHaveText('Main Bridge');
  await expect(page.locator('.testing-banner')).toHaveCount(0);
  expect(await saveBytes(page)).toBe(normal);
});

test('chapter 6 Sacrifice fixture supports the separation procedure and its full ending', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?adventure=original&testing=1');
  await page.getByLabel('Final strategy (chapter 6)', { exact: true }).selectOption('sacrifice');
  await page.getByRole('button', { name: /^Start chapter 6:/ }).click();
  await page.getByRole('button', { name: 'Take the conn', exact: true }).click();
  const steps = walkthrough({ strategy: 'sacrifice' });
  const startOfFinale = steps.findIndex((action) => action.type === 'travel' && action.room === 'c6-medical');
  expect(startOfFinale).toBeGreaterThan(0);
  for (const action of steps.slice(startOfFinale)) {
    await act(page, action);
    if (action.type === 'item' && action.target === 'c6-clutch') {
      await expect(page.locator('.dialogue-text')).toContainText('Geordi uncouples the engineering section');
      await expect(page.locator('.dialogue-text')).toContainText('saucer has cleared the separation envelope');
    }
  }
  await closeReading(page);
  await expect(page.locator('.ending-emblem')).toHaveClass(/sacrifice/);
  await expect(page.getByText('Thank you for taking command.')).toBeVisible();
});

test('invalid chapter requests fail visibly without replacing test progress', async ({ page }) => {
  await page.goto('/?adventure=original&testing=1');
  await expect(page.getByRole('heading', { name: 'Chapter select', exact: true })).toBeVisible();
  const before = await saveBytes(page, 'star-quest-testing');
  const chapter = page.getByRole('button', { name: /^Start chapter 1:/ });
  await chapter.evaluate((button) => button.setAttribute('data-chapter', '99'));
  await chapter.click();
  await expect(page.getByRole('heading', { name: 'Unable to complete that request' })).toBeVisible();
  await expect(page.locator('.dialog-body')).toContainText('Unknown test chapter 99');
  expect(await saveBytes(page, 'star-quest-testing')).toBe(before);
});
