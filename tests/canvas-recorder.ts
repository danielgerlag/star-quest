import { vi } from 'vitest';

export interface Fill {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface Draw {
  source: object;
  x: number;
  y: number;
  dimensions: readonly number[];
  alpha: number;
}

export const records = new Map<object, {
  fills: Fill[];
  draws: Draw[];
  labels: string[];
  paths: { operation: string; values: number[] }[];
}>();

export function recorded(canvas: object) {
  const result = records.get(canvas);
  if (!result) throw new Error('Canvas was not recorded.');
  return result;
}

export function installRecordingCanvas(): void {
  records.clear();
  vi.stubGlobal('document', {
    createElement: (tag: string) => {
      if (tag !== 'canvas') throw new Error(`Renderer must not create ${tag}.`);
      const fills: Fill[] = [];
      const draws: Draw[] = [];
      const labels: string[] = [];
      const paths: { operation: string; values: number[] }[] = [];
      const saved: number[] = [];
      const path = (operation: string, ...values: number[]) => { paths.push({ operation, values }); };
      const context = {
        fillStyle: '', strokeStyle: '', lineWidth: 1, globalAlpha: 1, imageSmoothingEnabled: false,
        fillRect(x: number, y: number, width: number, height: number) {
          fills.push({ x, y, width, height, color: this.fillStyle });
        },
        drawImage(source: object, ...coordinates: number[]) {
          const destination = coordinates.length === 8 ? coordinates.slice(4) : coordinates;
          draws.push({ source, x: destination[0], y: destination[1], dimensions: coordinates, alpha: this.globalAlpha });
        },
        clearRect() { fills.length = 0; draws.length = 0; labels.length = 0; paths.length = 0; },
        setTransform(...values: number[]) { path('setTransform', ...values); },
        translate(...values: number[]) { path('translate', ...values); },
        scale(...values: number[]) { path('scale', ...values); },
        rotate(...values: number[]) { path('rotate', ...values); },
        beginPath() { path('beginPath'); },
        moveTo(...values: number[]) { path('moveTo', ...values); },
        lineTo(...values: number[]) { path('lineTo', ...values); },
        closePath() { path('closePath'); },
        arc(...values: number[]) { path('arc', ...values); },
        ellipse(...values: number[]) { path('ellipse', ...values); },
        fill() { path('fill'); },
        stroke() { path('stroke'); },
        save() { saved.push(this.globalAlpha); },
        restore() { this.globalAlpha = saved.pop() ?? 1; },
        fillText(text: string) { labels.push(text); },
      };
      const canvas = { width: 0, height: 0, getContext: () => context };
      records.set(canvas, { fills, draws, labels, paths });
      return canvas;
    },
  });
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => {
    throw new Error('The renderer must not own an animation loop.');
  }));
}
