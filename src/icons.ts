const paths: Record<string, string> = {
  delta: '<path d="M12 2 21 22 12 16 3 22Z"/><path d="m12 8 1.3 4 4 .4-3.3 2.4 1 4-3-2.4-3 2.4 1-4-3.3-2.4 4-.4Z" fill="currentColor" stroke="none"/>',
  look: '<path d="M2 12s3.7-6 10-6 10 6 10 6-3.7 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  talk: '<path d="M20 15a3 3 0 0 1-3 3H9l-5 3V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3Z"/><path d="M8 8h8M8 12h5"/>',
  use: '<path d="m8 13 0-7a2 2 0 0 1 4 0v6-2a2 2 0 0 1 4 0v2a2 2 0 0 1 4 0v4c0 4-3 6-7 6-3 0-5-2-6-4l-3-5a2 2 0 0 1 3-2Z"/>',
  scan: '<path d="M5 3H3v5M19 3h2v5M5 21H3v-5M19 21h2v-5M2 12h20"/><path d="m7 8 3 7 4-8 3 8"/>',
  walk: '<circle cx="13" cy="4" r="2"/><path d="m7 11 4-3 4 2 3 4M11 8l-1 7-4 6M10 15l5 1 2 5"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2ZM9 3v16M15 5v16"/>',
  journal: '<path d="M5 3h14v18H5ZM3 7h4M3 12h4M3 17h4M10 8h6M10 12h6M10 16h4"/>',
  inventory: '<path d="M4 8h16v13H4ZM9 8V4h6v4M4 12h16M10 12v3h4v-3"/>',
  settings: '<path d="M4 5h16M4 12h16M4 19h16"/><circle cx="8" cy="5" r="2" fill="currentColor"/><circle cx="16" cy="12" r="2" fill="currentColor"/><circle cx="10" cy="19" r="2" fill="currentColor"/>',
  sound: '<path d="M4 9h4l5-4v14l-5-4H4ZM16 8c3 2 3 6 0 8M19 5c5 4 5 10 0 14"/>',
  mute: '<path d="M4 9h4l5-4v14l-5-4H4ZM17 9l5 6M22 9l-5 6"/>',
  save: '<path d="M4 3h13l4 4v14H3V3ZM7 3v6h10V3M7 21v-8h10v8"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4 10-10"/>',
  light: '<path d="M9 18h6M10 22h4M8 14a6 6 0 1 1 8 0l-1 4H9Z"/>',
  star: '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>',
  padd: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 10h8M8 14h5M10 19h4"/>',
  tricorder: '<path d="M4 8h16v13H4ZM6 8V3h12v5M7 12h10M7 16h4"/><circle cx="16" cy="17" r="1"/>',
  isolator: '<path d="M7 3v5M17 3v5M7 16v5M17 16v5M4 8h16v8H4ZM9 12h6"/>',
  beacon: '<path d="M9 21h6l-1-10h-4ZM8 8a6 6 0 0 1 8 0M5 5a10 10 0 0 1 14 0"/><circle cx="12" cy="10" r="1"/>',
  cell: '<path d="M8 4V2h8v2M6 4h12v18H6Z"/><path d="m13 7-4 6h5l-3 5"/>',
  record: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="m5 7 2 1M17 16l2 1"/>',
  key: '<circle cx="8" cy="8" r="5"/><path d="m12 12 9 9M16 16l3-3M18 18l3-3"/>',
};

export function icon(name: string): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.star}</svg>`;
}

const cursors = new Map<string, string>();

export function actionCursor(name: string): string {
  const cached = cursors.get(name);
  if (cached) return cached;
  const shapes = paths[name] ?? paths.star;
  const image = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none" color="#ffe1a3" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(8 8)"><g stroke="#07111d" stroke-width="4.5">${shapes}</g><g stroke="#ffe1a3" stroke-width="1.8">${shapes}</g></g><path d="M3 0v6M0 3h6" stroke="#07111d" stroke-width="3"/><path d="M3 0v6M0 3h6" stroke="#ffe1a3"/></svg>`;
  const cursor = `url("data:image/svg+xml,${encodeURIComponent(image)}") 3 3, crosshair`;
  cursors.set(name, cursor);
  return cursor;
}

export function escape(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
