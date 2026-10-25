import { describe, expect, it } from 'vitest';
import { campaign } from '../src/episode';
import { campaign as original } from '../src/campaign';
import { chapterStart } from '../src/episode/testing';
import { episodeOptionsSchema, episodeRoutes } from '../src/episode/options';
import { walkthrough } from '../src/episode/walkthrough';
import { adventureFor, episodeAdventure, newlyEarnedFilms, originalAdventure } from '../src/adventures';
import { chapterFor, decodeState, meets, resolve, startCampaign, validateCampaign } from '../src/engine';
import { encodeSave, parseSaveFile } from '../src/saves';
import type { Action } from '../src/model';

const milestones = [
  'picard-abducted', 'locutus-revealed', 'deflector-failed', 'riker-promoted',
  'shelby-appointed', 'saucer-separated', 'picard-rescued', 'data-linked',
  'regeneration-command', 'cube-destroyed', 'earth-safe', 'ship-rejoined',
] as const;
const filmMilestones = [
  'picard-abducted', 'deflector-failed', 'saucer-separated',
  'picard-rescued', 'cube-destroyed', 'ship-rejoined',
];

describe('The Best of Both Worlds episode campaign', () => {
  it('has six authored chapters, complete references and one canonical resolution', () => {
    expect(validateCampaign(campaign)).toEqual([]);
    expect(campaign.id).toBe('best-of-both-worlds');
    expect(campaign.chapters.map((chapter) => chapter.id)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(campaign.endings.map((ending) => ending.id)).toEqual(['home-again']);
    expect(campaign.chapters.slice(0, 2).every((chapter) => chapter.assignment === 'FIRST OFFICER')).toBe(true);
    expect(campaign.chapters.slice(2).every((chapter) => chapter.assignment === 'ACTING CAPTAIN')).toBe(true);
    for (const chapter of campaign.chapters) {
      expect(chapter.rooms).toHaveLength(4);
      expect(chapter.objectives).toHaveLength(4);
      for (const objective of chapter.objectives) {
        expect(objective.hints).toHaveLength(3);
        expect(objective.hints.every((hint) => hint.length > 20)).toBe(true);
      }
      for (const choice of chapter.rooms.flatMap((room) => room.hotspots)
        .flatMap((target) => target.interactions).flatMap((entry) => entry.choices ?? [])) {
        if (choice.effects?.some((effect) => effect.type === 'commit')) {
          expect(choice.confirm?.length).toBeGreaterThan(50);
        }
      }
    }
  });

  for (const history of episodeRoutes) {
    it(`plays ${Object.values(history).join('/')} through every canonical beat and chapter fixture`, () => {
      let state = startCampaign(campaign);
      expect(chapterStart(1, history)).toEqual(state);
      const reached = [1];
      const firstSeen = new Map<string, number>();
      const playedFilms: string[] = [];
      const steps = walkthrough(history);
      expect(steps.length).toBeGreaterThanOrEqual(90);
      for (const [index, action] of steps.entries()) {
        const previous = state;
        const result = resolve(campaign, previous, action);
        expect(result.changed, `Rejected ${index + 1}: ${JSON.stringify(action)}. ${result.dialogue?.lines.join(' ')}`).toBe(true);
        state = result.state;
        const films = newlyEarnedFilms(episodeAdventure.eventFilms, previous.facts, state.facts);
        expect(films.length).toBeLessThanOrEqual(1);
        for (const entry of films) {
          playedFilms.push(entry.fact);
          expect(previous.chapter).toBe(entry.chapter);
          expect(result.dialogue?.choices).toEqual([]);
          expect(state.ending).toBeNull();
          const repeated = resolve(campaign, state, action);
          expect(newlyEarnedFilms(episodeAdventure.eventFilms, state.facts, repeated.state.facts)).toEqual([]);
        }
        expect(newlyEarnedFilms(episodeAdventure.eventFilms, state.facts, state.facts)).toEqual([]);
        expect(decodeState(campaign, structuredClone(state))).toEqual(state);
        for (const fact of milestones) {
          if (state.facts.includes(fact) && !firstSeen.has(fact)) firstSeen.set(fact, index);
        }
        if (state.chapter !== previous.chapter) {
          expect(state.chapter).toBe(previous.chapter + 1);
          reached.push(state.chapter);
          expect(chapterStart(state.chapter, history)).toEqual(state);
          for (const objective of chapterFor(campaign, previous).objectives) {
            expect(meets(state, objective.done), `Unfinished chapter ${previous.chapter}: ${objective.text}`).toBe(true);
          }
        }
      }
      expect(reached).toEqual([1, 2, 3, 4, 5, 6]);
      expect(playedFilms).toEqual(filmMilestones);
      expect([...firstSeen.keys()]).toEqual(milestones);
      for (let index = 1; index < milestones.length; index++) {
        expect(firstSeen.get(milestones[index])).toBeGreaterThanOrEqual(firstSeen.get(milestones[index - 1])!);
      }
      expect(state.ending).toBe('home-again');
      expect(state.commitments).toEqual(history);
      expect(state.facts).toEqual(expect.arrayContaining([...milestones]));
      for (const objective of chapterFor(campaign, state).objectives) expect(meets(state, objective.done)).toBe(true);
      expect(new Set(state.facts).size).toBe(state.facts.length);
      expect(new Set(state.inventory).size).toBe(state.inventory.length);
      expect(new Set(state.evidence).size).toBe(state.evidence.length);
      expect(parseSaveFile(campaign, JSON.stringify(encodeSave(state, 'Episode complete'))).state).toEqual(state);
    });
  }

  it('starts each testing chapter with only earned prior history', () => {
    for (const chapter of campaign.chapters) {
      const state = chapterStart(chapter.id);
      expect(state.room).toBe(chapter.rooms[0].id);
      expect(state.activeInteraction).toBeNull();
      expect(state.ending).toBeNull();
      for (const previous of campaign.chapters.filter((entry) => entry.id < chapter.id)) {
        for (const objective of previous.objectives) expect(meets(state, objective.done)).toBe(true);
      }
      for (const objective of chapter.objectives) expect(meets(state, objective.done)).toBe(false);
      expect(Boolean(state.facts.includes('picard-abducted'))).toBe(chapter.id >= 3);
      expect(Boolean(state.facts.includes('deflector-failed'))).toBe(chapter.id >= 4);
      expect(Boolean(state.facts.includes('saucer-separated'))).toBe(chapter.id >= 5);
      expect(Boolean(state.facts.includes('picard-rescued'))).toBe(chapter.id >= 6);
    }
    expect(chapterStart(4, { rescue: 'wide', link: 'continuous' }).commitments).toEqual({ leadership: 'delegate' });
    expect(chapterStart(5, { rescue: 'wide', link: 'continuous' }).commitments).toEqual({ leadership: 'delegate', rescue: 'wide' });
    const modified = chapterStart(6);
    modified.facts.length = 0;
    expect(chapterStart(6).facts.length).toBeGreaterThan(0);
  });

  it('cannot activate chapter exits or the ending before preparing their prerequisites', () => {
    for (const chapter of campaign.chapters) {
      const initial = chapterStart(chapter.id);
      for (const room of chapter.rooms) {
        const located = room.id === initial.room ? initial : resolve(campaign, initial, { type: 'travel', room: room.id }).state;
        for (const target of room.hotspots) {
          for (const interaction of target.interactions) {
            const effects = [...interaction.effects ?? [], ...interaction.choices?.flatMap((choice) => choice.effects ?? []) ?? []];
            if (!effects.some((effect) => effect.type === 'chapter' || effect.type === 'ending')) continue;
            const action: Action = 'verb' in interaction.trigger
              ? { type: 'interact', target: target.id, verb: interaction.trigger.verb }
              : { type: 'item', target: target.id, item: interaction.trigger.item };
            const opened = resolve(campaign, located, action);
            expect(opened.state.chapter).toBe(chapter.id);
            expect(opened.state.ending).toBeNull();
            for (const choice of opened.dialogue?.choices ?? []) {
              const selected = resolve(campaign, opened.state, { type: 'choose', interaction: interaction.id, choice: choice.id });
              expect(selected.state.chapter).toBe(chapter.id);
              expect(selected.state.ending).toBeNull();
            }
          }
        }
      }
    }
  });

  it('supports using the inventory tricorder for every required scan', () => {
    let state = startCampaign(campaign);
    for (const step of walkthrough()) {
      const action: Action = step.type === 'interact' && step.verb === 'scan'
        ? { type: 'item', item: 'tricorder', target: step.target } : step;
      const result = resolve(campaign, state, action);
      expect(result.changed, JSON.stringify(action)).toBe(true);
      state = result.state;
    }
    expect(state.ending).toBe('home-again');
  });

  it('validates testing input and cannot reinterpret original saves as episode saves', () => {
    for (const id of [-1, 0, 7, 1.5, NaN, Infinity]) expect(() => chapterStart(id)).toThrow('Unknown test chapter');
    expect(episodeOptionsSchema.keyof().options.sort()).toEqual(Object.keys(campaign.commitmentLabels).sort());
    for (const [key, choices] of Object.entries(campaign.commitmentLabels)) {
      for (const value of Object.keys(choices)) expect(episodeOptionsSchema.safeParse({ [key]: value }).success).toBe(true);
      expect(() => chapterStart(3, { [key]: 'invalid' })).toThrow();
    }
    expect(() => parseSaveFile(campaign, JSON.stringify(encodeSave(startCampaign(original), 'Old save')))).toThrow();
    expect(() => parseSaveFile(original, JSON.stringify(encodeSave(startCampaign(campaign), 'Episode save')))).toThrow();
  });

  it('selects the episode by default with six earned-event movies and an unchanged original opening', () => {
    expect(adventureFor(null)).toBe(episodeAdventure);
    expect(adventureFor('episode')).toBe(episodeAdventure);
    expect(adventureFor('original')).toBe(originalAdventure);
    expect(() => adventureFor('unknown')).toThrow('Unknown adventure');
    expect(episodeAdventure.startFilm).toBeUndefined();
    expect(episodeAdventure.eventFilms.map(({ fact }) => fact)).toEqual(filmMilestones);
    expect(episodeAdventure.eventFilms[0].film).toBe(originalAdventure.startFilm);
    expect(episodeAdventure.eventFilms[2].film.noun).toBe('sequence');
    expect(originalAdventure.eventFilms).toEqual([]);
  });

  it('selects new facts once in story order without mutating the registry or observations', () => {
    const before = Object.freeze(['picard-abducted']);
    const after = Object.freeze([...filmMilestones].reverse().concat('deflector-failed'));
    const registry = Object.freeze([...episodeAdventure.eventFilms]);
    const films = newlyEarnedFilms(registry, before, after);
    expect(films.map(({ fact }) => fact)).toEqual(filmMilestones.slice(1));
    expect(newlyEarnedFilms(registry, after, after)).toEqual([]);
    expect(newlyEarnedFilms(registry, after, before)).toEqual([]);
    expect(newlyEarnedFilms(originalAdventure.eventFilms, [], after)).toEqual([]);
    expect(registry.map(({ fact }) => fact)).toEqual(filmMilestones);
    expect(before).toEqual(['picard-abducted']);
    expect(after).toEqual([...filmMilestones].reverse().concat('deflector-failed'));
  });

  it('does not schedule a failed deflector order or consume pending firing choices on reload', () => {
    let state = chapterStart(3);
    const early = resolve(campaign, state, { type: 'interact', verb: 'use', target: 'e3-fire-control' });
    expect(newlyEarnedFilms(episodeAdventure.eventFilms, state.facts, early.state.facts)).toEqual([]);
    state = startCampaign(campaign);
    for (const action of walkthrough()) {
      if (action.type === 'choose' && action.choice === 'e3-fire') break;
      state = resolve(campaign, state, action).state;
    }
    expect(state.activeInteraction).toBe('e3-fire-order');
    const restored = parseSaveFile(campaign, JSON.stringify(encodeSave(state, 'Pending fire order'))).state;
    expect(restored).toEqual(state);
    expect(newlyEarnedFilms(episodeAdventure.eventFilms, state.facts, restored.facts)).toEqual([]);
    const held = resolve(campaign, restored, { type: 'choose', interaction: 'e3-fire-order', choice: 'e3-hold' });
    expect(newlyEarnedFilms(episodeAdventure.eventFilms, restored.facts, held.state.facts)).toEqual([]);
  });
});
