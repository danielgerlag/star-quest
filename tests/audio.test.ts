import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShipAudio } from '../src/audio';

class Gain {
  gain = { value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(), setTargetAtTime: vi.fn() };
  connect() { return this; }
  disconnect = vi.fn();
}

class Oscillator {
  frequency = { value: 0, exponentialRampToValueAtTime: vi.fn() };
  type = 'sine';
  onended: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  disconnect = vi.fn();
  connect(gain: Gain) { return gain; }
}

class Context {
  static instances: Context[] = [];
  state = 'running';
  currentTime = 0;
  destination = {};
  oscillators: Oscillator[] = [];
  gains: Gain[] = [];
  constructor() { Context.instances.push(this); }
  createOscillator() { const node = new Oscillator(); this.oscillators.push(node); return node; }
  createGain() { const node = new Gain(); this.gains.push(node); return node; }
  async suspend() { this.state = 'suspended'; }
  async resume() { this.state = 'running'; }
}

beforeEach(() => {
  Context.instances = [];
  vi.stubGlobal('AudioContext', Context);
});
afterEach(() => vi.unstubAllGlobals());

describe('cinematic audio ownership', () => {
  it('cancels every cue voice exactly once without stopping ship ambience', async () => {
    const audio = new ShipAudio();
    await audio.start();
    const context = Context.instances[0];
    const stop = audio.cue('transport');
    const hum = context.oscillators.slice(0, 3);
    const cue = context.oscillators.slice(3);
    expect(cue).toHaveLength(3);
    stop();
    stop();
    for (const node of cue) {
      expect(node.stop).toHaveBeenCalledTimes(2);
      expect(node.stop).toHaveBeenLastCalledWith();
      expect(node.disconnect).toHaveBeenCalledOnce();
      expect(node.onended).toBeNull();
    }
    for (const node of hum) {
      expect(node.stop).not.toHaveBeenCalled();
      expect(node.disconnect).not.toHaveBeenCalled();
    }
  });

  it('releases naturally completed voices and does not stop them again', async () => {
    const audio = new ShipAudio();
    await audio.start();
    const stop = audio.cue('alert');
    const cue = Context.instances[0].oscillators.slice(3);
    for (const node of cue) node.onended?.();
    stop();
    for (const node of cue) {
      expect(node.stop).toHaveBeenCalledOnce();
      expect(node.disconnect).toHaveBeenCalledOnce();
    }
  });

  it('respects disabled audio, master volume and hidden-tab suspension', async () => {
    const audio = new ShipAudio();
    audio.configure(false, 0.4);
    await audio.start();
    audio.cue('transport')();
    expect(Context.instances).toHaveLength(0);
    audio.configure(true, 0.4);
    await audio.start();
    const context = Context.instances[0];
    expect(context.gains[0].gain.value).toBe(0.4);
    await audio.visibility(true);
    audio.cue('alert')();
    expect(context.oscillators).toHaveLength(3);
    await audio.visibility(false);
    audio.cue('transport')();
    expect(context.oscillators).toHaveLength(6);
    audio.configure(false, 0.7);
    expect(context.gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, 0.06);
    audio.cue('transport')();
    expect(context.oscillators).toHaveLength(6);
  });
});
