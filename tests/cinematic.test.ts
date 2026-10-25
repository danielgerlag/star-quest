import { describe, expect, it } from 'vitest';
import { opening } from '../src/campaign/opening';
import { sampleActor } from '../src/cinematic';
import type { ActorTrack } from '../src/cinematic';

const track: ActorTrack = [
  { at: 100, x: 10, y: 20, opacity: 0, transport: 1, pose: 'walk' },
  { at: 300, x: 30, y: 40, opacity: 1, transport: 0, pose: 'reach' },
];

function actor(id: string, at: number) {
  const found = opening.actors.find((entry) => entry.id === id);
  if (!found) throw new Error(`Missing opening actor ${id}.`);
  return sampleActor(found.track, at);
}

describe('cinematic sampling', () => {
  it('clamps endpoints and handles a single stationary keyframe', () => {
    expect(sampleActor(track, -50)).toEqual(track[0]);
    expect(sampleActor(track, 300)).toEqual(track[1]);
    expect(sampleActor(track, 500)).toEqual(track[1]);
    expect(sampleActor([track[0]], 500)).toEqual(track[0]);
  });

  it('interpolates positions and transport without blending discrete poses or mutating input', () => {
    const before = structuredClone(track);
    expect(sampleActor(track, 200)).toEqual({ x: 20, y: 30, opacity: 0.5, transport: 0.5, pose: 'walk' });
    expect(sampleActor(track, 300).pose).toBe('reach');
    expect(track).toEqual(before);
  });
});

describe('the authored bridge opening', () => {
  it('has ordered, bounded tracks and a stable still inside every caption beat', () => {
    expect(new Set(opening.actors.map((entry) => entry.id)).size).toBe(opening.actors.length);
    expect(opening.beats[0].at).toBe(0);
    for (const [index, beat] of opening.beats.entries()) {
      const end = opening.beats[index + 1]?.at ?? opening.duration;
      expect(end).toBeGreaterThan(beat.at);
      expect(beat.stillAt).toBeGreaterThanOrEqual(beat.at);
      expect(beat.stillAt).toBeLessThan(end);
      expect(beat.description).not.toBe('');
      expect(beat.text).not.toBe('');
    }
    for (const entry of opening.actors) {
      expect(entry.track[0].at).toBe(0);
      for (const [index, keyframe] of entry.track.entries()) {
        expect(keyframe.at).toBeGreaterThan(entry.track[index - 1]?.at ?? -1);
        expect(keyframe.at).toBeLessThanOrEqual(opening.duration);
        expect(keyframe.x).toBeGreaterThanOrEqual(13);
        expect(keyframe.x).toBeLessThanOrEqual(467);
        expect(keyframe.y).toBeGreaterThanOrEqual(54);
        expect(keyframe.y).toBeLessThanOrEqual(300);
        expect(keyframe.opacity).toBeGreaterThanOrEqual(0);
        expect(keyframe.opacity).toBeLessThanOrEqual(1);
        expect(keyframe.transport).toBeGreaterThanOrEqual(0);
        expect(keyframe.transport).toBeLessThanOrEqual(1);
      }
    }
  });

  it('materializes two drones before they approach the captain', () => {
    for (const id of ['drone-left', 'drone-right']) {
      expect(actor(id, 0)).toMatchObject({ opacity: 0, transport: 0 });
      expect(actor(id, 6000).opacity).toBeGreaterThan(0);
      expect(actor(id, 6000).opacity).toBeLessThan(1);
      expect(actor(id, 6000).transport).toBeGreaterThan(0);
      expect(actor(id, 10000)).toMatchObject({ opacity: 1, transport: 0 });
      expect(actor(id, 10000).x).toBe(actor(id, 0).x);
    }
  });

  it('shows both captors holding Picard, in command red, before departure', () => {
    const captain = actor('picard', 19000);
    const left = actor('drone-left', 19000);
    const right = actor('drone-right', 19000);
    expect(captain).toMatchObject({ opacity: 1, transport: 0, pose: 'reach' });
    expect(left).toMatchObject({ opacity: 1, pose: 'reach', y: captain.y });
    expect(right).toMatchObject({ opacity: 1, pose: 'reach', y: captain.y });
    expect(captain.x - left.x).toBe(19);
    expect(right.x - captain.x).toBe(19);
    expect(opening.actors.find((entry) => entry.id === 'picard')?.appearance)
      .toMatchObject({ style: 'bald', uniform: '#a33749' });
  });

  it('dematerializes the captain and both drones together, leaving Riker and Worf', () => {
    for (const at of [22000, 23200, 24400, 25500, 27300, 28500, opening.duration]) {
      const captain = actor('picard', at);
      for (const id of ['drone-left', 'drone-right']) {
        expect(actor(id, at).opacity).toBe(captain.opacity);
        expect(actor(id, at).transport).toBe(captain.transport);
      }
      for (const id of ['riker', 'worf']) expect(actor(id, at)).toMatchObject({ opacity: 1, transport: 0 });
    }
    expect(actor('picard', 25500)).toMatchObject({ opacity: 0.5, transport: 1 });
    expect(actor('picard', opening.duration)).toMatchObject({ opacity: 0, transport: 0 });
    expect(actor('riker', opening.duration)).toMatchObject({ x: 253, y: 241, pose: 'back' });
  });
});
