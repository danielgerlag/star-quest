import { expect, test } from '@playwright/test';
import { closeReading, expectPaintedRoom, start } from './helpers';
import { episodeAdventure } from '../../src/adventures';

test('starts and resumes a selected test chapter in this browser engine', async ({ page }) => {
  await page.goto('/?adventure=original&testing=1');
  await page.getByLabel('Final strategy (chapter 6)', { exact: true }).selectOption('sacrifice');
  await page.getByRole('button', { name: /^Start chapter 6:/ }).click();
  await page.getByRole('button', { name: 'Take the conn', exact: true }).click();
  await expect(page.locator('#chapter-number')).toHaveText('CHAPTER 06 / 06');
  await expect(page.locator('#objective-count')).toHaveText('0/4');
  await page.reload();
  await page.getByRole('button', { name: 'Resume test mission', exact: true }).click();
  await expect(page.locator('#chapter-number')).toHaveText('CHAPTER 06 / 06');
  await expect(page.locator('.cinematic-dialog')).toHaveCount(0);
});

test('replays the captioned opening as reduced-motion scenes in this browser engine', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?adventure=original');
  await page.getByRole('button', { name: 'Watch intro', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'The last order', exact: true })).toBeVisible();
  for (let index = 1; index <= 6; index++) {
    await expect(page.locator('.cinematic-status')).toContainText(`STILL SCENES / ${index} / 6`);
    await page.getByRole('button', { name: index === 6 ? 'Finish intro' : 'Next scene', exact: true }).click();
  }
  await expect(page.locator('.cinematic-dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'No mission in progress', exact: true })).toBeDisabled();
});

test('renders, interacts and resumes a mission in this browser engine', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?adventure=original');
  await page.getByRole('button', { name: 'Take command', exact: true }).click();
  await page.getByRole('button', { name: 'Skip intro', exact: true }).click();
  await page.getByRole('button', { name: 'Take the conn', exact: true }).click();
  await expect(page.locator('#scene-mount canvas')).toBeVisible();
  await page.getByRole('button', { name: 'look Chair', exact: true }).click();
  await expect(page.locator('#panel')).toBeVisible();
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
  await page.reload();
  await page.getByRole('button', { name: 'Continue your mission', exact: true }).click();
  await expect(page.locator('#objective-count')).toHaveText('1/4');
  await page.keyboard.press('m');
  await expect(page.getByRole('heading', { name: 'Where to, Commander?' })).toBeVisible();
  await page.getByRole('button', { name: /Primary Power Gallery/ }).click();
  await expect(page.locator('#room-name')).toHaveText('Primary Power Gallery');
  expect(errors).toEqual([]);
});

test('starts the episode and replays separation in this browser engine', async ({ page }) => {
  await start(page, 'episode');
  await expect(page.locator('#assignment-label')).toHaveText('FIRST OFFICER');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Watch separation', exact: true }).click();
  await expect(page.locator('.cinematic-dialog')).toBeVisible();
  for (let index = 1; index <= 6; index++) {
    await expect(page.locator('.cinematic-status')).toContainText(`STILL SCENES / ${index} / 6`);
    await page.getByRole('button', { name: index === 6 ? 'Finish sequence' : 'Next scene', exact: true }).click();
  }
  await expect(page.locator('.cinematic-dialog')).toHaveCount(0);
  await page.keyboard.press('m');
  await expect(page.getByRole('heading', { name: 'Where to, Commander?' })).toBeVisible();
  await closeReading(page);
  await page.reload();
  await page.getByRole('button', { name: 'Continue your mission', exact: true }).click();
  await expectPaintedRoom(page);
});

test('replays the four later movies and restores the gallery in this browser engine', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Cutscenes', exact: true }).click();
  for (const { fact, label, film } of episodeAdventure.eventFilms) {
    if (fact === 'picard-abducted' || fact === 'saucer-separated') continue;
    const replay = page.getByRole('button', { name: `Watch ${label.toLowerCase()}`, exact: true });
    await replay.click();
    await expect(page.getByRole('dialog', { name: film.title, exact: true })).toBeVisible();
    for (const [index, beat] of film.beats.entries()) {
      await expect(page.locator('.cinematic-line')).toContainText(beat.text);
      await page.getByRole('button', { name: index === 5 ? 'Finish sequence' : 'Next scene', exact: true }).click();
    }
    await expect(replay).toBeFocused();
  }
  await closeReading(page);
  await expect(page.getByRole('button', { name: 'No mission in progress', exact: true })).toBeDisabled();
  expect(errors).toEqual([]);
});
