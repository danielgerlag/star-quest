export type CinematicCue = 'alert' | 'transport';

export class ShipAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled = true;
  private level = 0.24;

  async start(): Promise<void> {
    if (!this.enabled) return;
    if (!this.context) {
      const context = new AudioContext();
      this.context = context;
      const master = context.createGain();
      master.gain.value = this.level;
      master.connect(context.destination);
      this.master = master;
      for (const [frequency, volume] of [[55, 0.08], [110.12, 0.025], [164.81, 0.012]]) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.value = volume;
        oscillator.connect(gain).connect(master);
        oscillator.start();
      }
    }
    if (this.context.state === 'suspended') await this.context.resume();
  }

  configure(enabled: boolean, volume: number): void {
    this.enabled = enabled;
    this.level = volume;
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(enabled ? volume : 0, this.context.currentTime, 0.06);
    }
  }

  cue(kind: 'tap' | 'discovery' | 'travel' | 'chapter' | CinematicCue): () => void {
    if (!this.context || !this.master || !this.enabled || this.context.state !== 'running') return () => {};
    const context = this.context;
    const master = this.master;
    const notes = kind === 'transport' ? [138.59, 277.18, 554.37]
      : kind === 'alert' ? [164.81, 146.83, 164.81]
      : kind === 'discovery' ? [523.25, 659.25, 783.99]
      : kind === 'chapter' ? [261.63, 392, 523.25]
        : kind === 'travel' ? [220, 330] : [740];
    const stops = new Set<() => void>();
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const transport = kind === 'transport';
      const duration = transport ? 2.4 : kind === 'alert' ? 0.5 : 0.3;
      const start = context.currentTime + index * (kind === 'alert' ? 0.4 : 0.095);
      oscillator.type = transport && index === 0 ? 'triangle' : 'sine';
      oscillator.frequency.value = frequency;
      if (transport) oscillator.frequency.exponentialRampToValueAtTime(frequency * 2.6, start + duration);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(transport ? 0.065 : kind === 'tap' ? 0.04 : 0.12, start + (transport ? 0.3 : 0.012));
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      oscillator.connect(gain).connect(master);
      const stop = () => {
        oscillator.onended = null;
        oscillator.stop();
        oscillator.disconnect();
        gain.disconnect();
        stops.delete(stop);
      };
      stops.add(stop);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
        stops.delete(stop);
      };
    });
    return () => { for (const stop of stops) stop(); };
  }

  async visibility(hidden: boolean): Promise<void> {
    if (!this.context) return;
    if (hidden) await this.context.suspend();
    else if (this.enabled) await this.context.resume();
  }
}
