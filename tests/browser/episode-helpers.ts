import type { Page } from '@playwright/test';
import { campaign } from '../../src/episode';
import { walkthrough } from '../../src/episode/walkthrough';
import type { EpisodeOptions } from '../../src/episode/options';
import { resolve, startCampaign } from '../../src/engine';
import { parseSaveFile } from '../../src/saves';
import type { Action } from '../../src/model';
import { expectPaintedRoom } from './helpers';

export function chapterActions(chapter: number, history: EpisodeOptions = {}): Action[] {
  let state = startCampaign(campaign);
  const actions: Action[] = [];
  for (const action of walkthrough(history)) {
    if (state.chapter === chapter) actions.push(action);
    state = resolve(campaign, state, action).state;
  }
  return actions;
}

export async function savedMission(page: Page, databaseName = 'star-quest-episode') {
  const text = await page.evaluate((name) => new Promise<string>((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('saves', 'readonly');
      const entry = transaction.objectStore('saves').get('auto');
      transaction.oncomplete = () => {
        database.close();
        if (!entry.result) reject(new Error('The mission autosave is missing.'));
        else resolve(JSON.stringify(entry.result));
      };
      transaction.onerror = () => { database.close(); reject(transaction.error); };
    };
  }), databaseName);
  return parseSaveFile(campaign, text).state;
}

export async function testChapter(page: Page, chapter: number, reducedMotion = true): Promise<void> {
  await page.emulateMedia({ reducedMotion: reducedMotion ? 'reduce' : 'no-preference' });
  await page.goto('/?testing=1');
  await page.getByRole('button', { name: new RegExp(`^Start chapter ${chapter}:`) }).click();
  await page.getByRole('button', { name: 'Take the conn', exact: true }).click();
  await expectPaintedRoom(page);
}

export async function pixels(page: Page): Promise<string> {
  return page.locator('.cinematic-stage').evaluate((canvas) => {
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error('The movie canvas is missing.');
    return canvas.toDataURL();
  });
}
