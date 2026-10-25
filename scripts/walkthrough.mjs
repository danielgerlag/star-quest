import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';

const server = await createServer({
  server: { middlewareMode: true }, appType: 'custom', logLevel: 'error',
});

try {
  const { campaign } = await server.ssrLoadModule('/src/episode/index.ts');
  const { walkthrough } = await server.ssrLoadModule('/src/episode/walkthrough.ts');
  const { episodeAdventure, newlyEarnedFilms } = await server.ssrLoadModule('/src/adventures.ts');
  const { chapterFor, roomFor, resolve, startCampaign } = await server.ssrLoadModule('/src/engine.ts');
  const lines = [
    'STAR QUEST: THE BEST OF BOTH WORLDS',
    'Complete spoiler walkthrough',
    '',
    'This route chooses Delegate, Close, and Paced. All eight combinations reach the episode ending.',
    'Keep a conversation open when the next step is Choose. Otherwise close its reading panel.',
    'Confirm irreversible orders when prompted.',
    'Close each completed event conversation to play its movie. Pause, skip, or use reduced-motion stills.',
    'Cutscenes on the title screen and mission menu replays all six movies without changing saves.',
    'Scan and using the inventory Tricorder are interchangeable. Optional Look and Talk actions add context.',
    'Alternate method choices have their own three-level hints in Captain\'s orders.',
    'The original alternate-timeline guide is in docs/original-walkthrough.txt.',
    '',
  ];
  let state = startCampaign(campaign);
  let currentChapter = 0;
  let step = 0;
  for (const action of walkthrough()) {
    const chapter = chapterFor(campaign, state);
    if (chapter.id !== currentChapter) {
      currentChapter = chapter.id;
      step = 0;
      lines.push('', `CHAPTER ${chapter.id}: ${chapter.title}`, chapter.subtitle, '');
    }
    const room = roomFor(campaign, state);
    let instruction;
    if (action.type === 'travel') {
      const destination = chapter.rooms.find((entry) => entry.id === action.room);
      if (!destination) throw new Error(`Unknown destination ${action.room}`);
      instruction = `${room.visual === 'colony' ? 'Transport' : 'Turbolift'} > ${destination.name}.`;
    } else if (action.type === 'choose') {
      const interaction = room.hotspots.flatMap((target) => target.interactions).find((entry) => entry.id === action.interaction);
      const choice = interaction?.choices?.find((entry) => entry.id === action.choice);
      if (!choice) throw new Error(`Unknown choice ${action.choice}`);
      instruction = `Choose "${choice.label}".`;
    } else {
      const target = room.hotspots.find((entry) => entry.id === action.target);
      if (!target) throw new Error(`Unknown target ${action.target}`);
      if (action.type === 'item') {
        const item = campaign.items.find((entry) => entry.id === action.item);
        if (!item) throw new Error(`Unknown item ${action.item}`);
        instruction = `Use ${item.name} on ${target.label}.`;
      } else instruction = `${action.verb[0].toUpperCase()}${action.verb.slice(1)} ${target.label}.`;
    }
    lines.push(`${++step}. ${instruction}`);
    const result = resolve(campaign, state, action);
    if (!result.changed) throw new Error(`Rejected chapter ${chapter.id}, step ${step}: ${instruction}`);
    const films = newlyEarnedFilms(episodeAdventure.eventFilms, state.facts, result.state.facts);
    state = result.state;
    for (const { label, film } of films) {
      lines.push('', `${label}: "${film.title}" plays after you close the conversation. ${Math.round(film.duration / 1000)} seconds; skippable.`);
    }
  }
  if (state.ending !== 'home-again') throw new Error('The guide does not reach the episode ending.');
  lines.push('', 'Earth is safe. Saucer and stardrive rejoin. Picard recovers aboard the Enterprise.', '');
  const output = lines.join('\n');
  if (process.argv[2]) await writeFile(process.argv[2], output);
  else console.log(output);
} finally {
  await server.close();
}
