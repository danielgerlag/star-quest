import { createPixelTexture } from '../art';
import type { Cinematic } from '../cinematic';
import { drawDeepSpace, drawDistantCube, drawEarth } from './space-art';
import { createGalaxyRenderer } from './space-renderer';

const duration = 24_000;
const fragments = [
  { sx: 0, sy: 0, width: 17, height: 16, dx: -28, dy: -16, spin: -0.22 },
  { sx: 17, sy: 0, width: 16, height: 16, dx: -4, dy: -26, spin: 0.18 },
  { sx: 33, sy: 0, width: 17, height: 16, dx: 22, dy: -20, spin: 0.25 },
  { sx: 0, sy: 16, width: 17, height: 13, dx: -31, dy: -4, spin: -0.17 },
  { sx: 17, sy: 16, width: 16, height: 13, dx: -6, dy: -8, spin: 0.15 },
  { sx: 33, sy: 16, width: 17, height: 13, dx: 29, dy: -1, spin: 0.2 },
  { sx: 0, sy: 29, width: 17, height: 13, dx: -24, dy: 13, spin: 0.23 },
  { sx: 17, sy: 29, width: 16, height: 13, dx: 4, dy: 9, spin: -0.25 },
  { sx: 33, sy: 29, width: 17, height: 13, dx: 27, dy: 16, spin: -0.18 },
  { sx: 0, sy: 42, width: 17, height: 14, dx: -19, dy: 25, spin: -0.2 },
  { sx: 17, sy: 42, width: 16, height: 14, dx: 3, dy: 29, spin: 0.17 },
  { sx: 33, sy: 42, width: 17, height: 14, dx: 21, dy: 24, spin: 0.22 },
] as const;

export interface DestructionPose {
  readonly cube: { readonly x: number; readonly y: number };
  readonly saucer: { readonly x: number; readonly y: number };
  readonly stardrive: { readonly x: number; readonly y: number };
  readonly network: number;
  readonly feedback: number;
  readonly breakup: number;
  readonly cloud: number;
  readonly debris: number;
}

function ease(at: number, start: number, end: number): number {
  const progress = Math.max(0, Math.min(1, (at - start) / (end - start)));
  return progress * progress * (3 - 2 * progress);
}

export function sampleDestructionPose(at: number): DestructionPose {
  const time = Math.max(0, Math.min(duration, Number.isNaN(at) ? 0 : at));
  const clearance = ease(time, 0, 22_000);
  return {
    cube: { x: 250, y: 96 },
    stardrive: { x: 132 - 5 * clearance, y: 221 + 5 * clearance },
    saucer: { x: 308 + 7 * clearance, y: 247 + 4 * clearance },
    network: 1 - ease(time, 500, 4000),
    feedback: ease(time, 4000, 10_500) * (1 - ease(time, 15_500, 20_500)),
    breakup: ease(time, 11_000, 18_500),
    cloud: ease(time, 9000, 13_500) * (1 - ease(time, 17_000, 23_000)),
    debris: 1 - ease(time, 18_500, 23_000),
  };
}

function createRenderer(canvas: HTMLCanvasElement): (at: number, still: boolean) => void {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('A Canvas2D context is required to show the cube breaking apart.');
  const background = createPixelTexture(480, 300, (p) => {
    drawDeepSpace(p);
    drawEarth(p, 402, 110, 58);
  });
  const drawSection = createGalaxyRenderer(context);
  const cube = createPixelTexture(50, 56, (p) => drawDistantCube(p, 0, 0));
  const network = createPixelTexture(50, 56, (p) => {
    for (let row = 0; row < 6; row++) {
      for (let column = 0; column < 4; column++) {
        p.rect(4 + column * 8, 16 + row * 5 + column, 2, 1, '#9abb7b');
      }
    }
    for (let row = 0; row < 6; row++) p.rect(42, 14 + row * 5, 2, 1, '#92ba84');
  });
  const fractures = createPixelTexture(50, 56, (p) => {
    const seams = [
      [[14, 1], [17, 10], [15, 19], [19, 28], [16, 38], [18, 49]],
      [[30, 4], [33, 15], [30, 26], [34, 34], [31, 43], [35, 53]],
      [[1, 20], [11, 23], [15, 19], [25, 25], [35, 23], [47, 16]],
      [[1, 31], [9, 30], [19, 35], [29, 34], [35, 38], [47, 30]],
      [[1, 41], [10, 42], [16, 38], [25, 45], [35, 46], [47, 40]],
    ] as const;
    for (const seam of seams) {
      for (let index = 1; index < seam.length; index++) {
        const from = seam[index - 1];
        const to = seam[index];
        p.line(from[0], from[1], to[0], to[1], '#587657', 2);
        p.line(from[0], from[1], to[0], to[1], '#d2c597');
      }
    }
    p.ellipse(24, 29, 4, 3, '#cad3a0');
  });
  const cloud = createPixelTexture(152, 152, (p) => {
    p.ellipse(76, 76, 73, 55, '#29453d24');
    p.ellipse(74, 73, 61, 48, '#41645232');
    for (const [x, y, rx, ry] of [
      [42, 56, 24, 22], [71, 43, 24, 22], [107, 64, 27, 22],
      [47, 95, 27, 24], [84, 108, 28, 23], [107, 95, 25, 24],
    ]) p.ellipse(x, y, rx, ry, '#6c79603c');
    p.ellipse(77, 74, 34, 30, '#a0a47b45');
    for (let index = 0; index < 28; index++) {
      const angle = index * 2.4;
      const radius = 23 + index % 5 * 9;
      p.rect(76 + Math.cos(angle) * radius, 76 + Math.sin(angle) * radius * 0.8,
        2 + index % 3, 1, '#9a9a7755');
    }
  });

  return (at, _still) => {
    const pose = sampleDestructionPose(at);
    const cubeX = pose.cube.x - 40;
    const cubeY = pose.cube.y - 45;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.imageSmoothingEnabled = false;
    context.globalAlpha = 1;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(background, 0, 0);
    if (pose.cloud > 0) {
      const size = 72 + 80 * pose.breakup;
      context.globalAlpha = pose.cloud * 0.58;
      context.drawImage(cloud, pose.cube.x - size / 2, pose.cube.y - size / 2, size, size);
    }
    if (pose.debris > 0) {
      context.globalAlpha = pose.debris;
      if (pose.breakup === 0) {
        context.drawImage(cube, cubeX, cubeY, 80, 90);
        if (pose.network > 0) {
          context.globalAlpha = pose.network;
          context.drawImage(network, cubeX, cubeY, 80, 90);
        }
        if (pose.feedback > 0) {
          context.globalAlpha = pose.feedback;
          context.drawImage(fractures, cubeX, cubeY, 80, 90);
        }
      } else {
        for (const fragment of fragments) {
          const left = Math.round(fragment.sx * 80 / 50);
          const top = Math.round(fragment.sy * 90 / 56);
          const width = Math.round((fragment.sx + fragment.width) * 80 / 50) - left;
          const height = Math.round((fragment.sy + fragment.height) * 90 / 56) - top;
          context.save();
          context.translate(cubeX + left + width / 2 + fragment.dx * pose.breakup,
            cubeY + top + height / 2 + fragment.dy * pose.breakup);
          context.rotate(fragment.spin * pose.breakup);
          context.globalAlpha = pose.debris;
          context.drawImage(cube, fragment.sx, fragment.sy, fragment.width, fragment.height,
            -width / 2, -height / 2, width, height);
          if (pose.feedback > 0) {
            context.globalAlpha = pose.feedback * pose.debris;
            context.drawImage(fractures, fragment.sx, fragment.sy, fragment.width, fragment.height,
              -width / 2, -height / 2, width, height);
          }
          context.restore();
        }
      }
    }
    context.globalAlpha = 1;
    drawSection('stardrive', pose.stardrive.x, pose.stardrive.y, 0.8);
    drawSection('saucer', pose.saucer.x, pose.saucer.y, 0.86);
    context.font = '9px monospace';
    context.textBaseline = 'top';
    context.fillStyle = '#99aeb7';
    context.fillText('SOL SYSTEM / REGENERATION FEEDBACK', 16, 15);
    context.fillStyle = '#a8c0c7';
    context.fillText('EARTH', 386, 31);
    context.fillStyle = '#9fb6aa';
    context.fillText(pose.debris === 0 ? 'CONTACT / DISPERSED' : 'NETWORK / NO RESPONSE', 16, 281);
    context.fillStyle = '#abbdb4';
    context.fillText('BOTH SECTIONS / SIGNALS STEADY', 284, 281);
    context.restore();
  };
}

export const cubeDestruction: Cinematic = {
  title: 'The Collective falls silent',
  duration,
  noun: 'sequence',
  createRenderer,
  beats: [
    {
      at: 0, stillAt: 2500, speaker: 'DATA',
      text: 'My connection is closed. The drones remain in regeneration; their power network has no one correcting it.',
      description: 'A solid Borg cube hangs near a blue Earth with green continents and white cloud bands. Its working lights dim while the separate saucer and stardrive hold well clear below.',
    },
    {
      at: 4000, stillAt: 6800, speaker: 'SHELBY',
      text: 'There is a glow inside their hull. It is moving from junction to junction.',
      description: 'Thin, muted gold-green fractures brighten from inside the cube. Earth stays in view, and neither Enterprise section fires a weapon.',
    },
    {
      at: 8500, stillAt: 10_200, speaker: 'DATA',
      text: 'Each overloaded junction is driving the next. The feedback is now crossing their internal power grid.',
      description: 'Connected seams spread through the still-solid cube as a small, dim cloud forms at its core. Nothing travels from either ship section toward the cube.',
    },
    {
      at: 11_500, stillAt: 14_500, speaker: 'WORF',
      text: 'The outer structure is separating. Large pieces are moving away from the center.',
      description: 'The cube physically breaks into a dozen textured hull fragments. They move apart and turn independently around a slowly expanding, low-intensity cloud.',
      cue: 'alert',
    },
    {
      at: 16_000, stillAt: 19_000, speaker: 'RIKER',
      text: 'Maintain that clearance. Let the fragments pass; keep both sections in sight.',
      description: 'Broken hull plates drift farther apart as the cloud thins. The saucer, stardrive and recognizable Earth remain visibly outside the entire debris field.',
    },
    {
      at: 21_000, stillAt: 23_500, speaker: 'SHELBY',
      text: 'The contact has dispersed. Earth is clear, and both sections are answering. We can prepare to come together.',
      description: 'The final fragments and cloud have dissipated. Earth remains unharmed beside the two intact, still-separated Enterprise sections; no Borg cube remains.',
    },
  ],
};
