import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { episodeAdventure } from '../../src/adventures';
import type { StoryFilm } from '../../src/adventures';
import { campaign } from '../../src/episode';
import { chapterStart } from '../../src/episode/testing';
import { resolve } from '../../src/engine';
import type { Action } from '../../src/model';
import { parseSaveFile } from '../../src/saves';
import { act, closeReading, saveBytes, start } from './helpers';
import { chapterActions, pixels, savedMission, testChapter } from './episode-helpers';

const additions = episodeAdventure.eventFilms.filter(({ fact }) =>
  ['deflector-failed', 'picard-rescued', 'cube-destroyed', 'ship-rejoined'].includes(fact));

async function reachEvent(page: Page, entry: StoryFilm, reducedMotion = true, beforeTrigger?: () => Promise<void>) {
  await testChapter(page, entry.chapter, reducedMotion);
  let state = chapterStart(entry.chapter);
  const actions = chapterActions(entry.chapter);
  for (const [index, action] of actions.entries()) {
    const next = resolve(campaign, state, action).state;
    const earned = !state.facts.includes(entry.fact) && next.facts.includes(entry.fact);
    if (earned) await beforeTrigger?.();
    await act(page, action);
    state = next;
    if (earned) return { state, following: actions[index + 1] };
  }
  throw new Error(`The walkthrough never earns ${entry.fact}.`);
}

async function closeResult(page: Page): Promise<void> {
  await page.locator('#panel[open] [data-command="close"]').first().click();
}

for (const entry of additions) {
  test(`${entry.label} animates after its saved event, pauses, finishes, and cannot repeat`, async ({ page }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
    const { state, following } = await reachEvent(page, entry, false);
    expect(await savedMission(page, 'star-quest-episode-testing')).toEqual(state);
    const before = await saveBytes(page, 'star-quest-episode-testing');
    await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 1000));
    await closeResult(page);
    await expect(page.getByRole('dialog', { name: entry.film.title, exact: true })).toBeVisible();
    const frames: string[] = [];
    let elapsed = 0;
    for (const [index, beat] of entry.film.beats.entries()) {
      await page.clock.runFor(beat.stillAt - elapsed);
      elapsed = beat.stillAt;
      await expect(page.locator('.cinematic-line')).toContainText(beat.text);
      frames.push(await pixels(page));
      await test.info().attach(`${entry.fact}-${index + 1}`, {
        body: await page.locator('.cinematic-stage').screenshot(), contentType: 'image/png',
      });
      if (index === 0) {
        await page.getByRole('button', { name: 'Pause sequence', exact: true }).click();
        for (const hidden of [true, false]) {
          await page.evaluate((value) => {
            Object.defineProperty(document, 'hidden', { configurable: true, value });
            document.dispatchEvent(new Event('visibilitychange'));
          }, hidden);
          await page.clock.fastForward(30_000);
          expect(await pixels(page)).toBe(frames[0]);
        }
        await page.getByRole('button', { name: 'Resume sequence', exact: true }).click();
      }
    }
    expect(new Set(frames).size).toBe(6);
    await page.clock.runFor(entry.film.duration - elapsed + 100);
    await expect(page.locator('.cinematic-dialog')).toHaveCount(0);
    await expect(page.locator('#panel')).not.toBeVisible();
    await expect(page.locator('#ending-screen')).not.toBeVisible();
    expect(await saveBytes(page, 'star-quest-episode-testing')).toBe(before);
    await page.clock.resume();
    const repeatTargets: Record<string, string> = {
      'deflector-failed': 'e3-fire-control', 'picard-rescued': 'e5-mission',
      'cube-destroyed': 'e6-command', 'ship-rejoined': 'e6-docking',
    };
    const repeat: Action = { type: 'interact', verb: 'use', target: repeatTargets[entry.fact] };
    await act(page, repeat);
    await closeResult(page);
    await expect(page.locator('.cinematic-dialog')).toHaveCount(0);
    expect(following).toBeDefined();
    if (!following) throw new Error('Recovery gameplay must follow the movie.');
    await act(page, following);
    expect(errors).toEqual([]);
  });
}

test('all new event movies can be interrupted by reload without replay or a spurious briefing', async ({ page }) => {
  test.setTimeout(150_000);
  for (const entry of additions) {
    const { state, following } = await reachEvent(page, entry);
    await closeResult(page);
    await expect(page.getByRole('dialog', { name: entry.film.title, exact: true })).toBeVisible();
    const before = await saveBytes(page, 'star-quest-episode-testing');
    await page.reload();
    await page.getByRole('button', { name: 'Resume test mission', exact: true }).click();
    await expect(page.locator('.cinematic-dialog')).toHaveCount(0);
    await expect(page.locator('#panel')).not.toBeVisible();
    expect(await savedMission(page, 'star-quest-episode-testing')).toEqual(state);
    expect(await saveBytes(page, 'star-quest-episode-testing')).toBe(before);
    if (!following) throw new Error('Recovery gameplay must follow the movie.');
    await act(page, following);
  }
});

test('the six-film gallery is save-neutral, keyboard-safe, and readable as mobile stills', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await start(page, 'episode');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Larger reading text', { exact: true }).check();
  await closeReading(page);
  const before = await saveBytes(page, 'star-quest-episode');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Cutscenes', exact: true }).click();
  await expect(page.locator('.film-grid button')).toHaveCount(6);
  expect(await page.locator('.dialog-body').evaluate((body) => body.scrollWidth <= body.clientWidth)).toBe(true);
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 1000));
  for (const entry of episodeAdventure.eventFilms) {
    const replay = page.getByRole('button', { name: `Watch ${entry.label.toLowerCase()}`, exact: true });
    await replay.click();
    for (const [index, beat] of entry.film.beats.entries()) {
      await expect(page.locator('.cinematic-status')).toContainText(`STILL SCENES / ${index + 1} / 6`);
      await expect(page.locator('.cinematic-line')).toContainText(beat.text);
      const still = await pixels(page);
      await page.clock.fastForward(30_000);
      expect(await pixels(page)).toBe(still);
      expect(await page.locator('.cinematic-dialog').evaluate((dialog) =>
        dialog.scrollWidth <= dialog.clientWidth && dialog.scrollHeight <= dialog.clientHeight)).toBe(true);
      if (index === 5) await test.info().attach(`${entry.fact}-mobile`, {
        body: await page.screenshot(), contentType: 'image/png',
      });
      await page.getByRole('button', {
        name: index === 5 ? `Finish ${entry.film.noun}` : 'Next scene', exact: true,
      }).click();
    }
    await expect(replay).toBeFocused();
    expect(await saveBytes(page, 'star-quest-episode')).toBe(before);
    await replay.click();
    await page.keyboard.press('Escape');
    await page.clock.fastForward(60_000);
    await expect(page.locator('.cinematic-dialog')).toHaveCount(0);
    await expect(replay).toBeFocused();
  }
  await closeResult(page);
  await page.keyboard.press('m');
  await expect(page.getByRole('heading', { name: 'Where to, Commander?' })).toBeVisible();
  expect(await saveBytes(page, 'star-quest-episode')).toBe(before);
});

test('an in-chapter renderer and storage failure remain visible without losing export-only progress', async ({ page }) => {
  const entry = additions.find(({ fact }) => fact === 'deflector-failed');
  if (!entry) throw new Error('The deflector film is missing.');
  const { state } = await reachEvent(page, entry, true, async () => {
    await page.evaluate(() => {
      IDBObjectStore.prototype.put = () => { throw new DOMException('QA storage limit', 'QuotaExceededError'); };
      const original = HTMLCanvasElement.prototype.getContext;
      Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
        configurable: true,
        value: function (this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
          return this.classList.contains('cinematic-stage') ? null : Reflect.apply(original, this, [kind, ...args]);
        },
      });
    });
  });
  await closeResult(page);
  await expect(page.getByRole('heading', { name: 'The sequence could not play' })).toBeVisible();
  await expect(page.locator('#save-status')).toContainText('NOT SAVED');
  await page.getByRole('button', { name: 'Close notice', exact: true }).click();
  await expect(page.locator('#panel')).not.toBeVisible();
  await expect(page.locator('.cinematic-dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Save and load', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export current mission/ }).click();
  const exported = await download;
  expect(exported.suggestedFilename()).toBe('star-quest-episode-test-chapter-3.json');
  const path = await exported.path();
  if (!path) throw new Error('The mission export was not downloaded.');
  expect(parseSaveFile(campaign, await readFile(path, 'utf8')).state).toEqual(state);
  await closeReading(page);
  await act(page, { type: 'interact', verb: 'scan', target: 'e3-telemetry' });
  await expect(page.locator('.dialogue-text')).toContainText('assimilated Picard');
});
