import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCharacterTexture } from '../src/art';
import { campaign } from '../src/episode';
import { sampleRescuePose, shuttleRescue } from '../src/episode/rescue';
import { galaxySections } from '../src/episode/space-art';
import { installRecordingCanvas, recorded, records } from './canvas-recorder';

beforeEach(installRecordingCanvas);
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function stage() {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 300;
  return { canvas, render: shuttleRescue.createRenderer(canvas), output: recorded(canvas) };
}

function frame(canvas: HTMLCanvasElement) {
  const output = recorded(canvas);
  return {
    draws: [...output.draws],
    fills: [...output.fills],
    labels: [...output.labels],
    paths: [...output.paths],
  };
}

function crew(canvas: HTMLCanvasElement) {
  return recorded(canvas).draws.filter(({ source }) =>
    'width' in source && source.width === 26 && 'height' in source && source.height === 54);
}

describe('the rescue timeline', () => {
  it('flies out under cover, opens only a local barrier, and moves the team around Locutus', () => {
    const start = sampleRescuePose(0);
    const outbound = sampleRescuePose(3800);
    expect(start.phase).toBe('cover');
    expect(outbound.shuttle.x).toBeGreaterThan(start.shuttle.x);
    expect(outbound.shuttle.y).toBeLessThan(start.shuttle.y);
    expect(outbound.screen).toBeGreaterThan(start.screen);
    expect(sampleRescuePose(6950)).toMatchObject({ phase: 'barrier', shot: 1, barrierOpen: 0 });
    expect(sampleRescuePose(7800).barrierOpen).toBeGreaterThan(0);
    expect(sampleRescuePose(7800).barrierOpen).toBeLessThan(1);
    expect(sampleRescuePose(9900)).toMatchObject({
      phase: 'barrier', shot: 0, barrierOpen: 1, teamApproach: 1, awayOpacity: 1, awayTransport: 0,
    });
  });

  it('extracts all three before the shuttle returns, then materializes Locutus while the others dock', () => {
    expect(sampleRescuePose(11_200)).toMatchObject({ awayOpacity: 1, awayTransport: 1 });
    expect(sampleRescuePose(12_750)).toMatchObject({ phase: 'extraction', awayOpacity: 0.5, awayTransport: 1 });
    expect(sampleRescuePose(15_400)).toMatchObject({ awayOpacity: 0, awayTransport: 0 });
    const turn = sampleRescuePose(15_500);
    const returning = sampleRescuePose(18_300);
    expect(turn.phase).toBe('return');
    expect(returning.shuttle.returning).toBe(true);
    expect(returning.shuttle.x).toBeLessThan(turn.shuttle.x);
    expect(returning.screen).toBe(1);
    expect(sampleRescuePose(21_000).shuttle.x).toBe(sampleRescuePose(0).shuttle.x);
    expect(sampleRescuePose(24_000)).toMatchObject({
      phase: 'reception', receivedOpacity: 0.5, receivedTransport: 1, crewExit: 0,
    });
    expect(sampleRescuePose(24_000).dock).toBeGreaterThan(0);
    expect(sampleRescuePose(24_000).dock).toBeLessThan(1);
    expect(sampleRescuePose(27_000)).toMatchObject({
      phase: 'home', receivedOpacity: 1, receivedTransport: 0, dock: 1, crewExit: 1,
    });
  });

  it('keeps motion and fades bounded, with an Earthward cube that never stops for the rescue', () => {
    let previous = sampleRescuePose(0);
    for (let at = 100; at <= shuttleRescue.duration; at += 100) {
      const pose = sampleRescuePose(at);
      expect(pose.cube.x).toBeGreaterThan(previous.cube.x);
      expect(pose.cube.x + 50).toBeLessThan(480);
      expect(pose.cube.y).toBeGreaterThan(0);
      expect(pose.cube.y + 56).toBeLessThan(300);
      expect(pose.shuttle.x - 16 * 0.64).toBeGreaterThan(0);
      expect(pose.shuttle.x + 60 * 0.64).toBeLessThan(480);
      expect(pose.shuttle.y).toBeGreaterThan(0);
      expect(pose.shuttle.y + 26 * 0.64).toBeLessThan(300);
      for (const key of [
        'screen', 'shot', 'barrierOpen', 'teamApproach', 'awayOpacity', 'awayTransport',
        'receivedOpacity', 'receivedTransport', 'dock', 'crewExit',
      ] as const) {
        expect(pose[key]).toBeGreaterThanOrEqual(0);
        expect(pose[key]).toBeLessThanOrEqual(1);
      }
      expect(Math.abs(pose.awayOpacity - previous.awayOpacity)).toBeLessThan(0.06);
      expect(Math.abs(pose.receivedOpacity - previous.receivedOpacity)).toBeLessThan(0.06);
      previous = pose;
    }
  });

  it('returns immutable, seek-independent poses and clamps invalid and infinite timestamps', () => {
    const start = sampleRescuePose(0);
    const end = sampleRescuePose(shuttleRescue.duration);
    for (const at of [-500, -Infinity, NaN]) expect(sampleRescuePose(at)).toEqual(start);
    for (const at of [shuttleRescue.duration + 1, Infinity]) expect(sampleRescuePose(at)).toEqual(end);
    const middle = sampleRescuePose(12_750);
    expect(Object.isFrozen(middle)).toBe(true);
    expect(Object.isFrozen(middle.cube)).toBe(true);
    expect(Object.isFrozen(middle.shuttle)).toBe(true);
    expect(Reflect.set(middle.shuttle, 'x', -1)).toBe(false);
    sampleRescuePose(shuttleRescue.duration);
    sampleRescuePose(0);
    expect(sampleRescuePose(12_750)).toEqual(middle);
  });
});

describe('Bring him home', () => {
  it('provides six truthful, route-neutral captioned stills without pre-executing the later solution', () => {
    expect(shuttleRescue.title).toBe('Bring him home');
    expect(shuttleRescue.noun).toBe('sequence');
    expect(shuttleRescue.duration).toBeGreaterThanOrEqual(29_000);
    expect(shuttleRescue.duration).toBeLessThanOrEqual(32_000);
    expect(shuttleRescue.beats).toHaveLength(6);
    expect(shuttleRescue.beats[0].at).toBe(0);
    expect(shuttleRescue.beats.map((beat) => sampleRescuePose(beat.stillAt).phase))
      .toEqual(['cover', 'barrier', 'extraction', 'return', 'reception', 'home']);
    for (const [index, beat] of shuttleRescue.beats.entries()) {
      expect(beat.stillAt).toBeGreaterThanOrEqual(beat.at);
      expect(beat.stillAt).toBeLessThan(shuttleRescue.beats[index + 1]?.at ?? shuttleRescue.duration);
      expect(beat.speaker.length).toBeGreaterThan(0);
      expect(beat.text.length).toBeGreaterThan(30);
      expect(beat.description.length).toBeGreaterThan(60);
      if (beat.cue) expect(['alert', 'transport']).toContain(beat.cue);
      if (beat.speaker.includes('RIKER')) expect(beat.speaker).toContain('STARDRIVE COMMS');
    }
    const captions = shuttleRescue.beats.map((beat) => `${beat.text} ${beat.description}`).join(' ');
    expect(captions).not.toMatch(/close approach|wide approach|neural|regeneration|cured|healed|destroyed/i);
    expect(shuttleRescue.beats[2].description).toContain('All three figures fade together');
    expect(shuttleRescue.beats[4].description).toContain('Data and Worf still aboard');
    expect(shuttleRescue.beats[5].description).toContain('still bearing Borg implants');
    expect(shuttleRescue.beats[5].description).toContain('docked shuttle');
    expect(sampleRescuePose(shuttleRescue.beats[1].stillAt).barrierOpen).toBe(1);
    expect(sampleRescuePose(shuttleRescue.beats[2].stillAt).awayOpacity).toBe(0.5);
    expect(sampleRescuePose(shuttleRescue.beats[4].stillAt).receivedOpacity).toBe(0.5);
    expect(sampleRescuePose(shuttleRescue.beats[5].stillAt).crewExit).toBe(1);
  });

  it('renders the recognizable separated hulls, sampled shuttle motion and moving cube without clipping', () => {
    const { render, output } = stage();
    for (const at of [0, 3800, 18_300]) {
      render(at, false);
      const pose = sampleRescuePose(at);
      expect(output.draws).toContainEqual(expect.objectContaining({
        x: Math.round(pose.cube.x), y: Math.round(pose.cube.y), alpha: 1,
      }));
      for (const [section, x, y, scale] of [
        ['saucer', 144, 108, 0.82], ['stardrive', 166, 213, 0.8],
      ] as const) {
        const bounds = galaxySections[section];
        const left = Math.round(x + bounds.left * scale);
        const top = Math.round(y + bounds.top * scale);
        const width = Math.round((bounds.right - bounds.left) * scale);
        const height = Math.round((bounds.bottom - bounds.top) * scale);
        expect(output.draws).toContainEqual(expect.objectContaining({
          x: left, y: top, dimensions: [left, top, width, height], alpha: 1,
        }));
        expect(left).toBeGreaterThan(0);
        expect(top).toBeGreaterThan(0);
        expect(left + width).toBeLessThan(480);
        expect(top + height).toBeLessThan(300);
      }
      expect(output.paths).toContainEqual({
        operation: 'translate',
        values: [
          Math.round(pose.shuttle.x + (pose.shuttle.returning ? 60 * 0.64 : 0)),
          Math.round(pose.shuttle.y),
        ],
      });
      expect(output.paths).toContainEqual({
        operation: 'scale', values: [pose.shuttle.returning ? -0.64 : 0.64, 0.64],
      });
      expect(output.labels).toContain('ANTIMATTER SCREEN');
      expect(output.labels).toContain('STARDRIVE CONTROL / RIKER ON COMMS');
    }
  });

  it('uses the episode Data, Worf and Locutus sprites, transports all three, and visibly receives Locutus', () => {
    const { canvas, render, output } = stage();
    render(9900, false);
    const team = crew(canvas);
    expect(team).toHaveLength(3);
    for (const [index, id] of ['data', 'locutus', 'worf'].entries()) {
      const speaker = campaign.speakers.find((candidate) => candidate.id === id);
      if (!speaker) throw new Error(`Missing episode speaker ${id}.`);
      const expected = createCharacterTexture(speaker.appearance);
      expect(recorded(team[index].source).fills).toEqual(recorded(expected).fills);
      expect(team[index].alpha).toBe(1);
    }
    expect(output.labels).toContain('LOCAL BARRIER / OPEN');
    render(12_750, false);
    expect(crew(canvas).map((draw) => draw.source)).toEqual(team.map((draw) => draw.source));
    expect(crew(canvas).map((draw) => draw.alpha)).toEqual([0.5, 0.5, 0.5]);
    expect(output.fills.filter((fill) => fill.width === 48 && fill.height === 110)).toHaveLength(3);
    render(15_450, false);
    expect(crew(canvas)).toHaveLength(0);
    expect(output.labels).toContain('COMPARTMENT CLEAR / THREE EXTRACTED');
    render(24_000, false);
    expect(crew(canvas)).toEqual([expect.objectContaining({ source: team[1].source, alpha: 0.5 })]);
    expect(output.fills.filter((fill) => fill.width === 48 && fill.height === 110)).toHaveLength(1);
    render(27_000, false);
    const returned = crew(canvas);
    expect(returned.map((draw) => draw.source)).toEqual([team[1].source, team[0].source, team[2].source]);
    expect(returned.map((draw) => draw.alpha)).toEqual([1, 1, 1]);
    expect(output.labels).toContain('LOCUTUS / ABOARD');
    expect(output.labels).toContain('DATA   WORF');
    expect(output.labels).toContain('BORG TRACK / COURSE UNCHANGED');
    for (const draw of returned) {
      expect(draw.x).toBeGreaterThan(0);
      expect(draw.y).toBeGreaterThan(0);
      expect(draw.x + draw.dimensions[2]).toBeLessThan(480);
      expect(draw.y + draw.dimensions[3]).toBeLessThan(300);
    }
  });

  it('animates the emitter and barrier rather than only changing their captions', () => {
    const { canvas, render, output } = stage();
    render(6950, false);
    expect(output.paths).toContainEqual({ operation: 'lineTo', values: [334, 108] });
    expect(output.fills).toContainEqual({ x: 268, y: 105, width: 62, height: 132, color: '#9fd6a2' });
    render(8200, false);
    const field = output.fills.find((fill) => fill.x === 268 && fill.y === 105 && fill.height > 1);
    expect(field?.height).toBeGreaterThan(0);
    expect(field?.height).toBeLessThan(132);
    render(9900, false);
    expect(output.paths).not.toContainEqual({ operation: 'lineTo', values: [334, 108] });
    expect(output.fills.some((fill) => fill.x === 268 && fill.height > 0)).toBe(false);
    expect(crew(canvas).map((draw) => draw.x)).toEqual([226, 277, 326]);
  });

  it('seeks deterministically, keeps stills identical to animated frames, and never allocates frame textures or RAF', () => {
    vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('Use absolute-time geometry.'); });
    const { canvas, render } = stage();
    const textures = records.size;
    for (const beat of shuttleRescue.beats) {
      render(beat.stillAt, true);
      const still = frame(canvas);
      render(shuttleRescue.duration, false);
      render(0, false);
      render(beat.stillAt, false);
      expect(frame(canvas)).toEqual(still);
      render(beat.stillAt, true);
      expect(frame(canvas)).toEqual(still);
    }
    for (let at = 0; at <= shuttleRescue.duration; at += 500) render(at, false);
    render(0, false);
    const start = frame(canvas);
    for (const at of [-Infinity, -1, NaN]) {
      render(at, false);
      expect(frame(canvas)).toEqual(start);
    }
    render(shuttleRescue.duration, false);
    const end = frame(canvas);
    for (const at of [Infinity, shuttleRescue.duration + 8000]) {
      render(at, true);
      expect(frame(canvas)).toEqual(end);
    }
    expect(records.size).toBe(textures);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(Math.random).not.toHaveBeenCalled();
  });

  it('fails explicitly when Canvas2D is unavailable', () => {
    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue(null);
    expect(() => shuttleRescue.createRenderer(canvas)).toThrow('Canvas2D');
  });
});
