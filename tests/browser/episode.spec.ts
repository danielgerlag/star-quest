import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { campaign } from '../../src/episode';
import { walkthrough } from '../../src/episode/walkthrough';
import { chapterStart } from '../../src/episode/testing';
import { separation } from '../../src/episode/separation';
import { episodeAdventure, newlyEarnedFilms } from '../../src/adventures';
import { resolve, startCampaign } from '../../src/engine';
import { act, closeReading, expectPaintedRoom, saveBytes, selectTool, start } from './helpers';
import { chapterActions, pixels, savedMission, testChapter } from './episode-helpers';

async function reachSeparation(page: Page, beforeLast?: () => Promise<void>, reducedMotion = true): Promise<void> {
  await testChapter(page, 4, reducedMotion);
  const steps = chapterActions(4);
  for (const [index, action] of steps.entries()) {
    if (index === steps.length - 1) await beforeLast?.();
    await act(page, action);
  }
  await page.locator('#panel[open] [data-command="close"]').first().click();
  await expect(page.locator('.cinematic-dialog')).toBeVisible();
}

for (const history of [
  { leadership: 'delegate', rescue: 'close', link: 'paced' },
  { leadership: 'coordinate', rescue: 'wide', link: 'continuous' },
] as const) {
  test(`plays the episode from Jouret IV to Earth with ${Object.values(history).join('/')}`, async ({ page }) => {
    test.setTimeout(240_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await start(page, 'episode');
    await expect(page.locator('#assignment-label')).toHaveText('FIRST OFFICER');
    let expected = startCampaign(campaign);
    const movies: string[] = [];
    for (const [index, action] of walkthrough(history).entries()) {
      await test.step(`${index + 1}. ${JSON.stringify(action)}`, async () => {
        const previous = expected;
        const result = resolve(campaign, expected, action);
        expected = result.state;
        await act(page, action);
        if (result.dialogue?.speaker === campaign.protagonist) {
          await expect(page.locator('#panel .dialog-header .eyebrow')).toHaveText(expected.chapter <= 2 ? 'FIRST OFFICER' : 'ACTING CAPTAIN');
        }
        const films = newlyEarnedFilms(episodeAdventure.eventFilms, previous.facts, expected.facts);
        if (expected.chapter !== previous.chapter || films.length) {
          expect(await savedMission(page)).toEqual(expected);
          for (const { fact, film } of films) {
            await page.locator('#panel[open] [data-command="close"]').first().click();
            await expect(page.getByRole('dialog', { name: film.title, exact: true })).toBeVisible();
            movies.push(fact);
            await page.keyboard.press('Escape');
            if (expected.chapter !== previous.chapter) {
              await expect(page.getByRole('button', { name: 'Take the conn', exact: true })).toHaveCount(1);
            } else {
              await expect(page.locator('#panel')).not.toBeVisible();
              expect(await savedMission(page)).toEqual(expected);
            }
          }
        }
      });
    }
    await closeReading(page);
    expect(movies).toEqual([
      'picard-abducted', 'deflector-failed', 'saucer-separated',
      'picard-rescued', 'cube-destroyed', 'ship-rejoined',
    ]);
    await expect(page.locator('.ending-copy h1')).toHaveText('The Man Behind the Voice');
    await expect(page.locator('.ending-prose')).toContainText('Saucer and stardrive reunite');
    await expect(page.locator('.ending-prose')).toContainText('Shelby leaves to help rebuild the fleet');
    expect(await savedMission(page)).toEqual(expected);
    await test.info().attach('episode-ending', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    await page.reload();
    await page.getByRole('button', { name: 'Continue your mission', exact: true }).click();
    await expect(page.locator('#ending-screen')).toBeVisible();
    await expect(page.locator('.cinematic-dialog')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('all six episode chapter starts are playable, untouched, and accessible on mobile', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?testing=1');
  for (const [key, value] of Object.entries({ leadership: 'coordinate', rescue: 'wide', link: 'continuous' })) {
    await page.locator(`#chapter-test-options select[name="${key}"]`).selectOption(value);
  }
  for (const chapter of campaign.chapters) {
    await page.getByRole('button', { name: new RegExp(`^Start chapter ${chapter.id}:`) }).click();
    await page.getByRole('button', { name: 'Take the conn', exact: true }).click();
    await expect(page.locator('#objective-count')).toHaveText('0/4');
    await expect(page.locator('#room-name')).toHaveText(chapter.rooms[0].name);
    await expect(page.locator('.cinematic-dialog')).toHaveCount(0);
    await expectPaintedRoom(page);
    const saved = await savedMission(page, 'star-quest-episode-testing');
    expect(saved).toEqual(chapterStart(chapter.id, { leadership: 'coordinate', rescue: 'wide', link: 'continuous' }));
    await page.getByRole('button', { name: 'Chapter select', exact: true }).click();
    for (const [key, value] of Object.entries({ leadership: 'coordinate', rescue: 'wide', link: 'continuous' })) {
      await page.locator(`#chapter-test-options select[name="${key}"]`).selectOption(value);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.locator('.dialog-body').evaluate((body) => body.scrollWidth <= body.clientWidth)).toBe(true);
  await page.getByRole('button', { name: /^Start chapter 1:/ }).click();
  await page.getByRole('button', { name: 'Take the conn', exact: true }).click();
  await expect(page.locator('#inventory-items button')).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByText('Room contents', { exact: false }).click();
  await expect(page.locator('#scene-index-items button').first()).toBeVisible();
  await act(page, { type: 'interact', verb: 'look', target: 'e1-basin' });
  await closeReading(page);
  await page.getByRole('button', { name: 'Chapter select', exact: true }).click();
  await page.getByRole('button', { name: /^Start chapter 6:/ }).click();
  await expect(page.locator('#notification')).not.toHaveClass(/visible/);
});

test('the surface survey uses painted foundations, natural bedrock, and a coring clamp', async ({ page }) => {
  await start(page, 'episode');
  const bounds = await page.locator('#scene-mount canvas').boundingBox();
  if (!bounds) throw new Error('The colony scene is missing.');
  const click = (x: number, y: number) => page.mouse.click(bounds.x + x * bounds.width / 480, bounds.y + y * bounds.height / 300);
  await click(240, 142);
  await expect(page.locator('.dialogue-text')).toContainText('no corresponding debris field');
  await closeReading(page);
  await click(92, 200);
  await expect(page.locator('.dialogue-text')).toContainText('Reinforcement rods');
  await closeReading(page);
  await selectTool(page, 'scan');
  await click(180, 265);
  await expect(page.locator('.dialogue-text')).toContainText('residual subspace band');
  await closeReading(page);
  await selectTool(page, 'use');
  await click(60, 249);
  await expect(page.locator('#inventory-items [data-item="e1-core-sample"]')).toBeVisible();
  await expect(page.locator('#objective-count')).toHaveText('1/4');
  await closeReading(page);
  await page.getByRole('button', { name: /^Transport/ }).click();
  await expect(page.locator('.dialog-body')).toContainText('transporter carries the survey team');
  await page.locator('[data-command="travel"][data-room="e1-lab"]').click();
  await expect(page.locator('#room-name')).toHaveText('Survey Laboratory');
  await expect(page.getByRole('button', { name: /Turbolift/ })).toBeVisible();
});

test('episode and original adventures keep all four save namespaces separate', async ({ page }) => {
  await start(page);
  await act(page, { type: 'interact', verb: 'look', target: 'c1-chair' });
  await closeReading(page);
  await page.getByRole('button', { name: 'Save and load', exact: true }).click();
  await page.locator('[data-command="save-slot"][data-slot="manual-1"]').click();
  await expect(page.getByText('Mission record saved.', { exact: true })).toBeVisible();
  await closeReading(page);
  const original = await saveBytes(page);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Play the episode adventure', exact: true }).click();
  await page.getByRole('button', { name: 'Take command', exact: true }).click();
  await page.getByRole('button', { name: 'Take the conn', exact: true }).click();
  await act(page, walkthrough()[0]);
  await closeReading(page);
  await page.getByRole('button', { name: 'Save and load', exact: true }).click();
  await page.locator('[data-command="save-slot"][data-slot="manual-1"]').click();
  await expect(page.getByText('Mission record saved.', { exact: true })).toBeVisible();
  await closeReading(page);
  const episode = await saveBytes(page, 'star-quest-episode');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Chapter select (testing)', exact: true }).click();
  await page.getByRole('button', { name: /^Start chapter 6:/ }).click();
  await page.getByRole('button', { name: 'Take the conn', exact: true }).click();
  const episodeTest = await saveBytes(page, 'star-quest-episode-testing');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Original adventure / old saves', exact: true }).click();
  await expect(page).toHaveURL(/testing=1/);
  await expect(page).toHaveURL(/adventure=original/);
  await page.getByRole('button', { name: /^Start chapter 2:/ }).click();
  await page.getByRole('button', { name: 'Take the conn', exact: true }).click();
  expect(await saveBytes(page)).toBe(original);
  expect(await saveBytes(page, 'star-quest-episode')).toBe(episode);
  expect(await saveBytes(page, 'star-quest-episode-testing')).toBe(episodeTest);
  const originalTest = await saveBytes(page, 'star-quest-testing');
  await page.getByRole('button', { name: 'Return to normal play', exact: true }).click();
  await page.getByRole('button', { name: 'Continue your mission', exact: true }).click();
  await expect(page.locator('#chapter-number')).toHaveText('CHAPTER 01 / 06');
  expect(await saveBytes(page)).toBe(original);
  expect(await saveBytes(page, 'star-quest-testing')).toBe(originalTest);
});

test('separation plays in real time after the saved diversion order, before the rescue briefing', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await reachSeparation(page, undefined, false);
  const saved = await savedMission(page, 'star-quest-episode-testing');
  expect(saved.chapter).toBe(5);
  expect(saved.room).toBe('e5-battle');
  expect(saved.facts).toContain('saucer-separated');
  expect(saved.facts).not.toContain('picard-rescued');
  await expect(page.locator('#panel')).not.toBeVisible();
  for (const beat of separation.beats.slice(1)) {
    await expect(page.locator('#cinematic-description')).toHaveText(beat.description, { timeout: 12000 });
    await test.info().attach(`separation-${beat.at}`, { body: await page.locator('.cinematic-stage').screenshot(), contentType: 'image/png' });
  }
  await expect(page.locator('.cinematic-dialog')).toHaveCount(0, { timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Take the conn', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Take the conn', exact: true }).click();
  await expect(page.locator('#room-name')).toHaveText(campaign.chapters[4].rooms[0].name);
  await expect(page.locator('#objective-count')).toHaveText('0/4');
  expect(await savedMission(page, 'star-quest-episode-testing')).toEqual(saved);
  expect(errors).toEqual([]);
});

test('six stable separation stills fit mobile and replay without modifying saves', async ({ page }) => {
  await start(page, 'episode');
  await page.keyboard.press('Escape');
  await page.locator('[data-command="title"]').click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Larger reading text', { exact: true }).check();
  await closeReading(page);
  const before = await saveBytes(page, 'star-quest-episode');
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.getByRole('button', { name: 'Watch separation', exact: true }).click();
  const first = await pixels(page);
  await page.clock.fastForward(60000);
  expect(await pixels(page)).toBe(first);
  const frames = new Set<string>();
  for (let index = 1; index <= 6; index++) {
    await expect(page.locator('.cinematic-status')).toContainText(`STILL SCENES / ${index} / 6`);
    expect(await page.locator('.cinematic-dialog').evaluate((dialog) =>
      dialog.scrollWidth <= dialog.clientWidth && dialog.scrollHeight <= dialog.clientHeight)).toBe(true);
    frames.add(await pixels(page));
    if (index === 4) await test.info().attach('separation-mobile', { body: await page.screenshot(), contentType: 'image/png' });
    await page.getByRole('button', { name: index === 6 ? 'Finish sequence' : 'Next scene', exact: true }).click();
  }
  expect(frames.size).toBe(6);
  await expect(page.locator('.cinematic-dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Watch separation', exact: true })).toBeFocused();
  expect(await saveBytes(page, 'star-quest-episode')).toBe(before);
});

test('reloading during separation resumes the destination without a repeated movie or briefing', async ({ page }) => {
  await reachSeparation(page);
  const before = await saveBytes(page, 'star-quest-episode-testing');
  await page.reload();
  await page.getByRole('button', { name: 'Resume test mission', exact: true }).click();
  await expect(page.locator('#chapter-number')).toHaveText('CHAPTER 05 / 06');
  await expect(page.locator('.cinematic-dialog')).toHaveCount(0);
  await expect(page.locator('#panel')).not.toBeVisible();
  expect(await saveBytes(page, 'star-quest-episode-testing')).toBe(before);
  await act(page, chapterActions(5)[0]);
});

test('separation pause, hidden tabs, and Escape leave no delayed work or changed saves', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'No mission in progress', exact: true })).toBeDisabled();
  const before = await saveBytes(page, 'star-quest-episode');
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.getByRole('button', { name: 'Watch separation', exact: true }).click();
  await page.clock.runFor(9000);
  await page.getByRole('button', { name: 'Pause sequence', exact: true }).click();
  const paused = await pixels(page);
  await page.clock.fastForward(60000);
  expect(await pixels(page)).toBe(paused);
  for (const hidden of [true, false]) {
    await page.evaluate((value) => {
      Object.defineProperty(document, 'hidden', { configurable: true, value });
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);
    await page.clock.fastForward(60000);
    expect(await pixels(page)).toBe(paused);
  }
  await expect(page.getByRole('button', { name: 'Resume sequence', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Resume sequence', exact: true }).click();
  await page.clock.runFor(1000);
  expect(await pixels(page)).not.toBe(paused);
  await page.keyboard.press('Escape');
  await page.clock.fastForward(60000);
  await expect(page.locator('.cinematic-dialog')).toHaveCount(0);
  await expect(page.locator('#panel')).not.toBeVisible();
  expect(await saveBytes(page, 'star-quest-episode')).toBe(before);
});

test('a separation renderer failure is visible and still hands off to the saved rescue chapter', async ({ page }) => {
  await testChapter(page, 4);
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
  for (const action of chapterActions(4)) await act(page, action);
  await page.locator('#panel[open] [data-command="close"]').first().click();
  await expect(page.getByRole('heading', { name: 'The sequence could not play' })).toBeVisible();
  await expect(page.locator('.cinematic-dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Continue to briefing', exact: true }).click();
  await page.getByRole('button', { name: 'Take the conn', exact: true }).click();
  await expect(page.locator('#chapter-number')).toHaveText('CHAPTER 05 / 06');
  expect((await savedMission(page, 'star-quest-episode-testing')).facts).toContain('saucer-separated');
});

test('local storage failure still permits the separation handoff and a chapter 5 export', async ({ page }) => {
  await reachSeparation(page, async () => {
    await page.evaluate(() => {
      IDBObjectStore.prototype.put = () => { throw new DOMException('QA storage limit', 'QuotaExceededError'); };
    });
  });
  await page.getByRole('button', { name: 'Skip sequence', exact: true }).click();
  await page.getByRole('button', { name: 'Take the conn', exact: true }).click();
  await expect(page.locator('#save-status')).toContainText('NOT SAVED');
  await page.getByRole('button', { name: 'Save and load', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export current mission/ }).click();
  expect((await download).suggestedFilename()).toBe('star-quest-episode-test-chapter-5.json');
});

test('an unknown story selector reports an error before opening a save namespace', async ({ page }) => {
  await page.goto('/?adventure=unknown');
  await expect(page.getByRole('heading', { name: 'Adventure unavailable' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open the original adventure' })).toHaveAttribute('href', '/?adventure=original');
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
});
