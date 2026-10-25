type Point = readonly [number, number];

export interface PixelPainter {
  rect(x: number, y: number, width: number, height: number, color: string): void;
  line(x1: number, y1: number, x2: number, y2: number, color: string, width?: number): void;
  polygon(points: readonly Point[], color: string): void;
  ellipse(cx: number, cy: number, rx: number, ry: number, color: string): void;
}

export interface PixelBounds {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

// Both textures use the same physical coupling as their origin.
export const galaxySections = {
  saucer: { left: -55, top: -73, right: 128, bottom: 6 },
  stardrive: { left: -139, top: -95, right: 33, bottom: 62 },
} as const satisfies Record<string, PixelBounds>;

export function translatedPainter(p: PixelPainter, dx: number, dy: number): PixelPainter {
  return {
    rect: (x, y, width, height, color) => p.rect(x + dx, y + dy, width, height, color),
    line: (x1, y1, x2, y2, color, width) => p.line(x1 + dx, y1 + dy, x2 + dx, y2 + dy, color, width),
    polygon: (points, color) => p.polygon(points.map(([x, y]) => [x + dx, y + dy]), color),
    ellipse: (x, y, rx, ry, color) => p.ellipse(x + dx, y + dy, rx, ry, color),
  };
}

export function drawDeepSpace(p: PixelPainter): void {
  p.rect(0, 0, 480, 300, '#060d1b');
  for (let y = 0; y < 300; y += 2) {
    for (let x = 0; x < 480; x += 2) {
      const cloud = Math.max(0, 1 - Math.abs(y - 68 - x * 0.27) / 98);
      const grain = ((x * 17 + y * 31) % 13) / 13;
      p.rect(x, y, 2, 2, `rgb(${7 + Math.round(cloud * 3)},${14 + Math.round(cloud * 6)},${26 + Math.round(cloud * (10 + grain * 4))})`);
    }
  }
  let seed = 3591701;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let index = 0; index < 285; index += 1) {
    const x = Math.floor(random() * 480);
    const y = Math.floor(random() * 300);
    const light = random();
    p.rect(x, y, 1, 1, light > 0.94 ? '#d7d5c5' : light > 0.65 ? '#8293ab' : '#34455e');
    if (light > 0.989) p.rect(x - 1, y, 3, 1, '#94a9bb');
  }
}

export function drawDistantCube(p: PixelPainter, x: number, y: number): void {
  const q = translatedPainter(p, x, y);
  q.polygon([[0, 10], [14, 0], [48, 6], [48, 43], [35, 54], [0, 45]], '#111f25');
  q.polygon([[0, 10], [14, 0], [48, 6], [35, 16]], '#35433e');
  q.polygon([[35, 16], [48, 6], [48, 43], [35, 54]], '#142a2a');
  q.polygon([[0, 10], [35, 16], [35, 54], [0, 45]], '#263931');
  for (let row = 0; row < 10; row += 1) {
    for (let column = 0; column < 9; column += 1) {
      const px = 2 + column * 4;
      const py = 13 + row * 3 + Math.floor(column * 0.65);
      q.rect(px, py, column % 3 === 0 ? 2 : 3, 2, (row * 3 + column) % 5 === 0 ? '#526153' : '#101f22');
      if ((row * 7 + column * 3) % 19 === 0) q.rect(px, py, 1, 1, '#86a780');
    }
  }
  for (let index = 0; index < 8; index += 1) {
    q.line(3 + index * 4, 9 - index * 0.6, 34 + index, 14 - index, '#192b29');
    q.line(38, 18 + index * 4, 46, 11 + index * 4, '#476050');
    q.rect(41 + index % 4, 21 + index * 3, 1, 2, '#668267');
  }
  q.line(0, 10, 35, 16, '#6a7560');
  q.line(35, 16, 35, 54, '#4d6451');
}

function nacelle(p: PixelPainter, x: number, y: number): void {
  const q = translatedPainter(p, x, y);
  q.polygon([[0, 5], [5, 0], [13, 0], [70, 33], [80, 42], [77, 49], [68, 50], [4, 14]], '#202c3b');
  q.polygon([[3, 5], [8, 2], [14, 3], [69, 35], [76, 42], [72, 46], [7, 11]], '#a6a99f');
  q.line(10, 3, 68, 36, '#ddd8be', 2);
  q.line(8, 12, 66, 46, '#305776', 4);
  q.line(11, 13, 66, 45, '#5099c1', 2);
  q.line(14, 14, 64, 43, '#9cd3d9');
  q.polygon([[67, 35], [73, 37], [78, 43], [74, 47], [68, 46], [64, 41]], '#7c3541');
  q.polygon([[69, 36], [74, 40], [76, 43], [72, 45], [68, 42]], '#d57b71');
  q.line(70, 37, 74, 41, '#f2b38c', 2);
  q.line(17, 7, 24, 11, '#757f7d');
  q.line(30, 15, 35, 18, '#757f7d');
  q.line(43, 22, 49, 26, '#757f7d');
  q.rect(8, 7, 3, 1, '#e1ceb0');
}

export function drawStardrive(p: PixelPainter): void {
  p.polygon([[-75, -45], [-62, -45], [-23, 29], [-28, 39], [-39, 35]], '#384653');
  p.polygon([[-70, -42], [-64, -42], [-28, 28], [-34, 32]], '#969d98');
  p.line(-67, -39, -32, 27, '#bec2ad', 2);
  nacelle(p, -137, -94);
  p.polygon([[-84, 2], [-72, 0], [-38, 30], [-39, 46], [-51, 43]], '#374654');
  p.polygon([[-80, 5], [-73, 4], [-43, 31], [-45, 39]], '#9ba396');
  p.line(-77, 5, -43, 33, '#d2d0b6', 2);
  nacelle(p, -137, -38);

  p.polygon([[-86, 34], [-72, 25], [-34, 25], [7, 35], [29, 47], [20, 57],
    [-14, 61], [-57, 56], [-81, 45]], '#243241');
  p.polygon([[-83, 34], [-71, 28], [-34, 28], [7, 39], [26, 47], [13, 53],
    [-31, 52], [-67, 44]], '#89968e');
  p.polygon([[-75, 31], [-47, 29], [-14, 36], [6, 44], [-26, 43], [-59, 36]], '#c1c2ad');
  p.polygon([[-80, 39], [-55, 45], [-13, 49], [20, 48], [15, 55], [-20, 58],
    [-59, 52]], '#5c6c72');
  p.line(-75, 40, -32, 49, '#a0aaa0');
  p.line(-56, 54, -15, 59, '#3d5360');
  p.ellipse(17, 49, 13, 6, '#293747');
  p.ellipse(18, 49, 10, 4, '#a27955');
  p.ellipse(19, 49, 7, 3, '#387c9c');
  p.ellipse(20, 49, 4, 2, '#8acfd7');
  p.line(19, 47, 23, 48, '#d5e7ce');
  for (let index = 0; index < 10; index += 1) {
    p.rect(-62 + index * 7, 43 + Math.floor(index * 0.7), 2, 1, index % 3 ? '#dac9a2' : '#344b56');
    if (index < 7) p.rect(-52 + index * 7, 50 + Math.floor(index * 0.4), 2, 1, '#b7bdb2');
  }
  p.polygon([[-15, 0], [17, 0], [4, 34], [-20, 43], [-41, 32]], '#455460');
  p.polygon([[-12, 2], [11, 2], [-1, 31], [-20, 38], [-30, 31]], '#b7bba5');
  p.polygon([[7, 3], [15, 2], [4, 34], [-18, 42], [-19, 36], [-2, 28]], '#76898a');
  p.line(-12, 6, -26, 29, '#d7d3b8', 2);
  for (const y of [11, 16, 21, 26]) {
    p.line(-11 - (y - 11) * 0.4, y, 4 - (y - 11) * 0.4, y + 1, '#687b7a');
    p.rect(-12 - (y - 11) * 0.4, y + 1, 2, 1, '#e4d4a7');
  }
  p.polygon([[-15, 0], [-10, -4], [15, -3], [18, 1], [12, 5], [-14, 4]], '#2c3b44');
  p.line(-10, -3, 14, -2, '#cec7ab');
  p.rect(-8, 0, 20, 2, '#798b82');
  for (const x of [-7, 0, 7]) p.rect(x, -1, 3, 1, '#bdc7b2');
  p.rect(-7, 5, 10, 2, '#334a58');
  p.rect(-5, 5, 6, 1, '#a7c9cd');
  p.polygon([[-80, 32], [-69, 31], [-67, 36], [-78, 37]], '#25333e');
  p.line(-77, 32, -70, 32, '#a6b9ac');
  p.rect(-75, 34, 5, 1, '#788b85');
}

export function drawSaucer(p: PixelPainter): void {
  p.ellipse(37, -24, 87, 28, '#253445');
  p.ellipse(37, -27, 89, 29, '#657781');
  p.ellipse(36, -31, 90, 31, '#a2a995');
  p.ellipse(35, -35, 88, 30, '#d1ccb0');
  p.ellipse(32, -37, 82, 28, '#b5bca8');
  p.ellipse(32, -38, 77, 26, '#ded8ba');
  p.ellipse(32, -38, 69, 23, '#8c9b94');
  p.ellipse(32, -39, 66, 21, '#c7ceba');
  p.ellipse(32, -39, 54, 18, '#a0afa0');
  p.ellipse(32, -40, 51, 16, '#d5d7bb');
  for (let index = 0; index < 24; index += 1) {
    const angle = index / 24 * Math.PI * 2;
    p.line(32 + Math.cos(angle) * 79, -37 + Math.sin(angle) * 26,
      32 + Math.cos(angle) * 31, -39 + Math.sin(angle) * 10, '#9daa9c');
  }
  for (let ring = 0; ring < 3; ring += 1) {
    for (let index = 0; index < 38; index += 1) {
      const angle = index / 38 * Math.PI * 2;
      const x = 32 + Math.cos(angle) * (72 - ring * 15);
      const y = -38 + Math.sin(angle) * (24 - ring * 5);
      p.rect(x, y, index % 3 ? 2 : 3, 1, ring === 1 ? '#758e89' : '#536d73');
    }
  }
  p.ellipse(26, -41, 34, 12, '#98a697');
  p.ellipse(25, -43, 31, 10, '#c8ccb3');
  p.ellipse(25, -46, 23, 7, '#e1dcc0');
  p.ellipse(25, -48, 12, 5, '#728c89');
  p.ellipse(24, -50, 10, 4, '#d7dcc5');
  p.rect(19, -53, 9, 2, '#ecdfbd');
  p.rect(20, -47, 9, 1, '#425d6d');
  p.rect(20, -48, 2, 1, '#93b6bc');
  p.rect(26, -48, 2, 1, '#93b6bc');
  p.polygon([[-27, -47], [-15, -47], [-6, -40], [-12, -35], [-33, -40]], '#889c95');
  p.line(-29, -43, -13, -39, '#47606c', 2);
  p.line(-28, -44, -14, -40, '#ddcfab');
  for (let index = 0; index < 45; index += 1) {
    const angle = index / 44 * Math.PI;
    const x = 37 + Math.cos(angle) * 86;
    const y = -28 + Math.sin(angle) * 28;
    p.rect(x, y, 2, 1, index % 4 === 0 ? '#516b79' : '#efe0b6');
    if (index % 3) p.rect(x, y + 2, 2, 1, '#354f62');
  }
  p.line(73, -30, 98, -36, '#8b5952', 2);
  p.line(74, -27, 99, -33, '#e9d5ad');
  for (let index = 0; index < 11; index += 1) {
    p.rect(68 + index * 3, -39 - Math.floor(index * 0.23), index % 3 === 0 ? 1 : 2, 2, '#566c72');
  }
  p.rect(-51, -32, 2, 2, '#8db39b');
  p.rect(123, -30, 2, 2, '#bd7776');
  p.polygon([[-13, 0], [-9, -3], [15, -2], [18, 1], [12, 5], [-8, 4]], '#405462');
  p.line(-8, 4, 12, 5, '#b4b99d');
  p.rect(-4, 2, 13, 1, '#809389');
}

export function drawEarth(p: PixelPainter, cx: number, cy: number, radius: number): void {
  p.ellipse(cx, cy, radius + 3, radius + 3, '#20394d');
  p.ellipse(cx, cy, radius + 1, radius + 1, '#6895a6');
  p.ellipse(cx, cy, radius, radius, '#295674');
  const point = (x: number, y: number): Point => [cx + x * radius, cy + y * radius];
  p.polygon([
    point(-0.48, -0.62), point(-0.17, -0.73), point(0.05, -0.57), point(0.21, -0.62),
    point(0.46, -0.43), point(0.3, -0.18), point(0.13, -0.22), point(0.06, 0.05),
    point(-0.18, 0.11), point(-0.33, -0.19), point(-0.63, -0.26),
  ], '#789786');
  p.polygon([
    point(-0.17, 0.02), point(0.14, 0.01), point(0.39, 0.26), point(0.27, 0.65),
    point(0.05, 0.82), point(-0.11, 0.5), point(-0.28, 0.29),
  ], '#94a18c');
  p.polygon([
    point(0.39, -0.45), point(0.63, -0.49), point(0.87, -0.15), point(0.77, 0.03),
    point(0.54, -0.04), point(0.49, -0.23),
  ], '#8da38a');
  for (let band = 0; band < 6; band++) {
    const y = -0.65 + band * 0.25;
    for (let segment = 0; segment < 3; segment++) {
      const x = -0.61 + segment * 0.43 + Math.sin(band * 2.3) * 0.09;
      p.ellipse(cx + x * radius, cy + y * radius,
        radius * (0.09 + (band + segment) % 3 * 0.025), radius * 0.022, '#c2d1ca');
    }
  }
  for (let y = -radius; y <= radius; y++) {
    const span = Math.sqrt(Math.max(0, radius * radius - y * y));
    const edge = cx - span;
    p.rect(edge, cy + y, span * 0.34, 1, '#172d4380');
  }
}

export function drawShuttle(p: PixelPainter): void {
  p.polygon([[0, 15], [15, 0], [39, 1], [54, 12], [58, 21], [0, 22]], '#657786');
  p.polygon([[2, 15], [17, 2], [38, 3], [50, 12], [36, 17]], '#d1d1b9');
  p.polygon([[4, 16], [36, 19], [55, 14], [57, 21], [34, 24], [1, 21]], '#889b9d');
  p.polygon([[17, 5], [33, 5], [43, 11], [11, 12]], '#193749');
  p.line(23, 6, 24, 11, '#9aacaf');
  p.line(30, 6, 32, 11, '#9aacaf');
  p.rect(4, 20, 30, 2, '#8a6057');
}

export function drawShuttleStandby(p: PixelPainter): void {
  p.rect(0, 0, 132, 61, '#101a2a');
  p.rect(0, 0, 132, 2, '#9eabaf');
  p.rect(0, 2, 2, 59, '#536774');
  p.rect(130, 2, 2, 59, '#536774');
  p.rect(2, 59, 128, 2, '#536774');
  p.rect(8, 8, 116, 28, '#303e4b');
  p.rect(12, 10, 107, 24, '#1c2c3b');
  for (const x of [29, 49, 69, 89, 109]) p.rect(x, 10, 2, 23, '#455763');
  p.rect(62, 10, 2, 24, '#b3aa8b');
  p.polygon([[8, 36], [124, 36], [128, 58], [4, 58]], '#354551');
  for (const x of [20, 45, 95, 115]) p.line(66 + (x - 66) * 0.6, 36, x, 58, '#61737a');
  p.line(18, 50, 112, 50, '#b7a77e');
  p.ellipse(67, 50, 32, 4, '#172637');
  drawShuttle(translatedPainter(p, 38, 25));
  p.rect(48, 48, 5, 3, '#212e3b');
  p.rect(84, 47, 5, 3, '#212e3b');
  p.rect(14, 16, 6, 2, '#cbb77e');
  p.rect(109, 16, 6, 2, '#cbb77e');
}

export function drawWolf359Wrecks(p: PixelPainter): void {
  // A broken Excelsior profile: saucer, long engineering hull, one surviving nacelle.
  p.line(173, 103, 213, 66, '#536575', 3);
  p.line(177, 102, 216, 67, '#83918e');
  p.polygon([[211, 60], [217, 59], [254, 76], [257, 81], [251, 84], [211, 66]], '#788b93');
  p.line(218, 62, 250, 77, '#abb3a4', 2);
  p.line(218, 67, 250, 81, '#344d65', 2);
  p.polygon([[134, 105], [155, 102], [184, 106], [217, 121], [210, 128], [178, 125],
    [151, 116]], '#6a7c83');
  p.line(155, 105, 208, 121, '#aab5a6', 2);
  p.polygon([[175, 112], [188, 116], [182, 121], [194, 125], [179, 125], [169, 116]], '#111d2d');
  p.polygon([[126, 103], [143, 88], [151, 92], [144, 111]], '#9aa696');
  p.ellipse(119, 86, 40, 13, '#536677');
  p.ellipse(118, 82, 41, 13, '#b2b7a2');
  p.ellipse(117, 81, 31, 9, '#80968f');
  p.ellipse(117, 80, 27, 7, '#a6b3a0');
  p.polygon([[126, 68], [158, 64], [161, 85], [142, 91], [136, 85], [143, 81],
    [130, 77]], '#0b172c');
  p.line(128, 71, 136, 77, '#8a8b77');
  p.line(138, 86, 143, 89, '#bec5ae');
  p.ellipse(113, 79, 7, 3, '#d0ccb1');
  p.rect(166, 94, 5, 2, '#5c7180');
  p.rect(178, 87, 3, 2, '#acb6a6');
  p.line(195, 99, 204, 93, '#728590', 2);

  // A Miranda-like rollbar and paired pods remain legible in the smaller wreck.
  p.line(322, 60, 356, 65, '#859993', 3);
  p.line(325, 60, 326, 73, '#a9b5a5', 2);
  p.line(354, 65, 355, 77, '#a9b5a5', 2);
  p.ellipse(339, 79, 27, 10, '#4a6172');
  p.ellipse(339, 76, 28, 10, '#8da198');
  p.ellipse(338, 75, 20, 6, '#adbaa7');
  p.line(311, 69, 324, 94, '#8d9d9c', 5);
  p.line(356, 78, 367, 99, '#657e8b', 5);
  p.line(311, 70, 323, 92, '#456280');
  p.polygon([[338, 76], [348, 79], [350, 87], [340, 86], [343, 81]], '#142338');
  p.rect(349, 51, 4, 2, '#738b8e');
  p.line(295, 99, 301, 103, '#748b95', 2);
  p.line(281, 133, 295, 129, '#526776', 3);
  p.line(298, 126, 304, 121, '#9caea0', 2);
  p.rect(367, 120, 3, 2, '#657d85');
  p.rect(97, 121, 2, 2, '#8c9f9a');
  p.rect(242, 105, 3, 1, '#6f8893');
}
