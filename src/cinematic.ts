import { createCharacterTexture, createRoomTexture } from './art';
import type { CinematicCue } from './audio';
import type { Appearance, CharacterPose, Room } from './model';

export type CinematicPose = CharacterPose | 'walk' | 'walk-back';

interface ActorState {
  x: number;
  y: number;
  opacity: number;
  transport: number;
  pose: CinematicPose;
}

export interface CinematicKeyframe extends ActorState { at: number }
export type ActorTrack = readonly [CinematicKeyframe, ...CinematicKeyframe[]];

export interface CinematicBeat {
  at: number;
  stillAt: number;
  speaker: string;
  text: string;
  description: string;
  cue?: CinematicCue;
}

export interface Cinematic {
  title: string;
  duration: number;
  noun: 'intro' | 'sequence';
  beats: readonly [CinematicBeat, ...CinematicBeat[]];
  createRenderer: (canvas: HTMLCanvasElement) => (at: number, still: boolean) => void;
}

export interface RoomCinematicScene {
  visual: Room['visual'];
  atmosphere: Room['atmosphere'];
  actors: readonly { id: string; appearance: Appearance; track: ActorTrack }[];
}

export function sampleActor(track: ActorTrack, at: number): ActorState {
  let from = track[0];
  if (at <= from.at) return from;
  for (const to of track.slice(1)) {
    if (at < to.at) {
      const fraction = (at - from.at) / (to.at - from.at);
      const lerp = (a: number, b: number) => a + (b - a) * fraction;
      return {
        x: lerp(from.x, to.x), y: lerp(from.y, to.y),
        opacity: lerp(from.opacity, to.opacity),
        transport: lerp(from.transport, to.transport), pose: from.pose,
      };
    }
    from = to;
  }
  return from;
}

function spritePose(pose: CinematicPose, at: number, still: boolean): CharacterPose {
  if (pose !== 'walk' && pose !== 'walk-back') return pose;
  if (still) return pose === 'walk' ? 'stand' : 'back';
  const left = Math.floor(at / 170) % 2 === 0;
  return pose === 'walk'
    ? left ? 'step-left' : 'step-right'
    : left ? 'step-back-left' : 'step-back-right';
}

export function createRoomCinematicRenderer(canvas: HTMLCanvasElement, film: RoomCinematicScene): (at: number, still: boolean) => void {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('A Canvas2D context is required to play the opening.');
  context.imageSmoothingEnabled = false;
  const room = createRoomTexture(film.visual, film.atmosphere);
  const actors = film.actors.map((actor) => ({ ...actor, sprites: new Map<CharacterPose, HTMLCanvasElement>() }));

  const beam = (frame: ActorState, at: number, foreground: boolean): void => {
    if (frame.transport <= 0) return;
    const { x, y, transport } = frame;
    context.save();
    if (!foreground) {
      const glow = context.createLinearGradient(x, y - 138, x, y + 3);
      glow.addColorStop(0, '#74ffd300');
      glow.addColorStop(0.65, '#8bf5b93d');
      glow.addColorStop(1, '#82ffbb99');
      context.globalAlpha = transport;
      context.fillStyle = glow;
      context.fillRect(Math.round(x - 17), y - 138, 34, 140);
      context.fillStyle = '#89f6bb';
      context.globalAlpha = transport * 0.3;
      context.beginPath();
      context.ellipse(x, y, 22, 5, 0, 0, Math.PI * 2);
      context.fill();
    } else {
      context.fillStyle = '#b9ffdf';
      context.globalAlpha = transport * 0.7;
      for (let i = 0; i < 45; i++) {
        const offset = (i * 19 + at * 0.025) % 108;
        context.fillRect(Math.round(x - 13 + (i * 7 % 27)), Math.round(y - offset), 1, i % 3 === 0 ? 3 : 1);
      }
      context.globalAlpha = transport * 0.22;
      for (let i = 0; i < 5; i++) {
        context.fillRect(Math.round(x - 13), Math.round(y - (at * 0.014 + i * 13) % 64), 26, 1);
      }
    }
    context.restore();
  };

  return (at, still) => {
    context.drawImage(room, 0, 0);
    const sampled = actors.map((actor) => ({ actor, frame: sampleActor(actor.track, at) }))
      .sort((a, b) => a.frame.y - b.frame.y);
    for (const { frame } of sampled) beam(frame, at, false);
    for (const { actor, frame } of sampled) {
      if (frame.opacity > 0) {
        const pose = spritePose(frame.pose, at, still);
        let sprite = actor.sprites.get(pose);
        if (!sprite) {
          sprite = createCharacterTexture(actor.appearance, pose);
          actor.sprites.set(pose, sprite);
        }
        context.save();
        context.globalAlpha = frame.opacity * 0.32;
        context.fillStyle = '#090d19';
        context.beginPath();
        context.ellipse(frame.x, frame.y - 1, 12, 3, 0, 0, Math.PI * 2);
        context.fill();
        context.globalAlpha = frame.opacity;
        context.drawImage(sprite, Math.round(frame.x - 13), Math.round(frame.y - 54));
        context.restore();
      }
      beam(frame, at, true);
    }
  };
}

export function playCinematic(film: Cinematic, options: {
  reducedMotion: boolean;
  cue: (kind: CinematicCue) => () => void;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'cinematic-dialog';
    dialog.setAttribute('aria-labelledby', 'cinematic-title');
    dialog.setAttribute('aria-describedby', 'cinematic-description');

    const header = document.createElement('header');
    header.className = 'cinematic-header';
    const title = document.createElement('h2');
    title.id = 'cinematic-title';
    title.textContent = film.title;
    const skip = document.createElement('button');
    skip.className = 'button quiet';
    skip.textContent = `Skip ${film.noun}`;
    header.append(title, skip);

    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 300;
    canvas.className = 'cinematic-stage';
    canvas.setAttribute('aria-hidden', 'true');
    const caption = document.createElement('div');
    caption.className = 'cinematic-caption';
    const description = document.createElement('p');
    description.id = 'cinematic-description';
    const line = document.createElement('p');
    line.className = 'cinematic-line';
    line.setAttribute('aria-live', 'polite');
    line.setAttribute('aria-atomic', 'true');
    const speaker = document.createElement('span');
    speaker.className = 'eyebrow';
    const text = document.createElement('span');
    line.append(speaker, text);
    caption.append(description, line);

    const controls = document.createElement('footer');
    controls.className = 'cinematic-controls';
    const status = document.createElement('span');
    status.className = 'cinematic-status';
    const advance = document.createElement('button');
    advance.className = 'button secondary';
    controls.append(status, advance);
    const progress = document.createElement('progress');
    progress.className = 'cinematic-progress';
    progress.max = film.duration;
    progress.value = 0;
    progress.setAttribute('aria-label', `${film.noun} progress`);
    dialog.append(header, canvas, caption, controls, progress);

    const listeners = new AbortController();
    let animation = 0;
    let previousTime: number | null = null;
    let elapsed = 0;
    let beatIndex = -1;
    let paused = false;
    let finished = false;
    let stopCue = () => {};
    let draw: (at: number, still: boolean) => void;

    function finish(failure?: { error: unknown }): void {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(animation);
      stopCue();
      listeners.abort();
      dialog.close();
      dialog.remove();
      if (failure) reject(failure.error);
      else resolve();
    }

    function showBeat(index: number): void {
      if (index === beatIndex) return;
      beatIndex = index;
      const beat = film.beats[index];
      description.textContent = beat.description;
      speaker.textContent = beat.speaker;
      text.textContent = beat.text;
      status.textContent = `${options.reducedMotion ? 'STILL SCENES' : film.title.toUpperCase()} / ${index + 1} / ${film.beats.length}`;
      stopCue();
      stopCue = beat.cue && !document.hidden ? options.cue(beat.cue) : () => {};
      if (options.reducedMotion) {
        elapsed = beat.stillAt;
        draw(elapsed, true);
        progress.value = film.duration * (index + 1) / film.beats.length;
        advance.textContent = index === film.beats.length - 1 ? `Finish ${film.noun}` : 'Next scene';
      }
    }

    function tick(now: number): void {
      if (finished || paused || document.hidden) return;
      try {
        if (previousTime !== null) elapsed += now - previousTime;
        previousTime = now;
        if (elapsed >= film.duration) { finish(); return; }
        let index = 0;
        for (const [i, beat] of film.beats.entries()) if (elapsed >= beat.at) index = i;
        showBeat(index);
        draw(elapsed, false);
        progress.value = elapsed;
        animation = requestAnimationFrame(tick);
      } catch (error) { finish({ error }); }
    }

    function updatePlayback(): void {
      cancelAnimationFrame(animation);
      previousTime = null;
      if (paused || document.hidden) stopCue();
      if (!options.reducedMotion) {
        advance.textContent = `${paused ? 'Resume' : 'Pause'} ${film.noun}`;
        if (!paused && !document.hidden) animation = requestAnimationFrame(tick);
      }
    }

    skip.addEventListener('click', () => finish(), { signal: listeners.signal });
    advance.addEventListener('click', () => {
      try {
        if (options.reducedMotion) {
          if (beatIndex === film.beats.length - 1) finish();
          else showBeat(beatIndex + 1);
        } else {
          paused = !paused;
          updatePlayback();
        }
      } catch (error) { finish({ error }); }
    }, { signal: listeners.signal });
    dialog.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Escape') { event.preventDefault(); finish(); }
    }, { signal: listeners.signal });
    dialog.addEventListener('cancel', (event) => { event.preventDefault(); finish(); }, { signal: listeners.signal });
    dialog.addEventListener('close', () => finish(), { signal: listeners.signal });
    document.addEventListener('visibilitychange', updatePlayback, { signal: listeners.signal });
    window.addEventListener('pagehide', () => finish(), { signal: listeners.signal });

    try {
      draw = film.createRenderer(canvas);
      document.body.append(dialog);
      dialog.showModal();
      showBeat(0);
      if (!options.reducedMotion) draw(0, false);
      updatePlayback();
      advance.focus({ preventScroll: true });
    } catch (error) { finish({ error }); }
  });
}
