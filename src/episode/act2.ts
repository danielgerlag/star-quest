import type { Action, Evidence, Item, Verb } from '../model';
import type { EpisodeHistory } from './options';

export const act2Items: readonly Item[] = [
  {
    id: 'e4-echo-filter', name: 'Wreck echo filter', icon: 'record',
    description: 'Data’s measured reflection delays for the repeating Wolf 359 beacon. Apply to the Search sweep to expose independent returns.',
  },
  {
    id: 'e4-location-record', name: 'Locutus position fix', icon: 'record',
    description: 'The internal relay timing from Locutus’s reply. Apply to Section formation to cover the target compartment with the saucer diversion.',
  },
  {
    id: 'e5-screen-profile', name: 'Screen timing profile', icon: 'record',
    description: 'The inner shadow and expanding outer edge of the saucer’s antimatter spread. Apply to the Shuttle course for the selected approach.',
  },
  {
    id: 'e5-barrier-waveform', name: 'Local barrier waveform', icon: 'record',
    description: 'Data’s remote measurement of the transport barrier enclosing Locutus. Apply to Shuttle mission to authorize Worf’s focused emitter shot.',
  },
  {
    id: 'e5-neural-coupler', name: 'Neural coupler', icon: 'isolator',
    description: 'Crusher’s implant-to-Data interface with a separate patient-monitor lead. Apply to the Interface cradle after measuring Picard’s baseline.',
  },
  {
    id: 'e6-regeneration-trace', name: 'Regeneration trace', icon: 'record',
    description: 'Picard’s human fatigue impulse crossing the implant carrier. Apply to the Regeneration index to find its routine Borg counterpart.',
  },
];

export const act2Evidence: readonly Evidence[] = [
  {
    id: 'e4-melbourne', title: 'The ruined Melbourne', category: 'observation',
    text: 'Melbourne’s broken forward hull is identified among the Wolf 359 wrecks. The command Riker once considered has been destroyed with the fleet.',
  },
  {
    id: 'e4-distress-echoes', title: 'One beacon, many reflections', category: 'report',
    text: 'Several apparent distress sources carry one damaged beacon’s identical timing. Their measured delays let Data subtract reflections without filtering independent life signs.',
  },
  {
    id: 'e4-fleet-losses', title: 'Hanson and the fleet lost', category: 'report',
    text: 'The filtered search finds no surviving life signs in its sweep. Hanson’s flagship is among the destroyed vessels; his command channel has ended.',
  },
  {
    id: 'e4-earthward-trail', title: 'The cube has left for Earth', category: 'tactical',
    text: 'A single Borg wake leaves Wolf 359 toward Sol. No intact battle line remains between it and Earth.',
  },
  {
    id: 'e4-guinan-counsel', title: 'Not Picard’s next move', category: 'personal',
    text: 'Guinan challenges Riker to stop reproducing Picard’s decisions. Picard’s assimilated knowledge makes a different approach more useful than another familiar attack.',
  },
  {
    id: 'e4-rescue-design', title: 'A conspicuous diversion, a quiet rescue', category: 'tactical',
    text: 'Riker proposes a saucer antimatter diversion covering Data and Worf’s shuttle. Both sections retain maneuvering power and a return course.',
  },
  {
    id: 'e4-locutus-location', title: 'Location in the reply', category: 'report',
    text: 'The reply from Locutus carries an internal relay delay. Data resolves it to a forward compartment near a local transport barrier.',
  },
  {
    id: 'e4-power-routing', title: 'Separate the loads before the hulls', category: 'report',
    text: 'The saucer’s auxiliary loads still cross the neck. They must transfer to independent supply before utilities retract and structural latches release.',
  },
  {
    id: 'e4-separation', title: 'Two functioning sections', category: 'tactical',
    text: 'The Enterprise separates with independent power, cleared utilities, and a plotted rescue formation. Riker commands from the stardrive. The shuttle has not launched.',
  },
  {
    id: 'e5-screen-geometry', title: 'Moving cover', category: 'tactical',
    text: 'The saucer’s planned antimatter screen has a dense inner shadow and a widening outer band. The shuttle must remain under cover throughout the chosen approach.',
  },
  {
    id: 'e5-close-approach', title: 'Close course prepared', category: 'tactical',
    text: 'The shuttle hugs the saucer’s sensor shadow and crosses after the inner screen covers its engines. Its return uses the same carefully timed moving notch.',
  },
  {
    id: 'e5-wide-approach', title: 'Wide course prepared', category: 'tactical',
    text: 'The shuttle follows the outer antimatter band at matched impulse, gaining turning room without outrunning the screen. A covered return arc is included.',
  },
  {
    id: 'e5-return-compensation', title: 'Receive on the stardrive', category: 'report',
    text: 'The transporter must replace joined-hull compensation with stardrive-only motion and a shield interval synchronized to the returning shuttle.',
  },
  {
    id: 'e5-antimatter-diversion', title: 'The saucer draws attention', category: 'tactical',
    text: 'The saucer deploys its antimatter spread on a recoverable course. Sensor interference covers the shuttle; it does not stop the cube’s engines.',
  },
  {
    id: 'e5-shuttle-insertion', title: 'Data and Worf aboard', category: 'report',
    text: 'Riker launches the shuttle from the battle bridge. Under the saucer’s screen, Data and Worf reach Locutus’s compartment and find a separate barrier around him.',
  },
  {
    id: 'e5-local-barrier', title: 'One emitter, one opening', category: 'tactical',
    text: 'The barrier enclosing Locutus has a low-duty interval. Worf can target its local emitter without trying to shut down the whole cube.',
  },
  {
    id: 'e5-rescue', title: 'Locutus and the away team recovered', category: 'report',
    text: 'The opened local barrier permits transport to the shuttle. Data follows the covered return path; O’Brien receives Locutus and the shuttle docks with Data and Worf.',
  },
  {
    id: 'e5-cube-continues', title: 'The mission continues without Locutus', category: 'tactical',
    text: 'After the rescue, the Borg cube continues toward Earth at the same velocity. Retrieving its spokesman does not halt the Collective.',
  },
  {
    id: 'e5-neural-baseline', title: 'A human trace beneath the carrier', category: 'medical',
    text: 'Picard’s cortical activity persists beneath active Borg telemetry. Crusher records it before connecting Data and keeps its monitor independent.',
  },
  {
    id: 'e5-paced-link', title: 'Paced contact selected', category: 'medical',
    text: 'Data samples the connection in intervals while Crusher follows the patient through contact and recovery. Live recovery timing must be configured before command tests.',
  },
  {
    id: 'e5-continuous-link', title: 'Continuous contact selected', category: 'medical',
    text: 'Data holds the carrier while Crusher watches an independent monitor and cutoff. A live load limiter must be configured before command tests.',
  },
  {
    id: 'e6-live-neural-load', title: 'Measure before making contact work', category: 'medical',
    text: 'The carrier presses against Picard’s baseline. Paced contact needs genuine recovery time; continuous contact needs its coupling limited below the suppression point.',
  },
  {
    id: 'e6-paced-monitor', title: 'Recovery intervals established', category: 'medical',
    text: 'Crusher sets intervals from the live load; Data reacquires the carrier after each pause. The independent monitor remains active throughout.',
  },
  {
    id: 'e6-continuous-monitor', title: 'Continuous load controlled', category: 'medical',
    text: 'Crusher sets the coupling limiter beneath the measured suppression point and retains the independent monitor and cutoff while Data holds contact.',
  },
  {
    id: 'e6-command-denials', title: 'Command systems reject the requests', category: 'report',
    text: 'Navigation and weapons requests are rejected by the cube’s command layer. A neural connection to Locutus does not provide control of the Borg.',
  },
  {
    id: 'e6-picard-clue', title: 'Picard reaches for rest', category: 'personal',
    text: 'Picard briefly breaks through Locutus’s formal cadence to express exhaustion. Crusher captures the fatigue impulse where it crosses the implant carrier.',
  },
  {
    id: 'e6-regeneration-path', title: 'An ordinary function left accessible', category: 'report',
    text: 'Data maps the human fatigue trace to less-protected Borg regeneration traffic. It is a rest function, not a route to general command authority.',
  },
  {
    id: 'e6-regeneration-feedback', title: 'Sleep can unbalance the operating cube', category: 'tactical',
    text: 'A local rehearsal confirms the regeneration instruction. Broad regeneration during operation may produce unstable feedback; both Enterprise sections must stand clear.',
  },
  {
    id: 'e6-borg-regeneration', title: 'The Borg enter regeneration', category: 'report',
    text: 'Riker authorizes the less-protected regeneration instruction. Drones enter their rest cycle, silencing weapons and halting the cube’s advance.',
  },
  {
    id: 'e6-feedback-rise', title: 'An unattended feedback cascade', category: 'report',
    text: 'With the drones asleep, the cube’s power corrections amplify each other. Both Enterprise sections are clear, but Data must be disconnected before the surge returns through the link.',
  },
  {
    id: 'e6-medical-disconnect', title: 'Data released, patient still monitored', category: 'medical',
    text: 'Crusher disconnects Data’s neural coupling after the instruction propagates. Picard’s independent physiological monitor remains powered.',
  },
  {
    id: 'e6-cube-destruction', title: 'Feedback destroys the cube', category: 'report',
    text: 'The regeneration feedback destroys the Borg cube near Earth without a final weapons strike. Earth reports the attack ended; both Enterprise sections survive.',
  },
  {
    id: 'e6-enterprise-rejoined', title: 'One Enterprise again', category: 'report',
    text: 'After matching rotation and relative drift, the saucer docks with the stardrive. Latches and utilities reconnect; the Enterprise is whole and intact.',
  },
  {
    id: 'e6-picard-recovery', title: 'Picard’s recovery begins', category: 'medical',
    text: 'Crusher removes the implants in stages with Picard’s own neural activity stable. Recovery is underway, without pretending the experience has been erased.',
  },
  {
    id: 'e6-new-watch', title: 'Shelby rebuilds; Riker stays', category: 'personal',
    text: 'Shelby leaves to help rebuild Starfleet after Wolf 359. Riker chooses to remain aboard the surviving Enterprise with Picard and the crew.',
  },
];

export function act2Steps(history: EpisodeHistory): Action[] {
  const actions: Action[] = [];
  const go = (room: string) => actions.push({ type: 'travel', room });
  const interact = (target: string, verb: Verb) => actions.push({ type: 'interact', target, verb });
  const apply = (target: string, itemId: string) => actions.push({ type: 'item', target, item: itemId });
  const choose = (interaction: string, choice: string) => actions.push({ type: 'choose', interaction, choice });

  interact('e4-melbourne', 'look');
  interact('e4-echoes', 'scan');
  interact('e4-data', 'talk');
  apply('e4-search', 'e4-echo-filter');
  interact('e4-search', 'scan');
  go('e4-ready');
  interact('e4-guinan', 'talk');
  apply('e4-sketch', 'padd');
  go('e4-bridge');
  interact('e4-channel', 'use');
  interact('e4-channel', 'scan');
  interact('e4-shelby', 'talk');
  choose('e4-rescue-choice', history.rescue);
  go('e4-engineering');
  interact('e4-feeds', 'scan');
  interact('e4-geordi', 'talk');
  apply('e4-feeds', 'padd');
  apply('e4-formation', 'e4-location-record');
  interact('e4-collar', 'use');
  go('e4-bridge');
  interact('e4-command', 'use');

  interact('e5-track', 'look');
  interact('e5-screen', 'scan');
  go('e5-shuttle');
  interact('e5-worf', 'talk');
  apply('e5-course', 'e5-screen-profile');
  go('e5-transport');
  interact('e5-pad', 'scan');
  interact('e5-obrien', 'talk');
  apply('e5-pad', 'padd');
  go('e5-battle');
  interact('e5-screen', 'use');
  interact('e5-mission', 'use');
  interact('e5-mission', 'scan');
  apply('e5-mission', 'e5-barrier-waveform');
  interact('e5-mission', 'use');
  go('e5-medical');
  interact('e5-monitor', 'scan');
  interact('e5-crusher', 'talk');
  apply('e5-interface', 'e5-neural-coupler');
  interact('e5-data-link', 'talk');
  choose('e5-link-choice', history.link);
  interact('e5-interface', 'use');

  interact('e6-monitor', 'scan');
  apply('e6-monitor', 'padd');
  go('e6-link');
  interact('e6-command-probe', 'use');
  go('e6-medical');
  interact('e6-locutus', 'talk');
  go('e6-link');
  apply('e6-regeneration', 'e6-regeneration-trace');
  interact('e6-rehearsal', 'use');
  go('e6-battle');
  interact('e6-earth', 'scan');
  interact('e6-command', 'use');
  interact('e6-earth', 'scan');
  apply('e6-command', 'padd');
  interact('e6-command', 'use');
  interact('e6-docking', 'scan');
  apply('e6-docking', 'padd');
  interact('e6-docking', 'use');
  go('e6-recovery');
  interact('e6-recovery-monitor', 'scan');
  interact('e6-picard', 'talk');
  interact('e6-shelby', 'talk');
  interact('e6-log', 'use');

  return actions;
}
