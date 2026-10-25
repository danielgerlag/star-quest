import { resolve, startCampaign } from '../engine';
import type { GameState } from '../model';
import { campaign } from './index';
import { episodeOptionsSchema } from './options';
import { walkthrough } from './walkthrough';

export function chapterStart(chapterId: number, rawOptions: unknown = {}): GameState {
  const options = episodeOptionsSchema.parse(rawOptions);
  if (!campaign.chapters.some((chapter) => chapter.id === chapterId)) {
    throw new Error(`Unknown test chapter ${chapterId}.`);
  }
  let state = startCampaign(campaign);
  for (const [index, action] of walkthrough(options).entries()) {
    if (state.chapter === chapterId) return state;
    const result = resolve(campaign, state, action);
    if (!result.changed) {
      throw new Error(`Could not prepare chapter ${chapterId}: episode step ${index + 1} was rejected. ${result.dialogue?.lines.join(' ') ?? ''}`);
    }
    state = result.state;
  }
  throw new Error(`The episode walkthrough did not reach chapter ${chapterId}.`);
}
