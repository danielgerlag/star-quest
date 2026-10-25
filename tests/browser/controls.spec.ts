import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { act, closeReading, saveBytes, selectTool, start } from './helpers';
import { chapterActions, savedMission, testChapter } from './episode-helpers';

async function roomPixels(page: Page): Promise<string> {
  return page.locator('#scene-mount canvas').evaluate((canvas) => {
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error('The room canvas is missing.');
    return canvas.toDataURL();
  });
}

async function floor(page: Page, button: 'left' | 'right' | 'middle' = 'left'): Promise<void> {
  const canvas = page.locator('#scene-mount canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('The room canvas is not visible.');
  await canvas.click({ position: { x: bounds.width * 0.88, y: bounds.height * 0.97 }, button });
}

test('the edge reveals icons without shifting the scene; selecting one tucks them away', async ({ page }) => {
  await start(page, 'episode');
  const toolbar = page.locator('#action-toolbar');
  const before = await page.locator('#scene-frame').boundingBox();
  const saved = await saveBytes(page, 'star-quest-episode');
  await expect(toolbar).toBeHidden();
  await page.getByRole('button', { name: 'Action icons', exact: true }).hover();
  await expect(toolbar).toBeVisible();
  await expect(page.locator('#toolbar-toggle')).toHaveAttribute('aria-expanded', 'true');
  expect(await page.locator('#scene-frame').boundingBox()).toEqual(before);
  await page.mouse.move(0, 0);
  await expect(toolbar).toBeHidden();
  await selectTool(page, 'talk');
  await expect(toolbar).toBeHidden();
  await expect(page.locator('#selected-action')).toHaveText('Talk');
  await expect(page.locator('#scene-frame')).toHaveAttribute('data-cursor', 'talk');
  await expect(page.locator('#hotspots [data-target="e1-basin"]')).toHaveAccessibleName('talk Colony basin');
  expect(await saveBytes(page, 'star-quest-episode')).toBe(saved);
  await page.getByRole('button', { name: 'Action icons', exact: true }).hover();
  await test.info().attach('classic-icon-bar', {
    body: await page.locator('.adventure-monitor').screenshot(), contentType: 'image/png',
  });
});

test('right-click cycles five native cursors without walking, actions or saves', async ({ page }) => {
  await start(page, 'episode');
  await page.keyboard.press('1');
  const before = await roomPixels(page);
  const saved = await saveBytes(page, 'star-quest-episode');
  const cursors = new Set<string>();
  for (const mode of ['look', 'talk', 'use', 'scan', 'walk']) {
    await floor(page, 'right');
    await expect(page.locator('#scene-frame')).toHaveAttribute('data-cursor', mode);
    const canvasCursor = await page.locator('#scene-mount canvas').evaluate((node) => getComputedStyle(node).cursor);
    expect(canvasCursor).toContain('data:image/svg+xml,');
    expect(await page.locator('.hotspot').first().evaluate((node) => getComputedStyle(node).cursor)).toBe(canvasCursor);
    cursors.add(canvasCursor);
    expect(await roomPixels(page)).toBe(before);
    await expect(page.locator('#panel')).toBeHidden();
  }
  expect(cursors.size).toBe(5);
  expect(await saveBytes(page, 'star-quest-episode')).toBe(saved);
  await page.locator('#hotspots [data-target="e1-basin"]').click({ button: 'right' });
  await expect(page.locator('#scene-frame')).toHaveAttribute('data-cursor', 'look');
  await expect(page.locator('#panel')).toBeHidden();
});

test('the inventory cursor survives verb changes and applies the carried instrument', async ({ page }) => {
  await start(page, 'episode');
  await page.keyboard.press('i');
  await page.locator('[data-command="equip-panel"][data-item="tricorder"]').click();
  await expect(page.locator('#selected-action')).toHaveText('Use Tricorder');
  const itemCursor = await page.locator('#scene-mount canvas').evaluate((node) => getComputedStyle(node).cursor);
  await page.keyboard.press('2');
  await page.getByRole('button', { name: 'Action icons', exact: true }).hover();
  await expect(page.locator('#carried-item')).toHaveAccessibleName('Use carried item: Tricorder');
  await page.getByRole('button', { name: 'Use carried item: Tricorder', exact: true }).click();
  await expect(page.locator('#scene-frame')).toHaveAttribute('data-cursor', 'item');
  expect(await page.locator('#scene-mount canvas').evaluate((node) => getComputedStyle(node).cursor)).toBe(itemCursor);
  for (const mode of ['walk', 'look', 'talk', 'use', 'scan', 'item']) {
    await floor(page, 'right');
    await expect(page.locator('#scene-frame')).toHaveAttribute('data-cursor', mode);
  }
  await page.getByRole('button', { name: 'Use Tricorder on Exposed bedrock', exact: true }).click();
  await expect(page.locator('.dialogue-text')).toContainText('residual subspace band');
  expect((await savedMission(page)).facts).toContain('e1-residue-scanned');
  await closeReading(page);
  await page.reload();
  await page.getByRole('button', { name: 'Continue your mission', exact: true }).click();
  await expect(page.locator('#carried-item')).toBeDisabled();
  await expect(page.locator('#scene-frame')).toHaveAttribute('data-cursor', 'look');
  expect((await savedMission(page)).facts).toContain('e1-residue-scanned');
});

test('consuming a carried component clears the slot and its cycling entry', async ({ page }) => {
  test.setTimeout(120_000);
  await testChapter(page, 2);
  const actions = chapterActions(2);
  const index = actions.findIndex((action) => action.type === 'item' && action.item === 'e2-induction-shunt');
  expect(index).toBeGreaterThan(0);
  for (const action of actions.slice(0, index)) await act(page, action);
  await closeReading(page);
  await page.keyboard.press('i');
  await page.locator('[data-command="equip-panel"][data-item="e2-induction-shunt"]').click();
  await expect(page.locator('#scene-frame')).toHaveAttribute('data-cursor', 'item');
  await page.locator('#hotspots [data-target="e2-waveguide"]').click();
  await expect(page.locator('.dialogue-text')).toContainText('seat the shunt');
  const mission = await savedMission(page, 'star-quest-episode-testing');
  expect(mission.facts).toContain('e2-deflector-coupled');
  expect(mission.inventory).not.toContain('e2-induction-shunt');
  await expect(page.locator('#carried-item')).toBeDisabled();
  await expect(page.locator('#scene-frame')).toHaveAttribute('data-cursor', 'use');
  await closeReading(page);
  await floor(page, 'right');
  await floor(page, 'right');
  await expect(page.locator('#scene-frame')).toHaveAttribute('data-cursor', 'walk');
});

test('only Walk moves on empty scenery; Look describes it and other modes request a target', async ({ page }) => {
  await start(page, 'episode');
  const before = await roomPixels(page);
  const saved = await saveBytes(page, 'star-quest-episode');
  const room = await page.locator('#room-name').innerText();
  await floor(page);
  await expect(page.locator('#panel-title')).toHaveText(room);
  expect(await roomPixels(page)).toBe(before);
  await closeReading(page);
  for (const key of ['3', '4', '5']) {
    await page.keyboard.press(key);
    await floor(page);
    await expect(page.locator('#notification')).toContainText('Select Walk to move');
    await expect(page.locator('#panel')).toBeHidden();
    expect(await roomPixels(page)).toBe(before);
  }
  await page.keyboard.press('1');
  await floor(page, 'middle');
  expect(await roomPixels(page)).toBe(before);
  await floor(page);
  await expect.poll(() => roomPixels(page)).not.toBe(before);
  expect(await saveBytes(page, 'star-quest-episode')).toBe(saved);
});

test('F2, arrows, Enter and shortcuts work without replacing focused room targets', async ({ page }) => {
  await start(page, 'episode');
  await page.keyboard.press('F2');
  await expect(page.locator('[data-tool="look"]')).toBeFocused();
  await page.mouse.move(0, 0);
  await expect(page.locator('#action-toolbar')).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.getByRole('button', { name: 'Control panel', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('button', { name: 'Open inventory', exact: true })).toBeFocused();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page.locator('#action-toolbar')).toBeHidden();
  await expect(page.locator('#toolbar-toggle')).toBeFocused();
  await page.keyboard.press('Tab');
  const target = page.locator('#hotspots [data-target="e1-basin"]');
  await expect(target).toBeFocused();
  await page.keyboard.press('5');
  await expect(target).toBeFocused();
  await expect(target).toHaveAccessibleName('scan Colony basin');
  await page.keyboard.press('2');
  const before = await roomPixels(page);
  await page.keyboard.press('Enter');
  await expect(page.locator('.dialogue-text')).toContainText('no corresponding debris field');
  expect(await roomPixels(page)).toBe(before);
});

test('panels, movies and the page outside the scene retain their own input', async ({ page }) => {
  await start(page, 'episode');
  await page.keyboard.press('3');
  const saved = await saveBytes(page, 'star-quest-episode');
  const contextBlocked = (selector: string) => page.locator(selector).evaluate((node) => {
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 });
    node.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(await contextBlocked('#selected-action')).toBe(false);
  await page.keyboard.press('i');
  await page.keyboard.press('2');
  await page.keyboard.press('F2');
  expect(await contextBlocked('#scene-frame')).toBe(false);
  await expect(page.locator('#scene-frame')).toHaveAttribute('data-cursor', 'talk');
  await expect(page.locator('#action-toolbar')).toBeHidden();
  await expect(page.locator('#panel-title')).toHaveText('Inventory');
  await closeReading(page);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Watch separation', exact: true }).click();
  await page.keyboard.press('1');
  await page.keyboard.press('F2');
  expect(await contextBlocked('#scene-frame')).toBe(false);
  await expect(page.locator('#scene-frame')).toHaveAttribute('data-cursor', 'talk');
  await expect(page.locator('.cinematic-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.cinematic-dialog')).toHaveCount(0);
  await expect(page.locator('#panel')).toBeHidden();
  expect(await saveBytes(page, 'star-quest-episode')).toBe(saved);
});

test('a walking hotspot action owns input until its movement finishes', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await testChapter(page, 3, false);
  await selectTool(page, 'walk');
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 1000));
  await page.locator('#hotspots [data-target="e3-fire-control"]').click();
  await page.keyboard.press('5');
  await page.keyboard.press('F2');
  await page.keyboard.press('Escape');
  await page.locator('#scene-frame').dispatchEvent('contextmenu', { button: 2 });
  await expect(page.locator('#scene-frame')).toHaveAttribute('data-cursor', 'walk');
  await expect(page.locator('#action-toolbar')).toBeHidden();
  await expect(page.locator('#panel')).toBeHidden();
  await page.clock.runFor(800);
  await page.keyboard.press('5');
  await expect(page.locator('#scene-frame')).toHaveAttribute('data-cursor', 'scan');
});

test.describe('touch controls', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test('keeps icons outside the picture and supports inventory and room-list taps', async ({ page }) => {
    await start(page, 'episode');
    const toolbar = page.locator('#action-toolbar');
    await expect(toolbar).toBeVisible();
    await expect(page.locator('#toolbar-toggle')).toBeHidden();
    const bar = await toolbar.boundingBox();
    const picture = await page.locator('#scene-frame').boundingBox();
    if (!bar || !picture) throw new Error('The touch controls are missing.');
    expect(bar.y + bar.height).toBeLessThanOrEqual(picture.y);
    for (const button of await toolbar.getByRole('button').all()) {
      const bounds = await button.boundingBox();
      expect(bounds?.width).toBeGreaterThanOrEqual(44);
      expect(bounds?.height).toBeGreaterThanOrEqual(44);
    }
    await toolbar.getByRole('button', { name: 'Open inventory', exact: true }).tap();
    await page.locator('[data-command="equip-panel"][data-item="tricorder"]').tap();
    await page.getByText('Room contents', { exact: false }).tap();
    await page.locator('#scene-index-items [data-target="e1-bedrock"]').tap();
    await expect(page.locator('.dialogue-text')).toContainText('residual subspace band');
    await closeReading(page);
    await toolbar.getByRole('button', { name: 'Look', exact: true }).tap();
    await expect(toolbar).toBeVisible();
    await page.locator('#hotspots [data-target="e1-basin"]').tap();
    await expect(page.locator('.dialogue-text')).toContainText('no corresponding debris field');
    await closeReading(page);
    expect((await savedMission(page)).facts).toEqual(expect.arrayContaining(['e1-residue-scanned', 'e1-colony-observed']));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await test.info().attach('touch-icon-bar', {
      body: await page.locator('.adventure-monitor').screenshot(), contentType: 'image/png',
    });
  });
});
