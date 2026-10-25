import { createCharacterTexture, createPixelTexture, createRoomTexture } from '../art';
import type { Cinematic } from '../cinematic';
import { campaign } from './index';
import { drawDeepSpace, drawDistantCube, drawShuttle } from './space-art';
import { createGalaxyRenderer } from './space-renderer';

const duration = 31_000;
const shuttleScale = 0.64;

export interface RescuePose {
  readonly at: number;
  readonly phase: 'cover' | 'barrier' | 'extraction' | 'return' | 'reception' | 'home';
  readonly cube: { readonly x: number; readonly y: number };
  readonly shuttle: { readonly x: number; readonly y: number; readonly returning: boolean };
  readonly screen: number;
  readonly shot: number;
  readonly barrierOpen: number;
  readonly teamApproach: number;
  readonly awayOpacity: number;
  readonly awayTransport: number;
  readonly receivedOpacity: number;
  readonly receivedTransport: number;
  readonly dock: number;
  readonly crewExit: number;
}

function ease(at: number, start: number, end: number): number {
  const t = Math.max(0, Math.min(1, (at - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

export function sampleRescuePose(at: number): RescuePose {
  const time = Number.isNaN(at) ? 0 : Math.max(0, Math.min(duration, at));
  const outbound = ease(time, 400, 5400);
  const inbound = ease(time, 15_500, 21_000);
  const travel = outbound * (1 - inbound);
  return Object.freeze({
    at: time,
    phase: time < 5500 ? 'cover' : time < 10_000 ? 'barrier' : time < 15_500 ? 'extraction'
      : time < 21_000 ? 'return' : time < 27_000 ? 'reception' : 'home',
    cube: Object.freeze({ x: 350 + 40 * time / duration, y: 42 + 10 * time / duration }),
    shuttle: Object.freeze({
      x: 153 + 191 * travel,
      y: 216 - 52 * travel - 16 * Math.sin(travel * Math.PI),
      returning: time >= 15_500,
    }),
    screen: 0.45 + 0.55 * ease(time, 0, 3000),
    shot: ease(time, 6700, 6950) * (1 - ease(time, 7400, 7800)),
    barrierOpen: ease(time, 7350, 9000),
    teamApproach: ease(time, 9000, 9900),
    awayOpacity: 1 - ease(time, 11_200, 14_300),
    awayTransport: ease(time, 10_000, 11_200) * (1 - ease(time, 14_600, 15_400)),
    receivedOpacity: ease(time, 22_500, 25_500),
    receivedTransport: ease(time, 21_000, 22_300) * (1 - ease(time, 25_900, 26_700)),
    dock: ease(time, 21_500, 24_500),
    crewExit: ease(time, 24_500, 27_000),
  });
}

function createRenderer(canvas: HTMLCanvasElement): (at: number, still: boolean) => void {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('A Canvas2D context is required to show the shuttle rescue.');
  const space = createPixelTexture(480, 300, drawDeepSpace);
  const cube = createPixelTexture(50, 56, (p) => drawDistantCube(p, 0, 0));
  const shuttle = createPixelTexture(60, 26, drawShuttle);
  const drawSection = createGalaxyRenderer(context);
  const compartment = createRoomTexture('borg', 'normal');
  const reception = createRoomTexture('transporter', 'normal');
  const screen = createPixelTexture(190, 96, (p) => {
    p.ellipse(93, 49, 90, 34, '#8b553b12');
    p.ellipse(107, 50, 74, 30, '#af704622');
    p.ellipse(72, 41, 58, 24, '#e0a46624');
    p.ellipse(126, 61, 57, 21, '#bd81562b');
    p.ellipse(84, 48, 47, 17, '#ecc68c31');
    for (let index = 0; index < 52; index++) {
      const x = 18 + index * 29 % 155;
      const y = 34 + index * 17 % 34;
      p.rect(x, y, 2 + index % 4, 1, index % 3 ? '#c3986359' : '#f0c38b80');
    }
  });
  const bay = createPixelTexture(166, 104, (p) => {
    p.rect(0, 0, 166, 104, '#0d1825');
    p.rect(0, 0, 166, 2, '#9babae');
    p.rect(0, 2, 2, 102, '#526875');
    p.rect(164, 2, 2, 102, '#526875');
    p.rect(2, 102, 162, 2, '#526875');
    p.rect(9, 25, 146, 46, '#384955');
    p.rect(13, 28, 138, 41, '#0a1826');
    for (const x of [20, 48, 76, 104, 132]) p.rect(x, 28, 2, 41, '#334b59');
    p.rect(93, 35, 36, 35, '#15232e');
    p.rect(91, 34, 2, 37, '#8b9b99');
    p.rect(129, 34, 2, 37, '#8b9b99');
    p.polygon([[9, 71], [155, 71], [161, 101], [5, 101]], '#354650');
    for (const x of [19, 51, 111, 147]) p.line(83 + (x - 83) * 0.6, 71, x, 100, '#52676e');
    p.line(12, 88, 153, 88, '#b5a477');
    p.line(13, 90, 152, 90, '#807552');
    p.rect(15, 32, 4, 2, '#e0c895');
    p.rect(141, 32, 4, 2, '#e0c895');
  });

  const appearance = (id: 'data' | 'worf' | 'locutus') => {
    const speaker = campaign.speakers.find((candidate) => candidate.id === id);
    if (!speaker) throw new Error(`The shuttle rescue requires the ${id} appearance.`);
    return speaker.appearance;
  };
  const walkingSprites = (id: 'data' | 'worf') => {
    const look = appearance(id);
    return {
      stand: createCharacterTexture(look),
      left: createCharacterTexture(look, 'step-left'),
      right: createCharacterTexture(look, 'step-right'),
    };
  };
  const data = walkingSprites('data');
  const worf = walkingSprites('worf');
  const aimingWorf = createCharacterTexture(appearance('worf'), 'reach');
  const locutus = createCharacterTexture(appearance('locutus'));
  const walking = (sprites: ReturnType<typeof walkingSprites>, progress: number, at: number) =>
    progress > 0 && progress < 1 ? Math.floor(at / 230) % 2 ? sprites.left : sprites.right : sprites.stand;

  const label = (text: string, x: number, y: number, color = '#bbc9ca'): void => {
    context.fillStyle = color;
    context.fillText(text, x, y);
  };
  const actor = (sprite: HTMLCanvasElement, x: number, y: number, opacity = 1, scale = 1.5): void => {
    if (opacity <= 0) return;
    context.save();
    context.globalAlpha = opacity * 0.25;
    context.fillStyle = '#071119';
    context.beginPath();
    context.ellipse(x, y, 12 * scale, 3 * scale, 0, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = opacity;
    context.drawImage(sprite, Math.round(x - 13 * scale), Math.round(y - 54 * scale), 26 * scale, 54 * scale);
    context.restore();
  };
  const transport = (x: number, y: number, strength: number, at: number, foreground: boolean): void => {
    if (strength <= 0) return;
    context.save();
    if (foreground) {
      context.globalAlpha = strength * 0.65;
      context.fillStyle = '#b7d9dc';
      for (let index = 0; index < 30; index++) {
        const rise = (index * 23 + at * 0.019) % 100;
        context.fillRect(Math.round(x - 18 + index * 13 % 37), Math.round(y - rise), 1, 2);
      }
      context.globalAlpha = strength * 0.2;
      for (let index = 0; index < 7; index++) {
        context.fillRect(x - 19, Math.round(y - (index * 15 + at * 0.009) % 101), 38, 1);
      }
    } else {
      context.globalAlpha = strength * 0.13;
      context.fillStyle = '#8cbdcf';
      context.fillRect(x - 24, y - 108, 48, 110);
      context.fillRect(x - 17, y - 105, 34, 108);
      context.globalAlpha = strength * 0.45;
      context.beginPath();
      context.ellipse(x, y, 25, 5, 0, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  };

  const exterior = (pose: RescuePose): void => {
    context.drawImage(space, 0, 0);
    context.drawImage(cube, Math.round(pose.cube.x), Math.round(pose.cube.y));
    context.save();
    context.globalAlpha = 0.3 * pose.screen;
    context.strokeStyle = '#cb9b63';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(238, 91);
    context.lineTo(258, 119);
    context.lineTo(283, 146);
    context.stroke();
    context.restore();
    const width = 150 + 40 * pose.screen;
    context.drawImage(screen, 216, 112, width, 76 + 20 * pose.screen);
    drawSection('stardrive', 166, 213, 0.8);
    drawSection('saucer', 144, 108, 0.82);
    context.save();
    context.translate(Math.round(pose.shuttle.x + (pose.shuttle.returning ? 60 * shuttleScale : 0)),
      Math.round(pose.shuttle.y));
    context.scale(pose.shuttle.returning ? -shuttleScale : shuttleScale, shuttleScale);
    context.fillStyle = '#54829866';
    context.fillRect(-16, 17, 17, 2);
    context.fillStyle = '#9ec6cd';
    context.fillRect(0, 16, 3, 4);
    context.drawImage(shuttle, 0, 0);
    context.restore();
    label('NCC-1701-D / SEPARATE SECTIONS', 16, 16);
    label('EARTHWARD >', 366, 25, '#94a994');
    label('SAUCER', 164, 121, '#869ba5');
    label('STARDRIVE CONTROL / RIKER ON COMMS', 16, 277, '#91a6b2');
    label('ANTIMATTER SCREEN', 254, 225, '#d6b98c');
    label(pose.phase === 'cover' ? 'SHUTTLE / OUTBOUND' : 'SHUTTLE / THREE ABOARD', 254, 242);
  };

  const aboardCube = (pose: RescuePose): void => {
    context.drawImage(compartment, 0, 0);
    context.fillStyle = '#101e24';
    context.fillRect(260, 99, 8, 139);
    context.fillRect(330, 99, 8, 139);
    context.fillRect(260, 98, 78, 6);
    context.fillStyle = '#6f8768';
    context.fillRect(262, 105, 2, 130);
    context.fillRect(332, 105, 2, 130);
    context.fillStyle = '#16262a';
    context.fillRect(325, 100, 19, 14);
    context.fillStyle = pose.barrierOpen === 1 ? '#3b4b43' : '#93b98a';
    context.fillRect(329, 104, 10, 5);
    context.save();
    context.globalAlpha = 0.18 * (1 - pose.barrierOpen);
    context.fillStyle = '#9fd6a2';
    const height = 132 * (1 - pose.barrierOpen);
    context.fillRect(268, 105, 62, height);
    context.globalAlpha = 0.5 * (1 - pose.barrierOpen);
    for (let y = 105; y < 105 + height; y += 8) context.fillRect(268, y, 62, 1);
    context.restore();
    const dataX = 162 + 83 * pose.teamApproach;
    const worfX = 214 + 131 * pose.teamApproach;
    const team = [
      { sprite: walking(data, pose.teamApproach, pose.at), x: dataX, y: 233 },
      { sprite: locutus, x: 296, y: 234 },
      {
        sprite: pose.shot > 0 ? aimingWorf : walking(worf, pose.teamApproach, pose.at),
        x: worfX, y: 228 + 7 * pose.teamApproach,
      },
    ];
    for (const member of team) transport(member.x, member.y, pose.awayTransport, pose.at, false);
    for (const member of team) actor(member.sprite, member.x, member.y, pose.awayOpacity);
    if (pose.shot > 0) {
      context.save();
      context.globalAlpha = pose.shot;
      context.fillStyle = '#adb6a6';
      context.fillRect(worfX + 15, 190, 9, 4);
      context.strokeStyle = '#dca564';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(worfX + 24, 191);
      context.lineTo(334, 108);
      context.stroke();
      context.fillStyle = '#efcc89';
      context.fillRect(330, 105, 6, 4);
      context.restore();
    }
    for (const member of team) transport(member.x, member.y, pose.awayTransport, pose.at, true);
    label('BORG INTERIOR / LOCAL EXTRACTION', 16, 24);
    label(pose.barrierOpen === 1 ? 'LOCAL BARRIER / OPEN' : 'LOCAL BARRIER / EMITTER', 251, 79, '#b6c796');
    if (pose.awayOpacity > 0) {
      label('DATA', dataX - 12, 249, '#cbbb85');
      label('LOCUTUS', 277, 249, '#b6c5b7');
      label('WORF', worfX - 12, 249, '#cbbb85');
    }
    label(pose.phase === 'barrier' ? 'FOCUSED EMITTER SHOT / MISSION REPLAY'
      : pose.awayOpacity > 0 ? 'SHUTTLE TRANSPORT / THREE PATTERNS' : 'COMPARTMENT CLEAR / THREE EXTRACTED',
    16, 278, '#92abb0');
  };

  const receiving = (pose: RescuePose): void => {
    context.drawImage(reception, 0, 0);
    transport(240, 178, pose.receivedTransport, pose.at, false);
    actor(locutus, 240, 178, pose.receivedOpacity);
    transport(240, 178, pose.receivedTransport, pose.at, true);
    label('STARDRIVE / TRANSPORTER RECEPTION', 16, 14);
    label(pose.receivedOpacity === 1 ? 'LOCUTUS / ABOARD' : 'LOCUTUS / RECEIVING', 179, 195, '#b8d4d1');

    context.fillStyle = '#0b1724';
    context.fillRect(16, 211, 266, 77);
    context.fillStyle = '#516772';
    context.fillRect(16, 211, 266, 2);
    label('BORG TRACK / COURSE UNCHANGED', 25, 220, '#96ae9c');
    context.fillStyle = '#354e55';
    context.fillRect(31, 273, 231, 1);
    for (let index = 0; index < 6; index++) context.fillRect(34 + index * 42, 268, 1, 9);
    context.drawImage(cube, Math.round(48 + (pose.cube.x - 350) * 2.4), 239, 25, 28);
    label('EARTHWARD >', 201, 249, '#a4b7a4');

    context.drawImage(bay, 299, 184);
    label('SHUTTLE / STARDRIVE BAY', 309, 195);
    context.save();
    context.translate(Math.round(445 - 88 * pose.dock), Math.round(225 + 20 * pose.dock));
    context.scale(-0.6, 0.6);
    context.drawImage(shuttle, 0, 0);
    context.restore();
    if (pose.crewExit > 0) {
      actor(walking(data, pose.crewExit, pose.at), 367 + 16 * pose.crewExit, 262 + 15 * pose.crewExit, 1, 1);
      actor(walking(worf, pose.crewExit, pose.at), 407 + 16 * pose.crewExit, 262 + 15 * pose.crewExit, 1, 1);
    }
    if (pose.crewExit === 1) label('DATA   WORF', 370, 280, '#cbbb85');
  };

  return (at, _still) => {
    const pose = sampleRescuePose(at);
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = '8px monospace';
    context.textBaseline = 'top';
    if (pose.phase === 'cover' || pose.phase === 'return') exterior(pose);
    else if (pose.phase === 'barrier' || pose.phase === 'extraction') aboardCube(pose);
    else receiving(pose);
    context.restore();
  };
}

export const shuttleRescue: Cinematic = {
  title: 'Bring him home',
  duration,
  noun: 'sequence',
  createRenderer,
  beats: [
    {
      at: 0, stillAt: 3800, speaker: 'RIKER · STARDRIVE COMMS',
      text: 'Saucer command, keep the screen across their sensors. Data, take the shuttle through the cover. We are holding your way back.',
      description: 'The separated saucer and stardrive remain intact. A small shuttle flies beneath a spreading amber antimatter screen while the Borg cube continues on its Earthward course.',
      cue: 'alert',
    },
    {
      at: 5500, stillAt: 9700, speaker: 'DATA',
      text: 'That emitter controls the local barrier. Worf, keep the beam narrow; we need only one way out.',
      description: 'Inside the green-lit Borg compartment, Data and Worf flank Locutus. The local barrier has opened and its emitter is dark; the rest of the compartment remains powered.',
    },
    {
      at: 10_000, stillAt: 12_750, speaker: 'WORF',
      text: 'Three patterns for the shuttle. I have the captain. Keep the lock on all of us.',
      description: 'Three pale-blue transporter columns surround Data, Locutus and Worf. All three figures fade together through the open local barrier; the Borg machinery remains solid behind their translucent outlines.',
      cue: 'transport',
    },
    {
      at: 15_500, stillAt: 18_300, speaker: 'DATA',
      text: 'All three of us are aboard the shuttle. Returning beneath the screen. The cube is maintaining its course.',
      description: 'The shuttle reverses direction and flies back through the amber cover toward the separated Enterprise sections. The intact cube continues toward Earth rather than following the shuttle.',
    },
    {
      at: 21_000, stillAt: 24_000, speaker: 'O’BRIEN',
      text: 'I have Locutus’s pattern at the stardrive receiver. Keep the shuttle steady through the transfer; your bay is ready.',
      description: 'Locutus takes shape on the stardrive receiving pad. A bay inset shows the returning shuttle settling toward its berth with Data and Worf still aboard.',
      cue: 'transport',
    },
    {
      at: 27_000, stillAt: 29_400, speaker: 'RIKER · STARDRIVE COMMS',
      text: 'He is aboard. Data, Worf, stand by. We have our captain back, but that cube is still headed for Earth.',
      description: 'Locutus stands fully materialized on the receiving pad, still bearing Borg implants. Data and Worf stand beside their docked shuttle in the bay inset. The Earthward cube track remains in motion.',
    },
  ],
};
