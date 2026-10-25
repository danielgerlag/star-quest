import type { Action } from '../model';
import { act1Steps } from './act1';
import { act2Steps } from './act2';
import { episodeOptionsSchema } from './options';
import type { EpisodeOptions } from './options';

export function walkthrough(options: EpisodeOptions = {}): Action[] {
  const history = episodeOptionsSchema.parse(options);
  return [...act1Steps(history), ...act2Steps(history)];
}
