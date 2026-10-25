import './style.css';
import { z } from 'zod';
import { adventureFor, newlyEarnedFilms } from './adventures';
import { opening } from './campaign/opening';
import { separation } from './episode/separation';
import { playCinematic } from './cinematic';
import type { Cinematic } from './cinematic';
import type { Action, Dialogue, GameState, Hotspot } from './model';
import { activeDialogue, chapterFor, meets, resolve, roomFor, startCampaign, validateCampaign, visibleHotspots } from './engine';
import { SaveStore, encodeSave, parseSaveFile } from './saves';
import type { SaveEnvelope, SaveSlot } from './saves';
import { createPortrait, createSpaceTexture } from './art';
import { GameScene } from './scene';
import { ShipAudio } from './audio';
import { actionCursor, escape, icon } from './icons';
import { cycleCursor, isTool, releaseItem, tools } from './controls';
import type { CursorSelection, Tool } from './controls';

const preferencesSchema = z.object({
  sound: z.boolean(), volume: z.number().min(0).max(1),
  reducedMotion: z.boolean(), highlights: z.boolean(), largeText: z.boolean(),
});
type Preferences = z.infer<typeof preferencesSchema>;
const testingMode = new URLSearchParams(location.search).get('testing') === '1';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('The application mount is missing.');
const adventure = (() => {
  try { return adventureFor(new URLSearchParams(location.search).get('adventure')); }
  catch (error) {
    app.innerHTML = `<main role="alert"><h1>Adventure unavailable</h1><p>${escape(error instanceof Error ? error.message : 'The adventure could not be selected.')}</p><a href="./">Open the episode adventure</a> · <a href="./?adventure=original">Open the original adventure</a></main>`;
    throw error;
  }
})();
const campaign = adventure.campaign;
const isEpisode = adventure.storage === 'episode';
const adventureLabel = isEpisode ? 'THE BEST OF BOTH WORLDS' : 'THE BURDEN OF COMMAND';
const switchLabel = isEpisode ? 'Original adventure / old saves' : 'Play the episode adventure';
document.title = campaign.title;
const contentErrors = validateCampaign(campaign);
if (contentErrors.length) throw new Error(`Campaign validation failed:\n${contentErrors.join('\n')}`);

app.innerHTML = `
  ${testingMode ? '<aside class="testing-banner"><strong>TEST MODE / SEPARATE SAVES</strong><div><button data-command="chapters">Chapter select</button><button data-command="normal-play">Return to normal play</button></div></aside>' : ''}
  <div class="app-grain" aria-hidden="true"></div>
  <section id="title-screen" class="title-screen">
    <div id="title-art" class="title-art" aria-hidden="true"></div>
    <div class="title-shade"></div>
    <header class="title-header"><span class="brand">${icon('delta')} STAR QUEST</span><span class="edition">A POINT-AND-CLICK ADVENTURE</span></header>
    <div class="title-copy">
      <div class="eyebrow"><span class="signal-dot"></span> THE NEXT GENERATION OF ADVENTURE</div>
      <h1>${isEpisode ? 'The best of<br><em>both worlds.</em>' : 'The burden<br>of <em>command.</em>'}</h1>
      <div class="title-rule"></div>
      <p class="title-premise">${isEpisode ? 'An empty colony. An impossible enemy.<br>A captain the crew refuses to abandon.<br><strong>Bring him home.</strong>' : 'The captain is gone.<br>The Borg know every move.<br><strong>The next one is yours.</strong>'}</p>
      <div class="title-buttons">
        <button class="button primary" data-command="begin">Take command ${icon('arrow')}</button>
        <button id="continue-button" class="button secondary" data-command="continue" disabled>Checking mission records...</button>
      </div>
      <div class="title-links"><button data-command="intro">${isEpisode ? 'Watch Picard abduction' : 'Watch intro'}</button>${isEpisode ? '<span>/</span><button data-command="separation">Watch separation</button><span>/</span><button data-command="cutscenes">Cutscenes</button>' : ''}<span>/</span><button data-command="how">How to play</button><span>/</span><button data-command="settings">Settings</button><span>/</span><button data-command="credits">About this adventure</button><span>/</span><button data-command="chapters">Chapter select (testing)</button><span>/</span><button data-command="switch-adventure">${switchLabel}</button></div>
    </div>
    <div class="ship-label"><span>U.S.S. ENTERPRISE</span><strong>NCC-1701-D</strong><i></i><small>GALAXY CLASS / FEDERATION STARSHIP</small></div>
    <footer class="title-footer"><span>${isEpisode ? 'THE EPISODE ARC · ORIGINAL DIALOGUE & PUZZLES' : 'ORIGINAL FAN ADVENTURE · SIX CHAPTERS · YOUR TIMELINE'}</span><span>STARDATE ${campaign.chapters[0].stardate} <i class="signal-dot"></i></span></footer>
  </section>
  <section id="game-shell" class="game-shell" hidden>
    <header class="game-header">
      <button class="brand brand-button" data-command="menu" aria-label="Open mission menu">${icon('delta')}<span>STAR QUEST<small>${adventureLabel}</small></span></button>
      <div class="assignment"><span class="signal-dot"></span><span><span id="assignment-label">FIRST OFFICER</span><strong>WILLIAM T. RIKER</strong></span></div>
      <div class="header-actions"><button class="icon-button" data-command="sound" aria-label="Toggle sound"></button><button class="icon-button" data-command="saves" aria-label="Save and load">${icon('save')}</button><button class="icon-button" data-command="settings" aria-label="Settings">${icon('settings')}</button></div>
    </header>
    <div class="mission-strip"><div><span class="eyebrow" id="chapter-number"></span><h1 id="chapter-title"></h1></div><div class="stardate"><span>MISSION CHRONOMETER</span><strong id="stardate"></strong></div></div>
    <div class="game-layout">
      <main class="adventure-monitor">
        <div class="monitor-top"><div class="monitor-elbow"></div><span id="room-deck"></span><span class="monitor-line"></span><span id="condition"></span></div>
        <div class="room-heading"><div><span class="eyebrow">CURRENT LOCATION</span><h2 id="room-name"></h2></div><button class="turbolift-button" data-command="map">${icon('map')} <span id="travel-label">Turbolift</span> <kbd>M</kbd></button></div>
        <div id="classic-controls" class="classic-controls">
          <button id="toolbar-toggle" class="toolbar-toggle" data-command="toolbar" aria-label="Action icons" aria-controls="action-toolbar" aria-expanded="false">${icon('use')} <span>ICON BAR <kbd>F2</kbd></span><small>RIGHT-CLICK TO CYCLE</small></button>
          <div id="action-toolbar" class="verb-bar" role="toolbar" aria-label="Interaction tools">
            ${tools.map((tool, i) => `<button data-command="tool" data-tool="${tool}" class="verb-button" aria-label="${tool[0].toUpperCase() + tool.slice(1)}" title="${tool[0].toUpperCase() + tool.slice(1)} (${i + 1})">${icon(tool)}<span>${tool[0].toUpperCase() + tool.slice(1)}</span><kbd>${i + 1}</kbd></button>`).join('')}
            <button class="verb-button" data-command="inventory" aria-label="Open inventory" title="Inventory (I)">${icon('inventory')}<span>Inventory</span><kbd>I</kbd></button>
            <button id="carried-item" class="verb-button carried-item" data-command="carried-item" disabled aria-label="No carried item" title="Select an item from inventory">${icon('inventory')}<span>Empty</span></button>
            <button class="verb-button" data-command="menu" aria-label="Control panel" title="Mission menu (Esc)">${icon('settings')}<span>Game</span><kbd>Esc</kbd></button>
          </div>
        </div>
        <div id="scene-frame" class="scene-frame" role="group" tabindex="-1" aria-label="Adventure scene">
          <div id="scene-mount" class="scene-mount" aria-hidden="true"></div>
          <div id="hotspots" class="hotspots" role="group" aria-label="People and objects in this room"></div>
          <div class="scene-vignette" aria-hidden="true"></div>
          <div id="location-tag" class="location-tag" aria-hidden="true"></div>
        </div>
        <div class="interaction-line"><span id="selected-action" role="status" aria-live="polite"></span><span id="hover-label">Choose a person or object to examine.</span><button class="hotspot-toggle" data-command="highlight" title="Highlight hotspots (H)" aria-label="Highlight hotspots">${icon('look')}</button></div>
        <div class="inventory-dock"><span class="dock-label">EQUIPMENT</span><div id="inventory-items"></div><button class="inventory-more" data-command="inventory" aria-label="Inspect inventory">${icon('inventory')}</button></div>
        <p id="room-description" class="room-description"></p>
        <details class="scene-index"><summary>Room contents <span>keyboard & touch alternative</span></summary><div id="scene-index-items"></div></details>
      </main>
      <aside class="mission-sidebar">
        <section class="orders-panel"><div class="panel-label"><span>CAPTAIN'S ORDERS</span><span id="objective-count"></span></div><div id="objectives"></div><button class="text-button" data-command="hint">${icon('light')} Request a hint</button></section>
        <section class="log-panel"><div class="panel-label"><span>MISSION RECORD</span><span class="signal-dot"></span></div><div id="recent-log"></div><button class="text-button" data-command="journal">Open the PADD ${icon('arrow')}</button></section>
        <section class="ship-panel"><div class="ship-outline" aria-hidden="true">${icon('delta')}</div><div><span>U.S.S. ENTERPRISE</span><strong>NCC-1701-D</strong><small id="ship-ambient"></small></div></section>
        <div class="sidebar-actions"><button data-command="journal">${icon('journal')} Journal <kbd>J</kbd></button><button data-command="how">${icon('light')} Controls</button></div>
      </aside>
    </div>
    <footer class="game-footer"><span id="save-status"><span class="signal-dot"></span> LOCAL MISSION RECORD READY</span><span>NO CLOCK ON CURIOSITY. TAKE YOUR TIME.</span><button data-command="menu">Mission menu <kbd>Esc</kbd></button></footer>
  </section>
  <section id="ending-screen" class="ending-screen" hidden></section>
  <dialog id="panel" class="panel-dialog" aria-labelledby="panel-title"><div id="panel-content"></div></dialog>
  <div id="notification" class="notification" role="status" aria-live="polite"></div>
  <input id="import-file" type="file" accept=".json,application/json" hidden>
`;

function element<T extends HTMLElement>(selector: string, constructor: { new(...args: never[]): T }): T {
  const found = document.querySelector(selector);
  if (!(found instanceof constructor)) throw new Error(`Missing interface element ${selector}.`);
  return found;
}

const titleScreen = element('#title-screen', HTMLElement);
const shell = element('#game-shell', HTMLElement);
const endingScreen = element('#ending-screen', HTMLElement);
const panel = element('#panel', HTMLDialogElement);
const panelContent = element('#panel-content', HTMLDivElement);
const notification = element('#notification', HTMLDivElement);
const continueButton = element('#continue-button', HTMLButtonElement);
const importFile = element('#import-file', HTMLInputElement);
const sceneFrame = element('#scene-frame', HTMLDivElement);
const toolbarRegion = element('#classic-controls', HTMLDivElement);
const toolbar = element('#action-toolbar', HTMLDivElement);
const toolbarToggle = element('#toolbar-toggle', HTMLButtonElement);
const mouseToolbar = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 761px)');
const audio = new ShipAudio();
const saves = new SaveStore(testingMode ? 'testing' : 'mission', adventure.storage);
let preferences: Preferences = {
  sound: true, volume: 0.28, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  highlights: false, largeText: false,
};
let state: GameState | null = null;
let resumeSave: SaveEnvelope | null = null;
let scene: GameScene | null = null;
let cursor: CursorSelection = { mode: 'look', item: null };
let busy = false;
let saveError = '';
let notificationTimer = 0;
let afterClose: (() => void) | null = null;
let pendingConfirmation: (() => void) | null = null;
let panelGeneration = 0;
const hintsShown = new Map<string, number>();
const portraitCache = new Map<string, string>();
let journalTab: 'evidence' | 'log' | 'decisions' = 'evidence';

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected problem occurred.';
}

function notify(message: string): void {
  window.clearTimeout(notificationTimer);
  notification.textContent = message;
  notification.classList.add('visible');
  notificationTimer = window.setTimeout(() => notification.classList.remove('visible'), 4200);
}

function applyPreferences(): void {
  document.documentElement.classList.toggle('large-text', preferences.largeText);
  document.documentElement.classList.toggle('reduced-motion', preferences.reducedMotion);
  audio.configure(preferences.sound, preferences.volume);
  document.querySelectorAll<HTMLButtonElement>('[data-command="sound"]').forEach((button) => {
    button.innerHTML = icon(preferences.sound ? 'sound' : 'mute');
    button.setAttribute('aria-label', preferences.sound ? 'Mute sound' : 'Enable sound');
  });
  if (state && !state.ending) render();
}

function persistPreferences(): void {
  try {
    localStorage.setItem('star-quest-preferences', JSON.stringify(preferences));
  } catch (error) {
    notify(`Settings apply for this visit, but could not be saved. ${errorText(error)}`);
  }
  applyPreferences();
}

async function beginAudio(): Promise<void> {
  try { await audio.start(); }
  catch (error) { notify(`Audio is unavailable. You can still play. ${errorText(error)}`); }
}

function openPanel(eyebrow: string, title: string, body: string, className = ''): void {
  setToolbarOpen(false);
  panelGeneration++;
  afterClose = null;
  panel.className = `panel-dialog ${className}`;
  panelContent.innerHTML = `<header class="dialog-header"><div><span class="eyebrow">${escape(eyebrow)}</span><h2 id="panel-title">${escape(title)}</h2></div><button class="icon-button close-panel" data-command="close" aria-label="Close">${icon('close')}</button></header><div class="dialog-body">${body}</div>`;
  if (!panel.open) panel.showModal();
  panelContent.querySelector<HTMLElement>('.dialog-body')?.scrollTo(0, 0);
}

function closePanel(): void {
  panelGeneration++;
  const callback = afterClose;
  afterClose = null;
  pendingConfirmation = null;
  panel.close();
  if (callback) queueMicrotask(callback);
}
panel.addEventListener('cancel', (event) => {
  event.preventDefault();
  closePanel();
});
panel.addEventListener('click', (event) => {
  if (event.target !== panel) return;
  const bounds = panel.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closePanel();
});

function confirmOrder(title: string, text: string, callback: () => void): void {
  openPanel('COMMAND AUTHORIZATION', title, `<p class="lead">${escape(text)}</p><p class="muted">Confirm only when you are ready. A manual save preserves a specific point in your timeline.</p><div class="dialog-actions"><button class="button secondary" data-command="close">Reconsider</button><button class="button primary" data-command="confirm">Confirm order ${icon('arrow')}</button></div>`);
  pendingConfirmation = callback;
}

function portrait(id: string): string {
  const cached = portraitCache.get(id);
  if (cached) return cached;
  const speaker = campaign.speakers.find((entry) => entry.id === id);
  if (!speaker) return '';
  const result = createPortrait(speaker.appearance).toDataURL();
  portraitCache.set(id, result);
  return result;
}

function showDialogue(dialogue: Dialogue, callback?: () => void): void {
  const speaker = campaign.speakers.find((entry) => entry.id === dialogue.speaker);
  const role = state && speaker?.id === campaign.protagonist
    ? chapterFor(campaign, state).assignment ?? speaker.role
    : speaker?.role ?? 'MISSION COMPUTER';
  const face = portrait(dialogue.speaker);
  const choices = dialogue.choices.map((choice) => {
    const available = state !== null && meets(state, choice.requires);
    return `<button class="dialogue-choice ${available ? '' : 'unavailable'}" data-command="choice" data-interaction="${escape(dialogue.interaction ?? '')}" data-choice="${escape(choice.id)}" ${available ? '' : 'disabled'}><span class="choice-arrow">${available ? icon('arrow') : '&#183;'}</span><span><strong>${escape(choice.label)}</strong>${choice.description ? `<small>${escape(choice.description)}</small>` : ''}${!available ? `<small class="requirement">${escape(choice.unavailable ?? 'Further evidence or preparation is required.')}</small>` : ''}${choice.confirm && available ? '<small class="commitment-label">IRREVERSIBLE COMMITMENT</small>' : ''}</span></button>`;
  }).join('');
  openPanel(role, dialogue.title,
    `<div class="conversation"><div class="speaker-card">${face ? `<img src="${face}" alt="" width="96" height="112">` : `<div class="computer-portrait">${icon('delta')}</div>`}<strong>${escape(speaker?.name ?? 'Computer')}</strong><span>CHANNEL OPEN</span></div><div class="dialogue-text">${dialogue.lines.map((line) => `<p>${escape(line)}</p>`).join('')}</div></div>${choices ? `<div class="dialogue-choices" role="group" aria-label="Responses and orders">${choices}</div>` : ''}<div class="dialog-actions"><button class="button ${choices ? 'quiet' : 'primary'}" data-command="close">${choices ? 'Return to the ship' : 'Continue'} ${icon('arrow')}</button></div>`,
    'conversation-dialog');
  afterClose = callback ?? null;
}

function showChapterIntro(): void {
  if (!state) return;
  const chapter = chapterFor(campaign, state);
  openPanel(`CHAPTER ${String(chapter.id).padStart(2, '0')} / 06`, chapter.title,
    `<div class="chapter-intro"><span class="chapter-watermark">${String(chapter.id).padStart(2, '0')}</span><p class="chapter-subtitle">${escape(chapter.subtitle)}</p>${chapter.intro.map((line) => `<p>${escape(line)}</p>`).join('')}<div class="log-signature">MISSION BRIEFING / ${escape(chapter.assignment ?? 'COMMANDER')} WILLIAM T. RIKER</div></div><div class="dialog-actions"><button class="button primary" data-command="close">Take the conn ${icon('arrow')}</button></div>`,
    'chapter-dialog');
  audio.cue('chapter');
}

async function saveCurrent(checkpoint = false): Promise<void> {
  if (!state) return;
  const chapter = chapterFor(campaign, state);
  try {
    await saves.write('auto', state, `${chapter.title} / ${roomFor(campaign, state).name}`);
    if (checkpoint) await saves.write('checkpoint', state, `Chapter ${state.chapter} checkpoint`);
    resumeSave = encodeSave(state, chapter.title);
    saveError = '';
  } catch (error) {
    const message = errorText(error);
    if (saveError !== message) notify(`Progress is not being saved locally. Use Export in the save menu. ${message}`);
    saveError = message;
  }
  updateSaveStatus();
}

function updateSaveStatus(): void {
  const status = element('#save-status', HTMLElement);
  status.classList.toggle('save-warning', Boolean(saveError));
  status.innerHTML = saveError
    ? `${icon('save')} NOT SAVED / EXPORT A BACKUP`
    : `<span class="signal-dot"></span> ${testingMode ? 'TEST PROGRESS SAVED / NORMAL SAVES UNTOUCHED' : 'PROGRESS SAVED ON THIS DEVICE'}`;
}

function activateGame(): void {
  titleScreen.hidden = true;
  endingScreen.hidden = true;
  shell.hidden = false;
  if (!scene) {
    scene = new GameScene(element('#scene-mount', HTMLElement), (x, y) => {
      if (!sceneInputAvailable() || !state) return;
      sceneFrame.focus({ preventScroll: true });
      if (cursor.mode === 'walk') void scene?.walk(x, y);
      else if (cursor.mode === 'look') {
        const room = roomFor(campaign, state);
        openPanel('OBSERVATION', room.name, `<p>${escape(room.description)}</p>`);
      } else notify('Choose a person or object for that action. Select Walk to move around.');
    });
  }
  scene.resize();
}

async function showFilm(film: Cinematic, onFinish?: () => void): Promise<void> {
  try {
    await playCinematic(film, { reducedMotion: preferences.reducedMotion, cue: (kind) => audio.cue(kind) });
  } catch (error) {
    await new Promise<void>((acknowledge) => {
      openPanel('COMPUTER NOTICE', film.noun === 'intro' ? 'The opening could not play' : 'The sequence could not play',
        `<p>${escape(errorText(error))}</p><p>Your mission is still available.</p><div class="dialog-actions"><button class="button primary" data-command="close">${onFinish ? 'Continue to briefing' : 'Close notice'}</button></div>`);
      afterClose = acknowledge;
    });
  }
  onFinish?.();
}

async function showFilms(films: readonly Cinematic[], onFinish?: () => void): Promise<void> {
  busy = true;
  try {
    if (!films.length) onFinish?.();
    for (const [index, film] of films.entries()) {
      await showFilm(film, index === films.length - 1 ? onFinish : undefined);
    }
  } finally { busy = false; }
}

async function newCampaign(): Promise<void> {
  if (busy) return;
  busy = true;
  try {
  state = startCampaign(campaign);
  cursor = { mode: 'look', item: null };
  hintsShown.clear();
  if (panel.open) closePanel();
  await beginAudio();
  activateGame();
  render();
  await saveCurrent(true);
  if (adventure.startFilm) await showFilm(adventure.startFilm, showChapterIntro);
  else showChapterIntro();
  } finally { busy = false; }
}

function resume(stateToLoad: GameState): void {
  window.clearTimeout(notificationTimer);
  notification.classList.remove('visible');
  state = structuredClone(stateToLoad);
  cursor = releaseItem(cursor);
  if (panel.open) closePanel();
  void beginAudio();
  if (state.ending) showEnding();
  else {
    activateGame();
    render();
    const pending = activeDialogue(campaign, state);
    if (pending) showDialogue(pending);
  }
}

function render(): void {
  if (!state) return;
  const current = state;
  if (cursor.item && !current.inventory.includes(cursor.item)) cursor = releaseItem(cursor);
  const chapter = chapterFor(campaign, current);
  const room = roomFor(campaign, current);
  const targets = visibleHotspots(campaign, current);
  element('#assignment-label', HTMLElement).textContent = chapter.assignment ?? 'ACTING CAPTAIN';
  element('#chapter-number', HTMLElement).textContent = `CHAPTER ${String(chapter.id).padStart(2, '0')} / 06`;
  element('#chapter-title', HTMLElement).textContent = chapter.title;
  element('#stardate', HTMLElement).textContent = chapter.stardate;
  element('#room-name', HTMLElement).textContent = room.name;
  element('#travel-label', HTMLElement).textContent = room.visual === 'colony' ? 'Transport' : 'Turbolift';
  element('#room-deck', HTMLElement).textContent = room.deck.toUpperCase();
  element('#condition', HTMLElement).textContent = room.atmosphere === 'normal' ? 'SYSTEMS NOMINAL' : room.atmosphere === 'damaged' ? 'DAMAGE CONTROL' : 'RED ALERT';
  element('#condition', HTMLElement).className = room.atmosphere;
  element('#room-description', HTMLElement).textContent = room.description;
  element('#location-tag', HTMLElement).textContent = room.name.toUpperCase();
  element('#ship-ambient', HTMLElement).textContent = room.ambient;
  const completed = chapter.objectives.filter((objective) => meets(current, objective.done)).length;
  element('#objective-count', HTMLElement).textContent = `${completed}/${chapter.objectives.length}`;
  element('#objectives', HTMLElement).innerHTML = chapter.objectives.map((objective) => {
    const done = meets(current, objective.done);
    return `<div class="objective ${done ? 'complete' : ''}"><span class="objective-mark" aria-hidden="true">${done ? icon('check') : ''}</span><span><span class="sr-only">${done ? 'Completed: ' : 'Outstanding: '}</span>${escape(objective.text)}</span></div>`;
  }).join('');
  const recentEvidence = current.evidence.slice(-2).reverse().map((id) => campaign.evidence.find((entry) => entry.id === id)).filter((entry) => entry !== undefined);
  element('#recent-log', HTMLElement).innerHTML = recentEvidence.length
    ? recentEvidence.map((entry) => `<div class="log-entry"><span>${escape(entry.category.toUpperCase())}</span><strong>${escape(entry.title)}</strong><p>${escape(entry.text)}</p></div>`).join('')
    : '<div class="log-empty"><span class="log-cross">+</span><p>Your observations belong here.<br>Look closely. Listen carefully.</p></div>';
  const targetLayer = element('#hotspots', HTMLElement);
  targetLayer.classList.toggle('highlight', preferences.highlights);
  targetLayer.innerHTML = targets.map((target) =>
    `<button class="hotspot ${target.kind}" data-command="target" data-target="${escape(target.id)}" style="left:${target.x / 4.8}%;top:${target.y / 3}%;width:${target.width / 4.8}%;height:${target.height / 3}%" title="${escape(target.label)}"><span class="hotspot-corner"></span><span class="hotspot-label">${escape(target.label)}</span></button>`).join('');
  element('#scene-index-items', HTMLElement).innerHTML = targets.map((target) => `<button data-command="target" data-target="${escape(target.id)}">${icon(target.kind === 'person' ? 'talk' : 'scan')}${escape(target.label)}</button>`).join('');
  element('#inventory-items', HTMLElement).innerHTML = current.inventory.map((id) => {
    const item = campaign.items.find((entry) => entry.id === id);
    return item ? `<button class="inventory-item" data-command="equip" data-item="${escape(id)}" aria-label="Use ${escape(item.name)}" title="${escape(item.description)}">${icon(item.icon)}<span>${escape(item.name)}</span></button>` : '';
  }).join('');
  renderControls();
  document.querySelector<HTMLButtonElement>('[data-command="highlight"]')?.setAttribute('aria-pressed', String(preferences.highlights));
  const player = campaign.speakers.find((speaker) => speaker.id === campaign.protagonist);
  if (!player) throw new Error('The campaign protagonist is not defined.');
  scene?.present({ room, player, speakers: campaign.speakers, hotspots: targets, reducedMotion: preferences.reducedMotion, highlight: preferences.highlights });
  updateSaveStatus();
}

async function dispatch(action: Action): Promise<void> {
  if (!state || busy) return;
  busy = true;
  shell.setAttribute('aria-busy', 'true');
  try {
    const previous = state;
    const transition = resolve(campaign, state, action);
    state = transition.state;
    const chapterChanged = state.chapter !== previous.chapter;
    const films = newlyEarnedFilms(adventure.eventFilms, previous.facts, state.facts).map(({ film }) => film);
    if (transition.changed) {
      await saveCurrent(chapterChanged);
      render();
    }
    if (action.type === 'travel') {
      audio.cue('travel');
      if (panel.open) closePanel();
    } else audio.cue(transition.discoveries.length ? 'discovery' : 'tap');
    if (transition.discoveries.length) {
      const id = transition.discoveries[0];
      const title = id.startsWith('evidence:')
        ? campaign.evidence.find((entry) => entry.id === id.slice(9))?.title
        : campaign.items.find((entry) => entry.id === id.slice(5))?.name;
      notify(`${id.startsWith('evidence:') ? 'Evidence recorded' : 'Equipment acquired'}${title ? `: ${title}` : ''}${transition.discoveries.length > 1 ? ` (+${transition.discoveries.length - 1})` : ''}`);
    }
    const continuation = state.ending ? showEnding : chapterChanged ? showChapterIntro : undefined;
    if (transition.dialogue) {
      showDialogue(transition.dialogue, films.length || continuation
        ? () => { void showFilms(films, continuation); } : undefined);
    } else if (films.length || continuation) await showFilms(films, continuation);
  } catch (error) {
    openPanel('COMPUTER NOTICE', 'Operation interrupted', `<p>${escape(errorText(error))}</p><p>Your last saved checkpoint remains available from the mission menu.</p>`);
  } finally {
    busy = false;
    shell.removeAttribute('aria-busy');
  }
}

async function interact(target: Hotspot): Promise<void> {
  if (!sceneInputAvailable()) return;
  const selection = cursor;
  if (selection.mode === 'walk' || selection.mode === 'use' || selection.mode === 'item') {
    busy = true;
    try { await scene?.walk(target.x + target.width / 2, target.y + target.height + 20); }
    finally { busy = false; }
  }
  if (selection.mode === 'walk') return;
  if (selection.mode === 'item') {
    await dispatch({ type: 'item', item: selection.item, target: target.id });
  } else {
    await dispatch({ type: 'interact', verb: selection.mode, target: target.id });
  }
}

function showMap(): void {
  if (!state) return;
  const current = state;
  const chapter = chapterFor(campaign, current);
  openPanel('TURBOLIFT CONTROL', 'Where to, Commander?',
    `<p class="muted">Available locations for the current operation. ${isEpisode && current.chapter === 1 ? 'The transporter carries the survey team between Jouret IV and Enterprise. ' : ''}Travel and investigation do not consume a hidden timer.</p><div class="deck-map">${chapter.rooms.map((room, index) => `<button class="destination ${current.room === room.id ? 'current' : ''}" data-command="travel" data-room="${escape(room.id)}"><span class="deck-number">${String(index + 1).padStart(2, '0')}</span><span><small>${escape(room.deck.toUpperCase())}</small><strong>${escape(room.name)}</strong><em>${current.room === room.id ? 'CURRENT LOCATION' : current.visited.includes(`${current.chapter}:${room.id}`) ? 'VISITED' : 'UNEXPLORED'}</em></span>${icon(current.room === room.id ? 'check' : 'arrow')}</button>`).join('')}</div>`, 'map-dialog');
}

function showInventory(): void {
  if (!state) return;
  openPanel('PERSONAL EQUIPMENT', 'Inventory',
    `<p class="muted">Select equipment to carry it on the cursor, then click its target. Right-click cycles through actions and back to your carried item. The PADD presents collected evidence.</p><div class="inventory-grid">${state.inventory.map((id) => campaign.items.find((item) => item.id === id)).filter((item) => item !== undefined).map((item) => `<article class="equipment-card"><div class="equipment-icon">${icon(item.icon)}</div><h3>${escape(item.name)}</h3><p>${escape(item.description)}</p><button class="button secondary" data-command="equip-panel" data-item="${escape(item.id)}">Use ${escape(item.name)}</button></article>`).join('')}</div>`);
}

function showJournal(): void {
  if (!state) return;
  const current = state;
  const tabs = `<nav class="panel-tabs" aria-label="Journal sections">${(['evidence', 'log', 'decisions'] as const).map((tab) => `<button class="${journalTab === tab ? 'active' : ''}" data-command="journal-tab" data-tab="${tab}">${tab === 'evidence' ? `Evidence (${current.evidence.length})` : tab === 'log' ? 'Conversation log' : 'Command decisions'}</button>`).join('')}</nav>`;
  let body = '';
  if (journalTab === 'evidence') {
    body = current.evidence.length ? [...current.evidence].reverse().map((id) => campaign.evidence.find((entry) => entry.id === id))
      .filter((entry) => entry !== undefined).map((entry, index) => `<article class="evidence-card"><span class="evidence-index">${String(current.evidence.length - index).padStart(2, '0')}</span><div><span class="eyebrow">${escape(entry.category)}</span><h3>${escape(entry.title)}</h3><p>${escape(entry.text)}</p></div></article>`).join('')
      : '<div class="empty-state">No evidence recorded yet. Examine your surroundings and consult the crew.</div>';
  } else if (journalTab === 'log') {
    body = current.log.length ? [...current.log].reverse().map((entry) => `<article class="transcript-entry"><strong>${escape(campaign.speakers.find((speaker) => speaker.id === entry.speaker)?.name ?? 'Computer')}</strong><p>${escape(entry.text)}</p></article>`).join('')
      : '<div class="empty-state">Your conversations will be recorded here.</div>';
  } else {
    body = Object.entries(current.commitments).length ? Object.entries(current.commitments).map(([key, value]) => `<article class="decision-card">${icon('delta')}<div><span class="eyebrow">${escape(key)}</span><h3>${escape(campaign.commitmentLabels[key]?.[value] ?? value)}</h3><p>Recorded in the captain's log. This commitment will carry forward.</p></div></article>`).join('')
      : '<div class="empty-state">No irreversible orders issued. Gather evidence before committing.</div>';
  }
  openPanel("CAPTAIN'S PADD", 'Mission records', tabs + `<div class="journal-content">${body}</div>`, 'journal-dialog');
}

function showHint(advance = false): void {
  if (!state) return;
  const chapter = chapterFor(campaign, state);
  const current = state;
  const objective = chapter.objectives.find((entry) => !meets(current, entry.done));
  if (!objective) {
    openPanel('ADVISORY', 'Ready for your next order', '<p>All current objectives are complete. Return to the command station and use it to conclude this operation.</p><div class="dialog-actions"><button class="button primary" data-command="close">Understood</button></div>');
    return;
  }
  const key = `${chapter.id}:${objective.id}`;
  const level = Math.min(3, (hintsShown.get(key) ?? 1) + (advance ? 1 : 0));
  hintsShown.set(key, level);
  openPanel('OPTIONAL ASSISTANCE', 'A nudge, not an order',
    `<p class="hint-objective">${escape(objective.text)}</p><div class="hint-list">${objective.hints.slice(0, level).map((hint, index) => `<div><span>${index + 1}</span><p>${escape(hint)}</p></div>`).join('')}</div><div class="dialog-actions"><button class="button secondary" data-command="close">Let me think</button>${level < 3 ? `<button class="button primary" data-command="more-hint">Reveal ${level === 1 ? 'a stronger hint' : 'the solution'} ${icon('arrow')}</button>` : ''}</div>`);
}

function showSettings(): void {
  openPanel('PERSONAL PREFERENCES', 'Make yourself comfortable',
    `<div class="setting"><div><strong>Sound & ship ambience</strong><p>Original synthesized tones. No speech or loud jump scares.</p></div><input aria-label="Sound and ship ambience" type="checkbox" data-setting="sound" ${preferences.sound ? 'checked' : ''}></div>
    <div class="setting"><div><strong>Volume</strong><p>Keep the bridge as quiet as you like.</p></div><input aria-label="Volume" type="range" min="0" max="100" value="${preferences.volume * 100}" data-setting="volume"></div>
    <div class="setting"><div><strong>Highlight interactive objects</strong><p>Show labels in the room. Toggle anytime with H.</p></div><input aria-label="Highlight interactive objects" type="checkbox" data-setting="highlights" ${preferences.highlights ? 'checked' : ''}></div>
    <div class="setting"><div><strong>Reduce motion</strong><p>Immediate walking and travel. Cinematics become manually advanced still scenes.</p></div><input aria-label="Reduce motion" type="checkbox" data-setting="reducedMotion" ${preferences.reducedMotion ? 'checked' : ''}></div>
    <div class="setting"><div><strong>Larger reading text</strong><p>Increase dialogue, evidence, and interface text.</p></div><input aria-label="Larger reading text" type="checkbox" data-setting="largeText" ${preferences.largeText ? 'checked' : ''}></div>
    <div class="dialog-actions"><button class="button primary" data-command="close">Back to the mission ${icon('arrow')}</button></div>`);
}

function showHow(): void {
  openPanel('FIELD GUIDE', 'Think like a Starfleet officer',
    `<div class="how-intro"><span class="big-icon">${icon('delta')}</span><p>This is an adventure about observation and judgment. Explore the ship, listen to your crew, and use what you learn to give informed orders.</p></div>
    <p>Move the pointer to the <strong>ICON BAR</strong> at the top of the scene to reveal the action icons. <strong>Right-click the scene</strong> to cycle Walk, Look, Talk, Use, Scan, and your carried item. Left-click performs the selected action; the small cross on the cursor marks its target.</p>
    <div class="control-guide"><div><kbd>F2</kbd><strong>Icon bar</strong><span>Open the icons. Arrow keys move between buttons; Enter selects one. Touch and narrow screens keep the icons visible.</span></div><div><kbd>1</kbd><strong>Walk</strong><span>Select Walk, then click the floor or a destination in the room.</span></div><div><kbd>2</kbd><strong>Look</strong><span>Examine a person or object without walking. Click empty scenery for a room description.</span></div><div><kbd>3</kbd><strong>Talk</strong><span>Hear expertise, ask questions, and give informed orders.</span></div><div><kbd>4</kbd><strong>Use</strong><span>Walk over and operate a console or handle an object.</span></div><div><kbd>5</kbd><strong>Scan</strong><span>Look for readings that eyes alone cannot reveal.</span></div><div><kbd>I</kbd><strong>Inventory</strong><span>Select equipment to carry it on the cursor, then click its target. The carried-item icon remembers it when you change actions.</span></div><div><kbd>M</kbd><strong>Turbolift</strong><span>Travel between the current chapter's locations.</span></div><div><kbd>J</kbd><strong>Journal</strong><span>Re-read evidence, conversations, and command decisions.</span></div><div><kbd>H</kbd><strong>Hotspots</strong><span>Reveal interactive labels. Keyboard Tab also finds them.</span></div></div>
    <p class="note">There is no hidden timer. Look, read, and think at your own pace. Major commitments ask for confirmation. Every chapter has a saved checkpoint, and hints reveal one step at a time.</p><div class="dialog-actions"><button class="button primary" data-command="close">Understood ${icon('arrow')}</button></div>`);
}

function showCredits(): void {
  openPanel('AN ORIGINAL FAN ADVENTURE', 'A love letter to another era',
    `<p class="lead">${isEpisode ? 'The familiar crisis. A new way to take the conn.' : 'A new story aboard a familiar ship.'}</p><p>Star Quest combines walkable pixel-art rooms and point-and-click investigation with a story about the responsibility of command. The dialogue, puzzles, procedural artwork, interface, and synthesized audio were created for this game.</p><p>${isEpisode ? 'This adventure follows the major events of The Best of Both Worlds: Jouret IV, Picard\'s abduction, the failed deflector attack, Wolf 359, the saucer-separation rescue diversion, and Data and Picard\'s regeneration solution. Your choices shape the method and aftermath, not an alternate battle outcome. It is an adaptation with original dialogue, not a transcription or scene-for-scene recreation.' : 'The opening takes its situation from The Next Generation\'s Borg crisis. Everything you do afterward belongs to this alternate timeline. It is not a recreation of the episode script.'}</p><p class="note">This is an unofficial, noncommercial fan project. Star Trek and its associated characters and settings belong to their respective rights holders. No affiliation or endorsement is implied. Original assets do not grant a license for public distribution.</p><div class="credits-grid"><div><span>ENGINE</span><strong>Phaser & TypeScript</strong></div><div><span>STORY</span><strong>Six chapters. Your decisions.</strong></div><div><span>ART & SOUND</span><strong>Original, generated locally</strong></div><div><span>YOUR DATA</span><strong>On this device. No accounts.</strong></div></div>`);
}

async function showSaves(): Promise<void> {
  const archive = testingMode ? 'TEST MISSION ARCHIVE' : 'MISSION ARCHIVE';
  openPanel(archive, 'Save & load', '<p class="muted">Reading local mission records...</p>');
  const generation = panelGeneration;
  const slots: SaveSlot[] = ['auto', 'checkpoint', 'manual-1', 'manual-2', 'manual-3'];
  type ArchiveEntry = { slot: SaveSlot; kind: 'available'; save: SaveEnvelope | null }
    | { slot: SaveSlot; kind: 'unavailable'; error: string };
  const entries = await Promise.all(slots.map(async (slot): Promise<ArchiveEntry> => {
    try { return { slot, kind: 'available', save: await saves.read(slot, campaign) }; }
    catch (error) { return { slot, kind: 'unavailable', error: errorText(error) }; }
  }));
  if (!panel.open || generation !== panelGeneration) return;
  const unavailable = entries.filter((entry) => entry.kind === 'unavailable').length;
  openPanel(archive, 'Save & load',
    `<p class="note">${isEpisode ? 'Episode adventure records. Old saves remain in Original adventure / old saves.' : 'Original adventure records. Episode progress is stored separately.'}${testingMode ? ' These are test records. Normal mission saves are not shown or changed here.' : ''}</p><p class="muted">Autosave follows your progress. Chapter checkpoints and three manual slots give you room to reconsider. Download a backup before clearing browser data.</p>${unavailable ? `<p class="note">${unavailable} record${unavailable === 1 ? ' is' : 's are'} unavailable. Other records remain accessible. Export a backup if storage is failing.</p>` : ''}<div class="save-slots">${entries.map((entry) => {
      const { slot } = entry;
      const save = entry.kind === 'available' ? entry.save : null;
      return `<article class="save-slot"><div><span class="eyebrow">${slot === 'auto' ? 'AUTOSAVE' : slot === 'checkpoint' ? 'CHAPTER CHECKPOINT' : slot.replace('-', ' ').toUpperCase()}</span><strong>${escape(entry.kind === 'unavailable' ? 'Record could not be read' : save?.label ?? 'Empty mission record')}</strong><small>${entry.kind === 'unavailable' ? escape(entry.error) : save ? escape(new Date(save.savedAt).toLocaleString()) : 'No record stored'}</small></div><div>${slot.startsWith('manual') && state ? `<button class="button secondary small" data-command="save-slot" data-slot="${slot}">Save here</button>` : ''}<button class="button secondary small" data-command="load-slot" data-slot="${slot}" ${save ? '' : 'disabled'}>Load</button></div></article>`;
    }).join('')}</div><div class="dialog-actions"><button class="button secondary" data-command="import">Import save</button><button class="button primary" data-command="export" ${state ? '' : 'disabled'}>Export current mission ${icon('save')}</button></div>`);
}

function showMenu(): void {
  openPanel('COMMAND OPTIONS', 'Mission menu',
    `<div class="menu-grid"><button data-command="close">${icon('arrow')}Return to the ship</button><button data-command="saves">${icon('save')}Save & load</button><button data-command="settings">${icon('settings')}Settings</button><button data-command="how">${icon('light')}How to play</button><button data-command="title">${icon('star')}Title screen</button><button data-command="credits">${icon('delta')}About this adventure</button><button data-command="intro">${icon('star')}${isEpisode ? 'Watch Picard abduction' : 'Watch intro'}</button>${isEpisode ? `<button data-command="separation">${icon('star')}Watch separation</button><button data-command="cutscenes">${icon('star')}Cutscenes</button>` : ''}<button data-command="chapters">${icon('map')}Chapter select (testing)</button><button data-command="switch-adventure">${icon('arrow')}${switchLabel}</button>${testingMode ? `<button data-command="normal-play">${icon('arrow')}Return to normal play</button>` : ''}</div>`);
}

function showFilmGallery(): void {
  openPanel('THE EPISODE / ANIMATED SEQUENCES', 'Cutscenes',
    `<p class="lead">Six moments from the mission.</p><p class="muted">Story spoilers ahead. Replaying a scene never changes your progress or saves.</p><div class="menu-grid film-grid">${adventure.eventFilms.map(({ fact, label, chapter, film }) =>
      `<button data-command="film" data-film="${escape(fact)}" aria-label="Watch ${escape(label.toLowerCase())}">${icon('star')}<span><strong>${escape(label)}</strong><small>CHAPTER ${chapter} / ${Math.round(film.duration / 1000)} SECONDS</small><em>${escape(film.title)}</em></span></button>`).join('')}</div>`);
}

function navigatePlayMode(testing: boolean): void {
  const url = new URL(location.href);
  if (testing) url.searchParams.set('testing', '1');
  else url.searchParams.delete('testing');
  location.assign(url);
}

function showChapterSelect(): void {
  const defaults = adventure.testing.defaults;
  const previous = state?.commitments ?? resumeSave?.state.commitments ?? {};
  const choices = Object.entries(adventure.testing.labels);
  openPanel('TEST MODE / SEPARATE SAVES', 'Chapter select',
    `<p class="lead">Start any chapter with its prerequisites already completed.</p>
    <p class="muted">Choose the history for skipped chapters. Decisions in your starting chapter are still yours to make. Earlier evidence, equipment, and conversations are included.</p>
    <form id="chapter-test-options" class="chapter-test-options">${choices.map(([key, label]) =>
      `<div><label for="test-${key}">${label}</label><select id="test-${key}" name="${key}">${Object.entries(campaign.commitmentLabels[key]).map(([value, text]) =>
        `<option value="${escape(value)}" ${value === (previous[key] ?? defaults[key]) ? 'selected' : ''}>${escape(value[0].toUpperCase() + value.slice(1))}: ${escape(text)}</option>`).join('')}</select></div>`).join('')}</form>
    <div class="deck-map" role="group" aria-label="Starting chapter">${campaign.chapters.map((chapter) =>
      `<button class="destination" data-command="test-chapter" data-chapter="${chapter.id}" aria-label="Start chapter ${chapter.id}: ${escape(chapter.title)}"><span class="deck-number">${String(chapter.id).padStart(2, '0')}</span><span><small>CHAPTER ${chapter.id}</small><strong>${escape(chapter.title)}</strong><em>${escape(chapter.subtitle)}</em></span>${icon('arrow')}</button>`).join('')}</div>
    <p class="note">Starting a chapter replaces the test autosave and checkpoint. Normal saves and manual test slots are untouched. ${isEpisode ? 'Chapter jumps skip earlier movies. Cutscenes in the mission menu replays all six sequences without changing your progress. New story events still play their movies normally.' : 'This is the original alternate-timeline adventure. Its Sacrifice strategy includes a separation procedure; the animated rescue diversion belongs to the episode adventure.'}</p>
    <div class="dialog-actions">${state || resumeSave ? '<button class="button secondary" data-command="continue">Resume test mission</button>' : ''}<button class="button secondary" data-command="normal-play">Return to normal play</button></div>`);
}

function showEnding(): void {
  if (!state?.ending) return;
  const ending = campaign.endings.find((entry) => entry.id === state?.ending);
  if (!ending) throw new Error('The mission has an unknown ending.');
  shell.hidden = true;
  titleScreen.hidden = true;
  endingScreen.hidden = false;
  const current = state;
  const paragraphs = ending.paragraphs.flatMap((paragraph) => typeof paragraph === 'string'
    ? [paragraph] : meets(current, paragraph.when) ? [paragraph.text] : []);
  const record = Object.entries(state.commitments).map(([key, value]) => `<div><span>${escape(key.toUpperCase())}</span><strong>${escape(campaign.commitmentLabels[key]?.[value] ?? value)}</strong></div>`).join('');
  endingScreen.innerHTML = `<div class="ending-stars" aria-hidden="true"></div><header class="ending-header"><span class="brand">${icon('delta')} STAR QUEST</span><span class="eyebrow">CAPTAIN'S FINAL LOG</span></header><main class="ending-copy"><div class="ending-emblem ${ending.tone}">${icon(ending.tone === 'sacrifice' ? 'star' : 'delta')}</div><div class="eyebrow">${isEpisode ? 'THE BEST OF BOTH WORLDS' : 'YOUR TIMELINE'} / MISSION COMPLETE</div><h1>${escape(ending.title)}</h1><p class="ending-subtitle">${escape(ending.subtitle)}</p><div class="ending-prose">${paragraphs.map((line) => `<p>${escape(line)}</p>`).join('')}</div><div class="timeline-record">${record}</div><div class="ending-stats"><span>${state.evidence.length} pieces of evidence</span><span>${state.visited.length} compartments visited</span><span>6 chapters completed</span></div><div class="dialog-actions"><button class="button secondary" data-command="saves">Revisit a checkpoint</button><button class="button primary" data-command="begin">${isEpisode ? 'Play the episode again' : 'Explore another timeline'} ${icon('arrow')}</button></div><p class="ending-thanks">Thank you for taking command.</p></main>`;
  audio.cue('chapter');
}

function selectTool(tool: string | undefined): void {
  if (!isTool(tool)) throw new Error('This action icon is not available.');
  cursor = { mode: tool, item: cursor.item };
  setToolbarOpen(false);
  renderControls();
}

function sceneInputAvailable(): boolean {
  return Boolean(state && !shell.hidden && !busy && !document.querySelector('dialog[open]'));
}

function setToolbarOpen(open: boolean): void {
  const hide = mouseToolbar.matches && !open;
  if (hide && toolbar.contains(document.activeElement)) toolbarToggle.focus({ preventScroll: true });
  toolbar.hidden = hide;
  toolbarToggle.hidden = !mouseToolbar.matches;
  toolbarToggle.setAttribute('aria-expanded', String(!hide));
  if (toolbarToggle.hidden && document.activeElement === toolbarToggle) {
    toolbar.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  }
}

function focusToolbar(): void {
  setToolbarOpen(true);
  const button = toolbar.querySelector<HTMLButtonElement>('[aria-pressed="true"]')
    ?? toolbar.querySelector<HTMLButtonElement>('button:not(:disabled)');
  button?.focus();
}

function renderControls(): void {
  const held = campaign.items.find((item) => item.id === cursor.item);
  const selected = cursor.mode === 'item' ? held : null;
  const label = selected ? `Use ${selected.name}` : cursor.mode[0].toUpperCase() + cursor.mode.slice(1);
  sceneFrame.style.setProperty('--action-cursor', actionCursor(selected?.icon ?? cursor.mode));
  sceneFrame.dataset.cursor = cursor.mode;
  element('#selected-action', HTMLElement).innerHTML = `${icon(selected?.icon ?? cursor.mode)} ${escape(label)}`;
  toolbar.querySelectorAll<HTMLButtonElement>('[data-command="tool"]').forEach((button) => {
    const active = button.dataset.tool === cursor.mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  const carried = element('#carried-item', HTMLButtonElement);
  carried.disabled = !held;
  carried.classList.toggle('active', cursor.mode === 'item');
  carried.setAttribute('aria-pressed', String(cursor.mode === 'item'));
  carried.setAttribute('aria-label', held ? `Use carried item: ${held.name}` : 'No carried item');
  carried.title = held ? `Use ${held.name}` : 'Select an item from inventory';
  carried.innerHTML = `${icon(held?.icon ?? 'inventory')}<span>${held ? 'Carried' : 'Empty'}</span>`;
  document.querySelectorAll<HTMLButtonElement>('#inventory-items button').forEach((button) => {
    const active = cursor.mode === 'item' && cursor.item === button.dataset.item;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll<HTMLButtonElement>('.hotspot').forEach((button) => {
    button.setAttribute('aria-label', `${selected ? `${label} on` : cursor.mode} ${button.title}`);
  });
}

function validSlot(value: string | undefined): SaveSlot | null {
  if (value === 'auto' || value === 'checkpoint' || value === 'manual-1' || value === 'manual-2' || value === 'manual-3') return value;
  return null;
}

async function handleCommand(button: HTMLButtonElement): Promise<void> {
  const command = button.dataset.command;
  if (command === 'close') { closePanel(); return; }
  if (command === 'confirm') {
    const callback = pendingConfirmation;
    pendingConfirmation = null;
    afterClose = null;
    closePanel();
    callback?.();
    return;
  }
  if (busy) return;
  switch (command) {
    case 'chapters':
      if (testingMode) showChapterSelect();
      else navigatePlayMode(true);
      break;
    case 'normal-play': navigatePlayMode(false); break;
    case 'switch-adventure': {
      const url = new URL(location.href);
      url.searchParams.set('adventure', isEpisode ? 'original' : 'episode');
      location.assign(url);
      break;
    }
    case 'test-chapter': {
      if (!testingMode) throw new Error('Chapter selection is only available in test mode.');
      const options = Object.fromEntries(
        new FormData(element('#chapter-test-options', HTMLFormElement)),
      );
      const prepared = adventure.testing.chapterStart(Number(button.dataset.chapter), options);
      busy = true;
      try {
        cursor = { mode: 'look', item: null };
        hintsShown.clear();
        resume(prepared);
        await saveCurrent(true);
        showChapterIntro();
      } finally { busy = false; }
      break;
    }
    case 'intro':
    case 'separation':
      busy = true;
      try {
        if (panel.open) closePanel();
        await beginAudio();
        await showFilm(command === 'intro' ? opening : separation);
      } finally { busy = false; }
      break;
    case 'cutscenes': showFilmGallery(); break;
    case 'film': {
      const entry = adventure.eventFilms.find(({ fact }) => fact === button.dataset.film);
      if (!entry) throw new Error('This cutscene is not available in the selected adventure.');
      busy = true;
      try {
        closePanel();
        await beginAudio();
        await showFilm(entry.film);
        showFilmGallery();
        panel.querySelector<HTMLButtonElement>(`[data-film="${CSS.escape(entry.fact)}"]`)?.focus();
      } finally { busy = false; }
      break;
    }
    case 'begin':
      if (state || resumeSave) confirmOrder('Begin a new timeline?', 'Your autosave and chapter checkpoint will be replaced. Existing manual saves will remain untouched.', () => { void newCampaign(); });
      else await newCampaign();
      break;
    case 'continue':
      if (state) resume(state);
      else if (resumeSave) resume(resumeSave.state);
      break;
    case 'title':
      closePanel(); shell.hidden = true; endingScreen.hidden = true; titleScreen.hidden = false;
      continueButton.disabled = !state && !resumeSave;
      continueButton.textContent = 'Continue your mission';
      break;
    case 'target': {
      if (!state) break;
      const target = visibleHotspots(campaign, state).find((entry) => entry.id === button.dataset.target);
      if (target) await interact(target);
      break;
    }
    case 'choice': {
      if (!state) break;
      const interaction = roomFor(campaign, state).hotspots.flatMap((target) => target.interactions).find((entry) => entry.id === button.dataset.interaction);
      const choice = interaction?.choices?.find((entry) => entry.id === button.dataset.choice);
      if (!interaction || !choice) break;
      const action: Action = { type: 'choose', interaction: interaction.id, choice: choice.id };
      if (choice.confirm) confirmOrder(choice.label, choice.confirm, () => { void dispatch(action); });
      else await dispatch(action);
      break;
    }
    case 'toolbar':
      if (sceneInputAvailable()) focusToolbar();
      break;
    case 'tool':
      if (sceneInputAvailable()) selectTool(button.dataset.tool);
      break;
    case 'carried-item':
      if (sceneInputAvailable() && cursor.item) {
        cursor = { mode: 'item', item: cursor.item };
        setToolbarOpen(false);
        renderControls();
      }
      break;
    case 'equip':
    case 'equip-panel': {
      if (command === 'equip' && !sceneInputAvailable()) break;
      const item = button.dataset.item;
      if (item && state?.inventory.includes(item)) {
        cursor = command === 'equip' && cursor.mode === 'item' && cursor.item === item
          ? { mode: 'use', item } : { mode: 'item', item };
        if (command === 'equip-panel') closePanel();
        setToolbarOpen(false);
        renderControls();
        if (cursor.mode === 'item') notify('Equipment on cursor. Choose its target; right-click to change actions.');
      }
      break;
    }
    case 'map': showMap(); break;
    case 'travel':
      if (button.dataset.room) await dispatch({ type: 'travel', room: button.dataset.room });
      break;
    case 'inventory': showInventory(); break;
    case 'journal': showJournal(); break;
    case 'journal-tab':
      if (button.dataset.tab === 'evidence' || button.dataset.tab === 'log' || button.dataset.tab === 'decisions') journalTab = button.dataset.tab;
      showJournal();
      break;
    case 'hint': showHint(); break;
    case 'more-hint': showHint(true); break;
    case 'settings': showSettings(); break;
    case 'how': showHow(); break;
    case 'credits': showCredits(); break;
    case 'menu': showMenu(); break;
    case 'highlight':
      preferences.highlights = !preferences.highlights; persistPreferences(); break;
    case 'sound':
      preferences.sound = !preferences.sound; persistPreferences(); await beginAudio(); break;
    case 'saves': await showSaves(); break;
    case 'save-slot': {
      const slot = validSlot(button.dataset.slot);
      if (!state || !slot) break;
      const generation = panelGeneration;
      await saves.write(slot, state, `${chapterFor(campaign, state).title} / ${roomFor(campaign, state).name}`);
      notify('Mission record saved.');
      if (panel.open && generation === panelGeneration) await showSaves();
      break;
    }
    case 'load-slot': {
      const slot = validSlot(button.dataset.slot);
      if (!slot) break;
      const generation = panelGeneration;
      const save = await saves.read(slot, campaign);
      if (!panel.open || generation !== panelGeneration) break;
      if (!save) { notify('This slot is empty.'); break; }
      confirmOrder('Restore this mission?', 'Your current autosave will be replaced by the selected record. Other manual records are unchanged.', () => {
        resume(save.state);
        void saveCurrent();
      });
      break;
    }
    case 'export': {
      if (!state) break;
      const data = JSON.stringify(encodeSave(state, chapterFor(campaign, state).title), null, 2);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `star-quest-${isEpisode ? 'episode-' : ''}${testingMode ? 'test-' : ''}chapter-${state.chapter}.json`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify('Your mission backup has been downloaded.');
      break;
    }
    case 'import': importFile.click(); break;
  }
}

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest<HTMLButtonElement>('button[data-command]');
  if (!button || button.disabled) return;
  void handleCommand(button).catch((error: unknown) => {
    openPanel('COMPUTER NOTICE', 'Unable to complete that request', `<p>${escape(errorText(error))}</p><p>Your current mission has not been discarded. You can export a backup from the save menu.</p>`);
  });
});

document.addEventListener('pointerover', (event) => {
  if (!(event.target instanceof Element)) return;
  const target = event.target.closest<HTMLButtonElement>('.hotspot');
  if (target) element('#hover-label', HTMLElement).textContent = target.title;
});
sceneFrame.addEventListener('contextmenu', (event) => {
  if (!sceneInputAvailable() || (event instanceof PointerEvent && event.pointerType === 'touch')) return;
  event.preventDefault();
  cursor = cycleCursor(cursor);
  setToolbarOpen(false);
  renderControls();
});
toolbarRegion.addEventListener('pointerenter', (event) => {
  if (event.pointerType === 'mouse' && mouseToolbar.matches && sceneInputAvailable()) setToolbarOpen(true);
});
toolbarRegion.addEventListener('pointerleave', () => {
  if (!toolbar.contains(document.activeElement)) setToolbarOpen(false);
});
toolbar.addEventListener('focusout', (event) => {
  if (!(event.relatedTarget instanceof Node && toolbar.contains(event.relatedTarget)) && !toolbarRegion.matches(':hover')) {
    setToolbarOpen(false);
  }
});
toolbar.addEventListener('keydown', (event) => {
  if (!sceneInputAvailable()) return;
  const buttons = [...toolbar.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
  const current = buttons.findIndex((button) => button === document.activeElement);
  let next: number;
  if (event.key === 'ArrowRight') next = (current + 1) % buttons.length;
  else if (event.key === 'ArrowLeft') next = (current - 1 + buttons.length) % buttons.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = buttons.length - 1;
  else return;
  event.preventDefault();
  buttons[next]?.focus();
});
mouseToolbar.addEventListener('change', () => setToolbarOpen(false));
setToolbarOpen(false);
document.addEventListener('focusin', (event) => {
  if (event.target instanceof HTMLButtonElement && event.target.classList.contains('hotspot')) {
    element('#hover-label', HTMLElement).textContent = event.target.title;
  }
});
document.addEventListener('change', (event) => {
  if (!(event.target instanceof HTMLInputElement)) return;
  const input = event.target;
  const setting = input.dataset.setting;
  if (!setting) return;
  if (setting === 'sound' || setting === 'reducedMotion' || setting === 'highlights' || setting === 'largeText') {
    preferences[setting] = input.checked;
  } else if (setting === 'volume') preferences.volume = Number(input.value) / 100;
  persistPreferences();
  if (setting === 'sound') void beginAudio();
});
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.target instanceof HTMLInputElement) return;
  if (busy || document.querySelector('.cinematic-dialog[open]')) return;
  if (event.key === 'Escape') {
    if (panel.open) return;
    if (state && !shell.hidden) { event.preventDefault(); showMenu(); }
    return;
  }
  if (!sceneInputAvailable()) return;
  const key = event.key.toLowerCase();
  const shortcuts: Record<string, Tool> = { '1': 'walk', '2': 'look', '3': 'talk', '4': 'use', '5': 'scan' };
  if (shortcuts[key]) { event.preventDefault(); selectTool(shortcuts[key]); }
  else if (key === 'f2') { event.preventDefault(); focusToolbar(); }
  else if (key === 'm') { event.preventDefault(); showMap(); }
  else if (key === 'j') { event.preventDefault(); showJournal(); }
  else if (key === 'i') { event.preventDefault(); showInventory(); }
  else if (key === 'h') { event.preventDefault(); preferences.highlights = !preferences.highlights; persistPreferences(); }
});
importFile.addEventListener('change', () => {
  const file = importFile.files?.[0];
  if (!file) return;
  void (async () => {
    try {
      if (file.size > 2_000_000) throw new Error('This file is too large to be a Star Quest save.');
      const imported = parseSaveFile(campaign, await file.text());
      confirmOrder('Open this mission record?', `Restore chapter ${imported.state.chapter}: ${imported.label}? Your current autosave will be replaced.`, () => {
        resume(imported.state);
        void saveCurrent();
        notify('Mission record imported.');
      });
    } catch (error) {
      openPanel('IMPORT REJECTED', 'This save could not be opened', `<p>${escape(errorText(error))}</p><p>Your current mission is unchanged. Choose a valid Star Quest JSON export.</p>`);
    } finally { importFile.value = ''; }
  })();
});
document.addEventListener('visibilitychange', () => {
  void audio.visibility(document.hidden).catch((error: unknown) => notify(`Audio could not resume. ${errorText(error)}`));
});
window.addEventListener('resize', () => scene?.resize());

async function initialize(): Promise<void> {
  try {
    const stored = localStorage.getItem('star-quest-preferences');
    if (stored) {
      const raw: unknown = JSON.parse(stored);
      preferences = preferencesSchema.parse(raw);
    }
  } catch (error) {
    notify(`Saved settings could not be read; using standard settings. ${errorText(error)}`);
  }
  applyPreferences();
  element('#title-art', HTMLElement).append(createSpaceTexture());
  try {
    resumeSave = await saves.read('auto', campaign);
    continueButton.disabled = !resumeSave;
    continueButton.textContent = resumeSave ? 'Continue your mission' : 'No mission in progress';
  } catch (error) {
    saveError = errorText(error);
    continueButton.disabled = true;
    continueButton.textContent = 'Local saves unavailable';
    notify('Local saves are unavailable. You can still play and export a backup.');
  }
  if (testingMode) showChapterSelect();
}
void initialize();
