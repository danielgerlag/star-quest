import type { Campaign, GameState } from './model';
import type { Cinematic } from './cinematic';
import { campaign as originalCampaign } from './campaign';
import { campaign as episodeCampaign } from './episode';
import { opening } from './campaign/opening';
import { separation } from './episode/separation';
import { deflectorAttack } from './episode/deflector';
import { shuttleRescue } from './episode/rescue';
import { cubeDestruction } from './episode/destruction';
import { rejoining } from './episode/rejoining';
import { chapterStart as originalChapterStart } from './campaign/testing';
import { chapterStart as episodeChapterStart } from './episode/testing';
import { walkthroughOptionsSchema } from './campaign/walkthrough';
import { episodeOptionsSchema } from './episode/options';

export interface StoryFilm {
  readonly fact: string;
  readonly label: string;
  readonly chapter: number;
  readonly film: Cinematic;
}

export interface Adventure {
  campaign: Campaign;
  storage: 'original' | 'episode';
  startFilm?: Cinematic;
  eventFilms: readonly StoryFilm[];
  testing: {
    defaults: Readonly<Record<string, string>>;
    labels: Readonly<Record<string, string>>;
    chapterStart: (chapterId: number, rawOptions: unknown) => GameState;
  };
}

export const originalAdventure: Adventure = {
  campaign: originalCampaign,
  storage: 'original',
  startFilm: opening,
  eventFilms: [],
  testing: {
    defaults: walkthroughOptionsSchema.parse({}),
    labels: { evacuation: 'Evacuation history', relay: 'Relay history', contact: 'Picard rescue history', strategy: 'Final strategy (chapter 6)' },
    chapterStart: (chapter, raw) => originalChapterStart(chapter, walkthroughOptionsSchema.parse(raw)),
  },
};

export const episodeAdventure: Adventure = {
  campaign: episodeCampaign,
  storage: 'episode',
  eventFilms: [
    { fact: 'picard-abducted', label: 'Picard abduction', chapter: 2, film: opening },
    { fact: 'deflector-failed', label: 'Deflector attack', chapter: 3, film: deflectorAttack },
    { fact: 'saucer-separated', label: 'Saucer separation', chapter: 4, film: separation },
    { fact: 'picard-rescued', label: 'Shuttle rescue', chapter: 5, film: shuttleRescue },
    { fact: 'cube-destroyed', label: 'Cube destruction', chapter: 6, film: cubeDestruction },
    { fact: 'ship-rejoined', label: 'Enterprise rejoining', chapter: 6, film: rejoining },
  ],
  testing: {
    defaults: episodeOptionsSchema.parse({}),
    labels: { leadership: 'Work with Shelby (chapter 1)', rescue: 'Shuttle approach (chapter 4)', link: 'Neural link (chapter 5)' },
    chapterStart: episodeChapterStart,
  },
};

export function newlyEarnedFilms(
  films: readonly StoryFilm[], before: readonly string[], after: readonly string[],
): readonly StoryFilm[] {
  return films.filter(({ fact }) => !before.includes(fact) && after.includes(fact));
}

export function adventureFor(value: string | null): Adventure {
  if (value === null || value === 'episode') return episodeAdventure;
  if (value === 'original') return originalAdventure;
  throw new Error(`Unknown adventure "${value}". Use the episode or original adventure link.`);
}
