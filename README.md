# Star Quest: The Best of Both Worlds

A browser point-and-click fan adventure with original dialogue, puzzles, artwork, and audio. Play Riker through the major events of The Best of Both Worlds.

## Play locally

Use Node.js 24.

```sh
npm ci
npm run dev -- --port 4173
```

Open **http://127.0.0.1:4173**. Choose **Take command**.

The default adventure begins at Jouret IV, while Picard still commands the Enterprise. Its six chapters follow the Borg encounter, Picard's abduction, Locutus, the failed deflector attack, Wolf 359, the rescue diversion, and the regeneration solution.

Your choices change how Riker works with Shelby, how Data and Worf approach the cube, and how Data's neural link is managed. All eight combinations preserve the episode's outcome. Earth is saved, Picard returns, and the Enterprise survives.

The game needs no account or external service. All artwork and sound are produced locally. Save data stays in your browser.

The original alternate-timeline adventure and its three endings remain available under **Original adventure / old saves**, or at **http://127.0.0.1:4173/?adventure=original**. Its saves have not been migrated or replaced.

## Watch the sequences

Six animated sequences follow their story events:

| Sequence | When it plays |
| --- | --- |
| Picard abduction | After chapter 2 |
| Deflector attack | After the firing order in chapter 3. The cube survives. |
| Saucer separation | After chapter 4, before the shuttle operation |
| Shuttle rescue | After you order Data, Worf, and Locutus retrieved in chapter 5 |
| Cube destruction | After the regeneration feedback and neural disconnect in chapter 6 |
| Enterprise rejoining | After the docking order in chapter 6. Recovery and the final log follow. |

Close the event's conversation to start its movie. Choose **Cutscenes** on the title screen or mission menu to replay any sequence without changing progress or saves. The gallery contains story spoilers.

The **Watch Picard abduction** and **Watch separation** shortcuts remain available.

Use **Pause intro** or **Pause sequence** to pause. Use **Skip intro**, **Skip sequence**, or `Esc` to leave. With reduced motion enabled, use **Next scene** to advance through six captioned stills.

Story actions save before playback. Reloading a saved mission does not replay its movies or briefings. Storage failures remain visible and do not block play.

## Take your first steps

1. Select **Look**, then select a person or object in the scene.
2. Select **Talk** to consult an officer. Select **Use** to operate a station.
3. Select an inventory item, then select its target. The PADD presents evidence collected in the journal.
4. Open **Turbolift** to visit another compartment. At Jouret IV, use **Transport** to return to the ship.
5. Follow **Captain's orders**. If you are stuck, request a hint. Each objective has three progressively more explicit hints.

Investigation and reading have no time limit. Major commitments ask for confirmation. Different choices can require different procedures later.

| Key | Control |
| --- | --- |
| `1` | Walk |
| `2` | Look |
| `3` | Talk |
| `4` | Use |
| `5` | Scan |
| `M` | Turbolift |
| `J` | Journal |
| `I` | Inventory |
| `H` | Hotspot labels |
| `Esc` | Close the current panel or open the mission menu |

For touch or keyboard play, expand **Room contents** below the scene. Settings include larger text, reduced motion, hotspot labels, and audio controls.

## Keep a mission backup

Open **Save & load** from the top bar. The game has an autosave, a chapter checkpoint, and three manual slots.

Choose **Export current mission** to download a JSON backup. Use **Import save** to restore it. Browser storage can be cleared or evicted, so keep an exported backup before clearing site data or changing browsers.

An invalid import leaves the active mission unchanged. Storage failures appear in the interface. If local saving is unavailable, export before closing the tab.

Episode and original saves are separate. Import an old backup in the original adventure, not the episode adventure. Each adventure also has separate testing saves.

The spoiler guide is in [docs/walkthrough.txt](docs/walkthrough.txt).

## Skip chapters for testing

Choose **Chapter select (testing)** from the title screen or mission menu. You can also open **http://127.0.0.1:4173/?testing=1**.

Select the earlier leadership, shuttle-approach, and neural-link choices, then choose a chapter. The selector completes the preceding chapters through the game rules, including their evidence, equipment, and conversation history. Decisions in the chapter you start remain unmade.

Test mode has its own autosave, checkpoint, and manual slots. Starting a chapter replaces only the test autosave and checkpoint. Choose **Return to normal play** to access your normal saves. Test exports have `test` in the filename.

To play the separation setup, start chapter 4 and complete the diversion plan. To watch only the animation, choose **Watch separation**. Chapter jumps skip earlier movies; new events in your starting chapter still play their sequences.

The original adventure retains its evacuation, relay, rescue, and finale choices. Its chapter 6 Sacrifice route is a different, text-based separation procedure. Open **http://127.0.0.1:4173/?adventure=original&testing=1** to test that adventure.

## Build and verify

```sh
npm run build
npm test
npm run test:e2e
```

If Playwright reports a missing browser, run `npx playwright install chromium webkit`. Then run the browser tests again.

`npm run check` runs the production build, domain tests, and browser tests together. The domain suite replays all eight episode routes and all 24 original routes. Browser tests use the actual controls to complete both adventures.

Opening tests cover real-time playback, the visible cast before and after transport, pause, hidden tabs, reduced motion, early and late skips, reload, and unchanged save records after replay.

Episode tests check the canonical milestones, progression prerequisites, chapter fixtures, and the surviving, reunited Enterprise. Separation tests cover the shared docking geometry, section clearance, real-time handoff, reduced-motion frames, reload, and unchanged records after replay. Save-isolation tests cover all four adventure and testing databases.

The four later-movie tests check their live story triggers, moving frames, natural completion, repeated orders, pause, hidden tabs, reload, and remaining gameplay. Gallery tests check all six reduced-motion sequences on mobile, focus restoration, and unchanged saves. Renderer and storage failures are tested together with a validated mission export.

Browser tests run against an isolated production preview on port `4174`, not the live development server. The default suite covers Chromium and WebKit. `npm run test:firefox` retains a separate Firefox compatibility check. Firefox could not launch its temporary profile in the development environment, so Firefox compatibility is not verified.

Run `npm run report` to replay every episode route and report counts from the campaign source. Automated walkthrough duration is not a measurement of first-time human playtime.

Run `npm run walkthrough -- docs/walkthrough.txt` to regenerate the default episode walkthrough from legal actions and current UI labels.

To serve the production build, run:

```sh
npm run preview -- --port 4173
```

The development and preview servers cannot use the same port at the same time.

## Project structure

| Path | Responsibility |
| --- | --- |
| `src/episode/` | Default episode campaign, legal walkthroughs, chapter fixtures, and space cinematics |
| `src/campaign/` | Preserved original adventure, shared content builders, and Picard-abduction movie |
| `src/adventures.ts` | Adventure selection, earned-event movie registry, and testing adapters |
| `src/model.ts` | Shared content contracts and save schema |
| `src/engine.ts` | Deterministic interaction and progression rules |
| `src/main.ts` | Browser interface and session coordination |
| `src/scene.ts` | Phaser presentation and character movement |
| `src/cinematic.ts` | Shared Canvas movie player, captions, pause controls, and renderer lifecycle |
| `src/campaign/opening.ts` | Original Picard abduction dialogue, cast, and animation timeline |
| `src/episode/testing.ts` | Episode chapter starts reconstructed from the authored walkthrough |
| `src/art.ts` | Original room art, interactive props, character sprites, portraits, and title scene |
| `src/audio.ts` | Synthesized ship ambience and interface sounds |
| `src/saves.ts` | IndexedDB saves and validated import/export |
| `tests/` | Domain, save, content, and browser checks |
| `.audit/implementation.tsv` | Implementation decisions and verification evidence |

The main bridge is drawn from the forward end looking aft, using the television-era layout described in [Ex Astris Scientia's set history](https://www.ex-astris-scientia.org/inconsistencies/enterprise-d-bridge.htm). Its chair and controls are part of the room painting, not separate furniture sprites. The game includes no images from the reference.

## Fan-project notice

This is an unofficial, noncommercial fan project. Star Trek and its associated characters and settings belong to their respective rights holders. No affiliation or endorsement is implied.

The default adventure adapts the episode's main events with original dialogue and puzzles. It is not an episode-script transcription. No episode footage, dialogue recordings, Sierra game assets, or existing music are included. Original assets and a noncommercial label do not grant permission for public distribution. Review the applicable rights before publishing.
