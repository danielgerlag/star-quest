import type { Appearance, CharacterPose, PropVisual, RoomVisual } from './model';
import { drawWolf359Wrecks } from './episode/space-art';
import type { PixelPainter } from './episode/space-art';

type Point = readonly [number, number];
type Atmosphere = 'normal' | 'alert' | 'damaged';

const C = {
  void: '#080f1b',
  ink: '#111827',
  dark: '#192335',
  wall: '#30374b',
  panel: '#454a61',
  steel: '#656b80',
  edge: '#9293a6',
  light: '#c2b6bf',
  warm: '#e6b775',
  cream: '#eed7b0',
  lilac: '#b1a5d6',
  cyan: '#76d5e7',
  blue: '#397c9c',
  red: '#d46d79',
  wood: '#79545b',
  green: '#7bbda0',
} as const;

function rgb(color: string): readonly [number, number, number] {
  const hex = color.replace('#', '');
  const full = hex.length === 3 ? [...hex].map((part) => part + part).join('') : hex;
  const value = Number.parseInt(full, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function blend(first: string, second: string, amount: number): string {
  const a = rgb(first);
  const b = rgb(second);
  return `rgb(${a.map((channel, index) => Math.round(channel + (b[index] - channel) * amount)).join(',')})`;
}

function shade(color: string, amount: number): string {
  return blend(color, amount < 0 ? '#080d19' : '#fff0df', Math.abs(amount));
}

function seedOf(value: string): number {
  let seed = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    seed = Math.imul(seed ^ value.charCodeAt(index), 16777619);
  }
  return seed >>> 0;
}

class Pixels {
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  private seed: number;

  constructor(width: number, height: number, seed: number) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('A Canvas2D context is required to draw the adventure.');
    context.imageSmoothingEnabled = false;
    this.context = context;
    this.seed = seed;
  }

  random(): number {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  rect(x: number, y: number, width: number, height: number, color: string): void {
    this.context.fillStyle = color;
    this.context.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  }

  line(x1: number, y1: number, x2: number, y2: number, color: string, width = 1): void {
    let x = Math.round(x1);
    let y = Math.round(y1);
    const targetX = Math.round(x2);
    const targetY = Math.round(y2);
    const dx = Math.abs(targetX - x);
    const dy = -Math.abs(targetY - y);
    const sx = x < targetX ? 1 : -1;
    const sy = y < targetY ? 1 : -1;
    let error = dx + dy;
    for (;;) {
      this.rect(x, y, width, width, color);
      if (x === targetX && y === targetY) break;
      const twice = error * 2;
      if (twice >= dy) {
        error += dy;
        x += sx;
      }
      if (twice <= dx) {
        error += dx;
        y += sy;
      }
    }
  }

  polygon(points: readonly Point[], color: string): void {
    const top = Math.max(0, Math.floor(Math.min(...points.map((point) => point[1]))));
    const bottom = Math.min(this.canvas.height, Math.ceil(Math.max(...points.map((point) => point[1]))));
    for (let y = top; y < bottom; y += 1) {
      const intersections: number[] = [];
      for (let index = 0; index < points.length; index += 1) {
        const a = points[index];
        const b = points[(index + 1) % points.length];
        if ((a[1] <= y + 0.5 && b[1] > y + 0.5) || (b[1] <= y + 0.5 && a[1] > y + 0.5)) {
          intersections.push(a[0] + ((y + 0.5 - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
        }
      }
      intersections.sort((a, b) => a - b);
      for (let index = 0; index + 1 < intersections.length; index += 2) {
        const left = Math.ceil(intersections[index] - 0.5);
        this.rect(left, y, Math.ceil(intersections[index + 1] - 0.5) - left, 1, color);
      }
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, color: string): void {
    for (let y = Math.ceil(cy - ry); y <= Math.floor(cy + ry); y += 1) {
      const dy = (y - cy) / ry;
      const dx = Math.floor(rx * Math.sqrt(Math.max(0, 1 - dy * dy)));
      this.rect(cx - dx, y, dx * 2 + 1, 1, color);
    }
  }

  gradient(x: number, y: number, width: number, height: number, top: string, bottom: string): void {
    for (let row = 0; row < height; row += 1) {
      this.rect(x, y + row, width, 1, blend(top, bottom, row / Math.max(1, height - 1)));
    }
  }

  grain(x: number, y: number, width: number, height: number, color: string, count: number): void {
    for (let index = 0; index < count; index += 1) {
      this.rect(x + Math.floor(this.random() * width), y + Math.floor(this.random() * height), 1, 1, color);
    }
  }
}

function stars(p: Pixels, x: number, y: number, width: number, height: number, count: number): void {
  for (let index = 0; index < count; index += 1) {
    const sx = x + 2 + Math.floor(p.random() * (width - 4));
    const sy = y + 2 + Math.floor(p.random() * (height - 4));
    const brightness = p.random();
    p.rect(sx, sy, 1, 1, brightness > 0.87 ? C.cream : brightness > 0.55 ? '#8298b3' : '#344761');
    if (brightness > 0.985 && sx > x + 4 && sx < x + width - 4 && sy > y + 4 && sy < y + height - 4) {
      p.rect(sx - 1, sy, 3, 1, C.lilac);
      p.rect(sx, sy - 1, 1, 3, C.lilac);
      p.rect(sx, sy, 1, 1, '#fff0df');
    }
  }
}

function windowPanel(p: Pixels, x: number, y: number, width: number, height: number, panoramic = false): void {
  p.rect(x - 4, y - 4, width + 8, height + 9, C.ink);
  p.rect(x - 3, y - 3, width + 6, 2, C.steel);
  p.gradient(x, y, width, height, '#0b172c', '#101628');
  stars(p, x, y, width, height, Math.floor(width * height / 160));
  p.rect(x, y + height, width, 2, C.edge);
  p.rect(x - 4, y + height + 3, width + 8, 3, C.dark);
  if (panoramic) {
    for (let bar = 1; bar < 4; bar += 1) {
      const bx = x + Math.floor((width * bar) / 4);
      p.rect(bx, y, 4, height, C.ink);
      p.rect(bx + 4, y, 2, height, C.panel);
    }
  }
}

function monitor(p: Pixels, x: number, y: number, width: number, height: number, mode = 0): void {
  p.rect(x - 2, y - 2, width + 4, height + 4, '#0a101c');
  p.rect(x, y, width, height, '#111b2c');
  p.rect(x, y, 4, height - 3, mode === 2 ? C.cyan : C.lilac);
  p.rect(x + 2, y + height - 6, 11, 6, mode === 2 ? C.cyan : C.lilac);
  p.rect(x + 6, y, Math.max(4, width - 12), 3, C.warm);
  p.rect(x + width - 4, y, 4, 3, C.red);
  const contentWidth = Math.max(4, width - 15);
  for (let row = 0; row < Math.floor((height - 12) / 5); row += 1) {
    const rowWidth = Math.max(2, Math.floor(contentWidth * (0.35 + p.random() * 0.55)));
    p.rect(x + 9, y + 8 + row * 5, rowWidth, 2, row % 3 === 0 ? '#537a96' : '#53617a');
    if (width > 35) p.rect(x + width - 7, y + 8 + row * 5, 3, 2, row % 2 ? C.warm : C.lilac);
  }
  if (mode === 1 && width > 40) {
    for (let column = 0; column < width - 24; column += 3) {
      const magnitude = Math.sin(column * 0.32) * Math.sin(column * 0.12) * (height * 0.23);
      p.rect(x + 12 + column, y + Math.round(height * 0.58 + magnitude), 3, 1, C.cyan);
    }
  }
  if (mode === 2 && width > 40) {
    const cx = x + Math.floor(width * 0.58);
    const cy = y + Math.floor(height * 0.55);
    p.ellipse(cx, cy, Math.floor(width * 0.18), Math.floor(height * 0.28), '#244f66');
    p.ellipse(cx, cy, Math.floor(width * 0.14), Math.floor(height * 0.21), '#112235');
    p.line(cx - 8, cy, cx + 8, cy, C.cyan);
    p.line(cx, cy - 6, cx, cy + 6, C.cyan);
    p.rect(cx + 3, cy - 4, 2, 2, C.warm);
  }
}

function floor(p: Pixels, top = 186, industrial = false): void {
  p.gradient(0, top, 480, 300 - top, industrial ? '#293642' : '#333243', '#171e2c');
  p.grain(0, top, 480, 300 - top, industrial ? '#303a45' : '#303142', 950);
  for (const x of [-300, -100, 100, 300, 500, 700]) {
    p.line(240 + (x - 240) * 0.21, top, x, 299, '#111b29');
    p.line(241 + (x - 240) * 0.21, top, x + 1, 299, '#3d3d4d');
  }
  for (const y of [204, 235, 281]) {
    p.line(0, y, 479, y, '#17212f');
    p.line(0, y + 1, 479, y + 1, '#3b3b4b');
  }
  p.polygon([[0, 282], [58, 252], [64, 252], [8, 282]], '#756854');
  p.polygon([[480, 282], [422, 252], [416, 252], [472, 282]], '#756854');
}

function roomShell(p: Pixels, industrial = false): void {
  p.gradient(0, 0, 480, 195, industrial ? '#253341' : '#444454', '#272c3e');
  p.grain(0, 22, 480, 166, industrial ? '#2b3744' : '#3d3e4e', 650);
  floor(p, 186, industrial);
  p.polygon([[0, 0], [480, 0], [414, 24], [66, 24]], '#202738');
  p.rect(0, 0, 480, 7, '#101827');
  p.rect(62, 23, 356, 3, '#74707d');
  p.rect(64, 26, 352, 2, '#b3a295');
  p.polygon([[0, 10], [29, 33], [29, 179], [0, 210]], '#303548');
  p.polygon([[480, 10], [451, 33], [451, 179], [480, 210]], '#303548');
  p.line(29, 35, 29, 179, '#83818e', 2);
  p.line(451, 35, 451, 179, '#83818e', 2);
  p.rect(31, 181, 418, 6, '#151f30');
  p.rect(31, 185, 418, 2, '#6e6570');
}

function door(p: Pixels, x: number, y: number, width: number, height: number, red = false): void {
  p.polygon([[x - 5, y + 9], [x + 5, y - 3], [x + width - 5, y - 3], [x + width + 5, y + 9],
    [x + width + 5, y + height], [x - 5, y + height]], '#111b29');
  p.rect(x, y + 7, width, height - 7, '#555164');
  p.rect(x + 3, y + 8, width / 2 - 4, height - 11, '#646073');
  p.rect(x + width / 2 + 1, y + 8, width / 2 - 4, height - 11, '#48485c');
  p.rect(x + width / 2 - 1, y + 8, 2, height - 8, '#202435');
  p.rect(x + 8, y + height - 22, width - 16, 3, '#34384b');
  p.rect(x + 8, y + 16, width - 16, 3, '#8b8190');
  p.rect(x + 5, y, width - 10, 3, red ? C.red : C.warm);
  p.rect(x - 9, y + 42, 3, 17, '#172336');
  p.rect(x - 9, y + 44, 3, 4, C.lilac);
  p.rect(x - 9, y + 51, 3, 3, C.warm);
  p.rect(x - 5, y + height, width + 10, 3, '#90909c');
}

function chair(p: Pixels, x: number, y: number, command = false): void {
  const width = command ? 26 : 20;
  p.ellipse(x + width / 2, y + 39, width * 0.8, 4, '#111927');
  p.rect(x + width / 2 - 2, y + 25, 4, 14, '#6f6c7d');
  p.rect(x + 2, y + 37, width - 4, 3, '#85818d');
  p.polygon([[x, y + 4], [x + 4, y], [x + width - 4, y], [x + width, y + 4],
    [x + width - 2, y + 26], [x + 2, y + 26]], command ? '#9b7880' : '#69637e');
  p.rect(x + 3, y + 4, width - 6, 16, command ? '#b09598' : '#827891');
  p.rect(x + 5, y + 5, width - 10, 2, command ? '#c1a1a0' : '#9c8da6');
  p.rect(x, y + 23, width, 6, '#484355');
  p.rect(x - 3, y + 20, 5, 5, '#aaa0aa');
  p.rect(x + width - 2, y + 20, 5, 5, '#aaa0aa');
  p.rect(x - 3, y + 20, 4, 2, C.warm);
}

function plant(p: Pixels, x: number, y: number, size = 1): void {
  const s = size;
  p.ellipse(x, y + 27 * s, 13 * s, 3 * s, '#111c28');
  p.polygon([[x - 8 * s, y + 12 * s], [x + 8 * s, y + 12 * s],
    [x + 5 * s, y + 27 * s], [x - 5 * s, y + 27 * s]], '#826f73');
  p.rect(x - 8 * s, y + 11 * s, 16 * s, 3 * s, '#b39789');
  p.line(x, y + 12 * s, x, y - 11 * s, '#466e5e', 2 * s);
  for (let leaf = 0; leaf < 7; leaf += 1) {
    const direction = leaf % 2 === 0 ? -1 : 1;
    const base = y + 8 * s - leaf * 3 * s;
    p.polygon([[x, base], [x + direction * 12 * s, base - 8 * s],
      [x + direction * 9 * s, base - 12 * s], [x + direction * 2 * s, base - 6 * s]],
    leaf % 3 === 0 ? '#82a18a' : '#567e6c');
    p.line(x, base, x + direction * 9 * s, base - 8 * s, '#a0b494');
  }
}

function consoleBank(p: Pixels, x: number, y: number, width: number, slant = 12): void {
  p.polygon([[x, y], [x + width, y], [x + width + slant, y + 23], [x - slant, y + 23]], '#96909d');
  p.polygon([[x + 3, y + 2], [x + width - 3, y + 2], [x + width + slant - 4, y + 20], [x - slant + 4, y + 20]], '#121b2b');
  p.polygon([[x - slant, y + 24], [x + width + slant, y + 24], [x + width + slant - 4, y + 43],
    [x - slant + 4, y + 43]], '#383649');
  p.rect(x - slant + 4, y + 26, width + slant * 2 - 8, 3, '#696073');
  for (let segment = 0; segment < width - 8; segment += 26) {
    p.rect(x + segment + 4, y + 5, Math.min(19, width - segment - 4), 3, segment % 3 === 0 ? C.lilac : C.warm);
    p.rect(x + segment + 4, y + 11, 7, 5, '#41677f');
    p.rect(x + segment + 13, y + 12, 6, 2, C.cyan);
    p.rect(x + segment + 13, y + 16, 6, 1, C.red);
  }
}

function bridgeChair(p: Pixels, x: number, y: number, captain = false): void {
  const half = captain ? 17 : 14;
  p.ellipse(x, y + 51, half + 10, 4, '#493c3e');
  p.rect(x - 4, y + 37, 8, 14, '#797674');
  p.rect(x - 3, y + 38, 2, 12, '#bbb8ac');
  p.rect(x - 12, y + 50, 24, 2, '#5b5c5b');
  p.polygon([[x - half, y + 8], [x - half + 3, y + 2], [x + half - 3, y + 2],
    [x + half, y + 8], [x + half - 2, y + 34], [x - half + 2, y + 34]], '#8c8173');
  p.polygon([[x - half + 3, y + 9], [x + half - 3, y + 9], [x + half - 4, y + 33],
    [x - half + 4, y + 33]], '#baae99');
  p.rect(x - half + 3, y + 3, half * 2 - 6, 6, '#d3c6af');
  p.rect(x - half + 5, y + 3, half * 2 - 10, 1, '#e7dac2');
  for (const offset of [15, 21, 27]) {
    p.line(x - half + 6, y + offset, x + half - 6, y + offset, '#9e927f');
    p.line(x - half + 6, y + offset + 1, x + half - 6, y + offset + 1, '#c5b8a1');
  }
  p.rect(x - 2, y + 13, 4, 17, '#71665a');
  p.rect(x - 1, y + 14, 2, 15, '#938575');
  p.polygon([[x - half + 2, y + 31], [x + half - 2, y + 31], [x + half + 3, y + 39],
    [x - half - 3, y + 39]], '#d1c2a9');
  p.rect(x - half - 3, y + 39, half * 2 + 6, 5, '#aa9a83');
  for (const side of [-1, 1]) {
    const arm = side < 0 ? x - half - 8 : x + half;
    p.polygon([[arm, y + 23], [arm + 8, y + 24], [arm + 9, y + 42], [arm + 1, y + 42]], '#c1b49e');
    p.rect(arm + 1, y + 23, 6, 3, '#e0d1b5');
    p.rect(arm + 2, y + 27, 4, 8, '#25262a');
    p.rect(arm + 3, y + 28, 2, 5, captain ? '#91cbd0' : '#d6a970');
  }
}

function bridge(p: Pixels): void {
  // View from the forward end, looking aft: the viewscreen is behind the viewer.
  p.gradient(0, 0, 480, 166, '#c4b59e', '#a19586');
  p.rect(0, 147, 480, 153, '#6d7777');
  p.ellipse(240, 284, 326, 135, '#69474d');
  p.ellipse(240, 280, 279, 119, '#7e5157');
  p.grain(0, 196, 480, 100, '#896067', 1450);
  p.ellipse(240, 173, 161, 52, '#4c4b4f');
  p.ellipse(240, 171, 157, 49, '#c0b1a0');
  p.ellipse(240, 168, 154, 47, '#794b52');
  p.ellipse(240, 168, 148, 43, '#87575d');

  p.polygon([[81, 55], [109, 49], [371, 49], [399, 55], [403, 129], [374, 143],
    [106, 143], [77, 129]], '#857c70');
  p.polygon([[91, 59], [117, 54], [363, 54], [389, 59], [389, 116], [366, 127],
    [114, 127], [91, 116]], '#24262a');
  p.line(94, 57, 116, 53, '#f0e3c8', 2);
  p.rect(116, 53, 250, 2, '#fff0d6');
  p.line(366, 53, 387, 57, '#f0e3c8', 2);
  const stationColors = ['#c3a2cc', '#8badd0', '#e1ac72', '#a7bad3', '#d7aa70'];
  for (let station = 0; station < 5; station++) {
    const x = 101 + station * 56;
    const y = 63 + (station === 0 || station === 4 ? 0 : 3);
    const color = stationColors[station];
    p.rect(x - 2, y - 3, 55, 52, '#171b20');
    p.rect(x, y, 50, 41, '#0b1017');
    p.rect(x + 2, y + 2, 46, 3, color);
    p.rect(x + 2, y + 7, 7, 22, color);
    p.rect(x + 5, y + 27, 23, 4, color);
    p.rect(x + 9, y + 7, 6, 19, '#0b1017');
    for (let row = 0; row < 5; row++) {
      p.rect(x + 19, y + 10 + row * 4, 3, 2, row % 2 ? '#e1b676' : '#869fc8');
      p.rect(x + 24, y + 10 + row * 4, 9 + (row * 3 + station) % 13, 1, '#8292b7');
      p.rect(x + 40, y + 10 + row * 4, 7, 2, row % 3 ? '#bda5ca' : '#e4c28f');
    }
    p.rect(x + 3, y + 35, 10, 3, '#d1b18a');
    p.rect(x + 15, y + 35, 19, 3, '#92aaca');
    p.rect(x + 37, y + 35, 10, 3, '#c0a5c9');
    p.polygon([[x - 2, y + 42], [x + 52, y + 42], [x + 55, y + 49], [x - 5, y + 49]], '#10151e');
    for (let key = 0; key < 10; key++) {
      p.rect(x + key * 5, y + 43, 3, 2, key % 3 ? '#b8a4cd' : '#e4b77e');
      p.rect(x + key * 5 - 1, y + 47, 4, 1, key % 2 ? '#8aaacd' : '#d2b28e');
    }
    p.polygon([[x - 5, y + 51], [x + 55, y + 51], [x + 53, 135], [x - 3, 135]], '#a69888');
    p.line(x - 2, y + 53, x + 51, y + 53, '#c8b9a4');
    p.line(x + 24, y + 53, x + 24, 134, '#867d71');
  }
  // The engineering station's damaged indicator is an actual point of inspection.
  p.line(339, 69, 353, 83, '#302528', 2);
  p.line(353, 83, 367, 87, '#18181c', 2);
  p.rect(374, 97, 5, 2, '#87b8a1');

  for (const left of [27, 400]) {
    p.polygon([[left - 9, 72], [left, 62], [left + 45, 62], [left + 54, 72],
      [left + 54, 165], [left - 9, 165]], '#8c8275');
    p.polygon([[left - 4, 75], [left + 2, 68], [left + 43, 68], [left + 49, 75],
      [left + 49, 161], [left - 4, 161]], '#c9bca7');
    p.rect(left + 3, 77, 39, 82, '#92918b');
    p.rect(left + 5, 78, 17, 80, '#aaa69a');
    p.rect(left + 24, 78, 16, 80, '#a19d93');
    p.rect(left + 22, 78, 2, 81, '#5e6060');
    for (const y of [86, 105, 124, 143]) {
      p.line(left - 2, y, left + 1, y, '#8e857a');
      p.line(left + 44, y, left + 48, y, '#8e857a');
    }
    p.rect(left + 12, 104, 22, 3, '#805051');
    p.rect(left + 14, 105, 7, 1, '#e4d6bd');
    p.rect(left + 26, 105, 6, 1, '#e4d6bd');
    p.rect(left + 46, 111, 5, 24, '#242a2d');
    p.rect(left + 47, 114, 3, 9, '#df9563');
    p.rect(left + 47, 126, 3, 3, '#d8af91');
    p.rect(left + 47, 132, 3, 1, '#86b0c4');
    p.line(left - 4, 76, left + 1, 70, '#fff0d0', 2);
    p.line(left + 2, 70, left + 41, 70, '#e5dcc8');
    p.rect(left + 2, 159, 41, 3, '#646568');
  }

  p.ellipse(240, -77, 314, 126, '#817466');
  p.ellipse(240, -79, 309, 123, '#e1d3b9');
  p.ellipse(240, -82, 304, 121, '#49443d');
  p.ellipse(240, -86, 300, 120, '#c9baa0');
  p.ellipse(240, -88, 296, 118, '#f0e8d7');
  for (const x of [55, 126, 202, 278, 354, 425]) {
    const endY = 30 - Math.round((x - 240) ** 2 / 2500);
    p.line(240 + (x - 240) * 0.68, -10, x, endY, '#af987a', 4);
    p.line(242 + (x - 240) * 0.68, -10, x + 2, endY, '#c8b18e');
  }
  p.polygon([[0, 26], [22, 43], [81, 59], [81, 63], [17, 48], [0, 34]], '#d8c5a8');
  p.polygon([[480, 26], [458, 43], [399, 59], [399, 63], [463, 48], [480, 34]], '#d8c5a8');

  p.polygon([[115, 168], [150, 141], [192, 132], [240, 128], [288, 132], [330, 141],
    [365, 168], [344, 173], [289, 153], [240, 147], [191, 153], [136, 173]], '#643f47');
  p.rect(226, 124, 28, 39, '#c2b49b');
  p.rect(231, 128, 18, 27, '#857b6e');
  p.rect(237, 130, 6, 23, '#303231');
  p.rect(238, 130, 2, 23, '#b8b7a9');
  p.polygon([[93, 192], [103, 163], [128, 141], [165, 126], [204, 119], [240, 117],
    [276, 119], [315, 126], [352, 141], [377, 163], [387, 192], [378, 196],
    [366, 169], [343, 150], [309, 136], [274, 130], [240, 128], [206, 130],
    [171, 136], [137, 150], [114, 169], [102, 196]], '#50352b');
  p.polygon([[93, 186], [103, 157], [128, 135], [165, 120], [204, 113], [240, 111],
    [276, 113], [315, 120], [352, 135], [377, 157], [387, 186], [378, 190],
    [366, 163], [343, 144], [309, 130], [274, 124], [240, 122], [206, 124],
    [171, 130], [137, 144], [114, 163], [102, 190]], '#af7a4e');
  const rail: readonly Point[] = [[98, 186], [109, 159], [133, 139], [169, 125],
    [206, 118], [240, 116], [274, 118], [311, 125], [347, 139], [371, 159], [382, 186]];
  for (let index = 1; index < rail.length; index++) {
    const a = rail[index - 1];
    const b = rail[index];
    p.line(a[0], a[1], b[0], b[1], '#dfb383', 2);
    p.line(a[0], a[1] + 3, b[0], b[1] + 3, '#825b3e');
  }
  p.polygon([[205, 113], [275, 113], [281, 118], [199, 118]], '#171b1f');
  for (let key = 0; key < 14; key++) {
    p.rect(204 + key * 5, 114, 3, 2, key % 3 ? '#b7a6cf' : '#e4b274');
  }
  p.polygon([[99, 161], [111, 154], [124, 169], [113, 181], [98, 179]], '#c2b49b');
  p.polygon([[102, 162], [110, 158], [119, 169], [111, 175], [101, 173]], '#20252a');
  p.line(104, 164, 109, 161, '#dbac71', 2);
  p.rect(105, 168, 6, 3, '#8fc8cc');
  p.rect(111, 171, 4, 2, '#cfb0d2');
  p.rect(104, 178, 7, 3, '#dcc9a8');

  bridgeChair(p, 185, 146);
  bridgeChair(p, 240, 141, true);
  bridgeChair(p, 295, 146);
  p.ellipse(262, 165, 2, 1, '#e6d4b8');

  for (const x of [106, 302]) {
    p.ellipse(x + 36, 253, 58, 8, '#513d45');
    p.polygon([[x - 4, 208], [x + 76, 208], [x + 89, 232], [x - 17, 232]], '#cabca7');
    p.polygon([[x, 211], [x + 72, 211], [x + 82, 229], [x - 10, 229]], '#171d23');
    for (let key = 0; key < 9; key++) {
      p.rect(x + key * 8 + 2, 214, 6, 2, key % 3 ? '#a9a5cb' : '#e5b887');
      p.rect(x + key * 8, 221, 5, 3, key % 2 ? '#82a8c7' : '#c8a9c7');
    }
    p.polygon([[x - 17, 233], [x + 89, 233], [x + 83, 250], [x - 11, 250]], '#b7a78f');
    p.line(x - 14, 234, x + 85, 234, '#e6d3b2', 2);
    p.rect(x + 9, 243, 20, 5, '#807d73');
    p.rect(x + 13, 244, 12, 3, '#b4b7ab');
    p.rect(x + 49, 243, 16, 5, '#777971');
    p.rect(x + 52, 244, 2, 3, '#89b4b1');
    p.rect(x + 57, 244, 2, 3, '#dac391');
  }
}

function readyRoom(p: Pixels): void {
  roomShell(p);
  p.rect(42, 34, 124, 129, '#534758');
  for (let slat = 0; slat < 8; slat += 1) p.rect(45 + slat * 15, 36, 2, 125, '#75616a');
  windowPanel(p, 199, 39, 206, 88, true);
  p.rect(184, 133, 238, 5, '#ab8a80');
  p.rect(193, 138, 218, 35, '#584a59');
  p.rect(199, 140, 206, 2, '#876c72');
  chair(p, 236, 122, true);
  p.ellipse(250, 207, 102, 10, '#17202e');
  p.polygon([[167, 164], [324, 164], [338, 183], [153, 183]], '#bc9487');
  p.polygon([[153, 183], [338, 183], [334, 192], [157, 192]], '#6d4d57');
  p.rect(169, 190, 13, 16, '#524452');
  p.rect(310, 190, 13, 16, '#524452');
  p.line(162, 181, 329, 181, '#d5aea0');
  p.line(178, 169, 315, 169, '#9a7272');
  monitor(p, 210, 150, 31, 20);
  p.rect(221, 171, 8, 3, C.steel);
  p.polygon([[260, 169], [278, 169], [281, 177], [257, 177]], '#344154');
  p.rect(261, 170, 13, 4, '#728faa');
  p.ellipse(294, 174, 5, 3, '#4a3440');
  p.rect(291, 166, 7, 7, C.cream);
  p.rect(298, 168, 2, 3, '#baa193');
  p.rect(54, 74, 88, 62, '#a18a87');
  p.rect(58, 78, 80, 52, '#16374a');
  p.gradient(60, 80, 76, 48, '#2c6073', '#172d3b');
  p.rect(59, 127, 79, 5, '#8b8275');
  for (const fx of [70, 79, 120, 130]) {
    p.line(fx, 126, fx - 3, 109, '#4d9280', 2);
    p.line(fx - 3, 115, fx + 2, 110, '#7bb6a0');
  }
  p.polygon([[88, 102], [96, 97], [103, 100], [109, 96], [109, 104], [103, 102], [96, 106]], C.warm);
  p.rect(92, 101, 2, 1, '#403348');
  p.rect(104, 115, 8, 3, '#a6b5d0');
  p.rect(111, 113, 3, 6, '#8da4bc');
  p.rect(59, 79, 2, 46, '#8cbdc5');
  p.rect(61, 79, 73, 1, C.cyan);
  p.rect(56, 136, 84, 26, '#4b4050');
  p.rect(64, 141, 67, 2, '#71606b');
  plant(p, 423, 165);
  p.rect(54, 43, 35, 18, '#22293a');
  p.rect(59, 48, 25, 8, '#96897c');
  p.rect(66, 49, 13, 1, C.warm);
}

function observation(p: Pixels): void {
  roomShell(p);
  p.polygon([[34, 29], [446, 29], [430, 131], [50, 131]], '#77717e');
  windowPanel(p, 51, 37, 378, 91, true);
  p.rect(47, 132, 386, 7, '#c1a59c');
  p.rect(52, 139, 376, 14, '#615361');
  for (const x of [90, 141, 194, 248, 301, 354]) chair(p, x, 134);
  p.ellipse(240, 203, 158, 11, '#151e2c');
  p.polygon([[101, 165], [344, 159], [391, 181], [369, 195], [96, 195], [78, 182]], '#4f3e4c');
  p.polygon([[101, 159], [344, 153], [391, 176], [369, 190], [96, 190], [78, 177]], '#bb938a');
  p.polygon([[105, 164], [342, 158], [377, 175], [364, 184], [101, 184], [90, 176]], '#916c70');
  p.line(108, 166, 335, 161, '#ccaa97');
  p.line(106, 181, 357, 181, '#795461');
  p.rect(110, 195, 10, 13, '#73606b');
  p.rect(350, 195, 10, 13, '#73606b');
  for (const x of [129, 188, 248, 307]) {
    p.polygon([[x, 169], [x + 19, 169], [x + 23, 175], [x - 2, 175]], '#233044');
    p.rect(x + 3, 170, 12, 2, '#7a9cba');
    p.rect(x + 3, 173, 7, 1, C.warm);
  }
  chair(p, 47, 157);
  chair(p, 407, 157);
  plant(p, 31, 168);
  plant(p, 449, 168);
  p.polygon([[125, 0], [355, 0], [325, 18], [155, 18]], '#5c566a');
  p.rect(163, 14, 154, 3, C.cream);
}

function engineering(p: Pixels): void {
  roomShell(p, true);
  p.rect(37, 31, 406, 143, '#152234');
  for (const x of [51, 104, 350, 406]) {
    p.rect(x, 35, 22, 117, '#293c50');
    p.rect(x + 3, 36, 4, 115, '#617587');
    p.rect(x + 16, 40, 3, 108, '#111b2b');
    for (let y = 41; y < 145; y += 14) {
      p.rect(x - 2, y, 26, 5, '#48576c');
      p.rect(x + 5, y + 1, 12, 1, '#8793a0');
    }
  }
  p.ellipse(240, 180, 51, 12, '#182a3c');
  p.ellipse(240, 178, 43, 9, '#738695');
  p.rect(220, 30, 40, 141, '#35576a');
  p.rect(226, 31, 28, 141, '#31859a');
  p.rect(230, 31, 20, 141, '#67becd');
  p.rect(235, 31, 10, 141, '#baf1e5');
  p.rect(239, 31, 3, 141, '#e4fff0');
  for (let y = 37; y < 174; y += 15) {
    p.ellipse(240, y + 2, 24, 5, '#182d40');
    p.rect(217, y - 2, 46, 5, '#8898a6');
    p.rect(222, y - 2, 36, 2, '#c0cdd0');
    p.rect(223, y + 3, 34, 2, '#287086');
  }
  p.ellipse(240, 171, 26, 6, '#658998');
  p.ellipse(240, 174, 20, 4, '#a1d2d6');
  p.rect(207, 23, 66, 8, '#8490a0');
  p.rect(214, 14, 52, 11, '#323f56');
  p.polygon([[26, 89], [190, 89], [190, 100], [31, 111]], '#7f8793');
  p.polygon([[454, 89], [290, 89], [290, 100], [449, 111]], '#7f8793');
  p.rect(29, 100, 162, 8, '#263247');
  p.rect(289, 100, 162, 8, '#263247');
  for (const x of [40, 84, 128, 172, 306, 350, 394, 438]) {
    p.rect(x, 66, 3, 28, '#a7adb5');
  }
  p.rect(32, 65, 162, 3, '#8d9ba7');
  p.rect(286, 65, 162, 3, '#8d9ba7');
  p.rect(36, 93, 155, 2, C.warm);
  p.rect(289, 93, 155, 2, C.warm);
  monitor(p, 132, 38, 58, 35, 1);
  monitor(p, 291, 38, 48, 35, 2);
  monitor(p, 63, 125, 62, 37, 1);
  monitor(p, 357, 125, 61, 37, 1);
  consoleBank(p, 140, 155, 48, 8);
  consoleBank(p, 292, 155, 48, 8);
  p.ellipse(239, 207, 84, 12, '#233547');
  p.ellipse(239, 206, 78, 10, '#40505d');
  p.ellipse(239, 205, 71, 8, '#263747');
  p.line(177, 205, 211, 212, '#70a5b0');
  p.line(267, 212, 301, 205, '#70a5b0');
  p.rect(210, 183, 3, 20, '#818da0');
  p.rect(267, 183, 3, 20, '#818da0');
  p.rect(204, 181, 72, 3, '#a9b6bf');
}

function biobed(p: Pixels, x: number, y: number): void {
  p.ellipse(x + 43, y + 46, 49, 7, '#152232');
  p.polygon([[x + 15, y + 13], [x + 68, y + 13], [x + 88, y + 35], [x, y + 35]], '#6a7f90');
  p.polygon([[x + 15, y + 7], [x + 68, y + 7], [x + 88, y + 29], [x, y + 29]], '#b9b9c5');
  p.polygon([[x + 19, y + 8], [x + 64, y + 8], [x + 76, y + 25], [x + 9, y + 25]], '#6c9ca9');
  p.polygon([[x + 19, y + 9], [x + 61, y + 9], [x + 64, y + 15], [x + 16, y + 15]], '#d1d4ce');
  p.rect(x + 12, y + 30, 62, 4, '#d2c4c5');
  p.rect(x + 15, y + 35, 7, 9, '#586575');
  p.rect(x + 65, y + 35, 7, 9, '#586575');
  p.rect(x + 22, y + 31, 20, 2, C.cyan);
  p.rect(x + 79, y - 19, 3, 40, '#8e9caa');
  monitor(p, x + 58, y - 34, 37, 20, 1);
}

function sickbay(p: Pixels): void {
  roomShell(p);
  p.rect(36, 31, 408, 125, '#707382');
  p.rect(37, 31, 406, 4, '#b5b7bd');
  for (const x of [43, 156, 325, 434]) p.rect(x, 36, 5, 124, '#9797a3');
  p.rect(45, 90, 390, 6, '#404d67');
  p.rect(45, 93, 390, 2, C.cyan);
  door(p, 203, 44, 72, 126);
  p.rect(212, 54, 54, 22, '#3d687f');
  p.rect(235, 58, 9, 14, '#a9c9ca');
  p.rect(227, 63, 25, 4, '#a9c9ca');
  monitor(p, 73, 48, 65, 35, 1);
  monitor(p, 344, 48, 65, 35, 1);
  biobed(p, 54, 151);
  biobed(p, 326, 151);
  p.rect(161, 108, 30, 61, '#525e73');
  p.rect(164, 111, 24, 50, '#97a4ad');
  for (let shelf = 0; shelf < 3; shelf += 1) {
    p.rect(166, 120 + shelf * 15, 20, 2, '#4e5c72');
    p.rect(170, 112 + shelf * 15, 4, 8, shelf % 2 ? C.lilac : C.cyan);
    p.rect(179, 113 + shelf * 15, 3, 7, '#d7d7ce');
  }
  p.rect(287, 109, 30, 61, '#525e73');
  monitor(p, 290, 113, 24, 21);
  p.rect(290, 140, 24, 18, '#9da7ad');
  p.rect(299, 144, 7, 2, '#58667a');
  p.rect(96, 19, 94, 4, '#d8d3d4');
  p.rect(290, 19, 94, 4, '#d8d3d4');
}

function transporter(p: Pixels): void {
  roomShell(p);
  p.polygon([[114, 37], [361, 37], [388, 65], [388, 160], [95, 160], [95, 65]], '#1a293c');
  p.polygon([[115, 37], [360, 37], [373, 49], [105, 49]], '#8d8596');
  for (const x of [124, 173, 222, 271, 320, 369]) {
    p.rect(x, 51, 6, 111, '#53556d');
    p.rect(x + 1, 53, 2, 105, '#aaa3b6');
    p.rect(x - 8, 60, 2, 85, '#365168');
  }
  p.ellipse(241, 179, 133, 29, '#141d2d');
  p.ellipse(241, 174, 130, 27, '#797586');
  p.ellipse(241, 170, 125, 25, '#49485e');
  p.ellipse(241, 168, 117, 22, '#777084');
  p.ellipse(241, 168, 113, 20, '#383d55');
  for (const [x, y] of [[179, 159], [240, 154], [301, 159], [164, 176], [240, 178], [316, 176]]) {
    p.ellipse(x, y, 20, 6, '#b5a3a9');
    p.ellipse(x, y, 16, 4, '#a6bdc6');
    p.ellipse(x, y, 13, 3, '#507b96');
    p.ellipse(x, y, 8, 2, '#8bcbda');
    p.rect(x - 8, y - 1, 16, 1, '#c3e4dc');
  }
  p.ellipse(241, 43, 125, 15, '#101b2b');
  p.ellipse(241, 43, 120, 12, '#6c7287');
  p.ellipse(241, 44, 113, 8, '#17283a');
  for (const x of [158, 196, 239, 282, 320]) p.rect(x, 44, 11, 3, '#c5cad5');
  monitor(p, 42, 59, 37, 49, 1);
  consoleBank(p, 37, 145, 57, 7);
  monitor(p, 402, 64, 34, 68);
  p.rect(397, 146, 44, 37, '#62556b');
  p.rect(404, 151, 30, 2, '#aa8d97');
  p.rect(404, 157, 30, 2, '#aa8d97');
  p.rect(404, 163, 30, 2, '#aa8d97');
}

function shuttle(p: Pixels, x: number, y: number, size = 1): void {
  const points = (vertices: readonly Point[]): Point[] => vertices.map(([px, py]) => [x + px * size, y + py * size]);
  p.ellipse(x + 52 * size, y + 41 * size, 69 * size, 8 * size, '#101a2a');
  p.polygon(points([[0, 29], [19, 3], [68, 0], [104, 23], [112, 36], [93, 43], [5, 40]]), '#555c70');
  p.polygon(points([[5, 28], [22, 6], [67, 4], [100, 24], [90, 33], [5, 35]]), '#bac1c4');
  p.polygon(points([[25, 10], [64, 8], [86, 21], [17, 22]]), '#1b354d');
  p.polygon(points([[28, 11], [46, 10], [48, 21], [19, 21]]), '#416680');
  p.polygon(points([[50, 10], [63, 10], [81, 20], [53, 20]]), '#6492a3');
  p.polygon(points([[7, 30], [89, 29], [104, 26], [108, 33], [91, 37], [7, 37]]), '#8394a2');
  p.line(x + 14 * size, y + 30 * size, x + 81 * size, y + 30 * size, '#e1d9cf', size);
  p.rect(x + 12 * size, y + 34 * size, 42 * size, 2 * size, '#966970');
  p.rect(x + 12 * size, y + 39 * size, 12 * size, 4 * size, '#333e51');
  p.rect(x + 81 * size, y + 38 * size, 12 * size, 5 * size, '#333e51');
  p.rect(x - 5 * size, y + 32 * size, 21 * size, 7 * size, '#434d64');
  p.rect(x - 2 * size, y + 33 * size, 13 * size, 3 * size, C.cyan);
  p.rect(x + 91 * size, y + 32 * size, 20 * size, 7 * size, '#434d64');
  p.rect(x + 95 * size, y + 33 * size, 13 * size, 3 * size, C.cyan);
}

function shuttlebay(p: Pixels): void {
  roomShell(p, true);
  p.rect(62, 25, 356, 146, '#111d30');
  windowPanel(p, 77, 31, 326, 134);
  p.gradient(78, 119, 324, 45, '#14283d', '#294e62');
  stars(p, 79, 33, 322, 116, 115);
  for (let y = 39; y < 163; y += 8) p.rect(78, y, 324, 1, '#23445a');
  p.rect(77, 31, 3, 134, C.cyan);
  p.rect(400, 31, 3, 134, C.cyan);
  p.rect(80, 163, 320, 2, '#a0d9d7');
  p.polygon([[24, 17], [68, 26], [68, 173], [40, 192], [24, 184]], '#596576');
  p.polygon([[456, 17], [412, 26], [412, 173], [440, 192], [456, 184]], '#596576');
  for (let y = 35; y < 176; y += 24) {
    p.rect(34, y, 26, 5, '#8392a0');
    p.rect(420, y, 26, 5, '#8392a0');
  }
  p.polygon([[0, 178], [113, 161], [367, 161], [480, 178], [480, 204], [0, 204]], '#374657');
  p.line(0, 199, 479, 199, '#819099', 2);
  p.polygon([[96, 212], [136, 177], [140, 177], [104, 212]], '#b5a071');
  p.polygon([[384, 212], [344, 177], [340, 177], [376, 212]], '#b5a071');
  shuttle(p, 178, 145, 1.1);
  monitor(p, 26, 119, 28, 30, 1);
  monitor(p, 426, 118, 27, 31);
  p.rect(15, 18, 450, 7, '#6d7988');
  for (const x of [62, 152, 242, 332, 412]) p.rect(x, 20, 17, 3, C.cream);
}

function crate(p: Pixels, x: number, y: number, width: number, height: number, color: string): void {
  p.polygon([[x, y], [x + width - 10, y], [x + width, y + 7], [x + 10, y + 7]], shade(color, 0.22));
  p.rect(x, y + 7, width - 10, height - 7, color);
  p.polygon([[x + width - 10, y + 7], [x + width, y + 7], [x + width, y + height - 6],
    [x + width - 10, y + height]], shade(color, -0.3));
  p.rect(x + 3, y + 11, width - 16, 2, shade(color, 0.35));
  p.rect(x + 3, y + height - 6, width - 16, 3, shade(color, -0.3));
  p.rect(x + 5, y + 14, 4, height - 22, shade(color, -0.32));
  p.rect(x + width - 20, y + 14, 4, height - 22, shade(color, -0.32));
  p.rect(x + 14, y + 18, Math.min(16, width - 32), 9, '#252d3d');
  p.rect(x + 16, y + 20, Math.min(10, width - 36), 2, '#b8a592');
  p.rect(x + 16, y + 24, 6, 1, '#c0a976');
  for (let slat = 20; slat < height - 7; slat += 9) {
    p.line(x + width - 8, y + slat, x + width - 3, y + slat - 3, shade(color, 0.1));
  }
}

function cargo(p: Pixels): void {
  roomShell(p, true);
  p.rect(36, 31, 408, 145, '#1d2a3c');
  for (const x of [47, 120, 194, 267, 340, 426]) {
    p.rect(x, 31, 6, 143, '#4c5f70');
    p.rect(x + 1, 32, 2, 140, '#82929e');
  }
  door(p, 218, 86, 71, 97);
  crate(p, 52, 126, 76, 66, '#727582');
  crate(p, 59, 79, 66, 47, '#877767');
  crate(p, 117, 145, 71, 49, '#7a6268');
  crate(p, 337, 127, 86, 65, '#696b7d');
  crate(p, 345, 82, 72, 45, '#847266');
  crate(p, 310, 161, 47, 36, '#536d75');
  p.rect(29, 66, 421, 10, '#788594');
  p.rect(31, 76, 418, 7, '#27364b');
  p.rect(34, 70, 411, 2, '#a1a19c');
  for (let x = 35; x < 445; x += 29) {
    p.rect(x, 42, 3, 25, '#87939f');
    p.rect(x + 3, 62, 22, 2, '#3d4d60');
  }
  p.rect(32, 41, 416, 3, '#a0a4aa');
  p.rect(191, 77, 5, 112, '#8693a0');
  p.rect(208, 77, 5, 112, '#8693a0');
  for (let y = 83; y < 188; y += 10) p.rect(195, y, 14, 3, '#657e8e');
  monitor(p, 301, 99, 24, 32);
  p.line(218, 201, 299, 201, '#8e855f', 3);
  for (let x = 219; x < 297; x += 12) p.line(x, 201, x + 4, 203, '#232f40', 3);
}

function corridor(p: Pixels): void {
  p.gradient(0, 0, 480, 200, '#363e52', '#1d293e');
  floor(p, 190);
  p.polygon([[0, 0], [129, 43], [129, 164], [0, 237]], '#515267');
  p.polygon([[480, 0], [351, 43], [351, 164], [480, 237]], '#515267');
  p.polygon([[0, 0], [480, 0], [351, 43], [129, 43]], '#252d40');
  p.rect(129, 43, 222, 133, '#595367');
  door(p, 205, 65, 70, 112);
  p.rect(142, 62, 34, 75, '#3b3a52');
  p.rect(304, 62, 34, 75, '#3b3a52');
  monitor(p, 153, 89, 16, 26);
  for (let rib = 0; rib < 3; rib += 1) {
    const x = 15 + rib * 47;
    const top = 5 + rib * 16;
    const foot = 225 - rib * 28;
    p.polygon([[x - 12, top], [x + 11, top + 7], [x + 11, foot - 8], [x - 12, foot + 8]], '#807789');
    p.polygon([[480 - x + 12, top], [480 - x - 11, top + 7], [480 - x - 11, foot - 8],
      [480 - x + 12, foot + 8]], '#807789');
    p.line(x + 9, top + 8, x + 9, foot - 8, '#c1aeb3', 2);
    p.line(471 - x, top + 8, 471 - x, foot - 8, '#c1aeb3', 2);
    p.polygon([[x - 12, top], [480 - x + 12, top], [480 - x - 11, top + 7], [x + 11, top + 7]], '#82788a');
    p.line(x + 22, top + 5, 458 - x, top + 5, '#b8a3a9', 2);
  }
  p.line(0, 158, 127, 132, '#191f32', 9);
  p.line(479, 158, 352, 132, '#191f32', 9);
  p.line(0, 159, 127, 133, C.warm, 2);
  p.line(479, 159, 352, 133, C.warm, 2);
  p.line(0, 211, 129, 167, '#b9a395', 3);
  p.line(479, 211, 350, 167, '#b9a395', 3);
  p.polygon([[115, 300], [204, 177], [277, 177], [365, 300]], '#3a3447');
  p.line(115, 299, 204, 178, '#716071', 2);
  p.line(365, 299, 277, 178, '#716071', 2);
  p.polygon([[29, 59], [47, 65], [47, 128], [29, 132]], '#34374e');
  p.polygon([[433, 65], [451, 59], [451, 132], [433, 128]], '#34374e');
}

function sofa(p: Pixels, x: number, y: number, width: number): void {
  p.ellipse(x + width / 2, y + 40, width / 2 + 8, 7, '#111d2b');
  p.rect(x + 4, y, width - 8, 28, '#685e78');
  p.rect(x + 7, y + 3, width - 14, 19, '#8c7d97');
  for (let cushion = 0; cushion < 3; cushion += 1) {
    p.rect(x + 8 + cushion * Math.floor((width - 17) / 3), y + 5, Math.floor((width - 20) / 3), 16, '#97869d');
  }
  p.rect(x + 4, y + 25, width - 8, 12, '#76697f');
  p.rect(x + 8, y + 25, width - 16, 3, '#ae94aa');
  p.rect(x, y + 17, 7, 21, '#a08a9f');
  p.rect(x + width - 7, y + 17, 7, 21, '#a08a9f');
  p.rect(x + 7, y + 38, 4, 4, '#646271');
  p.rect(x + width - 11, y + 38, 4, 4, '#646271');
}

function quarters(p: Pixels): void {
  roomShell(p);
  p.rect(39, 31, 402, 118, '#615767');
  windowPanel(p, 160, 40, 227, 80, true);
  p.rect(151, 126, 245, 6, '#ad8f8c');
  p.rect(42, 40, 78, 106, '#7c6570');
  for (let slat = 0; slat < 5; slat += 1) p.rect(44, 48 + slat * 19, 75, 2, '#a48687');
  p.rect(52, 57, 17, 7, '#c3a68d');
  p.rect(76, 50, 7, 14, '#444865');
  p.rect(85, 51, 5, 13, '#81949c');
  p.rect(92, 49, 6, 15, '#ae8d91');
  p.ellipse(72, 95, 10, 4, '#97a6b5');
  p.rect(66, 85, 12, 9, '#bac4c5');
  p.rect(92, 108, 13, 13, '#4a485f');
  p.rect(95, 110, 7, 9, '#7891a2');
  sofa(p, 164, 148, 137);
  plant(p, 345, 157, 1.4);
  p.rect(393, 142, 34, 9, '#baa298');
  p.rect(405, 150, 9, 40, '#645c70');
  p.ellipse(409, 192, 17, 4, '#8a7682');
  p.rect(408, 81, 3, 61, '#a597a1');
  p.polygon([[401, 76], [419, 76], [427, 97], [393, 97]], '#ceb59c');
  p.rect(395, 96, 30, 3, C.warm);
  p.ellipse(107, 190, 37, 8, '#242436');
  p.rect(82, 174, 4, 18, '#7b6473');
  p.rect(128, 174, 4, 18, '#7b6473');
  p.ellipse(107, 170, 39, 12, '#b08d86');
  p.ellipse(107, 167, 37, 10, '#99767a');
  p.rect(93, 164, 16, 6, '#39445a');
  p.rect(95, 165, 11, 2, '#90adc0');
  p.rect(115, 160, 5, 7, C.cream);
  p.rect(377, 34, 59, 4, '#9d8391');
}

function starChart(p: Pixels, x: number, y: number, width: number, height: number): void {
  p.gradient(x, y, width, height, '#101c31', '#19364d');
  const cx = x + Math.floor(width * 0.51);
  const cy = y + Math.floor(height * 0.53);
  for (const radius of [18, 37, 58]) {
    p.ellipse(cx, cy, radius * 1.7, radius * 0.65, '#31566e');
    p.ellipse(cx, cy, radius * 1.7 - 1, radius * 0.65 - 1, '#14283d');
  }
  stars(p, x, y, width, height, 135);
  const nodes: Point[] = [
    [x + 25, y + 28], [x + 57, y + 44], [x + 88, y + 27], [x + 130, y + 53],
    [x + 169, y + 41], [x + 201, y + 68], [x + 157, y + 82], [x + 110, y + 90],
    [x + 67, y + 74],
  ];
  for (let index = 0; index < nodes.length - 1; index += 1) {
    p.line(nodes[index][0], nodes[index][1], nodes[index + 1][0], nodes[index + 1][1], '#537c96');
  }
  for (const [nx, ny] of nodes) {
    p.rect(nx - 2, ny - 2, 5, 5, '#335975');
    p.rect(nx - 1, ny - 1, 3, 3, C.cyan);
    p.rect(nx, ny, 1, 1, '#e5efdc');
  }
  p.ellipse(cx, cy, 6, 5, C.warm);
  p.ellipse(cx - 1, cy - 1, 3, 3, C.cream);
  p.rect(x + 10, y + height - 14, 36, 3, C.lilac);
  p.rect(x + 10, y + height - 8, 57, 2, '#4b7b99');
  p.rect(x + width - 33, y + 8, 24, 3, C.warm);
}

function astrometrics(p: Pixels): void {
  roomShell(p, true);
  p.polygon([[82, 27], [397, 27], [424, 62], [412, 152], [70, 152], [58, 62]], '#5a6178');
  p.polygon([[88, 33], [391, 33], [410, 61], [400, 144], [82, 144], [72, 61]], '#0c1729');
  starChart(p, 108, 39, 263, 101);
  p.rect(95, 43, 4, 90, '#5886a2');
  p.rect(382, 43, 4, 90, '#5886a2');
  for (let y = 50; y < 130; y += 16) {
    p.rect(75, y, 8, 6, y % 3 === 0 ? C.warm : C.lilac);
    p.rect(397, y, 8, 6, y % 3 === 0 ? C.warm : C.lilac);
  }
  p.rect(84, 151, 314, 4, '#9e92af');
  p.ellipse(240, 201, 73, 12, '#152132');
  p.polygon([[189, 174], [290, 174], [278, 199], [202, 199]], '#41485f');
  p.ellipse(240, 173, 58, 15, '#8a8da2');
  p.ellipse(240, 170, 54, 13, '#17354b');
  p.ellipse(240, 170, 32, 8, '#39768a');
  p.ellipse(240, 170, 27, 6, '#193d55');
  p.line(214, 170, 266, 170, C.cyan);
  p.line(240, 164, 240, 176, C.cyan);
  p.rect(207, 179, 16, 2, C.warm);
  p.rect(254, 179, 16, 2, C.lilac);
  consoleBank(p, 43, 153, 64, 7);
  consoleBank(p, 373, 153, 64, 7);
  p.polygon([[0, 0], [50, 0], [86, 31], [65, 40], [0, 19]], '#596277');
  p.polygon([[480, 0], [430, 0], [394, 31], [415, 40], [480, 19]], '#596277');
}

function battleBridge(p: Pixels): void {
  roomShell(p, true);
  p.polygon([[58, 27], [421, 27], [405, 125], [73, 125]], '#353244');
  windowPanel(p, 150, 39, 180, 76);
  p.line(170, 67, 213, 74, '#59424f');
  p.rect(198, 76, 4, 2, C.red);
  p.polygon([[220, 80], [227, 75], [240, 78], [235, 83]], '#678099');
  p.rect(119, 35, 8, 91, '#714756');
  p.rect(353, 35, 8, 91, '#714756');
  p.rect(121, 36, 3, 82, C.red);
  p.rect(355, 36, 3, 82, C.red);
  monitor(p, 42, 63, 58, 45, 2);
  monitor(p, 380, 63, 58, 45, 2);
  consoleBank(p, 54, 132, 93, 11);
  consoleBank(p, 333, 132, 93, 11);
  p.polygon([[160, 155], [320, 155], [333, 181], [147, 181]], '#645366');
  p.polygon([[147, 181], [333, 181], [333, 186], [147, 186]], '#957684');
  chair(p, 226, 132, true);
  p.rect(189, 155, 13, 13, '#333246');
  p.rect(278, 155, 13, 13, '#333246');
  p.rect(191, 157, 9, 3, C.red);
  p.rect(280, 157, 9, 3, C.warm);
  consoleBank(p, 199, 189, 82, 9);
  p.polygon([[0, 0], [87, 0], [112, 30], [82, 32], [57, 16], [0, 16]], '#564454');
  p.polygon([[480, 0], [393, 0], [368, 30], [398, 32], [423, 16], [480, 16]], '#564454');
  p.rect(137, 20, 206, 3, '#ae626e');
  p.rect(179, 20, 122, 1, '#eeb7b0');
  p.line(32, 188, 124, 190, '#815161', 2);
  p.line(356, 190, 448, 188, '#815161', 2);
}

function borg(p: Pixels): void {
  p.gradient(0, 0, 480, 204, '#112c29', '#0b171c');
  floor(p, 191, true);
  for (let x = 12; x < 480; x += 39) {
    p.rect(x, 12, 19, 177, '#1d3836');
    p.rect(x + 2, 12, 3, 177, '#36514a');
    for (let y = 18; y < 189; y += 19) {
      p.rect(x - 5, y, 30, 6, '#2c4541');
      p.rect(x - 4, y + 1, 18, 2, '#4b6155');
      p.rect(x + 12, y + 9, 5, 4, '#637a53');
    }
  }
  for (const x of [54, 179, 304]) {
    p.polygon([[x, 46], [x + 19, 31], [x + 70, 31], [x + 88, 47], [x + 82, 185], [x + 6, 185]], '#536053');
    p.polygon([[x + 9, 52], [x + 25, 40], [x + 65, 40], [x + 78, 54], [x + 73, 177], [x + 14, 177]], '#06171b');
    p.rect(x + 12, 56, 3, 108, '#5e925e');
    p.rect(x + 73, 56, 3, 108, '#5e925e');
    p.rect(x + 18, 62, 51, 7, '#294a3e');
    p.rect(x + 23, 70, 41, 5, '#4f7750');
    p.rect(x + 23, 82, 9, 59, '#25463a');
    p.rect(x + 56, 82, 9, 59, '#25463a');
    p.rect(x + 34, 84, 20, 52, '#183329');
    p.rect(x + 39, 88, 11, 26, '#406a46');
    p.rect(x + 42, 91, 5, 18, '#8ab578');
    p.rect(x + 29, 145, 33, 5, '#536b50');
    p.ellipse(x + 44, 181, 36, 7, '#3b4d40');
    p.ellipse(x + 44, 180, 28, 4, '#213e32');
    p.line(x + 15, 53, x + 34, 51, '#a2cb78', 2);
  }
  for (const x of [24, 152, 281, 412]) {
    p.rect(x, 19, 12, 185, '#415347');
    p.rect(x + 3, 21, 4, 180, '#6f9270');
    p.rect(x + 7, 21, 2, 180, '#1e312a');
    for (let y = 31; y < 197; y += 22) p.rect(x - 2, y, 16, 5, '#748174');
  }
  p.rect(0, 7, 480, 13, '#283a34');
  p.rect(0, 9, 480, 3, '#5b7652');
  p.line(0, 187, 49, 207, '#648a5f', 3);
  p.line(480, 187, 431, 207, '#648a5f', 3);
  monitor(p, 439, 79, 24, 49, 1);
  p.rect(441, 79, 3, 44, '#96c97b');
  for (let x = 7; x < 475; x += 13) p.rect(x, 212, 7, 2, '#3e5d43');
  p.grain(0, 1, 480, 193, '#758166', 290);
}

function equipmentRack(p: Pixels, x: number, y: number, width: number, height: number): void {
  p.rect(x, y, width, height, '#111d2c');
  p.rect(x, y, 3, height, '#778291');
  p.rect(x + width - 3, y, 3, height, '#455568');
  for (let row = 0; row < Math.floor((height - 7) / 19); row += 1) {
    const ry = y + 5 + row * 19;
    p.rect(x + 5, ry, width - 10, 16, row % 2 === 0 ? '#3e4b60' : '#4b5468');
    p.rect(x + 7, ry + 1, width - 14, 1, '#80909c');
    p.rect(x + 9, ry + 5, width - 25, 5, '#111f32');
    for (let slot = 0; slot < width - 28; slot += 6) {
      p.rect(x + 10 + slot, ry + 6, 3, 1, row % 3 === 0 ? C.cyan : '#708db1');
    }
    p.rect(x + width - 13, ry + 5, 3, 3, row % 4 === 0 ? C.warm : C.green);
    p.rect(x + 9, ry + 12, width - 25, 1, '#718293');
  }
}

function relay(p: Pixels): void {
  roomShell(p, true);
  p.rect(34, 29, 412, 145, '#222c3f');
  for (const x of [49, 111, 309, 371]) equipmentRack(p, x, 40, 54, 138);
  windowPanel(p, 184, 36, 99, 56);
  p.ellipse(232, 64, 22, 18, '#32445b');
  p.ellipse(232, 64, 19, 15, '#19293c');
  p.line(212, 72, 249, 49, '#778592', 2);
  p.line(225, 47, 239, 81, '#778592', 2);
  p.rect(231, 62, 5, 5, C.warm);
  monitor(p, 185, 111, 95, 38, 1);
  consoleBank(p, 185, 159, 95, 7);
  p.rect(41, 20, 396, 7, '#556879');
  p.rect(49, 22, 380, 2, '#99a4a9');
  for (const x of [80, 141, 339, 400]) {
    p.line(x, 21, x, 35, '#987562', 3);
    p.line(x, 35, x + 7, 35, '#987562', 3);
  }
  p.line(171, 28, 171, 144, '#796774', 4);
  p.line(295, 28, 295, 144, '#627f88', 4);
  p.rect(159, 187, 150, 3, '#8896a1');
  p.rect(168, 192, 132, 1, '#61798b');
}

function tender(p: Pixels): void {
  p.gradient(0, 0, 480, 193, '#514b49', '#303b42');
  floor(p, 188, true);
  p.polygon([[0, 0], [480, 0], [422, 47], [58, 47]], '#252d35');
  p.polygon([[0, 0], [51, 25], [67, 185], [0, 218]], '#5c625f');
  p.polygon([[480, 0], [429, 25], [413, 185], [480, 218]], '#5c625f');
  windowPanel(p, 122, 49, 226, 80);
  p.rect(225, 49, 8, 80, '#5f6d73');
  p.line(231, 50, 231, 128, '#95a5a6');
  p.line(143, 50, 154, 65, '#64798b');
  p.line(154, 65, 151, 79, '#64798b');
  p.line(154, 65, 173, 68, '#64798b');
  p.rect(98, 131, 277, 9, '#858881');
  consoleBank(p, 130, 151, 82, 8);
  consoleBank(p, 265, 151, 81, 8);
  monitor(p, 68, 75, 35, 42, 1);
  equipmentRack(p, 370, 57, 43, 111);
  chair(p, 233, 147);
  p.rect(100, 34, 277, 5, '#aba797');
  p.rect(123, 35, 92, 2, '#e0c797');
  p.rect(272, 35, 77, 2, '#807760');
  for (const x of [18, 444]) {
    p.rect(x, 48, 18, 134, '#4b504d');
    p.rect(x + 3, 49, 4, 131, '#8c9081');
    for (let y = 62; y < 173; y += 24) p.rect(x - 3, y, 24, 5, '#78837d');
  }
  p.line(349, 6, 351, 32, '#171e29', 3);
  p.line(351, 32, 341, 57, '#171e29', 3);
  p.line(342, 53, 345, 73, '#8f7763', 2);
  p.rect(339, 72, 3, 3, C.warm);
  p.polygon([[70, 169], [96, 163], [105, 189], [76, 196]], '#715b59');
  p.line(74, 176, 97, 170, '#a78d76', 2);
  p.rect(84, 182, 8, 3, C.cream);
  p.polygon([[359, 179], [377, 173], [393, 184], [382, 192]], '#303944');
  p.line(359, 180, 377, 175, '#90918b');
  p.grain(40, 26, 385, 149, '#9a8e72', 120);
}

function earthPlanet(p: Pixels, cx: number, cy: number, radius: number): void {
  p.ellipse(cx, cy, radius + 3, radius + 3, '#254c69');
  p.ellipse(cx, cy, radius + 1, radius + 1, '#83c0d1');
  p.ellipse(cx, cy, radius, radius, '#386b99');
  for (let y = -radius; y <= radius; y += 1) {
    const half = Math.floor(Math.sqrt(radius * radius - y * y));
    for (let x = -half; x <= half; x += 1) {
      const nx = x / radius;
      const ny = y / radius;
      const light = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const land = Math.sin(nx * 11 + Math.sin(ny * 6) * 2) + Math.cos(ny * 13 - nx * 4) * 0.7
        + Math.sin(nx * 19 + ny * 17) * 0.3;
      const cloud = Math.sin(ny * 26 + Math.sin(nx * 9) * 2.5) + Math.cos(nx * 17 + ny * 9);
      let color = land > 0.95 ? '#92a58d' : land > 0.55 ? '#658e84' : '#386b99';
      if (cloud > 1.42 || Math.abs(ny) > 0.9) color = '#cfdbd5';
      const darkness = Math.max(0, 0.48 - light * 0.32 + nx * 0.33);
      p.rect(cx + x, cy + y, 1, 1, shade(color, -darkness));
    }
  }
  p.ellipse(cx - radius * 0.72, cy - radius * 0.43, 1, 3, '#dcf2dd');
}

function earth(p: Pixels): void {
  roomShell(p);
  p.rect(41, 28, 398, 137, '#9995a3');
  windowPanel(p, 47, 34, 386, 124);
  earthPlanet(p, 278, 93, 56);
  p.line(131, 55, 177, 74, '#8991a4', 2);
  p.line(150, 50, 157, 78, '#c1bfc2', 2);
  p.ellipse(153, 65, 11, 3, '#b9b6bd');
  p.rect(153, 52, 2, 25, '#6b8297');
  p.rect(48, 34, 4, 124, '#c3b7bc');
  p.rect(429, 34, 4, 124, '#c3b7bc');
  for (const x of [117, 364]) {
    p.rect(x, 34, 4, 124, '#55586c');
    p.rect(x + 4, 34, 2, 124, '#a09dac');
  }
  p.rect(37, 160, 406, 9, '#b79fa0');
  p.rect(41, 169, 398, 17, '#5c5368');
  p.rect(41, 170, 398, 2, '#816e80');
  sofa(p, 171, 163, 133);
  plant(p, 68, 173);
  plant(p, 408, 173);
  p.polygon([[91, 0], [389, 0], [350, 24], [130, 24]], '#5b5266');
  p.rect(145, 18, 190, 3, '#d6bda6');
}

function colony(p: Pixels): void {
  p.gradient(0, 0, 480, 144, '#263547', '#ae8c76');
  p.ellipse(391, 43, 14, 14, '#bbaa90');
  p.ellipse(396, 40, 13, 14, '#716f73');
  p.polygon([[0, 102], [27, 92], [43, 97], [68, 76], [92, 88], [111, 69], [151, 98],
    [178, 89], [199, 98], [224, 78], [251, 90], [286, 73], [323, 86], [353, 65],
    [374, 81], [394, 75], [431, 102], [456, 89], [480, 99], [480, 160], [0, 160]], '#6d6870');
  p.polygon([[0, 121], [45, 107], [89, 124], [128, 115], [173, 125], [224, 113],
    [269, 128], [328, 109], [368, 122], [413, 106], [480, 118], [480, 179], [0, 179]], '#897466');
  p.gradient(0, 139, 480, 161, '#8e7765', '#423e40');
  p.grain(0, 143, 480, 157, '#9b826d', 2100);
  p.grain(0, 160, 480, 140, '#504844', 1200);
  p.ellipse(245, 179, 220, 54, '#bc9b7d');
  p.ellipse(246, 177, 209, 48, '#665b53');
  p.ellipse(248, 174, 197, 42, '#413c3c');
  p.ellipse(249, 169, 179, 32, '#2a2b32');
  p.ellipse(250, 172, 158, 25, '#343237');
  for (let index = 0; index < 60; index += 1) {
    const angle = index / 60 * Math.PI * 2;
    const x = 245 + Math.cos(angle) * (201 + p.random() * 14);
    const y = 177 + Math.sin(angle) * (46 + p.random() * 7);
    p.line(x, y, 245 + (x - 245) * 0.86, 174 + (y - 174) * 0.7,
      index % 3 ? '#887461' : '#4b4542', index % 4 === 0 ? 2 : 1);
  }
  p.polygon([[30, 209], [120, 188], [153, 199], [101, 211], [100, 217], [48, 229]], '#514c49');
  p.polygon([[31, 205], [120, 185], [135, 190], [50, 212], [50, 222], [31, 216]], '#b2a58c');
  p.polygon([[51, 213], [135, 192], [149, 196], [67, 218], [67, 224], [51, 226]], '#8e8a7b');
  p.line(36, 205, 119, 187, '#d1bca0', 2);
  p.polygon([[327, 193], [393, 181], [447, 201], [448, 211], [391, 193], [345, 202]], '#b2a38a');
  p.line(332, 193, 391, 183, '#dfc5a2', 2);
  p.polygon([[372, 197], [385, 194], [439, 211], [441, 220], [385, 204], [372, 206]], '#666c64');
  p.polygon([[70, 247], [115, 229], [160, 231], [171, 240], [151, 244], [108, 242], [91, 256]], '#78746a');
  p.line(76, 247, 116, 232, '#bbae94', 2);
  p.polygon([[272, 249], [328, 231], [369, 242], [353, 253], [317, 244], [290, 255]], '#6e7069');
  p.line(279, 249, 327, 234, '#b4aa8f', 2);
  for (const [x, y] of [[46, 204], [71, 198], [92, 193], [391, 183], [407, 189]] as const) {
    p.line(x, y, x - 2, y - 12, '#272f36', 2);
    p.line(x - 2, y - 12, x + 2, y - 16, '#595e58');
  }
  p.polygon([[12, 154], [18, 151], [29, 151], [32, 160], [29, 204], [17, 209]], '#514e49');
  p.polygon([[18, 155], [24, 153], [25, 201], [19, 203]], '#a49880');
  p.line(26, 163, 31, 174, '#292e33', 2);
  p.line(25, 193, 31, 199, '#292e33', 2);
  p.polygon([[445, 132], [452, 127], [458, 133], [455, 146], [459, 179], [446, 176]], '#4f5050');
  p.line(450, 137, 450, 173, '#9e9680', 2);
  p.line(453, 132, 453, 119, '#34383c', 2);
  p.line(453, 120, 461, 115, '#68665c');
  p.polygon([[211, 218], [233, 214], [244, 226], [226, 231], [208, 226]], '#2e383d');
  p.line(214, 220, 232, 217, '#648985', 2);
  p.rect(221, 220, 5, 2, '#a5ada0');
  p.polygon([[159, 264], [175, 257], [204, 263], [192, 274], [163, 272]], '#3c4345');
  p.line(164, 264, 177, 260, '#94958a', 2);
  p.line(177, 260, 195, 265, '#787c70');
  for (let index = 0; index < 40; index += 1) {
    const x = 15 + Math.floor(p.random() * 450);
    const y = 233 + Math.floor(p.random() * 59);
    p.polygon([[x, y], [x + 3, y - 2], [x + 6, y], [x + 4, y + 2]], index % 2 ? '#9c8f77' : '#353b3e');
  }
  p.ellipse(62, 268, 22, 5, '#34393b');
  p.line(60, 248, 42, 269, '#8d9690', 3);
  p.line(64, 248, 80, 269, '#77888b', 3);
  p.line(62, 249, 64, 272, '#afb2a1', 3);
  p.rect(58, 231, 7, 31, '#344b57');
  p.rect(60, 232, 3, 27, '#bfbeaa');
  p.rect(45, 230, 27, 7, '#657e85');
  p.rect(47, 229, 23, 2, '#cbc7ac');
  p.rect(51, 232, 6, 2, '#99c1bb');
  p.rect(69, 231, 13, 2, '#9da99f');
  p.rect(79, 228, 4, 8, '#a6695c');
  p.polygon([[53, 253], [57, 253], [57, 262], [67, 262], [67, 253], [71, 253], [71, 266], [53, 266]], '#849793');
  p.rect(58, 259, 8, 5, '#444c49');
}

function wolf359(p: Pixels): void {
  roomShell(p);
  p.polygon([[34, 27], [446, 27], [435, 160], [45, 160]], '#777681');
  windowPanel(p, 47, 33, 386, 119);
  drawWolf359Wrecks(p);
  for (const x of [65, 267, 411]) {
    p.rect(x, 33, 4, 119, '#232c3c');
    p.rect(x + 4, 33, 2, 119, '#929097');
  }
  p.line(52, 40, 426, 40, '#374656');
  p.rect(42, 153, 396, 9, '#b8a49c');
  p.rect(46, 162, 388, 19, '#5d5363');
  p.rect(46, 163, 388, 2, '#887584');
  p.rect(87, 169, 308, 4, '#252d3e');
  p.rect(90, 169, 9, 2, '#ac796e');
  p.rect(102, 169, 17, 2, '#b6a4c4');
  p.rect(124, 169, 35, 2, '#ad9976');
  p.polygon([[126, 0], [354, 0], [324, 23], [155, 23]], '#555363');
  p.rect(160, 18, 159, 3, '#c0baa7');
  p.polygon([[48, 194], [183, 190], [194, 206], [52, 212]], '#8b7c7e');
  p.polygon([[52, 212], [194, 206], [194, 214], [54, 220]], '#444555');
  p.rect(62, 217, 9, 18, '#2b3345');
  p.rect(173, 214, 9, 18, '#2b3345');
  p.polygon([[62, 193], [115, 192], [126, 201], [67, 204]], '#142335');
  p.line(70, 196, 110, 195, '#b9a3cb', 2);
  p.line(71, 200, 87, 199, '#86b2c1');
  p.polygon([[339, 189], [421, 194], [431, 205], [330, 200]], '#8b7c7e');
  p.polygon([[330, 200], [431, 205], [429, 214], [332, 209]], '#444555');
  p.rect(341, 207, 9, 24, '#293145');
  p.rect(413, 211, 9, 23, '#293145');
  p.polygon([[351, 191], [410, 195], [418, 202], [345, 197]], '#142335');
  p.line(353, 194, 399, 197, '#8eabb7', 2);
  p.line(371, 196, 400, 198, '#b4a188');
}

const roomPainters: Record<RoomVisual, (p: Pixels) => void> = {
  bridge,
  'ready-room': readyRoom,
  observation,
  engineering,
  sickbay,
  transporter,
  shuttlebay,
  cargo,
  corridor,
  quarters,
  astrometrics,
  'battle-bridge': battleBridge,
  borg,
  relay,
  tender,
  earth,
  colony,
  wolf359,
};

function atmosphereLighting(p: Pixels, atmosphere: Atmosphere): void {
  if (atmosphere === 'normal') return;
  p.context.globalAlpha = atmosphere === 'alert' ? 0.08 : 0.06;
  p.rect(0, 0, 480, 300, atmosphere === 'alert' ? '#9a273f' : '#050b18');
  p.context.globalAlpha = 1;
  for (const x of [14, 454]) {
    p.rect(x - 3, 36, 18, 10, '#352835');
    p.rect(x, 39, 12, 3, C.red);
    p.rect(x + 2, 39, 8, 1, '#ffc0ad');
    for (let halo = 0; halo < 5; halo += 1) {
      p.context.globalAlpha = 0.025;
      p.rect(x - 8 - halo * 4, 31 - halo * 2, 28 + halo * 8, 21 + halo * 4, '#f07686');
    }
    p.context.globalAlpha = 1;
  }
  if (atmosphere === 'damaged') {
    p.polygon([[366, 0], [404, 0], [393, 12], [369, 20], [355, 13]], '#111622');
    p.line(378, 8, 374, 28, '#111622', 3);
    p.line(374, 28, 379, 38, '#111622', 2);
    p.line(382, 11, 386, 23, '#78646e', 2);
    p.rect(385, 24, 2, 4, C.warm);
    p.line(40, 180, 53, 171, '#171b29', 2);
    p.line(53, 171, 49, 153, '#171b29', 2);
    p.line(53, 171, 69, 175, '#171b29');
    p.polygon([[442, 206], [457, 201], [467, 209], [459, 215], [444, 214]], '#121b27');
    p.line(443, 207, 454, 204, '#78707c');
    p.rect(448, 209, 5, 2, '#6b5b66');
  }
}

export function createRoomTexture(visual: RoomVisual, atmosphere: Atmosphere): HTMLCanvasElement {
  const p = new Pixels(480, 300, seedOf(visual));
  roomPainters[visual](p);
  if (visual !== 'colony') atmosphereLighting(p, atmosphere);
  p.rect(0, 296, 480, 4, '#101825');
  return p.canvas;
}

export function createPixelTexture(
  width: number,
  height: number,
  paint: (p: PixelPainter) => void,
): HTMLCanvasElement {
  const p = new Pixels(width, height, 0);
  paint(p);
  return p.canvas;
}

function communicator(p: Pixels, x: number, y: number, scale = 1): void {
  p.polygon([[x, y + 4 * scale], [x + 2 * scale, y], [x + 5 * scale, y + 2 * scale],
    [x + 3 * scale, y + 5 * scale]], C.warm);
  p.rect(x + 2 * scale, y + scale, scale, 2 * scale, '#fff0c2');
  p.rect(x + 3 * scale, y + 4 * scale, 2 * scale, scale, '#725654');
}

export function createCharacterTexture(appearance: Appearance, pose: CharacterPose = 'stand'): HTMLCanvasElement {
  const p = new Pixels(26, 54, seedOf(`${appearance.style}:${appearance.skin}:${appearance.hair}`));
  const { skin, hair, uniform, style } = appearance;
  const hairDark = shade(hair, -0.3);
  const skinDark = shade(skin, -0.25);
  const steppingLeft = pose === 'step-left' || pose === 'step-back-left';
  const steppingRight = pose === 'step-right' || pose === 'step-back-right';
  const facingBack = pose === 'back' || pose === 'step-back-left' || pose === 'step-back-right';
  const leftStep = steppingLeft ? -2 : steppingRight ? 1 : 0;
  const rightStep = steppingRight ? 2 : steppingLeft ? -1 : 0;
  const bob = steppingLeft || steppingRight ? 1 : 0;
  if (style === 'long' || style === 'ridge') {
    p.polygon([[8, 3 + bob], [17, 3 + bob], [21, 8 + bob], [22, 25 + bob], [4, 25 + bob],
      [5, 9 + bob]], hairDark);
  }
  p.polygon([[7, 19 + bob], [18, 19 + bob], [22, 23 + bob], [23, 37 + bob], [19, 39 + bob],
    [17, 32 + bob], [18, 39], [7, 39], [8, 30 + bob], [6, 38 + bob], [2, 36 + bob], [3, 23 + bob]], '#0a1120');
  p.polygon([[6, 24 + bob], [20, 24 + bob], [18, 36 + bob], [7, 36 + bob]], uniform);
  p.rect(7, 26 + bob, 3, 9, shade(uniform, 0.15));
  p.rect(17, 26 + bob, 2, 10, shade(uniform, -0.3));
  p.rect(5, 25 + bob, 2, 9, uniform);
  p.rect(20, 25 + bob, 2, 9, shade(uniform, -0.22));
  p.rect(3, 35 + bob, 3, 5, skinDark);
  p.rect(3, 35 + bob, 2, 3, skin);
  p.rect(20, 36 + bob, 3, 4, skinDark);
  p.rect(20, 36 + bob, 2, 3, skin);
  p.rect(8, 37, 10, 3, '#080e1a');
  p.polygon([[8, 39], [12, 39], [12 + leftStep, 51], [7 + leftStep, 51]], '#111827');
  p.polygon([[13, 39], [18, 39], [18 + rightStep, 51], [13 + rightStep, 51]], '#111827');
  p.line(9, 40, 9 + leftStep, 49, '#333746');
  p.line(15, 40, 15 + rightStep, 49, '#252c3c');
  p.rect(6 + leftStep, steppingRight ? 50 : 51, 7, 3, '#080d17');
  p.rect(13 + rightStep, steppingLeft ? 50 : 51, 7, 3, '#080d17');
  p.rect(6 + leftStep, steppingRight ? 50 : 51, 5, 1, '#444352');
  p.rect(13 + rightStep, steppingLeft ? 50 : 51, 5, 1, '#353b4b');
  p.rect(10, 15 + bob, 6, 7, skinDark);
  p.rect(10, 17 + bob, 3, 4, skin);
  p.polygon([[8, 5 + bob], [16, 4 + bob], [19, 7 + bob], [19, 13 + bob],
    [16, 18 + bob], [11, 18 + bob], [7, 13 + bob], [7, 8 + bob]], skinDark);
  p.polygon([[9, 5 + bob], [15, 5 + bob], [17, 8 + bob], [17, 15 + bob], [14, 17 + bob],
    [10, 15 + bob], [8, 12 + bob], [8, 8 + bob]], skin);
  p.rect(8, 8 + bob, 2, 3, shade(skin, 0.22));
  p.rect(6, 10 + bob, 2, 4, skinDark);
  p.rect(19, 10 + bob, 1, 4, skinDark);
  if (style !== 'bald') {
    p.polygon([[7, 8 + bob], [7, 5 + bob], [10, 2 + bob], [16, 2 + bob], [19, 5 + bob],
      [19, 9 + bob], [17, 8 + bob], [15, 5 + bob], [10, 6 + bob], [8, 9 + bob]], hair);
    p.rect(10, 3 + bob, 6, 1, shade(hair, 0.24));
  } else {
    p.rect(9, 4 + bob, 7, 2, skin);
    p.rect(10, 4 + bob, 4, 1, shade(skin, 0.3));
    p.rect(7, 8 + bob, 1, 4, hair);
    p.rect(18, 8 + bob, 1, 4, hair);
  }
  if (style === 'long') {
    p.rect(6, 8 + bob, 2, 13, hair);
    p.rect(18, 7 + bob, 3, 17, hairDark);
    p.rect(19, 9 + bob, 1, 12, shade(hair, 0.2));
  }
  if (style === 'ridge') {
    p.rect(11, 5 + bob, 5, 3, skinDark);
    p.rect(13, 5 + bob, 1, 5, shade(skin, 0.28));
    p.rect(11, 7 + bob, 5, 1, shade(skin, -0.4));
    p.rect(11, 17 + bob, 6, 2, hair);
    p.line(18, 25 + bob, 9, 36 + bob, '#a7a0a2', 2);
    p.line(18, 25 + bob, 9, 36 + bob, '#e0cda5');
  }
  p.rect(9, 10 + bob, 3, 1, hairDark);
  p.rect(15, 10 + bob, 3, 1, hairDark);
  p.rect(10, 11 + bob, 1, 1, style === 'android' ? '#ae891f' : '#192232');
  p.rect(16, 11 + bob, 1, 1, style === 'android' ? '#ae891f' : '#192232');
  p.rect(13, 11 + bob, 1, 3, skinDark);
  p.rect(12, 15 + bob, 4, 1, shade(skin, -0.4));
  if (style === 'beard') {
    p.polygon([[8, 12 + bob], [10, 14 + bob], [12, 13 + bob], [15, 13 + bob], [17, 12 + bob],
      [18, 14 + bob], [16, 18 + bob], [11, 18 + bob], [8, 15 + bob]], hair);
    p.rect(11, 15 + bob, 5, 1, skinDark);
    p.rect(12, 17 + bob, 3, 1, shade(hair, 0.2));
  }
  if (style === 'visor') {
    p.rect(7, 9 + bob, 13, 4, '#716143');
    p.rect(8, 9 + bob, 11, 2, '#d9b36a');
    p.rect(9, 9 + bob, 9, 1, '#f3dba0');
    for (let x = 9; x < 19; x += 2) p.rect(x, 10 + bob, 1, 2, '#725843');
  }
  p.rect(10, 21 + bob, 6, 2, '#171d29');
  p.rect(16, 22 + bob, 1, 1, C.warm);
  p.rect(18, 22 + bob, 1, 1, C.warm);
  communicator(p, 7, 26 + bob, 0.65);
  if (facingBack) {
    p.polygon([[7, 5 + bob], [10, 2 + bob], [16, 2 + bob], [20, 6 + bob],
      [19, 16 + bob], [16, 19 + bob], [9, 17 + bob], [6, 12 + bob]], style === 'bald' ? skin : hair);
    p.rect(9, 4 + bob, 7, 2, style === 'bald' ? shade(skin, 0.2) : shade(hair, 0.18));
    p.rect(10, 19 + bob, 6, 3, skinDark);
    p.rect(6, 23 + bob, 14, 14, uniform);
    p.rect(7, 24 + bob, 3, 12, shade(uniform, 0.15));
    p.rect(18, 24 + bob, 2, 12, shade(uniform, -0.3));
    p.rect(8, 22 + bob, 10, 2, '#131925');
  }
  if (style === 'borg') {
    p.polygon([[6, 4 + bob], [12, 1 + bob], [19, 4 + bob], [21, 11 + bob],
      [18, 18 + bob], [10, 19 + bob], [6, 14 + bob]], '#393f42');
    p.polygon([[11, 3 + bob], [17, 4 + bob], [19, 9 + bob], [17, 16 + bob],
      [12, 17 + bob], [9, 12 + bob]], skin);
    p.rect(5, 6 + bob, 7, 9, '#777f7c');
    p.rect(6, 7 + bob, 6, 6, '#242c30');
    p.rect(7, 9 + bob, 3, 2, '#92efba');
    p.rect(16, 10 + bob, 2, 1, '#11191d');
    p.rect(13, 15 + bob, 4, 1, '#5d6862');
    p.rect(10, 18 + bob, 8, 5, '#41494b');
    p.polygon([[5, 22 + bob], [12, 20 + bob], [21, 23 + bob], [23, 34 + bob],
      [17, 39], [7, 38], [3, 32 + bob]], '#3c4548');
    p.rect(6, 24 + bob, 7, 9, '#697475');
    p.rect(7, 25 + bob, 5, 2, '#929b94');
    p.rect(15, 23 + bob, 5, 12, '#222b30');
    p.rect(16, 25 + bob, 3, 2, '#6ca48b');
    for (const y of [29, 32, 35]) p.rect(7, y + bob, 7, 1, '#1b252a');
    p.line(5, 13 + bob, 3, 23 + bob, '#111b20', 2);
    p.line(4, 14 + bob, 2, 21 + bob, '#82928a');
    p.line(20, 29 + bob, 22, 40, '#17252a', 2);
    p.rect(8, 39, 4, 8, '#5c6566');
    p.rect(14, 40, 4, 8, '#3f494d');
    p.rect(9, 41, 2, 2, '#8b9890');
    p.rect(3, 34 + bob, 4, 7, '#444f52');
    p.rect(20, 35 + bob, 4, 7, '#596467');
  }
  if (pose === 'reach') {
    p.context.clearRect(0, 29, 7, 12);
    p.context.clearRect(19, 29, 7, 13);
    p.line(6, 25, 2, 29, style === 'borg' ? '#657175' : uniform, 3);
    p.line(19, 25, 23, 29, style === 'borg' ? '#657175' : uniform, 3);
    p.rect(0, 29, 4, 3, style === 'borg' ? '#87948d' : skin);
    p.rect(23, 29, 3, 3, style === 'borg' ? '#87948d' : skin);
  }
  return p.canvas;
}

export function createPortrait(appearance: Appearance): HTMLCanvasElement {
  const p = new Pixels(96, 112, seedOf(`${appearance.style}:${appearance.skin}:${appearance.hair}`));
  const { skin, hair, uniform, style } = appearance;
  const shadow = shade(skin, -0.28);
  const deepShadow = shade(skin, -0.47);
  const light = shade(skin, 0.24);
  const darkHair = shade(hair, -0.3);
  const hairHighlight = shade(hair, 0.18);
  p.gradient(0, 0, 96, 112, '#202b3e', '#0d1626');
  p.context.globalAlpha = 0.2;
  p.ellipse(46, 51, 45, 55, uniform);
  p.context.globalAlpha = 1;
  for (let y = 5; y < 108; y += 5) p.rect(5, y, 86, 1, '#263044');
  p.grain(4, 4, 88, 104, '#344056', 180);
  p.rect(6, 7, 15, 2, C.warm);
  p.rect(6, 11, 7, 1, '#696c83');
  p.rect(80, 99, 10, 2, C.lilac);
  const longHair = style === 'long' || style === 'ridge';
  if (longHair) {
    p.polygon([[28, 17], [40, 10], [60, 12], [73, 25], [76, 63], [83, 89], [62, 102],
      [15, 99], [22, 66], [21, 35]], darkHair);
    p.polygon([[28, 24], [36, 16], [34, 59], [26, 91], [18, 94], [25, 59]], hair);
    p.polygon([[62, 17], [70, 29], [69, 59], [76, 87], [66, 94], [63, 60]], hair);
    p.line(29, 27, 26, 76, hairHighlight, 2);
    p.line(69, 35, 70, 78, hairHighlight, 2);
  }
  p.polygon([[31, 78], [64, 78], [69, 83], [85, 88], [95, 100], [96, 112], [0, 112], [1, 99],
    [12, 88], [26, 84]], '#080e1b');
  p.polygon([[9, 99], [29, 91], [48, 97], [66, 91], [88, 99], [91, 112], [4, 112]], uniform);
  p.polygon([[8, 102], [30, 95], [40, 100], [40, 112], [5, 112]], shade(uniform, 0.12));
  p.polygon([[67, 94], [88, 101], [91, 112], [68, 112]], shade(uniform, -0.24));
  p.rect(38, 69, 21, 18, shadow);
  p.polygon([[39, 69], [49, 73], [56, 71], [56, 85], [48, 90], [39, 84]], skin);
  p.polygon([[34, 79], [40, 84], [48, 89], [58, 83], [63, 78], [66, 85], [49, 97], [30, 86]], '#141c2b');
  p.line(35, 84, 48, 92, '#465164');
  p.line(48, 92, 62, 84, '#303a4c');
  p.rect(60, 87, 2, 2, C.warm);
  p.rect(64, 85, 2, 2, C.warm);
  p.rect(68, 86, 2, 2, C.warm);
  const jaw = style === 'beard' || style === 'ridge' ? 66 : style === 'long' ? 61 : 63;
  p.polygon([[30, 27], [40, 20], [59, 22], [68, 33], [69, 58], [jaw, 72], [53, 81], [42, 80],
    [31, 70], [26, 53]], deepShadow);
  p.polygon([[32, 27], [43, 22], [57, 24], [64, 32], [65, 55], [60, 70], [51, 77], [42, 76],
    [33, 66], [29, 51]], skin);
  p.polygon([[32, 30], [39, 26], [43, 27], [38, 40], [36, 58], [32, 62], [29, 49]], light);
  p.polygon([[58, 30], [64, 35], [65, 55], [60, 67], [55, 70], [58, 52]], shadow);
  p.polygon([[32, 59], [40, 64], [45, 64], [41, 70], [34, 67]], shade(skin, -0.1));
  p.polygon([[51, 66], [59, 62], [60, 67], [54, 74], [47, 76], [43, 73]], shade(skin, -0.14));
  p.rect(24, 44, 5, 13, shadow);
  p.rect(25, 44, 3, 9, skin);
  p.rect(26, 47, 2, 5, deepShadow);
  p.rect(67, 43, 5, 13, shadow);
  p.rect(68, 44, 2, 8, shade(skin, -0.08));
  p.rect(68, 48, 2, 4, deepShadow);
  if (style === 'bald') {
    p.polygon([[27, 37], [29, 24], [35, 17], [46, 14], [57, 16], [65, 23], [68, 36],
      [60, 34], [54, 31], [36, 33]], skin);
    p.polygon([[32, 25], [39, 19], [48, 17], [55, 20], [51, 22], [37, 26]], light);
    p.rect(27, 34, 3, 10, hair);
    p.rect(66, 33, 3, 12, darkHair);
    p.line(38, 33, 54, 32, shade(skin, -0.13));
    p.line(39, 36, 54, 35, shade(skin, -0.09));
  } else if (style === 'long') {
    p.polygon([[25, 43], [24, 29], [29, 19], [40, 14], [57, 15], [68, 24], [72, 40],
      [66, 46], [61, 32], [53, 25], [44, 28], [34, 33], [29, 45]], hair);
    p.polygon([[27, 30], [34, 21], [44, 18], [51, 18], [44, 24], [34, 29]], hairHighlight);
    p.line(51, 18, 61, 26, shade(hair, 0.27), 2);
    p.line(61, 26, 66, 41, hairHighlight, 2);
    p.polygon([[24, 46], [29, 41], [29, 65], [25, 79], [26, 89], [20, 94], [23, 74]], hair);
    p.line(25, 53, 25, 74, hairHighlight);
    p.line(68, 52, 70, 73, hairHighlight);
  } else if (style === 'ridge') {
    p.polygon([[26, 44], [23, 31], [27, 19], [40, 12], [57, 14], [68, 24], [72, 40], [68, 46],
      [63, 28], [53, 22], [42, 20], [32, 30], [30, 43]], hair);
    p.line(27, 30, 35, 21, hairHighlight, 2);
    p.polygon([[43, 22], [51, 22], [54, 38], [49, 43], [44, 39], [40, 28]], shadow);
    for (let y = 25; y < 42; y += 5) {
      p.polygon([[42, y], [47, y - 2], [53, y + 1], [50, y + 3], [45, y + 2]], deepShadow);
      p.line(44, y - 1, 48, y - 2, light, 2);
    }
    p.rect(47, 27, 2, 13, shade(skin, 0.17));
  } else {
    const android = style === 'android';
    p.polygon([[26, 39], [25, 28], [28, 20], [36, 15], [51, 14], [64, 19], [70, 29], [69, 42],
      [64, 38], [62, android ? 27 : 31], [android ? 37 : 43, 27], [32, 32], [30, 43]], hair);
    p.polygon([[29, 25], [37, 18], [52, 17], [61, 22], [43, 22], [33, 29]], hairHighlight);
    p.line(34, 25, 53, 20, shade(hair, 0.25), 2);
    p.rect(27, 35, 3, 11, darkHair);
    p.rect(65, 34, 3, 12, darkHair);
    if (style === 'short') {
      p.polygon([[33, 28], [42, 22], [56, 24], [52, 30], [45, 31], [39, 29]], hair);
    }
  }
  const browColor = style === 'android' ? '#655c48' : darkHair;
  if (style === 'long') {
    p.line(32, 43, 36, 41, browColor);
    p.line(36, 41, 41, 42, browColor);
    p.line(53, 42, 57, 41, browColor);
    p.line(57, 41, 62, 43, browColor);
  } else if (style === 'ridge') {
    p.line(31, 40, 41, 43, browColor, 2);
    p.line(53, 43, 63, 40, browColor, 2);
  } else if (style === 'android') {
    p.line(32, 42, 41, 42, browColor, 2);
    p.line(53, 40, 61, 41, browColor, 2);
  } else {
    p.line(32, 41, 41, 42, browColor, 2);
    p.line(53, 42, 61, 41, browColor, 2);
  }
  p.rect(32, 46, 10, 4, shade(skin, -0.36));
  p.rect(52, 46, 10, 4, shade(skin, -0.36));
  p.rect(33, 46, 8, 2, '#e4d8cb');
  p.rect(53, 46, 8, 2, '#d3c5b9');
  const iris = style === 'android' ? '#b49637' : style === 'long' ? '#528795' : '#596e77';
  p.rect(37, 46, 3, 3, iris);
  p.rect(55, 46, 3, 3, iris);
  p.rect(38, 47, 1, 2, '#111826');
  p.rect(56, 47, 1, 2, '#111826');
  p.rect(37, 46, 1, 1, '#ffeed5');
  p.rect(55, 46, 1, 1, '#ffeed5');
  if (style === 'long') {
    p.line(31, 45, 35, 46, darkHair);
    p.line(59, 46, 63, 45, darkHair);
    p.rect(33, 48, 3, 1, skin);
    p.rect(59, 48, 3, 1, shadow);
  }
  p.line(33, 51, 40, 52, shade(skin, -0.1));
  p.line(54, 52, 61, 50, shade(skin, -0.22));
  p.polygon([[46, 44], [48, 45], [49, 56], [53, 60], [48, 63], [42, 60], [45, 57]], shadow);
  p.line(46, 46, 45, 56, light, 2);
  p.rect(44, 57, 5, 3, light);
  p.rect(43, 60, 3, 1, deepShadow);
  p.rect(49, 60, 3, 1, deepShadow);
  p.line(40, 66, 46, 67, shade(skin, -0.45));
  p.line(46, 67, 54, 66, shade(skin, -0.45));
  p.rect(42, 68, 11, 2, style === 'long' ? blend(skin, '#af5769', 0.48) : shade(skin, -0.14));
  p.rect(44, 70, 7, 1, light);
  if (style === 'beard' || style === 'ridge') {
    p.polygon([[29, 54], [34, 61], [37, 62], [40, 64], [46, 63], [54, 64], [59, 60], [64, 54],
      [65, 64], [61, 73], [53, 80], [41, 78], [33, 72], [29, 64]], hair);
    p.rect(41, 66, 14, 3, shadow);
    p.line(42, 67, 54, 67, '#32252c');
    p.line(38, 72, 43, 75, hairHighlight, 2);
    p.line(48, 77, 54, 75, hairHighlight);
    p.rect(46, 70, 5, 3, darkHair);
    if (style === 'ridge') {
      p.line(34, 61, 40, 64, darkHair, 2);
      p.line(52, 63, 59, 60, darkHair, 2);
    }
  }
  if (style === 'visor') {
    p.polygon([[26, 43], [34, 42], [63, 42], [71, 44], [70, 53], [62, 54], [32, 54], [26, 52]], '#5b503c');
    p.rect(29, 43, 38, 9, '#c39b57');
    p.rect(30, 43, 36, 2, '#f5d58e');
    p.rect(30, 50, 36, 2, '#8b6c43');
    for (let x = 32; x < 65; x += 3) {
      p.rect(x, 45, 1, 5, '#69563e');
      p.rect(x + 1, 45, 1, 4, '#e0b977');
    }
    p.rect(26, 45, 3, 5, '#a4a3a0');
    p.rect(68, 45, 3, 5, '#96989d');
    p.rect(27, 46, 1, 2, '#d2d6c8');
  }
  if (style === 'ridge') {
    p.polygon([[72, 88], [82, 93], [62, 112], [49, 112]], '#756f77');
    p.line(72, 90, 52, 111, '#d3c5aa', 2);
    for (let link = 0; link < 6; link += 1) {
      p.line(72 - link * 3, 94 + link * 3, 77 - link * 3, 97 + link * 3, '#d4c7b4', 2);
    }
  }
  communicator(p, 19, 98, 1.6);
  if (style === 'borg') {
    p.polygon([[27, 37], [29, 24], [35, 17], [46, 14], [57, 16], [65, 23], [68, 37],
      [59, 34], [49, 31], [36, 34]], skin);
    p.polygon([[32, 25], [39, 19], [48, 17], [55, 20], [50, 23], [37, 27]], light);
    p.polygon([[17, 88], [34, 80], [47, 90], [62, 81], [83, 88], [96, 104], [96, 112],
      [0, 112], [0, 102]], '#252f34');
    p.polygon([[12, 92], [29, 86], [37, 93], [35, 112], [6, 112]], '#65706e');
    p.polygon([[57, 93], [66, 86], [83, 92], [89, 112], [55, 112]], '#465654');
    for (const y of [95, 101, 107]) {
      p.rect(17, y, 17, 3, '#202d32');
      p.rect(61, y, 18, 3, '#1a272d');
      p.rect(62, y, 13, 1, '#8a9990');
    }
    p.polygon([[31, 77], [38, 79], [48, 86], [60, 78], [65, 81], [61, 93], [48, 98],
      [34, 90]], '#79817a');
    p.line(38, 83, 48, 91, '#c0bdaa', 2);
    p.line(49, 91, 60, 85, '#333f42', 3);
    p.polygon([[23, 26], [32, 21], [35, 29], [31, 37], [38, 41], [38, 55], [28, 61],
      [21, 54], [19, 38]], '#4d5a5a');
    p.line(25, 29, 24, 48, '#a5aea0', 2);
    p.polygon([[25, 38], [36, 36], [42, 40], [41, 54], [29, 59], [23, 52]], '#89928a');
    p.ellipse(32, 46, 9, 9, '#202e35');
    p.ellipse(32, 46, 6, 6, '#506766');
    p.ellipse(32, 46, 4, 4, '#16262b');
    p.rect(30, 44, 4, 3, '#b05c58');
    p.rect(31, 44, 2, 2, '#eea282');
    p.rect(22, 38, 4, 4, '#c1c1aa');
    p.rect(23, 53, 4, 3, '#394b4f');
    p.line(24, 55, 18, 68, '#121d26', 5);
    p.line(18, 68, 21, 85, '#121d26', 5);
    p.line(24, 55, 19, 67, '#8b9a90', 2);
    p.line(19, 67, 22, 84, '#8b9a90', 2);
    for (let y = 64; y < 83; y += 4) p.line(16, y, 22, y + 1, '#34464b', 2);
    p.polygon([[55, 66], [63, 60], [69, 64], [64, 75], [56, 79], [52, 75]], '#78847d');
    p.line(58, 70, 63, 66, '#c1c4b0', 2);
    p.rect(56, 74, 5, 2, '#34494e');
    p.rect(40, 101, 12, 9, '#111f27');
    p.rect(42, 103, 7, 2, '#79947f');
    p.rect(42, 106, 4, 1, '#bbba95');
  }
  p.rect(0, 0, 96, 1, '#536078');
  p.rect(0, 111, 96, 1, '#080f1b');
  return p.canvas;
}

function noise(x: number, y: number): number {
  let value = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const tx = x - ix;
  const ty = y - iy;
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  const top = noise(ix, iy) * (1 - sx) + noise(ix + 1, iy) * sx;
  const bottom = noise(ix, iy + 1) * (1 - sx) + noise(ix + 1, iy + 1) * sx;
  return top * (1 - sy) + bottom * sy;
}

function titleShip(p: Pixels): void {
  p.polygon([[277, 213], [286, 177], [308, 166], [317, 177], [300, 220]], '#333e54');
  p.polygon([[288, 210], [295, 178], [308, 172], [310, 178], [300, 216]], '#7c8596');
  p.polygon([[326, 196], [340, 159], [354, 155], [359, 163], [345, 210]], '#505970');
  p.polygon([[334, 191], [345, 163], [352, 161], [350, 177]], '#a5a8b4');
  p.polygon([[241, 135], [248, 132], [303, 170], [312, 181], [305, 188], [295, 185],
    [242, 147], [237, 141]], '#242f46');
  p.polygon([[242, 135], [249, 135], [301, 171], [307, 180], [301, 182], [245, 144]], '#949cae');
  p.line(248, 136, 300, 172, '#d0cbd0', 2);
  p.line(244, 145, 297, 181, '#256080', 3);
  p.line(246, 145, 298, 180, '#7ddbea');
  p.polygon([[295, 173], [301, 174], [307, 180], [302, 184], [296, 181]], '#b26372');
  p.line(298, 175, 304, 180, '#efad9a', 2);
  p.polygon([[317, 119], [325, 116], [373, 148], [382, 160], [373, 168], [366, 164],
    [317, 131], [313, 124]], '#28334c');
  p.polygon([[318, 120], [325, 119], [371, 149], [376, 158], [371, 162], [320, 128]], '#a6abba');
  p.line(324, 121, 370, 150, '#ded8d7', 2);
  p.line(320, 130, 367, 161, '#285e83', 3);
  p.line(322, 130, 368, 160, '#89e4e4');
  p.polygon([[368, 150], [374, 152], [379, 159], [373, 164], [368, 159]], '#ba6975');
  p.line(371, 154, 376, 159, '#ffd4ad', 2);
  p.polygon([[264, 215], [280, 207], [326, 213], [362, 228], [350, 238], [297, 238],
    [272, 230]], '#323c55');
  p.polygon([[266, 216], [283, 211], [325, 216], [354, 227], [342, 233], [292, 232],
    [273, 225]], '#727e94');
  p.polygon([[278, 214], [305, 215], [327, 224], [290, 223]], '#b1b5c0');
  p.polygon([[269, 221], [291, 228], [342, 232], [334, 236], [295, 235], [276, 229]], '#505d75');
  p.ellipse(337, 232, 10, 4, '#1a385a');
  p.ellipse(338, 232, 7, 2, C.cyan);
  p.rect(337, 231, 6, 1, '#d6f6e3');
  for (let x = 283; x < 325; x += 7) p.rect(x, 229, 3, 1, C.warm);
  p.polygon([[315, 216], [331, 185], [360, 185], [349, 226]], '#6a758e');
  p.polygon([[320, 215], [335, 188], [350, 190], [340, 221]], '#acb2c0');
  p.line(325, 209, 335, 190, '#cfd2d2', 2);
  p.ellipse(367, 200, 81, 30, '#1c2c43');
  p.ellipse(366, 198, 82, 29, '#4b5971');
  p.ellipse(366, 193, 82, 29, '#8490a6');
  p.ellipse(365, 190, 80, 28, '#b6becb');
  p.ellipse(362, 187, 74, 25, '#cbd0d5');
  p.ellipse(361, 186, 65, 22, '#9ba9be');
  p.ellipse(361, 185, 62, 20, '#b7c2ce');
  p.ellipse(361, 185, 52, 17, '#8396af');
  p.ellipse(361, 185, 49, 15, '#b7c4d0');
  p.ellipse(361, 184, 35, 11, '#9cacc0');
  p.ellipse(361, 183, 32, 9, '#c9d0d4');
  const seams: readonly Point[] = [[292, 182], [305, 170], [331, 164], [365, 163], [400, 168], [430, 181], [434, 196], [408, 207], [373, 213], [336, 211], [307, 201]];
  for (const [x, y] of seams) {
    const innerX = 361 + (x - 361) * 0.29;
    const innerY = 185 + (y - 185) * 0.29;
    p.line(x, y, innerX, innerY, '#8496af');
  }
  p.ellipse(358, 182, 24, 8, '#8e9eb5');
  p.ellipse(358, 180, 22, 7, '#dce0dc');
  p.ellipse(355, 178, 12, 4, '#a4b3c6');
  p.ellipse(355, 176, 9, 3, '#e0e2db');
  p.rect(352, 175, 6, 2, '#eef0df');
  p.rect(351, 179, 8, 1, '#63788f');
  for (let index = 0; index < 35; index += 1) {
    const angle = (index / 34) * Math.PI;
    const x = Math.round(366 + Math.cos(angle) * 77);
    const y = Math.round(195 + Math.sin(angle) * 26);
    p.rect(x, y, 2, 1, index % 5 === 0 ? C.warm : '#e4e5d4');
    if (index % 3 !== 0) p.rect(x, y + 3, 2, 1, '#768ba2');
  }
  for (let index = 0; index < 29; index += 1) {
    const angle = (index / 28) * Math.PI * 2;
    const x = Math.round(361 + Math.cos(angle) * 58);
    const y = Math.round(185 + Math.sin(angle) * 19);
    p.rect(x, y, 2, 1, '#526c8a');
  }
  p.line(391, 198, 409, 192, '#9b6778', 2);
  p.line(392, 200, 410, 194, '#e2d1ce');
  p.rect(403, 184, 8, 1, '#516f8e');
  p.rect(407, 187, 8, 1, '#516f8e');
  p.rect(303, 190, 8, 1, '#607792');
  p.rect(306, 193, 9, 1, '#607792');
  p.rect(444, 194, 2, 2, C.red);
  p.rect(286, 191, 2, 2, '#9ce2cd');
  p.rect(362, 165, 2, 1, '#eef6e2');
}

export function createSpaceTexture(): HTMLCanvasElement {
  const p = new Pixels(480, 300, 71823);
  p.rect(0, 0, 480, 300, C.void);
  for (let y = 0; y < 300; y += 2) {
    for (let x = 0; x < 480; x += 2) {
      const n = smoothNoise(x / 81, y / 71) * 0.52 + smoothNoise(x / 31 + 8, y / 28) * 0.3
        + smoothNoise(x / 9, y / 11) * 0.18;
      const cloud = Math.max(0, n - 0.22) * Math.min(1, Math.max(0, (x - 125) / 240));
      const ribbon = Math.max(0, 1 - Math.abs(y - (95 + Math.sin(x / 85) * 47)) / 140);
      const glow = cloud * ribbon;
      const blueCloud = Math.max(0, n - 0.35) * Math.max(0, 1 - Math.abs(y - 222) / 110)
        * Math.min(1, Math.max(0, (x - 235) / 220));
      const red = Math.round(8 + glow * 94 + blueCloud * 16);
      const green = Math.round(15 + glow * 51 + blueCloud * 68);
      const blue = Math.round(27 + glow * 153 + blueCloud * 107);
      p.rect(x, y, 2, 2, `rgb(${red},${green},${blue})`);
      if ((x + y) % 4 === 0 && glow > 0.12) p.rect(x, y, 1, 1, `rgb(${red + 3},${green + 2},${blue + 4})`);
    }
  }
  stars(p, 0, 0, 480, 300, 560);
  p.ellipse(443, 74, 20, 20, '#162741');
  p.ellipse(446, 73, 18, 19, '#29394f');
  p.ellipse(449, 71, 15, 17, '#455269');
  p.ellipse(453, 69, 12, 15, '#586174');
  p.ellipse(448, 69, 4, 3, '#49586d');
  p.ellipse(453, 79, 6, 2, '#48586b');
  p.line(396, 38, 421, 43, '#536078');
  p.line(408, 39, 421, 43, '#a8b5c9');
  p.rect(420, 43, 2, 1, '#e1e3dc');
  titleShip(p);
  const output = new Pixels(960, 600, 0);
  output.context.drawImage(p.canvas, 0, 0, 960, 600);
  return output.canvas;
}

function propShadow(p: Pixels, width: number): void {
  p.context.globalAlpha = 0.38;
  p.ellipse(56, 74, width / 2, 4, C.void);
  p.context.globalAlpha = 1;
}

function propBench(p: Pixels, width = 58): void {
  const left = 56 - width / 2;
  propShadow(p, width + 10);
  p.rect(left + 7, 57, 5, 16, '#393b50');
  p.rect(left + width - 12, 57, 5, 16, '#393b50');
  p.rect(left + 7, 62, 2, 9, '#8e8798');
  p.rect(left + width - 12, 62, 2, 9, '#6e6d83');
  p.polygon([[left + 5, 49], [left + width - 5, 49], [left + width, 55], [left, 55]], C.edge);
  p.polygon([[left + 6, 50], [left + width - 6, 50], [left + width - 3, 53], [left + 3, 53]], '#606678');
  p.rect(left, 55, width, 5, '#34384c');
  p.rect(left + 1, 55, width - 2, 1, '#c0adb2');
  p.rect(left + 7, 59, width - 14, 2, '#565367');
}

const propPainters: Record<PropVisual, (p: Pixels) => void> = {
  terminal: (p) => {
    propShadow(p, 50);
    p.ellipse(56, 71, 20, 4, '#737184');
    p.ellipse(56, 70, 17, 3, '#444a60');
    p.polygon([[50, 38], [62, 38], [64, 68], [48, 68]], '#353e52');
    p.rect(51, 41, 4, 25, '#8a899b');
    p.rect(59, 43, 2, 23, '#566479');
    p.polygon([[31, 8], [78, 8], [82, 12], [80, 37], [33, 37], [29, 33]], '#9294a5');
    p.rect(32, 11, 46, 25, C.ink);
    monitor(p, 35, 13, 40, 20);
    p.polygon([[36, 38], [76, 38], [81, 44], [31, 44]], '#aaa0ad');
    p.polygon([[38, 39], [73, 39], [77, 42], [35, 42]], '#1b293d');
    for (const x of [39, 47, 55, 65]) p.rect(x, 40, 5, 1, x === 65 ? C.warm : C.lilac);
    p.rect(32, 44, 48, 3, '#34384c');
  },
  chair: (p) => {
    propShadow(p, 61);
    p.rect(53, 52, 7, 18, '#565f75');
    p.rect(54, 54, 2, 14, '#c0b3ba');
    p.line(56, 69, 35, 74, '#82828f', 3);
    p.line(57, 69, 76, 74, '#82828f', 3);
    p.rect(53, 69, 7, 6, '#96909e');
    p.polygon([[35, 13], [40, 8], [71, 8], [77, 13], [73, 42], [38, 42]], '#252b3e');
    p.polygon([[38, 14], [42, 11], [68, 11], [73, 15], [69, 40], [41, 40]], '#9c7d8d');
    p.rect(43, 14, 24, 3, '#c0a0a6');
    p.polygon([[42, 20], [68, 20], [66, 35], [44, 35]], '#866879');
    p.rect(45, 21, 19, 2, '#a58a99');
    p.polygon([[39, 40], [72, 40], [80, 49], [32, 49]], '#b296a2');
    p.rect(34, 49, 45, 6, '#514457');
    p.rect(39, 48, 34, 2, '#d0b1b2');
    p.rect(29, 35, 9, 18, '#3a4054');
    p.rect(76, 35, 9, 18, '#3a4054');
    p.rect(27, 34, 12, 5, '#96929f');
    p.rect(75, 34, 12, 5, '#96929f');
    p.rect(29, 34, 6, 2, C.warm);
    p.rect(79, 34, 5, 2, C.lilac);
  },
  padd: (p) => {
    propBench(p, 58);
    p.polygon([[36, 44], [66, 44], [74, 49], [41, 51]], '#202b3c');
    p.polygon([[40, 17], [65, 15], [76, 42], [71, 47], [43, 49], [34, 22]], '#192334');
    p.polygon([[41, 18], [64, 17], [72, 43], [45, 46], [37, 22]], '#a6a4b1');
    p.polygon([[43, 22], [61, 20], [67, 37], [47, 39]], '#153249');
    p.line(44, 23, 59, 22, C.lilac, 2);
    p.line(47, 28, 60, 27, C.cyan);
    p.line(49, 31, 63, 30, '#607f9c');
    p.line(50, 34, 60, 33, '#607f9c');
    p.rect(50, 42, 5, 2, C.warm);
    p.rect(59, 41, 3, 2, '#454c67');
    p.rect(64, 40, 3, 2, '#454c67');
    p.line(38, 23, 45, 44, '#d0c5c9');
  },
  crate: (p) => {
    propShadow(p, 70);
    crate(p, 27, 14, 62, 50, '#69717f');
    p.rect(39, 27, 4, 26, '#ae9e8b');
    p.rect(64, 27, 4, 26, '#ae9e8b');
    p.rect(38, 36, 6, 8, '#262e3e');
    p.rect(63, 36, 6, 8, '#262e3e');
    p.rect(39, 38, 4, 3, C.warm);
    p.rect(64, 38, 4, 3, C.warm);
    p.rect(32, 65, 12, 4, '#273246');
    p.rect(69, 65, 12, 4, '#273246');
  },
  conduit: (p) => {
    propShadow(p, 60);
    p.polygon([[34, 62], [74, 62], [83, 69], [29, 69]], '#576375');
    p.rect(31, 69, 50, 4, '#243147');
    p.rect(45, 24, 19, 40, '#1b2a3d');
    p.rect(48, 25, 13, 38, '#8397a4');
    p.rect(49, 26, 3, 36, '#c0c7c6');
    p.rect(57, 28, 4, 34, '#4e6c81');
    p.polygon([[48, 12], [77, 12], [77, 28], [60, 28], [60, 35], [45, 35], [45, 17]], '#4d6479');
    p.rect(50, 15, 28, 10, '#879daa');
    p.rect(51, 15, 25, 2, '#d4d5ce');
    p.rect(51, 23, 25, 2, '#35516b');
    p.ellipse(77, 20, 6, 11, '#1e3043');
    p.ellipse(77, 19, 5, 9, '#aab6bc');
    p.ellipse(78, 19, 3, 6, '#254454');
    p.rect(76, 16, 2, 7, C.cyan);
    for (const y of [34, 47, 58]) {
      p.rect(42, y, 25, 5, '#566b80');
      p.rect(43, y, 23, 2, '#aeb9be');
      p.rect(46, y + 2, 3, 2, '#dfcfa7');
    }
    p.rect(53, 40, 3, 6, C.cyan);
  },
  cylinder: (p) => {
    propBench(p, 42);
    p.ellipse(56, 48, 12, 4, '#192536');
    p.ellipse(56, 46, 10, 3, '#b1a5af');
    p.rect(52, 38, 8, 8, '#596a7b');
    p.rect(53, 39, 2, 6, '#c3c1bf');
    p.ellipse(56, 37, 12, 4, '#3f485c');
    p.rect(44, 15, 25, 23, '#99794e');
    p.rect(45, 16, 5, 22, '#e6c590');
    p.rect(50, 17, 3, 21, '#f1d5a3');
    p.rect(53, 17, 9, 21, '#bc995d');
    p.rect(64, 17, 4, 21, '#665441');
    p.ellipse(56, 15, 12, 4, '#d8be8c');
    p.ellipse(56, 14, 8, 2, '#6c6b63');
    p.ellipse(56, 14, 4, 1, '#293549');
    p.ellipse(56, 37, 12, 3, '#776549');
    p.rect(45, 34, 23, 2, '#e0c897');
    p.rect(46, 20, 21, 2, '#526b7a');
    p.rect(46, 21, 20, 1, C.cyan);
    p.rect(59, 25, 4, 6, '#514539');
    p.rect(60, 26, 2, 4, C.cream);
  },
  kit: (p) => {
    propBench(p, 64);
    p.rect(44, 15, 25, 4, '#182335');
    p.rect(43, 18, 5, 8, '#b6b2b8');
    p.rect(65, 18, 5, 8, '#b6b2b8');
    p.rect(47, 16, 18, 2, '#a6a4ad');
    p.polygon([[32, 25], [73, 23], [81, 30], [81, 46], [37, 49], [31, 43]], '#303d52');
    p.polygon([[34, 24], [73, 23], [78, 28], [39, 30]], '#b2b8c0');
    p.rect(34, 30, 40, 17, '#8194a7');
    p.rect(36, 32, 36, 12, '#91a8b8');
    p.polygon([[75, 30], [80, 28], [80, 44], [75, 47]], '#536b80');
    p.rect(39, 28, 5, 7, '#354357');
    p.rect(65, 28, 5, 7, '#354357');
    p.rect(40, 29, 3, 4, C.warm);
    p.rect(66, 29, 3, 4, C.warm);
    p.rect(52, 33, 5, 10, '#d6e1dd');
    p.rect(48, 36, 13, 4, '#d6e1dd');
    p.rect(53, 36, 3, 3, '#669fab');
    p.rect(35, 43, 4, 3, C.red);
    p.rect(69, 43, 4, 3, C.red);
  },
  shutter: (p) => {
    propShadow(p, 68);
    p.rect(26, 10, 60, 57, '#172334');
    p.rect(28, 8, 56, 5, '#87929e');
    p.rect(28, 13, 5, 50, '#697b8d');
    p.rect(79, 13, 5, 50, '#697b8d');
    p.rect(29, 13, 1, 48, '#c0c2c5');
    for (let y = 15; y < 59; y += 8) {
      p.rect(34, y, 44, 6, '#565c70');
      p.rect(34, y, 44, 2, '#9c98a7');
      p.rect(35, y + 5, 42, 1, '#313c50');
    }
    p.rect(35, 48, 42, 7, '#283749');
    p.rect(36, 49, 40, 3, '#c3a26b');
    for (const x of [39, 49, 59, 69]) p.line(x, 49, x + 2, 51, '#404453', 2);
    p.rect(27, 63, 58, 4, '#a7a0a9');
    p.rect(32, 67, 8, 6, '#424c60');
    p.rect(73, 67, 8, 6, '#424c60');
  },
  hatch: (p) => {
    propShadow(p, 68);
    p.polygon([[35, 10], [76, 10], [85, 19], [85, 57], [77, 65], [34, 65], [26, 57], [26, 20]], '#263347');
    p.polygon([[37, 12], [74, 12], [82, 20], [82, 55], [75, 62], [36, 62], [29, 55], [29, 21]], '#a1a3ae');
    p.polygon([[39, 17], [71, 17], [77, 23], [77, 53], [71, 57], [39, 57], [34, 52], [34, 24]], '#545e75');
    p.line(40, 19, 69, 19, '#858d9e');
    p.line(35, 25, 35, 51, '#7c8a9c');
    p.ellipse(56, 37, 14, 13, '#25344a');
    p.ellipse(56, 37, 11, 10, '#adb1b8');
    p.ellipse(56, 37, 8, 7, '#52677c');
    p.line(49, 31, 63, 43, '#dad3c8', 3);
    p.line(50, 43, 63, 31, '#dad3c8', 3);
    p.ellipse(56, 37, 4, 4, '#303f55');
    p.rect(55, 35, 3, 3, C.warm);
    for (const y of [22, 47]) {
      p.rect(25, y, 9, 7, '#6e7c90');
      p.rect(26, y, 7, 2, '#c0bcc2');
    }
    p.rect(79, 32, 7, 12, '#334459');
    p.rect(81, 34, 3, 4, C.cyan);
    p.rect(36, 65, 5, 7, '#4f5970');
    p.rect(72, 65, 5, 7, '#4f5970');
  },
  beacon: (p) => {
    propBench(p, 47);
    p.line(56, 38, 43, 50, '#8795a4', 3);
    p.line(56, 38, 69, 50, '#8795a4', 3);
    p.rect(54, 32, 5, 21, '#455d73');
    p.rect(54, 33, 2, 18, '#c5c8c6');
    p.ellipse(56, 31, 11, 4, '#283c51');
    p.rect(47, 17, 19, 14, '#497f91');
    p.rect(48, 18, 5, 11, '#a5e4e1');
    p.rect(53, 18, 7, 11, '#64b6c4');
    p.rect(62, 18, 3, 11, '#39728d');
    p.ellipse(56, 17, 10, 4, '#d3bbb2');
    p.ellipse(56, 16, 7, 2, C.red);
    p.rect(55, 7, 2, 9, '#b2bfca');
    p.rect(53, 6, 6, 2, C.warm);
    p.rect(47, 24, 19, 2, '#304b64');
    p.rect(49, 24, 15, 1, '#f1dbac');
    p.rect(46, 31, 21, 3, '#97a3b1');
    p.rect(52, 35, 9, 3, C.warm);
  },
  lamp: (p) => {
    propShadow(p, 47);
    p.ellipse(56, 71, 18, 4, '#6b647a');
    p.ellipse(55, 69, 15, 3, '#aaa0af');
    p.rect(53, 27, 6, 41, '#4a4d65');
    p.rect(54, 27, 2, 41, '#c6b8bd');
    p.rect(58, 32, 1, 34, '#968797');
    p.polygon([[45, 10], [66, 10], [79, 30], [32, 30]], '#4f4659');
    p.polygon([[46, 11], [65, 11], [76, 27], [35, 27]], '#d3b499');
    p.polygon([[46, 11], [52, 11], [47, 27], [35, 27]], '#f0d8b3');
    p.polygon([[62, 11], [65, 11], [76, 27], [65, 27]], '#ae8985');
    p.ellipse(56, 28, 22, 4, '#af857d');
    p.ellipse(56, 29, 17, 2, C.warm);
    p.rect(52, 29, 8, 2, '#ffebc1');
    p.rect(59, 32, 1, 7, '#dbc1a1');
    p.rect(58, 39, 3, 3, C.warm);
  },
  platform: (p) => {
    propShadow(p, 88);
    p.ellipse(56, 62, 40, 10, '#263347');
    p.rect(16, 44, 81, 18, '#454f66');
    p.ellipse(56, 60, 40, 10, '#677187');
    p.ellipse(56, 56, 40, 10, '#444d64');
    p.ellipse(56, 44, 40, 12, '#b4afbc');
    p.ellipse(56, 43, 36, 10, '#5d6981');
    p.ellipse(56, 43, 29, 8, '#9eaabc');
    p.ellipse(56, 43, 26, 6, '#2c4a65');
    p.ellipse(56, 43, 18, 4, '#6999ad');
    p.ellipse(56, 43, 14, 3, '#203d57');
    p.rect(53, 41, 7, 3, '#a8e1df');
    for (const [x, y] of [[29, 43], [40, 37], [70, 37], [81, 43], [70, 49], [40, 49]]) {
      p.rect(x - 2, y, 4, 2, C.warm);
    }
    p.rect(29, 58, 10, 2, C.lilac);
    p.rect(73, 58, 10, 2, C.lilac);
    p.rect(46, 61, 21, 2, C.cyan);
  },
  sample: (p) => {
    propBench(p, 48);
    p.ellipse(56, 47, 18, 5, '#344457');
    p.ellipse(56, 45, 16, 4, '#929dac');
    p.context.globalAlpha = 0.3;
    p.polygon([[47, 12], [65, 12], [72, 19], [72, 42], [65, 46], [45, 46], [39, 41], [39, 20]], '#76d5e7');
    p.context.globalAlpha = 1;
    p.polygon([[45, 41], [48, 25], [54, 20], [61, 26], [65, 43]], '#51465e');
    p.polygon([[47, 39], [50, 25], [54, 22], [56, 38], [53, 44]], C.lilac);
    p.polygon([[56, 28], [62, 26], [67, 35], [62, 43], [55, 43]], '#cb8ca8');
    p.line(50, 25, 48, 37, '#e8c8de', 2);
    p.line(60, 28, 63, 35, '#f1bfca');
    p.line(40, 20, 40, 40, '#c3e0dc');
    p.line(41, 18, 47, 13, '#c3e0dc');
    p.line(66, 14, 71, 20, '#749bad');
    p.line(71, 20, 71, 40, '#749bad');
    p.rect(43, 22, 2, 11, '#9cc7cc');
    p.ellipse(56, 12, 10, 3, '#7e93a4');
    p.ellipse(56, 11, 8, 2, '#d1d3cd');
    p.ellipse(56, 45, 16, 3, '#8eabbb');
    p.rect(48, 45, 16, 1, C.cyan);
  },
  model: (p) => {
    propBench(p, 65);
    p.ellipse(56, 49, 14, 3, '#212d40');
    p.rect(53, 37, 6, 11, '#687d91');
    p.rect(54, 38, 2, 9, '#b6c0c6');
    p.polygon([[35, 21], [39, 18], [59, 35], [55, 39]], '#869cb0');
    p.polygon([[69, 17], [72, 16], [64, 37], [59, 36]], '#a8b9c6');
    p.line(30, 13, 47, 24, '#243449', 6);
    p.line(31, 13, 48, 24, '#b8c8d0', 3);
    p.line(31, 16, 47, 26, C.cyan);
    p.line(63, 10, 78, 20, '#243449', 6);
    p.line(64, 10, 79, 20, '#c9d0d3', 3);
    p.line(64, 13, 78, 23, C.cyan);
    p.polygon([[39, 38], [47, 33], [67, 38], [62, 44], [44, 43]], '#7892a8');
    p.ellipse(62, 32, 22, 8, '#506882');
    p.ellipse(61, 29, 23, 7, '#bbc9d3');
    p.ellipse(61, 28, 17, 5, '#7f9ab3');
    p.ellipse(61, 28, 14, 4, '#c4d1d7');
    p.ellipse(60, 27, 6, 2, '#8aa2b8');
    p.rect(58, 25, 4, 2, '#e3e5da');
    p.rect(71, 32, 6, 1, C.red);
    p.rect(62, 39, 4, 1, C.cyan);
  },
  locker: (p) => {
    propShadow(p, 61);
    p.polygon([[30, 10], [36, 6], [78, 6], [83, 12], [83, 63], [78, 67], [30, 67]], '#2b384d');
    p.polygon([[31, 10], [36, 7], [77, 7], [80, 10]], '#b2acb8');
    p.rect(32, 11, 46, 53, '#74798d');
    p.rect(34, 12, 2, 50, '#bdb4c1');
    p.rect(38, 16, 35, 20, '#4b5870');
    p.rect(38, 40, 35, 19, '#5c667d');
    p.rect(39, 16, 33, 2, '#8997a8');
    p.rect(39, 40, 33, 2, '#95a0af');
    p.rect(43, 24, 15, 1, '#26374d');
    p.rect(43, 27, 15, 1, '#26374d');
    p.rect(43, 30, 15, 1, '#26374d');
    p.rect(65, 24, 4, 7, '#bcc0c3');
    p.rect(65, 48, 4, 7, '#bcc0c3');
    p.rect(66, 25, 2, 4, '#35445b');
    p.rect(66, 49, 2, 4, '#35445b');
    p.rect(43, 45, 12, 4, C.lilac);
    p.rect(36, 67, 6, 6, '#3d4c63');
    p.rect(71, 67, 6, 6, '#3d4c63');
  },
  clutch: (p) => {
    propBench(p, 58);
    p.rect(39, 42, 34, 7, '#43566d');
    p.rect(41, 44, 30, 2, '#a3acb7');
    for (const [x, y] of [[49, 10], [67, 13], [76, 27], [71, 41], [49, 45], [32, 33], [35, 18]]) {
      p.rect(x, y, 9, 8, '#5c738a');
      p.rect(x, y, 7, 2, '#bdc8c9');
    }
    p.ellipse(56, 30, 21, 19, '#263b52');
    p.ellipse(55, 28, 20, 18, '#9caebd');
    p.ellipse(55, 28, 16, 14, '#4b687f');
    p.ellipse(55, 28, 12, 11, '#20354b');
    p.ellipse(55, 28, 9, 8, '#c7995e');
    p.ellipse(54, 27, 6, 6, '#edd3a0');
    p.ellipse(54, 27, 3, 3, '#455063');
    p.rect(68, 21, 14, 12, '#344c65');
    p.rect(68, 21, 14, 3, '#b7c7cf');
    p.rect(72, 25, 10, 2, C.cyan);
    p.rect(77, 24, 4, 8, '#7598ad');
    p.rect(40, 18, 3, 3, C.warm);
    p.rect(39, 34, 3, 3, C.warm);
    p.rect(58, 40, 3, 3, C.warm);
    p.line(44, 14, 51, 12, '#d9ded6', 2);
  },
};

export function createPropTexture(visual: PropVisual): HTMLCanvasElement {
  const p = new Pixels(112, 80, seedOf(`prop:${visual}`));
  propPainters[visual](p);
  return p.canvas;
}
