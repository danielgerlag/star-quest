import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rejoining, sampleRejoiningPose } from '../src/episode/rejoining';
import { sampleSeparationPose, separation } from '../src/episode/separation';
import { galaxySections } from '../src/episode/space-art';
import { installRecordingCanvas, recorded, records } from './canvas-recorder';

beforeEach(installRecordingCanvas);
afterEach(() => vi.unstubAllGlobals());

describe('Enterprise rejoining', () => {
  it('starts in the separation formation and seats both sections at the same physical coupling', () => {
    const separated = sampleSeparationPose(separation.duration);
    const initial = sampleRejoiningPose(0);
    expect(initial.saucer).toEqual(separated.saucer);
    expect(initial.stardrive).toEqual(separated.stardrive);
    expect(initial.saucer).not.toEqual(initial.stardrive);
    expect(sampleRejoiningPose(-Infinity)).toEqual(initial);
    expect(sampleRejoiningPose(4000)).toEqual(initial);
    const seated = sampleRejoiningPose(16_500);
    expect(seated.saucer).toEqual({ x: 260, y: 165 });
    expect(seated.stardrive).toEqual(seated.saucer);
    expect(seated.latches).toBe(0);
    expect(seated.utilities).toBe(0);
    const end = sampleRejoiningPose(rejoining.duration);
    expect(end.latches).toBe(1);
    expect(end.utilities).toBe(1);
    expect(sampleRejoiningPose(21_400)).toEqual(end);
    expect(sampleRejoiningPose(Infinity)).toEqual(end);
  });

  it('approaches continuously without clipping and connects utilities only after the collars lock', () => {
    let previous = sampleRejoiningPose(0);
    let distance = Infinity;
    for (let at = 0; at <= rejoining.duration; at += 100) {
      const pose = sampleRejoiningPose(at);
      const nextDistance = Math.hypot(pose.saucer.x - pose.stardrive.x, pose.saucer.y - pose.stardrive.y);
      expect(nextDistance).toBeLessThanOrEqual(distance);
      distance = nextDistance;
      for (const section of ['saucer', 'stardrive'] as const) {
        const point = pose[section];
        const bounds = galaxySections[section];
        expect(point.x + bounds.left).toBeGreaterThan(0);
        expect(point.x + bounds.right).toBeLessThan(480);
        expect(point.y + bounds.top).toBeGreaterThan(0);
        expect(point.y + bounds.bottom).toBeLessThan(300);
        expect(Math.hypot(point.x - previous[section].x, point.y - previous[section].y)).toBeLessThan(2);
      }
      if (pose.latches > 0) expect(pose.saucer).toEqual(pose.stardrive);
      if (pose.utilities > 0) expect(pose.latches).toBe(1);
      previous = pose;
    }
    expect(distance).toBe(0);
  });

  it('renders the two shared hulls at sampled positions, never an overlaid intact-ship ghost', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 300;
    const draw = rejoining.createRenderer(canvas);
    const output = recorded(canvas);
    draw(0, false);
    expect(output.draws).toHaveLength(3);
    const sources = output.draws.map(({ source }) => source);
    const canvasCount = records.size;
    for (const beat of rejoining.beats) {
      const pose = sampleRejoiningPose(beat.stillAt);
      draw(beat.stillAt, true);
      const still = { draws: [...output.draws], fills: [...output.fills], labels: [...output.labels] };
      expect(output.draws.slice(0, 3).map(({ source }) => source)).toEqual(sources);
      for (const [index, section] of (['stardrive', 'saucer'] as const).entries()) {
        expect(output.draws[index + 1].x).toBe(Math.round(pose[section].x) + galaxySections[section].left);
        expect(output.draws[index + 1].y).toBe(Math.round(pose[section].y) + galaxySections[section].top);
      }
      draw(rejoining.duration, false);
      draw(beat.stillAt, false);
      expect({ draws: output.draws, fills: output.fills, labels: output.labels }).toEqual(still);
    }
    draw(Infinity, false);
    expect(output.labels).toContain('LOCKED / CONNECTED');
    expect(output.draws).toHaveLength(4);
    expect(records.size).toBe(canvasCount);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('provides six readable stills and reports a missing renderer explicitly', () => {
    expect(rejoining.beats).toHaveLength(6);
    expect(rejoining.beats[0].at).toBe(0);
    for (const [index, beat] of rejoining.beats.entries()) {
      expect(beat.stillAt).toBeGreaterThanOrEqual(beat.at);
      expect(beat.stillAt).toBeLessThan(rejoining.beats[index + 1]?.at ?? rejoining.duration);
      expect(beat.text.length).toBeGreaterThan(30);
      expect(beat.description.length).toBeGreaterThan(40);
    }
    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue(null);
    expect(() => rejoining.createRenderer(canvas)).toThrow('Canvas2D');
  });
});
