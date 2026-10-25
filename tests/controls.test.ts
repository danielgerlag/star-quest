import { describe, expect, it } from 'vitest';
import { cycleCursor, isTool, releaseItem, tools } from '../src/controls';
import type { CursorSelection } from '../src/controls';
import { actionCursor } from '../src/icons';

describe('classic cursor selection', () => {
  it.each([
    ['walk', 'look'], ['look', 'talk'], ['talk', 'use'], ['use', 'scan'], ['scan', 'walk'],
  ] as const)('cycles %s to %s without equipment', (mode, next) => {
    const selection = Object.freeze({ mode, item: null });
    expect(cycleCursor(selection)).toEqual({ mode: next, item: null });
    expect(selection).toEqual({ mode, item: null });
  });

  it('remembers equipment through every verb and includes it before wrapping', () => {
    let selection: CursorSelection = { mode: 'item', item: 'tricorder' };
    for (const mode of ['walk', 'look', 'talk', 'use', 'scan', 'item', 'walk']) {
      selection = cycleCursor(selection);
      expect(selection).toEqual({ mode, item: 'tricorder' });
    }
  });

  it.each(tools)('removes unavailable equipment without changing %s', (mode) => {
    const selection: CursorSelection = { mode, item: 'used-component' };
    expect(releaseItem(selection)).toEqual({ mode, item: null });
    expect(selection.item).toBe('used-component');
  });

  it('returns to the hand after consuming the active item and cannot cycle to it', () => {
    let selection = releaseItem({ mode: 'item', item: 'used-component' });
    expect(selection).toEqual({ mode: 'use', item: null });
    for (let index = 0; index < 10; index++) {
      selection = cycleCursor(selection);
      expect(selection.mode).not.toBe('item');
    }
  });

  it('accepts exactly the supported action icons', () => {
    for (const value of tools) expect(isTool(value)).toBe(true);
    for (const value of ['item', 'travel', '', null, undefined, {}, 1]) expect(isTool(value)).toBe(false);
  });

  it('uses distinct self-contained, outlined cursors with a consistent click point', () => {
    const images = [...tools, 'padd', 'tricorder'].map(actionCursor);
    expect(new Set(images).size).toBe(7);
    for (const image of images) {
      expect(image).toMatch(/^url\("data:image\/svg\+xml,/);
      expect(image).toMatch(/\) 3 3, crosshair$/);
      const svg = decodeURIComponent(image.slice(image.indexOf(',') + 1, image.indexOf('")')));
      expect(svg).toContain('width="36" height="36"');
      expect(svg).toContain('stroke="#07111d"');
      expect(svg).toContain('stroke="#ffe1a3"');
      expect(svg).not.toContain('currentColor');
    }
    expect(actionCursor('look')).toBe(images[1]);
  });
});
