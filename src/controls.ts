import type { Verb } from './model';

export const tools = ['walk', 'look', 'talk', 'use', 'scan'] as const satisfies readonly (Verb | 'walk')[];
export type Tool = typeof tools[number];
export type CursorSelection =
  | { mode: Tool; item: string | null }
  | { mode: 'item'; item: string };

export function isTool(value: unknown): value is Tool {
  return tools.some((tool) => tool === value);
}

export function cycleCursor(selection: CursorSelection): CursorSelection {
  if (selection.mode === 'item') return { mode: 'walk', item: selection.item };
  const next = tools[tools.indexOf(selection.mode) + 1];
  if (next) return { mode: next, item: selection.item };
  return selection.item ? { mode: 'item', item: selection.item } : { mode: 'walk', item: null };
}

export function releaseItem(selection: CursorSelection): CursorSelection {
  return { mode: selection.mode === 'item' ? 'use' : selection.mode, item: null };
}
