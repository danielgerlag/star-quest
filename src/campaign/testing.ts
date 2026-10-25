import { resolve, startCampaign } from '../engine';
import type { GameState } from '../model';
import { campaign } from './index';
import { walkthrough } from './walkthrough';
import type { WalkthroughOptions } from './walkthrough';

export function chapterStart(chapterId: number, options: WalkthroughOptions = {}): GameState {
  if (!campaign.chapters.some((chapter) => chapter.id === chapterId)) {
    throw new Error(`Unknown test chapter ${chapterId}.`);
  }
  let state = startCampaign(campaign);
  for (const [index, action] of walkthrough(options).entries()) {
    if (state.chapter === chapterId) return state;
    const transition = resolve(campaign, state, action);
    if (!transition.changed) {
      throw new Error(`Could not prepare chapter ${chapterId}: walkthrough step ${index + 1} was rejected. ${transition.dialogue?.lines.join(' ') ?? ''}`);
    }
    state = transition.state;
  }
  throw new Error(`The walkthrough did not reach chapter ${chapterId}.`);
}
