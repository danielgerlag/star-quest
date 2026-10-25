import { createRoomCinematicRenderer } from '../cinematic';
import type { ActorTrack, Cinematic, CinematicKeyframe, CinematicPose, RoomCinematicScene } from '../cinematic';
import type { Appearance } from '../model';
import { speakers } from './catalog';

function appearance(id: 'riker' | 'worf' | 'picard'): Appearance {
  const speaker = speakers.find((entry) => entry.id === id);
  if (!speaker) throw new Error(`Opening actor ${id} is missing from the cast.`);
  return speaker.appearance;
}

function frame(at: number, x: number, y: number, pose: CinematicPose = 'stand', opacity = 1, transport = 0): CinematicKeyframe {
  return { at, x, y, pose, opacity, transport };
}

function droneTrack(startX: number, heldX: number): ActorTrack {
  return [
    frame(0, startX, 218, 'stand', 0),
    frame(4500, startX, 218, 'stand', 0),
    frame(5200, startX, 218, 'stand', 0, 1),
    frame(7600, startX, 218, 'stand', 1, 0.65),
    frame(9400, startX, 218),
    frame(10500, startX, 218, 'walk'),
    frame(16200, heldX, 220, 'reach'),
    frame(22000, heldX, 220, 'reach'),
    frame(23200, heldX, 220, 'reach', 1, 1),
    frame(25500, heldX, 220, 'reach', 0.5, 1),
    frame(27300, heldX, 220, 'reach', 0, 0.6),
    frame(28500, heldX, 220, 'reach', 0),
  ];
}

const armor: Appearance = { skin: '#b6bdab', hair: '#242e30', uniform: '#344247', style: 'borg' };

export const opening: Cinematic & RoomCinematicScene = {
  title: 'The last order',
  duration: 33000,
  noun: 'intro',
  createRenderer: (canvas) => createRoomCinematicRenderer(canvas, opening),
  visual: 'bridge',
  atmosphere: 'alert',
  actors: [
    { id: 'picard', appearance: { ...appearance('picard'), uniform: '#a33749' }, track: [
      frame(0, 240, 211),
      frame(10500, 240, 211, 'walk'),
      frame(16200, 240, 220, 'reach'),
      frame(22000, 240, 220, 'reach'),
      frame(23200, 240, 220, 'reach', 1, 1),
      frame(25500, 240, 220, 'reach', 0.5, 1),
      frame(27300, 240, 220, 'reach', 0, 0.6),
      frame(28500, 240, 220, 'stand', 0),
    ] },
    { id: 'drone-left', appearance: armor, track: droneTrack(175, 221) },
    { id: 'drone-right', appearance: { ...armor, skin: '#9daaa0' }, track: droneTrack(305, 259) },
    { id: 'riker', appearance: appearance('riker'), track: [
      frame(0, 341, 262),
      frame(10500, 341, 262, 'walk-back'),
      frame(16200, 286, 244, 'back'),
      frame(28500, 286, 244, 'walk-back'),
      frame(31700, 253, 241, 'back'),
    ] },
    { id: 'worf', appearance: appearance('worf'), track: [
      frame(0, 125, 258),
      frame(10500, 125, 258, 'walk-back'),
      frame(16200, 191, 249, 'back'),
    ] },
  ],
  beats: [
    { at: 0, stillAt: 2000, speaker: 'Worf', cue: 'alert',
      text: 'Transporter signatures. On the bridge.',
      description: 'Picard stands beside the command chair. Worf detects an intruder transport.' },
    { at: 4500, stillAt: 7900, speaker: 'Jean-Luc Picard', cue: 'transport',
      text: 'Keep clear of them. Protect the ship.',
      description: 'Two Borg drones materialize in columns of green light, one on either side of Picard.' },
    { at: 10500, stillAt: 14200, speaker: 'William T. Riker',
      text: 'Captain, get behind me.',
      description: 'The drones converge on Picard. Riker and Worf move to intercept them.' },
    { at: 16500, stillAt: 19000, speaker: 'Jean-Luc Picard',
      text: 'Will. The ship comes first.',
      description: 'The drones seize Picard by the arms. They ignore the consoles. They came for him.' },
    { at: 22000, stillAt: 25500, speaker: 'Worf', cue: 'transport',
      text: 'A second transport! I cannot isolate it.',
      description: 'Green light envelops all three figures. Picard disappears with his captors.' },
    { at: 28500, stillAt: 32000, speaker: 'William T. Riker',
      text: 'Keep us together. All stations, report.',
      description: 'The transporter light fades. Riker steps toward the empty command chair.' },
  ],
};
