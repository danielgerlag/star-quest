import { createPixelTexture } from '../art';
import type { Cinematic } from '../cinematic';
import { drawDeepSpace, drawDistantCube, drawShuttleStandby } from './space-art';
import { createGalaxyRenderer } from './space-renderer';

const duration = 26_400;

export interface SeparationPose {
  readonly saucer: { readonly x: number; readonly y: number };
  readonly stardrive: { readonly x: number; readonly y: number };
  readonly shuttleInset: number;
}

function ease(at: number, start: number, end: number): number {
  const t = Math.max(0, Math.min(1, (at - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

export function sampleSeparationPose(at: number): SeparationPose {
  const time = Math.max(0, Math.min(duration, at));
  const clearance = ease(time, 5500, 11_500);
  const formation = ease(time, 11_500, 21_000);
  return {
    saucer: { x: 260 + 8 * clearance + 49 * formation, y: 165 - 22 * clearance - 18 * formation },
    stardrive: { x: 260 - 4 * clearance - 10 * formation, y: 165 + 8 * clearance + 16 * formation },
    shuttleInset: ease(time, 21_000, 23_000),
  };
}

function createRenderer(canvas: HTMLCanvasElement): (at: number, still: boolean) => void {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('A Canvas2D context is required to show saucer separation.');
  const background = createPixelTexture(480, 300, (p) => {
    drawDeepSpace(p);
    drawDistantCube(p, 406, 42);
  });
  const drawSection = createGalaxyRenderer(context);
  const shuttle = createPixelTexture(132, 61, drawShuttleStandby);

  return (at, _still) => {
    const pose = sampleSeparationPose(at);
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.imageSmoothingEnabled = false;
    context.globalAlpha = 1;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(background, 0, 0);
    drawSection('stardrive', pose.stardrive.x, pose.stardrive.y);
    drawSection('saucer', pose.saucer.x, pose.saucer.y);
    context.font = '9px monospace';
    context.textBaseline = 'top';
    context.fillStyle = '#99aeb7';
    context.fillText('NCC-1701-D / SAUCER SEPARATION', 16, 15);
    context.fillStyle = '#607983';
    context.fillText('BORG CONTACT', 389, 25);
    if (pose.shuttleInset > 0) {
      context.globalAlpha = pose.shuttleInset;
      context.drawImage(shuttle, 332, 227);
      context.fillStyle = '#ccd1bb';
      context.fillText('SHUTTLE BAY / HOLD', 334, 214);
      context.fillStyle = '#99aeb7';
      context.fillText('TWO SECTIONS / FORMATION', 16, 278);
    }
    context.restore();
  };
}

export const separation: Cinematic = {
  title: 'Two ships. One crew.',
  duration,
  noun: 'sequence',
  createRenderer,
  beats: [
    {
      at: 0, stillAt: 2500, speaker: 'RIKER',
      text: 'Battle bridge has control. Saucer command, keep our people clear and stay with us.',
      description: 'The intact Enterprise faces a distant Borg cube. Its broad saucer joins the engineering hull through a narrow neck; two nacelles shine blue beneath their red collectors.',
      cue: 'alert',
    },
    {
      at: 5500, stillAt: 8000, speaker: 'SHELBY',
      text: 'Separation locks are cycling. Both sections show independent power.',
      description: 'The saucer rises gently from the neck. The coupling surfaces part, opening a narrow strip of starlight between the two hulls.',
    },
    {
      at: 8500, stillAt: 11_000, speaker: 'GEORDI',
      text: 'The last connection is clear. Structural fields are holding on both sides.',
      description: 'The saucer clears the exposed docking saddle. Below it, the stardrive retains its deflector, swept pylons and both warp nacelles.',
    },
    {
      at: 12_400, stillAt: 15_600, speaker: 'RIKER',
      text: 'Open the distance slowly. I want two steady targets, not a race.',
      description: 'The saucer glides forward and above the stardrive. The engineering section eases down and aft; neither hull disappears or turns toward a collision.',
    },
    {
      at: 17_500, stillAt: 20_800, speaker: 'SHELBY',
      text: 'Formation is nearly settled. The saucer is ready for your next order.',
      description: 'Both intact sections remain in view with clear space between them. The distant cube holds its course; no weapons or antimatter have been released.',
    },
    {
      at: 22_400, stillAt: 25_000, speaker: 'DATA',
      text: 'Lieutenant Worf and I are standing by in the shuttle. We will hold for the diversion and your launch order.',
      description: 'The saucer and stardrive hold formation. A bay inset shows the shuttle resting on its landing gear behind closed doors, awaiting release.',
    },
  ],
};
