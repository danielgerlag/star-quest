import { createPixelTexture } from '../art';
import type { Cinematic } from '../cinematic';
import { drawDeepSpace, drawEarth } from './space-art';
import { createGalaxyRenderer } from './space-renderer';

const duration = 25_200;

export interface RejoiningPose {
  readonly saucer: { readonly x: number; readonly y: number };
  readonly stardrive: { readonly x: number; readonly y: number };
  readonly collarInset: number;
  readonly latches: number;
  readonly utilities: number;
}

function ease(at: number, start: number, end: number): number {
  const t = Math.max(0, Math.min(1, (at - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

export function sampleRejoiningPose(at: number): RejoiningPose {
  const time = Math.max(0, Math.min(duration, at));
  const approach = ease(time, 4000, 11_000);
  const contact = ease(time, 11_000, 16_500);
  return {
    saucer: { x: 317 - 47 * approach - 10 * contact, y: 125 + 20 * approach + 20 * contact },
    stardrive: { x: 246 + 10 * approach + 4 * contact, y: 189 - 16 * approach - 8 * contact },
    collarInset: ease(time, 9500, 11_000),
    latches: ease(time, 16_800, 19_000),
    utilities: ease(time, 19_500, 21_400),
  };
}

function createRenderer(canvas: HTMLCanvasElement): (at: number, still: boolean) => void {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('A Canvas2D context is required to show Enterprise rejoining.');
  const background = createPixelTexture(480, 300, (p) => {
    drawDeepSpace(p);
    drawEarth(p, 411, 82, 57);
  });
  const drawSection = createGalaxyRenderer(context);
  const collar = createPixelTexture(118, 67, (p) => {
    p.rect(0, 0, 118, 67, '#101a2a');
    p.rect(0, 0, 118, 1, '#8b9ea4');
    p.rect(0, 66, 118, 1, '#41576b');
    p.rect(0, 1, 1, 65, '#41576b');
    p.rect(117, 1, 1, 65, '#41576b');
    p.rect(17, 37, 84, 12, '#354f60');
    p.rect(22, 37, 74, 3, '#c0c7b6');
    p.rect(28, 40, 62, 5, '#152b3d');
    p.rect(17, 49, 84, 3, '#748d93');
  });

  return (at, _still) => {
    const pose = sampleRejoiningPose(at);
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
    context.fillText('NCC-1701-D / REJOINING', 16, 15);
    context.fillStyle = '#91a9bc';
    context.fillText('EARTH / ALL CLEAR', 16, 278);
    if (pose.collarInset > 0) {
      const gap = Math.round(Math.min(16, pose.stardrive.y - pose.saucer.y));
      context.globalAlpha = pose.collarInset;
      context.drawImage(collar, 346, 220);
      context.fillStyle = '#bdc9c0';
      context.fillText('DOCKING COLLAR', 349, 206);
      context.fillStyle = '#7f969d';
      context.fillRect(374, 249 - gap, 62, 8);
      context.fillStyle = '#d2d2b8';
      context.fillRect(374, 249 - gap, 62, 2);
      context.fillStyle = '#445f70';
      context.fillRect(387, 254 - gap, 36, 5);
      const latchTravel = Math.round(pose.latches * 11);
      context.fillStyle = '#b7a47e';
      context.fillRect(354 + latchTravel, 256, 12, 4);
      context.fillRect(444 - latchTravel, 256, 12, 4);
      context.fillStyle = pose.utilities === 1 ? '#92b8a5' : '#5f7278';
      context.fillText(pose.utilities === 1 ? 'LOCKED / CONNECTED' : pose.latches === 1 ? 'LOCKED / LINKING' : 'MATCHED / CLOSING', 350, 273);
      if (pose.utilities > 0) {
        context.globalAlpha = pose.utilities;
        context.fillStyle = '#95c2c9';
        for (const x of [393, 403, 413]) context.fillRect(x, 253, 2, 16);
        context.fillRect(256, 165, 9, 1);
      }
    }
    context.restore();
  };
}

export const rejoining: Cinematic = {
  title: 'One ship again',
  duration,
  noun: 'sequence',
  createRenderer,
  beats: [
    {
      at: 0, stillAt: 2000, speaker: 'RIKER',
      text: 'Both sections are clear. Bring the Enterprise back together.',
      description: 'Earth hangs beyond the two surviving sections. The saucer holds above and ahead of the stardrive; no intact Borg cube remains.',
    },
    {
      at: 4000, stillAt: 7500, speaker: 'GEORDI',
      text: 'Relative motion is matched. Beginning the closing maneuver.',
      description: 'The saucer glides down and aft as the stardrive eases beneath it. Both hulls maintain the same steady attitude.',
    },
    {
      at: 9500, stillAt: 13_000, speaker: 'SAUCER CONTROL',
      text: 'The docking saddle is centered. Taking out the last of the distance.',
      description: 'Starlight still separates the matching collars. A close view shows the upper coupling approaching its seat without touching the extended latches.',
    },
    {
      at: 14_000, stillAt: 16_500, speaker: 'GEORDI',
      text: 'The collars are meeting. Hold this attitude while we secure the ship.',
      description: 'The saucer settles onto the neck of the engineering section. The two coupling origins meet, restoring the Enterprise silhouette.',
    },
    {
      at: 17_700, stillAt: 20_000, speaker: 'GEORDI',
      text: 'Collar latches are engaged. Bringing the utility connections online.',
      description: 'In the docking close-up, opposing latches slide into their seats. Blue utility indicators begin filling between the joined couplings.',
    },
    {
      at: 21_400, stillAt: 24_000, speaker: 'RIKER',
      text: 'One ship again. Release the emergency stations. I am going to see the captain.',
      description: 'The intact Enterprise holds above Earth. All collar indicators remain steady; the crew can now turn from the rescue to Picard\'s recovery.',
    },
  ],
};
