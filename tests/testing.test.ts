import { describe, expect, it } from 'vitest';
import { campaign } from '../src/campaign';
import { chapterStart } from '../src/campaign/testing';
import { walkthroughOptionsSchema } from '../src/campaign/walkthrough';
import { chapterFor, decodeState, meets } from '../src/engine';
import { encodeSave, parseSaveFile } from '../src/saves';

describe('chapter testing fixtures', () => {
  for (const chapter of campaign.chapters) {
    it(`starts chapter ${chapter.id} with complete prerequisites and no current objectives done`, () => {
      const state = chapterStart(chapter.id);
      expect(state.chapter).toBe(chapter.id);
      expect(state.room).toBe(chapter.rooms[0].id);
      expect(state.activeInteraction).toBeNull();
      expect(state.ending).toBeNull();
      expect(state.inventory).toContain('padd');
      for (const previous of campaign.chapters.filter((entry) => entry.id < chapter.id)) {
        for (const objective of previous.objectives) expect(meets(state, objective.done)).toBe(true);
      }
      for (const objective of chapterFor(campaign, state).objectives) expect(meets(state, objective.done)).toBe(false);
      expect(decodeState(campaign, state)).toEqual(state);
      expect(parseSaveFile(campaign, JSON.stringify(encodeSave(state, 'Chapter test'))).state).toEqual(state);
    });
  }

  it('returns independent states and leaves unplayed decisions available', () => {
    const first = chapterStart(5, { evacuation: 'escort', relay: 'supervised', contact: 'tactical', strategy: 'sacrifice' });
    expect(first.commitments).toEqual({ evacuation: 'escort', relay: 'supervised', contact: 'tactical' });
    const untouched = structuredClone(first);
    first.inventory.length = 0;
    first.facts.length = 0;
    expect(chapterStart(5, { evacuation: 'escort', relay: 'supervised', contact: 'tactical' })).toEqual(untouched);
    expect(chapterStart(6, { strategy: 'sacrifice' }).commitments.strategy).toBe('sacrifice');
  });

  it('rejects invalid chapters instead of producing a partial or invented state', () => {
    for (const chapter of [-1, 0, 7, 1.5, NaN, Infinity]) {
      expect(() => chapterStart(chapter)).toThrow('Unknown test chapter');
    }
  });

  it('accepts exactly the authored route choices at the UI boundary', () => {
    expect(walkthroughOptionsSchema.keyof().options.sort()).toEqual(Object.keys(campaign.commitmentLabels).sort());
    for (const [key, choices] of Object.entries(campaign.commitmentLabels)) {
      for (const value of Object.keys(choices)) {
        expect(walkthroughOptionsSchema.safeParse({ [key]: value }).success).toBe(true);
      }
      expect(walkthroughOptionsSchema.safeParse({ [key]: '__invalid__' }).success).toBe(false);
    }
  });
});
