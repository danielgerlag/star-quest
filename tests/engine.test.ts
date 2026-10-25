import { describe, expect, it } from 'vitest';
import type { Campaign } from '../src/model';
import { activeDialogue, decodeState, meets, resolve, startCampaign, validateCampaign } from '../src/engine';
import { encodeSave, parseSaveFile } from '../src/saves';

const fixture: Campaign = {
  id: 'fixture', title: 'Test expedition', protagonist: 'explorer', commitmentLabels: {},
  speakers: [{ id: 'explorer', name: 'Explorer', role: 'Researcher', description: 'An attentive field researcher.', appearance: { skin: '#b87a55', hair: '#31271f', uniform: '#6474a7', style: 'short' } }],
  initialItems: ['probe'],
  items: [{ id: 'probe', name: 'Probe', description: 'Instrument', icon: 'tricorder' }],
  evidence: [{ id: 'reading', title: 'Reading', text: 'Observed', category: 'observation' }],
  endings: [{ id: 'safe', title: 'Safe', subtitle: '', tone: 'hope', paragraphs: [] }],
  chapters: [{
    id: 1, title: 'Landing', subtitle: '', stardate: '', intro: [], objectives: [],
    rooms: [{
      id: 'lab', name: 'Lab', deck: '1', visual: 'engineering', atmosphere: 'normal',
      description: '', ambient: '', hotspots: [{
        id: 'sensor', label: 'Sensor', kind: 'console', prop: 'terminal', x: 10, y: 10, width: 20, height: 20,
        interactions: [{
          id: 'read', trigger: { verb: 'look' }, lines: ['A reading.'],
          effects: [{ type: 'fact', id: 'observed' }, { type: 'evidence', id: 'reading' }],
        }, {
          id: 'calibrate', trigger: { item: 'probe' }, when: { all: ['observed'] },
          lines: ['Calibration complete.'], effects: [{ type: 'fact', id: 'calibrated' }],
        }, {
          id: 'operate', trigger: { verb: 'use' }, lines: ['Choose.'],
          choices: [{
            id: 'finish', label: 'Proceed', requires: { all: ['calibrated'] },
            unavailable: 'Calibrate first.', response: ['Success.'], effects: [{ type: 'ending', id: 'safe' }],
          }],
        }],
      }],
    }],
  }],
};

describe('adventure state contract', () => {
  it('validates authored references and geometry', () => expect(validateCampaign(fixture)).toEqual([]));
  it('does not mutate input and grants discoveries once', () => {
    const initial = startCampaign(fixture);
    const first = resolve(fixture, initial, { type: 'interact', target: 'sensor', verb: 'look' });
    const repeat = resolve(fixture, first.state, { type: 'interact', target: 'sensor', verb: 'look' });
    expect(initial.facts).toEqual([]);
    expect(first.discoveries).toEqual(['evidence:reading']);
    expect(repeat.discoveries).toEqual([]);
    expect(repeat.state.facts).toEqual(['observed']);
    expect(repeat.state.evidence).toEqual(['reading']);
  });
  it('requires both a live conversation and the actual prerequisite', () => {
    const initial = startCampaign(fixture);
    const forged = resolve(fixture, initial, { type: 'choose', interaction: 'operate', choice: 'finish' });
    expect(forged.changed).toBe(false);
    const opened = resolve(fixture, initial, { type: 'interact', target: 'sensor', verb: 'use' });
    const premature = resolve(fixture, opened.state, { type: 'choose', interaction: 'operate', choice: 'finish' });
    expect(premature.dialogue?.lines).toEqual(['Calibrate first.']);
    expect(premature.state.ending).toBeNull();
  });
  it('finishes through legal actions and round-trips its save', () => {
    let state = startCampaign(fixture);
    state = resolve(fixture, state, { type: 'interact', target: 'sensor', verb: 'look' }).state;
    state = resolve(fixture, state, { type: 'item', target: 'sensor', item: 'probe' }).state;
    state = resolve(fixture, state, { type: 'interact', target: 'sensor', verb: 'use' }).state;
    state = resolve(fixture, state, { type: 'choose', interaction: 'operate', choice: 'finish' }).state;
    expect(state.ending).toBe('safe');
    expect(parseSaveFile(fixture, JSON.stringify(encodeSave(state, 'Test'))).state).toEqual(state);
  });
  it('rejects invalid save types, unknown rooms and oversized files', () => {
    const state = startCampaign(fixture);
    expect(() => decodeState(fixture, { ...state, moves: -1 })).toThrow();
    expect(() => decodeState(fixture, { ...state, room: 'missing' })).toThrow();
    expect(() => decodeState(fixture, { ...state, inventory: ['made-up'] })).toThrow();
    expect(() => parseSaveFile(fixture, 'x'.repeat(2_000_001))).toThrow('too large');
  });
  it('evaluates positive, negative and commitment constraints together', () => {
    const state = startCampaign(fixture);
    state.facts = ['a', 'b'];
    state.commitments.relay = 'quiet';
    expect(meets(state, { all: ['a'], any: ['b', 'c'], none: ['d'], choices: { relay: 'quiet' } })).toBe(true);
    expect(meets(state, { none: ['a'] })).toBe(false);
    expect(meets(state, { choices: { relay: 'noisy' } })).toBe(false);
  });
  it('can answer and restore a one-shot interaction after its opening effects consume the trigger', () => {
    const oneShot: Campaign = {
      ...fixture,
      chapters: fixture.chapters.map((chapter) => ({
        ...chapter,
        rooms: chapter.rooms.map((room) => ({
          ...room,
          hotspots: room.hotspots.map((target) => ({
            ...target,
            interactions: [{
              id: 'one-shot', trigger: { item: 'probe' }, when: { none: ['briefed'] },
              lines: ['The probe is installed. Confirm the result.'],
              effects: [{ type: 'fact', id: 'briefed' }, { type: 'remove-item', id: 'probe' }],
              choices: [{ id: 'confirm', label: 'Confirm', requires: { all: ['briefed'] }, response: ['Done.'], effects: [{ type: 'ending', id: 'safe' }] }],
            }],
          })),
        })),
      })),
    };
    expect(validateCampaign(oneShot)).toEqual([]);
    const opened = resolve(oneShot, startCampaign(oneShot), { type: 'item', item: 'probe', target: 'sensor' }).state;
    expect(opened.inventory).toEqual([]);
    expect(opened.activeInteraction).toBe('one-shot');
    const restored = parseSaveFile(oneShot, JSON.stringify(encodeSave(opened, 'Awaiting confirmation'))).state;
    expect(activeDialogue(oneShot, restored)?.choices.map((choice) => choice.id)).toEqual(['confirm']);
    expect(restored.facts).toEqual(['briefed']);
    expect(resolve(oneShot, restored, { type: 'choose', interaction: 'one-shot', choice: 'confirm' }).state.ending).toBe('safe');
  });
  it('rejects duplicate or invented facts and commitments in imported saves', () => {
    const state = startCampaign(fixture);
    expect(() => decodeState(fixture, { ...state, facts: ['invented'] })).toThrow('unrecognized mission facts');
    expect(() => decodeState(fixture, { ...state, inventory: ['probe', 'probe'] })).toThrow('duplicate');
    expect(() => decodeState(fixture, { ...state, commitments: { fabricated: 'yes' } })).toThrow('Unknown saved commitment');
  });
});
