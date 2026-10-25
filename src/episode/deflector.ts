import { createPixelTexture } from '../art';
import type { Cinematic } from '../cinematic';
import { drawDeepSpace, drawDistantCube } from './space-art';
import { createGalaxyRenderer } from './space-renderer';

const duration = 24_000;

export interface DeflectorPose {
  readonly ship: { readonly x: number; readonly y: number };
  readonly cube: { readonly x: number; readonly y: number };
  readonly charge: number;
  readonly beam: number;
  readonly beamReach: number;
  readonly shield: number;
  readonly exhausted: number;
}

function ease(at: number, start: number, end: number): number {
  const progress = Math.max(0, Math.min(1, (at - start) / (end - start)));
  return progress * progress * (3 - 2 * progress);
}

export function sampleDeflectorPose(at: number): DeflectorPose {
  const time = Math.max(0, Math.min(duration, Number.isNaN(at) ? 0 : at));
  const approach = ease(time, 0, 6000);
  const recoil = ease(time, 15_500, 20_500);
  const course = ease(time, 0, 22_000);
  return {
    ship: { x: 156 + 4 * approach - 4 * recoil, y: 154 + 3 * approach + 4 * recoil },
    cube: { x: 354 + 9 * course, y: 82 + 9 * course },
    charge: ease(time, 1000, 5300) * (1 - ease(time, 16_000, 19_000)),
    beam: ease(time, 6000, 7500) * (1 - ease(time, 16_500, 19_000)),
    beamReach: ease(time, 6000, 7000),
    shield: ease(time, 5300, 6900),
    exhausted: ease(time, 17_000, 20_500),
  };
}

function createRenderer(canvas: HTMLCanvasElement): (at: number, still: boolean) => void {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('A Canvas2D context is required to show the deflector attack.');
  const background = createPixelTexture(480, 300, drawDeepSpace);
  const drawSection = createGalaxyRenderer(context);
  const cube = createPixelTexture(50, 56, (p) => drawDistantCube(p, 0, 0));
  const beam = createPixelTexture(128, 24, (p) => {
    p.polygon([[0, 10], [127, 0], [127, 23], [0, 13]], '#426f9c38');
    p.polygon([[0, 10], [127, 4], [127, 19], [0, 13]], '#5b9fc77d');
    p.polygon([[0, 11], [127, 8], [127, 15], [0, 13]], '#8acddd');
    p.polygon([[0, 11], [127, 10], [127, 13], [0, 12]], '#d3e8dc');
  });
  const dishGlow = createPixelTexture(44, 24, (p) => {
    p.ellipse(22, 12, 21, 10, '#497ab82b');
    p.ellipse(22, 12, 15, 7, '#5a9ec466');
    p.ellipse(22, 12, 9, 4, '#75bfd4');
    p.ellipse(22, 12, 5, 2, '#d3e8dc');
  });
  const shield = createPixelTexture(112, 122, (p) => {
    const outline = [[1, 30], [34, 1], [110, 14], [110, 89], [81, 120], [1, 101]] as const;
    p.polygon(outline, '#5ba8901b');
    for (let index = 0; index < outline.length; index++) {
      const from = outline[index];
      const to = outline[(index + 1) % outline.length];
      p.line(from[0], from[1], to[0], to[1], '#6a9d8ba6');
    }
    p.line(8, 33, 78, 44, '#8ebba891');
    p.line(78, 44, 103, 22, '#8ebba891');
    p.line(78, 44, 78, 111, '#8ebba891');
    for (const y of [48, 63, 78, 93]) p.line(8, y, 71, y + 9, '#78b79d55');
    p.line(8, 33, 8, 95, '#9ac7b3');
  });
  const impact = createPixelTexture(30, 38, (p) => {
    p.ellipse(15, 19, 14, 18, '#78bba732');
    p.ellipse(15, 19, 9, 12, '#8bc8be70');
    p.ellipse(15, 19, 3, 6, '#b6dcd1');
    p.line(15, 5, 15, 33, '#8bc8be85');
  });
  const spentDish = createPixelTexture(32, 16, (p) => {
    p.ellipse(16, 8, 13, 6, '#26313c');
    p.ellipse(17, 8, 10, 4, '#675540');
    p.ellipse(18, 8, 7, 3, '#253846');
    p.ellipse(19, 8, 4, 2, '#344f59');
    p.line(18, 6, 22, 7, '#56686a');
  });

  return (at, _still) => {
    const pose = sampleDeflectorPose(at);
    const shipX = Math.round(pose.ship.x);
    const shipY = Math.round(pose.ship.y);
    const cubeX = Math.round(pose.cube.x);
    const cubeY = Math.round(pose.cube.y);
    // drawStardrive places the luminous center of the lower dish at (20, 49).
    const emitterX = shipX + 20;
    const emitterY = shipY + 49;
    const targetX = cubeX + 16;
    const targetY = cubeY + 65;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.imageSmoothingEnabled = false;
    context.globalAlpha = 1;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(background, 0, 0);
    context.drawImage(cube, cubeX, cubeY, 90, 101);
    drawSection('stardrive', pose.ship.x, pose.ship.y);
    drawSection('saucer', pose.ship.x, pose.ship.y);
    if (pose.charge > 0) {
      context.globalAlpha = pose.charge;
      context.drawImage(dishGlow, emitterX - 22, emitterY - 12);
    }
    if (pose.beam > 0) {
      const dx = targetX - emitterX;
      const dy = targetY - emitterY;
      const width = Math.hypot(dx, dy) * pose.beamReach;
      const height = 10 + pose.charge * 10 + pose.shield * 6;
      context.save();
      context.translate(emitterX, emitterY);
      context.rotate(Math.atan2(dy, dx));
      context.globalAlpha = pose.beam;
      context.drawImage(beam, 0, -height / 2, width, height);
      context.restore();
      if (pose.beamReach === 1) {
        context.globalAlpha = pose.beam * (0.4 + pose.shield * 0.6);
        context.drawImage(impact, targetX - 15, targetY - 19);
      }
    }
    if (pose.shield > 0) {
      context.globalAlpha = pose.shield * 0.85;
      context.drawImage(shield, cubeX - 12, cubeY - 11);
    }
    if (pose.exhausted > 0) {
      context.globalAlpha = pose.exhausted;
      context.drawImage(spentDish, shipX + 1, shipY + 41);
    }
    context.globalAlpha = 1;
    context.font = '9px monospace';
    context.textBaseline = 'top';
    context.fillStyle = '#99aeb7';
    context.fillText('NCC-1701-D / MAIN DEFLECTOR', 16, 15);
    context.fillStyle = '#708879';
    context.fillText('BORG CONTACT', 352, 61);
    context.fillStyle = '#101b2ade';
    context.fillRect(16, 251, 448, 35);
    context.fillStyle = pose.exhausted === 1 ? '#bd9975' : '#9abeca';
    context.fillText(pose.exhausted === 1 ? 'DISH / EXHAUSTED' : 'DISH / FIELD STRENGTH', 24, 259);
    context.fillStyle = '#2a3e4e';
    context.fillRect(24, 274, 172, 3);
    context.fillStyle = '#80c3d5';
    context.fillRect(24, 274, Math.round(172 * pose.charge), 3);
    context.fillStyle = '#9bb4a4';
    context.fillText(pose.exhausted === 1 ? 'CUBE / STILL ON COURSE' : 'CUBE / SHIELD ENVELOPE', 254, 259);
    context.fillStyle = '#253d36';
    context.fillRect(254, 274, 172, 3);
    context.fillStyle = '#7ea991';
    context.fillRect(254, 274, Math.round(172 * pose.shield), 3);
    context.restore();
  };
}

export const deflectorAttack: Cinematic = {
  title: 'The deflector gambit',
  duration,
  noun: 'sequence',
  createRenderer,
  beats: [
    {
      at: 0, stillAt: 3500, speaker: 'GEORDI',
      text: 'Power is building in the main dish. Once we release it, there will be very little left to draw on.',
      description: 'The joined Enterprise advances on an intact cube. Blue-white light gathers in the small lower deflector dish, below the saucer and ahead of the engineering hull.',
      cue: 'alert',
    },
    {
      at: 5500, stillAt: 8300, speaker: 'RIKER',
      text: 'Hold our heading. Release the deflector charge and keep the channel open.',
      description: 'A continuous blue beam grows outward from the lower dish until it reaches the cube. The saucer and both nacelles remain attached; none of them fires.',
    },
    {
      at: 9500, stillAt: 12_000, speaker: 'SHELBY',
      text: 'Their envelope is already carrying the impact around the hull. I can see no breach.',
      description: 'The continuous beam spreads along a green shield lattice already formed around the cube. The hull remains intact behind it.',
    },
    {
      at: 14_000, stillAt: 15_500, speaker: 'GEORDI',
      text: 'That is the full output. Their shield is carrying the load without giving way.',
      description: 'The beam widens against a complete shield envelope. The detailed cube remains solid behind it and continues moving, without fractures or debris.',
    },
    {
      at: 17_200, stillAt: 18_400, speaker: 'GEORDI',
      text: 'The dish field is collapsing. I am closing the feed before we lose the assembly.',
      description: 'The continuous beam gradually thins and fades. Light drains from the actual dish while the cube and its adapted shield remain intact.',
    },
    {
      at: 20_500, stillAt: 22_900, speaker: 'RIKER',
      text: 'End the attempt. Keep us clear. We will examine the return signal before deciding our next move.',
      description: 'The beam is gone and the exhausted lower dish is dark. The intact cube continues on course, with the joined Enterprise holding behind it.',
    },
  ],
};
