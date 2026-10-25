import { z } from 'zod';

export type Verb = 'look' | 'talk' | 'use' | 'scan';
export type CharacterPose =
  | 'stand' | 'step-left' | 'step-right' | 'reach'
  | 'back' | 'step-back-left' | 'step-back-right';
export type RoomVisual =
  | 'bridge' | 'ready-room' | 'observation' | 'engineering' | 'sickbay'
  | 'transporter' | 'shuttlebay' | 'cargo' | 'corridor' | 'quarters'
  | 'astrometrics' | 'battle-bridge' | 'borg' | 'relay' | 'tender' | 'earth'
  | 'colony' | 'wolf359';

export type PropVisual =
  | 'terminal' | 'chair' | 'padd' | 'crate' | 'conduit' | 'cylinder'
  | 'kit' | 'shutter' | 'hatch' | 'beacon' | 'lamp' | 'platform'
  | 'sample' | 'model' | 'locker' | 'clutch';

export interface Appearance {
  skin: string;
  hair: string;
  uniform: string;
  style: 'beard' | 'short' | 'bald' | 'long' | 'android' | 'ridge' | 'visor' | 'borg';
}

export interface Speaker {
  id: string;
  name: string;
  role: string;
  description: string;
  appearance: Appearance;
}

export interface Requirement {
  all?: readonly string[];
  any?: readonly string[];
  none?: readonly string[];
  choices?: Readonly<Record<string, string>>;
}

export type Effect =
  | { type: 'fact'; id: string }
  | { type: 'item'; id: string }
  | { type: 'remove-item'; id: string }
  | { type: 'evidence'; id: string }
  | { type: 'commit'; key: string; value: string }
  | { type: 'chapter'; chapter: number; room: string }
  | { type: 'ending'; id: string };

export interface Choice {
  id: string;
  label: string;
  description?: string;
  requires?: Requirement;
  unavailable?: string;
  effects?: readonly Effect[];
  response: readonly string[];
  speaker?: string;
  confirm?: string;
}

export interface Interaction {
  id: string;
  trigger: { verb: Verb } | { item: string };
  when?: Requirement;
  speaker?: string;
  title?: string;
  lines: readonly string[];
  effects?: readonly Effect[];
  choices?: readonly Choice[];
}

interface HotspotBase {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible?: Requirement;
  interactions: readonly Interaction[];
}

// A null prop uses the room painting instead of a separate sprite.
export type Hotspot = HotspotBase & (
  | { kind: 'person'; speaker: string; prop?: never }
  | { kind: 'viewport'; speaker?: never; prop?: never }
  | { kind: 'console' | 'object'; speaker?: never; prop: PropVisual | null }
);

export interface Room {
  id: string;
  name: string;
  deck: string;
  visual: RoomVisual;
  atmosphere: 'normal' | 'alert' | 'damaged';
  description: string;
  ambient: string;
  hotspots: readonly Hotspot[];
}

export interface Objective {
  id: string;
  text: string;
  done: Requirement;
  hints: readonly [string, string, string];
}

export interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  stardate: string;
  assignment?: string;
  intro: readonly string[];
  rooms: readonly Room[];
  objectives: readonly Objective[];
}

export interface Evidence {
  id: string;
  title: string;
  category: 'report' | 'observation' | 'medical' | 'tactical' | 'personal';
  text: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  icon: 'padd' | 'tricorder' | 'isolator' | 'beacon' | 'cell' | 'record' | 'key';
}

export interface Ending {
  id: string;
  title: string;
  subtitle: string;
  tone: 'hope' | 'sacrifice' | 'loss';
  paragraphs: readonly (string | { when: Requirement; text: string })[];
}

export interface Campaign {
  id: string;
  title: string;
  protagonist: string;
  commitmentLabels: Readonly<Record<string, Readonly<Record<string, string>>>>;
  speakers: readonly Speaker[];
  chapters: readonly Chapter[];
  evidence: readonly Evidence[];
  items: readonly Item[];
  endings: readonly Ending[];
  initialItems: readonly string[];
}

export const stateSchema = z.object({
  schema: z.literal(1),
  campaign: z.string().max(100),
  chapter: z.number().int().min(1).max(6),
  room: z.string().max(100),
  facts: z.array(z.string().max(120)).max(1000),
  inventory: z.array(z.string().max(120)).max(100),
  evidence: z.array(z.string().max(120)).max(200),
  commitments: z.record(z.string().max(100), z.string().max(100)),
  visited: z.array(z.string().max(120)).max(200),
  moves: z.number().int().min(0).max(1_000_000),
  activeInteraction: z.string().max(120).nullable(),
  ending: z.string().max(100).nullable(),
  log: z.array(z.object({
    speaker: z.string().max(100),
    text: z.string().max(5000),
  }).strict()).max(600),
}).strict();

export type GameState = z.infer<typeof stateSchema>;
export type Action =
  | { type: 'interact'; target: string; verb: Verb }
  | { type: 'item'; target: string; item: string }
  | { type: 'choose'; interaction: string; choice: string }
  | { type: 'travel'; room: string };

export interface Dialogue {
  title: string;
  speaker: string;
  lines: readonly string[];
  interaction: string | null;
  choices: readonly Choice[];
}

export interface Transition {
  state: GameState;
  dialogue: Dialogue | null;
  discoveries: readonly string[];
  changed: boolean;
}

export interface SceneView {
  room: Room;
  player: Speaker;
  speakers: readonly Speaker[];
  hotspots: readonly Hotspot[];
  reducedMotion: boolean;
  highlight: boolean;
}
