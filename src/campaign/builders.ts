import type { Effect, Hotspot, Interaction, Objective, PropVisual, Requirement, Verb } from '../model';

export const fact = (id: string): Effect => ({ type: 'fact', id });
export const evidence = (id: string): Effect => ({ type: 'evidence', id });
export const item = (id: string): Effect => ({ type: 'item', id });
export const all = (...ids: string[]): Requirement => ({ all: ids });
export const decision = (key: string, value: string): Effect => ({ type: 'commit', key, value });
export const next = (chapter: number, room: string): Effect => ({ type: 'chapter', chapter, room });

export function act(
  id: string,
  trigger: Verb | { item: string },
  lines: readonly string[],
  options: Omit<Interaction, 'id' | 'trigger' | 'lines'> = {},
): Interaction {
  return { id, trigger: typeof trigger === 'string' ? { verb: trigger } : trigger, lines, ...options };
}

export function object(
  id: string, label: string, slot: 0 | 1 | 2, visual: 'console' | 'viewport' | PropVisual,
  interactions: readonly Interaction[],
): Exclude<Hotspot, { kind: 'person' }> {
  const content = {
    id, label, x: [24, 184, 344][slot], y: 111, width: 112, height: 65,
    interactions: interactions.flatMap(interaction =>
      'verb' in interaction.trigger && interaction.trigger.verb === 'scan'
        ? [interaction, { ...interaction, id: `${interaction.id}-tricorder`, trigger: { item: 'tricorder' } }]
        : [interaction]),
  };
  if (visual === 'viewport') return { ...content, kind: 'viewport' };
  return {
    ...content, kind: visual === 'console' ? 'console' : 'object',
    prop: visual === 'console' ? 'terminal' : visual,
  };
}

export function person(
  id: string, speaker: string, slot: 0 | 1, interactions: readonly Interaction[],
  visible?: Requirement,
): Hotspot {
  return {
    id, label: speaker === 'obrien' ? "O'Brien" : speaker[0].toUpperCase() + speaker.slice(1),
    kind: 'person', speaker, x: [105, 310][slot], y: 177, width: 58, height: 76,
    interactions: interactions.map(interaction => ({ speaker, ...interaction })),
    ...(visible ? { visible } : {}),
  };
}

export function objective(
  id: string, text: string, done: Requirement, hints: readonly [string, string, string],
): Objective {
  return { id, text, done, hints };
}
