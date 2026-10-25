import { describe, expect, it } from 'vitest';
import { campaign } from '../src/campaign';
import { walkthrough } from '../src/campaign/walkthrough';
import { chapterStart } from '../src/campaign/testing';
import { chapterFor, decodeState, meets, resolve, startCampaign, validateCampaign } from '../src/engine';
import { encodeSave, parseSaveFile } from '../src/saves';

describe('complete campaign', () => {
  it('has complete content with valid references, no empty chapters and three conclusions', () => {
    expect(validateCampaign(campaign)).toEqual([]);
    expect(campaign.chapters.map((chapter) => chapter.id)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(new Set(campaign.chapters.flatMap((chapter) => chapter.rooms.map((room) => room.id))).size).toBeGreaterThanOrEqual(20);
    expect(campaign.chapters.reduce((sum, chapter) => sum + chapter.objectives.length, 0)).toBeGreaterThanOrEqual(23);
    expect(campaign.endings.length).toBeGreaterThanOrEqual(3);
    for (const chapter of campaign.chapters) {
      expect(chapter.rooms.length).toBeGreaterThanOrEqual(3);
      for (const objective of chapter.objectives) {
        expect(objective.hints).toHaveLength(3);
        expect(objective.hints.every((hint) => hint.length > 20)).toBe(true);
      }
    }
    for (const choice of campaign.chapters.flatMap((chapter) => chapter.rooms)
      .flatMap((room) => room.hotspots).flatMap((target) => target.interactions)
      .flatMap((interaction) => interaction.choices ?? [])) {
      if (choice.effects?.some((effect) => effect.type === 'commit')) {
        expect(choice.confirm?.length).toBeGreaterThan(50);
      }
    }
  });

  it('gives physical objects authored artwork within their interactive regions', () => {
    const targets = campaign.chapters.flatMap(chapter => chapter.rooms.flatMap(room => room.hotspots));
    for (const target of targets) {
      if (target.kind !== 'object' && target.kind !== 'console') continue;
      if (target.prop === null) {
        expect(['c1-chair', 'c1-seal', 'c1-board']).toContain(target.id);
        continue;
      }
      expect(target.prop).toBeTruthy();
      expect(target.width).toBe(112);
      expect(target.height).toBe(65);
    }
    expect(targets.find(target => target.id === 'c2-dispatch')?.prop).toBe('cylinder');
    expect(targets.find(target => target.id === 'c1-crate')?.prop).toBe('crate');
    expect(targets.filter(target => target.prop === null).map(target => target.id))
      .toEqual(['c1-chair', 'c1-seal', 'c1-board']);
    expect(targets.find(target => target.id === 'c1-chair')).toMatchObject({
      prop: null, x: 211, y: 141, width: 58, height: 61,
    });
    const chair = targets.find(target => target.id === 'c1-chair');
    expect(chair && chair.x + chair.width / 2).toBe(240);
  });

  for (const evacuation of ['aboard', 'escort'] as const) {
    for (const relay of ['cut', 'supervised'] as const) {
      for (const contact of ['medical', 'tactical'] as const) {
        for (const strategy of ['precision', 'fleet', 'sacrifice'] as const) {
          it(`finishes ${evacuation}/${relay}/${contact}/${strategy} through legal actions`, () => {
            let state = startCampaign(campaign);
            const options = { evacuation, relay, contact, strategy };
            const steps = walkthrough(options);
            expect(chapterStart(1, options)).toEqual(state);
            const reached = new Set([1]);
            let previousChapter = 1;
            expect(steps.length).toBeGreaterThan(60);
            for (const [index, action] of steps.entries()) {
              const previous = state;
              const transition = resolve(campaign, state, action);
              expect(transition.changed, `Rejected step ${index}: ${JSON.stringify(action)}: ${transition.dialogue?.lines.join(' ')}`).toBe(true);
              state = transition.state;
              if (state.chapter !== previousChapter) {
                expect(chapterStart(state.chapter, options)).toEqual(state);
                for (const objective of chapterFor(campaign, previous).objectives) {
                  expect(meets(state, objective.done), `Incomplete chapter ${previousChapter} objective: ${objective.text}`).toBe(true);
                }
                reached.add(state.chapter);
                previousChapter = state.chapter;
              }
              expect(decodeState(campaign, JSON.parse(JSON.stringify(state)))).toEqual(state);
              expect(state.facts.length).toBe(new Set(state.facts).size);
              expect(state.inventory.length).toBe(new Set(state.inventory).size);
              expect(state.evidence.length).toBe(new Set(state.evidence).size);
            }
            expect([...reached]).toEqual([1, 2, 3, 4, 5, 6]);
            expect(state.ending).not.toBeNull();
            expect(state.commitments).toMatchObject({ evacuation, relay, contact, strategy });
            if (strategy === 'sacrifice') expect(state.ending).toBe('last-command');
            expect(parseSaveFile(campaign, JSON.stringify(encodeSave(state, 'Completed route'))).state).toEqual(state);
          });
        }
      }
    }
  }

  it('cannot jump chapters, invent inventory or select unoffered decisions', () => {
    const state = startCampaign(campaign);
    expect(resolve(campaign, state, { type: 'travel', room: '__not_a_room__' }).changed).toBe(false);
    const target = campaign.chapters[0].rooms[0].hotspots[0];
    expect(resolve(campaign, state, { type: 'item', target: target.id, item: '__unowned__' }).changed).toBe(false);
    expect(resolve(campaign, state, { type: 'choose', interaction: '__not_open__', choice: '__not_offered__' }).changed).toBe(false);
  });

  it('supports the alternate comparison records and inventory tricorder across the full story', () => {
    for (const record of ['manifest', 'medical-report']) {
      let state = startCampaign(campaign);
      for (const step of walkthrough()) {
        const action = step.type === 'interact' && step.verb === 'scan'
          ? { type: 'item' as const, target: step.target, item: 'tricorder' }
          : step.type === 'item' && step.target === 'c1-med-records'
            ? { ...step, item: record } : step;
        const next = resolve(campaign, state, action);
        expect(next.changed).toBe(true);
        state = next.state;
      }
      expect(state.ending).toBe('recovery');
    }
  });
});
