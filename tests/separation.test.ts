import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPixelTexture, createPortrait, createRoomTexture } from '../src/art';
import { sampleSeparationPose, separation } from '../src/episode/separation';
import {
  drawSaucer, drawStardrive, galaxySections, translatedPainter,
} from '../src/episode/space-art';
import type { PixelPainter } from '../src/episode/space-art';
import { installRecordingCanvas, recorded, records } from './canvas-recorder';

beforeEach(installRecordingCanvas);
afterEach(() => vi.unstubAllGlobals());

function mask(paint: (p: PixelPainter) => void): readonly (readonly [number, number])[] {
  const texture = createPixelTexture(400, 260, (p) => paint(translatedPainter(p, 180, 120)));
  const pixels = new Map<string, readonly [number, number]>();
  for (const fill of recorded(texture).fills) {
    for (let y = fill.y; y < fill.y + fill.height; y += 1) {
      for (let x = fill.x; x < fill.x + fill.width; x += 1) {
        pixels.set(`${x - 180}:${y - 120}`, [x - 180, y - 120]);
      }
    }
  }
  return [...pixels.values()];
}

describe('saucer separation geometry', () => {
  it('starts with a shared coupling origin and keeps attached sections still until release', () => {
    const initial = sampleSeparationPose(0);
    expect(initial.saucer).toEqual(initial.stardrive);
    expect(initial.shuttleInset).toBe(0);
    for (const at of [-1000, 0, 2500, 5500]) expect(sampleSeparationPose(at)).toEqual(initial);
  });

  it('uses bounded, detailed hull silhouettes with an actual attached seam and clear separation', () => {
    const saucer = mask(drawSaucer);
    const stardrive = mask(drawStardrive);
    expect(saucer.length).toBeGreaterThan(7000);
    expect(stardrive.length).toBeGreaterThan(3500);
    for (const [name, points] of [['saucer', saucer], ['stardrive', stardrive]] as const) {
      const bounds = galaxySections[name];
      for (const [x, y] of points) {
        expect(x).toBeGreaterThanOrEqual(bounds.left);
        expect(x).toBeLessThan(bounds.right);
        expect(y).toBeGreaterThanOrEqual(bounds.top);
        expect(y).toBeLessThan(bounds.bottom);
      }
    }
    const overlap = (at: number) => {
      const pose = sampleSeparationPose(at);
      const drivePixels = new Set(stardrive.map(([x, y]) =>
        `${x + Math.round(pose.stardrive.x)}:${y + Math.round(pose.stardrive.y)}`));
      return saucer.filter(([x, y]) =>
        drivePixels.has(`${x + Math.round(pose.saucer.x)}:${y + Math.round(pose.saucer.y)}`)).length;
    };
    expect(overlap(0)).toBeGreaterThan(50);
    for (const at of [11_500, 15_600, 21_000, separation.duration]) expect(overlap(at)).toBe(0);
    const cleared = sampleSeparationPose(11_500);
    expect((cleared.stardrive.y - 4) - (cleared.saucer.y + 5)).toBeGreaterThan(18);
  });

  it('keeps both complete sections inside the stage and converges smoothly on stable endpoints', () => {
    let previous = sampleSeparationPose(0);
    let previousDistance = 0;
    for (let at = 0; at <= separation.duration; at += 100) {
      const pose = sampleSeparationPose(at);
      const distance = Math.hypot(pose.saucer.x - pose.stardrive.x, pose.saucer.y - pose.stardrive.y);
      expect(distance).toBeGreaterThanOrEqual(previousDistance);
      for (const section of ['saucer', 'stardrive'] as const) {
        const point = pose[section];
        const bounds = galaxySections[section];
        expect(point.x + bounds.left).toBeGreaterThan(0);
        expect(point.x + bounds.right).toBeLessThan(480);
        expect(point.y + bounds.top).toBeGreaterThan(0);
        expect(point.y + bounds.bottom).toBeLessThan(300);
        expect(Math.hypot(point.x - previous[section].x, point.y - previous[section].y)).toBeLessThan(1);
      }
      expect(pose.shuttleInset).toBeGreaterThanOrEqual(0);
      expect(pose.shuttleInset).toBeLessThanOrEqual(1);
      previous = pose;
      previousDistance = distance;
    }
    const end = sampleSeparationPose(separation.duration);
    expect(end.saucer).not.toEqual(end.stardrive);
    expect(end.shuttleInset).toBe(1);
    expect(sampleSeparationPose(23_000)).toEqual(end);
    expect(sampleSeparationPose(1_000_000)).toEqual(end);
    expect(sampleSeparationPose(Number.POSITIVE_INFINITY)).toEqual(end);
    expect(sampleSeparationPose(10_000)).toEqual(sampleSeparationPose(10_000));
    expect(Math.hypot(end.saucer.x - end.stardrive.x, end.saucer.y - end.stardrive.y)).toBeGreaterThan(90);
  });
});

describe('the separation sequence', () => {
  it('provides six ordered, captioned reduced-motion stills across 24–30 seconds', () => {
    expect(separation.noun).toBe('sequence');
    expect(separation.duration).toBeGreaterThanOrEqual(24_000);
    expect(separation.duration).toBeLessThanOrEqual(30_000);
    expect(separation.beats).toHaveLength(6);
    expect(separation.beats[0].at).toBe(0);
    for (const [index, beat] of separation.beats.entries()) {
      const end = separation.beats[index + 1]?.at ?? separation.duration;
      expect(end).toBeGreaterThan(beat.at);
      expect(beat.stillAt).toBeGreaterThanOrEqual(beat.at);
      expect(beat.stillAt).toBeLessThan(end);
      expect(beat.speaker.length).toBeGreaterThan(0);
      expect(beat.text.length).toBeGreaterThan(30);
      expect(beat.description.length).toBeGreaterThan(40);
      if (beat.cue) expect(['alert', 'transport']).toContain(beat.cue);
    }
    expect(separation.beats[5].text).toContain('hold');
    expect(separation.beats[5].description).toContain('landing gear behind closed doors');
  });

  it('replays absolute-time draws using only the two original section textures, with no ship ghost', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 300;
    const draw = separation.createRenderer(canvas);
    const output = recorded(canvas);
    draw(0, false);
    expect(output.draws).toHaveLength(3);
    const [background, stardrive, saucer] = output.draws.map((entry) => entry.source);
    const sources = records.size;
    for (const beat of separation.beats) {
      draw(beat.stillAt, true);
      const still = output.draws.map((entry) => ({ ...entry }));
      draw(separation.duration, false);
      draw(beat.stillAt, false);
      expect(output.draws).toEqual(still);
      expect(output.draws.slice(0, 3).map((entry) => entry.source)).toEqual([background, stardrive, saucer]);
      expect(output.draws.slice(0, 3).every((entry) => entry.alpha === 1)).toBe(true);
    }
    draw(separation.duration, true);
    expect(output.draws).toHaveLength(4);
    expect(output.labels).toContain('SHUTTLE BAY / HOLD');
    const end = output.draws.map((entry) => ({ ...entry }));
    draw(separation.duration + 9000, false);
    expect(output.draws).toEqual(end);
    expect(records.size).toBe(sources);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('paints deterministic colony and wreck-gallery scenes without interior alert fittings outdoors', () => {
    for (const visual of ['colony', 'wolf359'] as const) {
      const first = createRoomTexture(visual, 'normal');
      const second = createRoomTexture(visual, 'normal');
      expect(first.width).toBe(480);
      expect(first.height).toBe(300);
      expect(recorded(first).fills).toEqual(recorded(second).fills);
    }
    const colony = createRoomTexture('colony', 'normal');
    const damagedColony = createRoomTexture('colony', 'damaged');
    expect(recorded(damagedColony).fills).toEqual(recorded(colony).fills);
    const gallery = createRoomTexture('wolf359', 'normal');
    expect(recorded(gallery).fills).not.toEqual(recorded(colony).fills);
  });

  it('adds a visible mechanical eye and armored body only to the Borg portrait', () => {
    const appearance = { skin: '#b0b7a4', hair: '#202728', uniform: '#394746', style: 'borg' } as const;
    const portrait = createPortrait(appearance);
    const human = createPortrait({ ...appearance, style: 'bald' });
    expect(recorded(portrait).fills).toContainEqual({ x: 30, y: 44, width: 4, height: 3, color: '#b05c58' });
    expect(recorded(human).fills).not.toContainEqual({ x: 30, y: 44, width: 4, height: 3, color: '#b05c58' });
  });
});
