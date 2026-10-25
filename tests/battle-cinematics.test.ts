import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Cinematic } from '../src/cinematic';
import { deflectorAttack, sampleDeflectorPose } from '../src/episode/deflector';
import { cubeDestruction, sampleDestructionPose } from '../src/episode/destruction';
import { galaxySections } from '../src/episode/space-art';
import { installRecordingCanvas, recorded, records } from './canvas-recorder';

beforeEach(installRecordingCanvas);
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function open(film: Cinematic) {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 300;
  return { canvas, draw: film.createRenderer(canvas), output: recorded(canvas) };
}

function frame(canvas: HTMLCanvasElement) {
  const output = recorded(canvas);
  return {
    fills: output.fills.map((fill) => ({ ...fill })),
    draws: output.draws.map((draw) => ({ ...draw, dimensions: [...draw.dimensions] })),
    paths: output.paths.map((path) => ({ ...path, values: [...path.values] })),
    labels: [...output.labels],
  };
}

const films = [
  { name: 'deflector', film: deflectorAttack, sample: sampleDeflectorPose, title: 'The deflector gambit' },
  { name: 'destruction', film: cubeDestruction, sample: sampleDestructionPose, title: 'The Collective falls silent' },
] as const;

describe.each(films)('$name cinematic contract', ({ film, sample, title }) => {
  it('provides six captioned stills inside ordered beats over twenty-four seconds', () => {
    expect(film.title).toBe(title);
    expect(film.noun).toBe('sequence');
    expect(film.duration).toBe(24_000);
    expect(film.beats).toHaveLength(6);
    expect(film.beats[0].at).toBe(0);
    for (const [index, beat] of film.beats.entries()) {
      const end = film.beats[index + 1]?.at ?? film.duration;
      expect(end).toBeGreaterThan(beat.at);
      expect(beat.stillAt).toBeGreaterThanOrEqual(beat.at);
      expect(beat.stillAt).toBeLessThan(end);
      expect(beat.speaker.length).toBeGreaterThan(0);
      expect(beat.text.length).toBeGreaterThan(30);
      expect(beat.description.length).toBeGreaterThan(60);
      if (beat.cue) expect(['alert', 'transport']).toContain(beat.cue);
    }
  });

  it('clamps all endpoints and seeks without retaining or mutating an earlier pose', () => {
    const start = sample(0);
    const end = sample(film.duration);
    for (const at of [-Infinity, -90_000, -1, NaN]) expect(sample(at)).toEqual(start);
    for (const at of [Infinity, 90_000, film.duration + 1]) expect(sample(at)).toEqual(end);
    const middle = sample(12_000);
    for (const at of [24_000, 700, 20_000, 0, 12_000]) {
      const pose = sample(at);
      for (const value of Object.values(pose)) {
        const coordinates = typeof value === 'number' ? [value] : Object.values(value);
        expect(coordinates.every(Number.isFinite)).toBe(true);
      }
    }
    expect(middle).toEqual(sample(12_000));
    expect(sample(23_000)).toEqual(end);
  });

  it('renders six distinct visual stills identically after out-of-order animated seeks', () => {
    const { canvas, draw, output } = open(film);
    const visuals = new Set<string>();
    for (const beat of film.beats) {
      draw(beat.stillAt, true);
      const still = frame(canvas);
      visuals.add(JSON.stringify({
        fills: still.fills,
        paths: still.paths,
        draws: still.draws.map(({ x, y, dimensions, alpha }) => ({ x, y, dimensions, alpha })),
      }));
      draw(film.duration, false);
      draw(0, false);
      draw(beat.stillAt, false);
      expect(frame(canvas)).toEqual(still);
      draw(beat.stillAt, true);
      expect(frame(canvas)).toEqual(still);
      expect(output.draws[0]).toMatchObject({ x: 0, y: 0, alpha: 1 });
      expect(output.draws.every((entry) =>
        entry.dimensions.every(Number.isFinite) && entry.alpha >= 0 && entry.alpha <= 1)).toBe(true);
      expect(output.paths.every((entry) => entry.values.every(Number.isFinite))).toBe(true);
    }
    expect(visuals.size).toBe(6);
  });

  it('also clamps the actual renderer, including infinite and invalid timestamps', () => {
    const { canvas, draw } = open(film);
    draw(0, false);
    const start = frame(canvas);
    for (const at of [-Infinity, -1, NaN]) {
      draw(at, true);
      expect(frame(canvas)).toEqual(start);
    }
    draw(film.duration, false);
    const end = frame(canvas);
    for (const at of [Infinity, film.duration + 1, 100_000]) {
      draw(at, true);
      expect(frame(canvas)).toEqual(end);
    }
  });

  it('caches bounded artwork once and owns no timers, listeners, random source, or RAF', () => {
    const timer = vi.fn(() => { throw new Error('A renderer must not schedule work.'); });
    const listener = vi.fn(() => { throw new Error('A renderer must not install listeners.'); });
    vi.stubGlobal('setTimeout', timer);
    vi.stubGlobal('setInterval', timer);
    vi.stubGlobal('addEventListener', listener);
    vi.stubGlobal('window', { addEventListener: listener });
    const random = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Artwork must have deterministic sampling.');
    });
    const { draw } = open(film);
    const allocated = records.size;
    expect(allocated).toBeGreaterThan(5);
    expect(allocated).toBeLessThanOrEqual(12);
    for (let at = 0; at <= film.duration; at += 400) {
      draw(at, false);
      draw(film.duration - at, true);
      expect(records.size).toBe(allocated);
    }
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(timer).not.toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
    expect(random).not.toHaveBeenCalled();
  });
});

describe('the failed deflector attack', () => {
  it('pre-adapts the cube before the beam arrives, then exhausts the correctly fired weapon', () => {
    expect(sampleDeflectorPose(0)).toMatchObject({ charge: 0, beam: 0, beamReach: 0, shield: 0, exhausted: 0 });
    expect(sampleDeflectorPose(5300)).toMatchObject({ charge: 1, beam: 0, shield: 0, exhausted: 0 });
    expect(sampleDeflectorPose(5500).shield).toBeGreaterThan(0);
    expect(sampleDeflectorPose(6900).shield).toBe(1);
    expect(sampleDeflectorPose(6900).beamReach).toBeLessThan(1);
    expect(sampleDeflectorPose(8300)).toMatchObject({ charge: 1, beam: 1, beamReach: 1, shield: 1 });
    expect(sampleDeflectorPose(15_500)).toMatchObject({ charge: 1, beam: 1, shield: 1 });
    expect(sampleDeflectorPose(18_400).beam).toBeGreaterThan(0);
    expect(sampleDeflectorPose(18_400).beam).toBeLessThan(0.2);
    expect(sampleDeflectorPose(19_000)).toMatchObject({ charge: 0, beam: 0, shield: 1 });
    expect(sampleDeflectorPose(20_500)).toMatchObject({ charge: 0, beam: 0, shield: 1, exhausted: 1 });
  });

  it('does not paint an impact on the cube before the beam reaches it', () => {
    const { draw, output } = open(deflectorAttack);
    for (const at of [6500, 7000]) {
      const pose = sampleDeflectorPose(at);
      draw(at, false);
      const impacts = output.draws.filter((entry) =>
        entry.x === Math.round(pose.cube.x) + 1 && entry.y === Math.round(pose.cube.y) + 46);
      expect(impacts).toHaveLength(at === 7000 ? 1 : 0);
    }
  });

  it('uses the physical lower dish of the joined hull as the continuous beam origin', () => {
    const { draw, output } = open(deflectorAttack);
    draw(0, false);
    const stardrive = output.draws[2].source;
    const saucer = output.draws[3].source;
    let beamSource: object | undefined;
    for (const at of [7000, 8300, 12_000, 15_500, 18_400]) {
      const pose = sampleDeflectorPose(at);
      draw(at, false);
      const driveDraw = output.draws.find((entry) => entry.source === stardrive);
      const saucerDraw = output.draws.find((entry) => entry.source === saucer);
      expect(driveDraw).toMatchObject({
        x: Math.round(pose.ship.x + galaxySections.stardrive.left),
        y: Math.round(pose.ship.y + galaxySections.stardrive.top), alpha: 1,
      });
      expect(saucerDraw).toMatchObject({
        x: Math.round(pose.ship.x + galaxySections.saucer.left),
        y: Math.round(pose.ship.y + galaxySections.saucer.top), alpha: 1,
      });
      const emitterX = Math.round(pose.ship.x) + 20;
      const emitterY = Math.round(pose.ship.y) + 49;
      expect(output.paths).toContainEqual({ operation: 'translate', values: [emitterX, emitterY] });
      const beamDraw = output.draws.find((entry) => entry.x === 0 && entry.y < 0);
      expect(beamDraw).toBeDefined();
      if (!beamDraw) throw new Error('The active deflector must draw its beam.');
      beamSource ??= beamDraw.source;
      expect(beamDraw.source).toBe(beamSource);
      expect(beamDraw.alpha).toBe(pose.beam);
      expect(beamDraw.dimensions[2]).toBeCloseTo(Math.hypot(
        Math.round(pose.cube.x) + 16 - emitterX, Math.round(pose.cube.y) + 65 - emitterY,
      ) * pose.beamReach);
      expect(beamDraw.dimensions[3]).toBeCloseTo(10 + pose.charge * 10 + pose.shield * 6);
      expect(output.draws).toContainEqual(expect.objectContaining({
        x: emitterX - 22, y: emitterY - 12, alpha: pose.charge,
      }));
    }
  });

  it('keeps every hull on stage and changes the shield smoothly without flashing', () => {
    let previous = sampleDeflectorPose(0);
    for (let at = 0; at <= deflectorAttack.duration; at += 100) {
      const pose = sampleDeflectorPose(at);
      for (const bounds of Object.values(galaxySections)) {
        expect(pose.ship.x + bounds.left).toBeGreaterThan(0);
        expect(pose.ship.x + bounds.right).toBeLessThan(480);
        expect(pose.ship.y + bounds.top).toBeGreaterThan(0);
        expect(pose.ship.y + bounds.bottom).toBeLessThan(251);
      }
      expect(pose.cube.x - 12).toBeGreaterThan(pose.ship.x + galaxySections.saucer.right);
      expect(pose.cube.x + 100).toBeLessThan(480);
      expect(pose.cube.y + 111).toBeLessThan(251);
      expect(pose.shield).toBeGreaterThanOrEqual(previous.shield);
      for (const key of ['charge', 'beam', 'beamReach', 'shield', 'exhausted'] as const) {
        expect(pose[key]).toBeGreaterThanOrEqual(0);
        expect(pose[key]).toBeLessThanOrEqual(1);
        expect(Math.abs(pose[key] - previous[key])).toBeLessThan(0.16);
      }
      previous = pose;
    }
  });

  it('renders adaptation and the dark dish while the original, unbroken cube survives', () => {
    const { draw, output } = open(deflectorAttack);
    draw(0, false);
    const background = output.draws[0].source;
    const cube = output.draws[1].source;
    const startX = output.draws[1].x;
    for (const at of [12_000, 15_500, 18_400, 24_000]) {
      const pose = sampleDeflectorPose(at);
      draw(at, false);
      expect(output.draws[0]).toMatchObject({ source: background, alpha: 1 });
      expect(output.draws.filter((entry) => entry.source === cube)).toHaveLength(1);
      expect(output.draws[1]).toMatchObject({
        source: cube, x: Math.round(pose.cube.x), y: Math.round(pose.cube.y), alpha: 1,
        dimensions: [Math.round(pose.cube.x), Math.round(pose.cube.y), 90, 101],
      });
      expect(output.draws).toContainEqual(expect.objectContaining({
        x: Math.round(pose.cube.x) - 12, y: Math.round(pose.cube.y) - 11, alpha: pose.shield * 0.85,
      }));
    }
    const final = sampleDeflectorPose(24_000);
    expect(output.draws[1].x).toBeGreaterThan(startX);
    expect(output.paths.filter((entry) => entry.operation === 'translate')).toHaveLength(0);
    const darkDish = output.draws.find((entry) =>
      entry.x === Math.round(final.ship.x) + 1 && entry.y === Math.round(final.ship.y) + 41);
    expect(darkDish?.alpha).toBe(1);
    if (!darkDish) throw new Error('The exhausted dish must be visibly darkened.');
    expect(recorded(darkDish.source).fills.some((fill) => fill.color === '#253846')).toBe(true);
    expect(output.labels).toContain('DISH / EXHAUSTED');
    expect(output.labels).toContain('CUBE / STILL ON COURSE');
    expect(deflectorAttack.beats[5].text).toContain('will examine the return signal');
  });
});

describe('internal regeneration feedback', () => {
  it('dims the unattended network before internal fractures and actual breakup', () => {
    expect(sampleDestructionPose(0)).toMatchObject({ network: 1, feedback: 0, breakup: 0, cloud: 0, debris: 1 });
    expect(sampleDestructionPose(4000)).toMatchObject({ network: 0, feedback: 0, breakup: 0 });
    expect(sampleDestructionPose(6800).feedback).toBeGreaterThan(0);
    expect(sampleDestructionPose(6800).feedback).toBeLessThan(1);
    expect(sampleDestructionPose(10_500)).toMatchObject({ feedback: 1, breakup: 0, debris: 1 });
    expect(sampleDestructionPose(11_000).breakup).toBe(0);
    expect(sampleDestructionPose(11_001).breakup).toBeGreaterThan(0);
    expect(sampleDestructionPose(14_500).breakup).toBeGreaterThan(0.4);
    expect(sampleDestructionPose(18_500)).toMatchObject({ breakup: 1, debris: 1 });
    expect(sampleDestructionPose(23_000)).toMatchObject({ network: 0, feedback: 0, breakup: 1, cloud: 0, debris: 0 });
    expect(cubeDestruction.beats[0].text).toContain('My connection is closed');
  });

  it('replaces the intact cube with twelve moving, turning crops of the actual hull', () => {
    const { draw, output } = open(cubeDestruction);
    draw(0, false);
    const cube = output.draws[1].source;
    draw(10_500, false);
    expect(output.draws.filter((entry) => entry.source === cube)).toHaveLength(1);
    expect(output.draws.find((entry) => entry.source === cube)?.dimensions).toHaveLength(4);
    draw(14_500, false);
    const hullPieces = output.draws.filter((entry) => entry.source === cube);
    expect(hullPieces).toHaveLength(12);
    expect(hullPieces.every((entry) => entry.dimensions.length === 8 && entry.alpha === 1)).toBe(true);
    const sourcePixels = new Set<string>();
    for (const piece of hullPieces) {
      const [x, y, width, height] = piece.dimensions;
      for (let py = y; py < y + height; py++) {
        for (let px = x; px < x + width; px++) {
          const pixel = `${px}:${py}`;
          expect(sourcePixels.has(pixel)).toBe(false);
          sourcePixels.add(pixel);
        }
      }
    }
    expect(sourcePixels.size).toBe(50 * 56);
    const firstPositions = output.paths.filter((entry) => entry.operation === 'translate')
      .map((entry) => [...entry.values]);
    expect(firstPositions).toHaveLength(12);
    expect(output.paths.filter((entry) => entry.operation === 'rotate')
      .every((entry) => Math.abs(entry.values[0]) > 0)).toBe(true);
    draw(18_500, false);
    const laterPositions = output.paths.filter((entry) => entry.operation === 'translate');
    expect(laterPositions).toHaveLength(12);
    for (const [index, position] of laterPositions.entries()) {
      expect(position.values).not.toEqual(firstPositions[index]);
    }
    expect(output.draws.filter((entry) => entry.source === cube)).toHaveLength(12);
  });

  it('expands a restrained cloud and smoothly dissipates the debris without a full-stage flash', () => {
    const { draw, output } = open(cubeDestruction);
    draw(13_500, false);
    const background = output.draws[0].source;
    const cloud = output.draws[1].source;
    const firstSize = output.draws[1].dimensions[2];
    draw(19_000, false);
    expect(output.draws[1]).toMatchObject({ source: cloud, alpha: sampleDestructionPose(19_000).cloud * 0.58 });
    expect(output.draws[1].dimensions[2]).toBeGreaterThan(firstSize);
    let previous = sampleDestructionPose(0);
    for (let at = 0; at <= cubeDestruction.duration; at += 100) {
      const pose = sampleDestructionPose(at);
      for (const key of ['network', 'feedback', 'breakup', 'cloud', 'debris'] as const) {
        expect(pose[key]).toBeGreaterThanOrEqual(0);
        expect(pose[key]).toBeLessThanOrEqual(1);
        expect(Math.abs(pose[key] - previous[key])).toBeLessThan(0.05);
      }
      expect(pose.breakup).toBeGreaterThanOrEqual(previous.breakup);
      expect(pose.debris).toBeLessThanOrEqual(previous.debris);
      draw(at, false);
      expect(output.draws[0]).toMatchObject({ source: background, alpha: 1 });
      const mist = output.draws.find((entry) => entry.source === cloud);
      if (mist) {
        expect(mist.alpha).toBeLessThanOrEqual(0.58);
        expect(mist.dimensions[2]).toBeLessThanOrEqual(152);
        expect(mist.dimensions[3]).toBeLessThanOrEqual(152);
      }
      expect(output.fills).toHaveLength(0);
      previous = pose;
    }
    expect(output.draws.some((entry) => entry.source === cloud)).toBe(false);
  });

  it('keeps both unarmed ship sections and Earth outside every fragment and effect', () => {
    const { draw, output } = open(cubeDestruction);
    draw(0, false);
    const background = output.draws[0].source;
    const cube = output.draws[1].source;
    const stardrive = output.draws[output.draws.length - 2].source;
    const saucer = output.draws[output.draws.length - 1].source;
    const permitted = new Set(output.draws.map((entry) => entry.source));
    draw(10_500, false);
    for (const entry of output.draws) permitted.add(entry.source);
    expect(permitted.size).toBe(7);
    for (let at = 0; at <= cubeDestruction.duration; at += 500) {
      const pose = sampleDestructionPose(at);
      draw(at, false);
      expect(output.draws.every((entry) => permitted.has(entry.source))).toBe(true);
      expect(output.fills).toHaveLength(0);
      expect(output.paths.every((entry) =>
        ['setTransform', 'translate', 'rotate'].includes(entry.operation))).toBe(true);
      const ships = [
        { source: stardrive, point: pose.stardrive, bounds: galaxySections.stardrive, scale: 0.8 },
        { source: saucer, point: pose.saucer, bounds: galaxySections.saucer, scale: 0.86 },
      ];
      for (const { source, point, bounds, scale } of ships) {
        const hull = output.draws.filter((entry) => entry.source === source);
        expect(hull).toHaveLength(1);
        expect(hull[0]).toMatchObject({
          x: Math.round(point.x + bounds.left * scale),
          y: Math.round(point.y + bounds.top * scale), alpha: 1,
        });
        expect(hull[0].x).toBeGreaterThan(0);
        expect(hull[0].y).toBeGreaterThan(0);
        expect(hull[0].x + hull[0].dimensions[2]).toBeLessThan(480);
        expect(hull[0].y + hull[0].dimensions[3]).toBeLessThan(281);
      }
      expect(pose.stardrive.x + galaxySections.stardrive.right * 0.8).toBeLessThan(174);
      expect(pose.saucer.y + galaxySections.saucer.top * 0.86).toBeGreaterThan(177);
      const translations = output.paths.filter((entry) => entry.operation === 'translate');
      const pieces = output.draws.filter((entry) => entry.source === cube && entry.dimensions.length === 8);
      expect(translations).toHaveLength(pieces.length);
      for (const [index, piece] of pieces.entries()) {
        const [x, y] = translations[index].values;
        const radius = Math.hypot(piece.dimensions[6], piece.dimensions[7]) / 2;
        expect(x - radius).toBeGreaterThan(174);
        expect(x + radius).toBeLessThan(328);
        expect(y - radius).toBeGreaterThan(18);
        expect(y + radius).toBeLessThan(177);
      }
      for (const entry of output.draws) {
        if ([background, stardrive, saucer].includes(entry.source) || entry.dimensions.length === 8) continue;
        expect(entry.x).toBeGreaterThanOrEqual(174);
        expect(entry.x + entry.dimensions[2]).toBeLessThanOrEqual(328);
        expect(entry.y).toBeGreaterThanOrEqual(18);
        expect(entry.y + entry.dimensions[3]).toBeLessThanOrEqual(177);
      }
    }
  });

  it('ends with recognizable Earth, both surviving sections, and no intact cube or debris', () => {
    const { draw, output } = open(cubeDestruction);
    draw(0, false);
    const background = output.draws[0].source;
    const sections = output.draws.slice(-2).map((entry) => entry.source);
    const earth = recorded(background).fills;
    expect(earth.some((fill) => fill.color === '#295674' && fill.width >= 110)).toBe(true);
    for (const color of ['#789786', '#94a18c', '#8da38a', '#c2d1ca']) {
      const features = earth.filter((fill) => fill.color === color);
      expect(features.length).toBeGreaterThan(12);
      expect(features.every((fill) => fill.x > 328 && fill.y > 18 && fill.y + fill.height < 177)).toBe(true);
    }
    draw(cubeDestruction.duration, true);
    expect(output.draws.map((entry) => entry.source)).toEqual([background, ...sections]);
    expect(output.draws.every((entry) => entry.alpha === 1)).toBe(true);
    expect(output.paths).toEqual([]);
    expect(output.labels).toContain('EARTH');
    expect(output.labels).toContain('CONTACT / DISPERSED');
    expect(output.labels).toContain('BOTH SECTIONS / SIGNALS STEADY');
    expect(sampleDestructionPose(cubeDestruction.duration).saucer)
      .not.toEqual(sampleDestructionPose(cubeDestruction.duration).stardrive);
  });
});
