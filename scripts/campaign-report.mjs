import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';

const server = await createServer({
  server: { middlewareMode: true }, appType: 'custom', logLevel: 'error',
});

try {
  const { campaign } = await server.ssrLoadModule('/src/episode/index.ts');
  const { walkthrough } = await server.ssrLoadModule('/src/episode/walkthrough.ts');
  const { episodeRoutes } = await server.ssrLoadModule('/src/episode/options.ts');
  const { validateCampaign, resolve, startCampaign } = await server.ssrLoadModule('/src/engine.ts');
  const rooms = campaign.chapters.flatMap((chapter) => chapter.rooms);
  const hotspots = rooms.flatMap((room) => room.hotspots);
  const interactions = hotspots.flatMap((target) => target.interactions);
  const prose = [
    ...campaign.chapters.flatMap((chapter) => [...chapter.intro, ...chapter.objectives.flatMap((objective) => [objective.text, ...objective.hints])]),
    ...campaign.speakers.map((speaker) => speaker.description),
    ...rooms.flatMap((room) => [room.description, room.ambient]),
    ...interactions.filter((entry) => !entry.id.endsWith('-tricorder'))
      .flatMap((entry) => [...entry.lines, ...(entry.choices ?? []).flatMap((choice) => [choice.label, choice.description ?? '', choice.confirm ?? '', ...choice.response])]),
    ...campaign.evidence.map((entry) => entry.text),
    ...campaign.items.map((entry) => entry.description),
    ...campaign.endings.flatMap((entry) => entry.paragraphs.map((paragraph) => typeof paragraph === 'string' ? paragraph : paragraph.text)),
  ];
  const lengths = [];
  for (const history of episodeRoutes) {
    const steps = walkthrough(history);
    let state = startCampaign(campaign);
    for (const [index, action] of steps.entries()) {
      const result = resolve(campaign, state, action);
      if (!result.changed) throw new Error(`Route ${JSON.stringify(history)} failed at step ${index + 1}: ${JSON.stringify(action)}`);
      state = result.state;
    }
    if (state.ending !== 'home-again') throw new Error(`Route ${JSON.stringify(history)} did not complete the episode.`);
    lengths.push(steps.length);
  }
  const report = {
    campaign: campaign.id,
    chapters: campaign.chapters.length,
    locations: rooms.length,
    roomArtDesigns: new Set(rooms.map((room) => room.visual)).size,
    roomArtAndAtmosphereCombinations: new Set(rooms.map((room) => `${room.visual}:${room.atmosphere}`)).size,
    objectives: campaign.chapters.reduce((sum, chapter) => sum + chapter.objectives.length, 0),
    hotspots: hotspots.length,
    illustratedProps: hotspots.filter((target) => target.kind === 'console' || target.kind === 'object').length,
    builtInRoomFixtures: hotspots.filter((target) => target.prop === null).length,
    propArtDesigns: new Set(hotspots.flatMap((target) => target.prop ? [target.prop] : [])).size,
    authoredInteractions: interactions.filter((entry) => !entry.id.endsWith('-tricorder')).length,
    evidenceEntries: campaign.evidence.length,
    equipment: campaign.items.length,
    speakers: campaign.speakers.length,
    endings: campaign.endings.length,
    authoredWordsIncludingOptionalTextAndHints: prose.join(' ').trim().split(/\s+/u).length,
    testedMainRouteCombinations: lengths.length,
    routeActions: { minimum: Math.min(...lengths), maximum: Math.max(...lengths) },
    contentErrors: validateCampaign(campaign),
    humanPlaytime: 'Not measured. Automated action replays do not measure first-time player duration.',
  };
  const output = JSON.stringify(report, null, 2);
  console.log(output);
  const outputPath = process.argv[2];
  if (outputPath) await writeFile(outputPath, `${output}\n`);
  if (report.contentErrors.length) process.exitCode = 1;
} finally {
  await server.close();
}
