import type { Action, Evidence, Item, Verb } from '../model';
import type { EpisodeHistory } from './options';

export const act1Items: readonly Item[] = [
  {
    id: 'e1-core-sample', name: 'Residue core', icon: 'cell',
    description: 'A sealed core from Jouret IV’s exposed bedrock. The surface carries a residual field; compare it with undisturbed basalt in the Survey Laboratory.',
  },
  {
    id: 'e1-tractor-report', name: 'Tractor analysis', icon: 'record',
    description: 'The laboratory’s background-subtracted field analysis, supported by the lifted foundations. Hanson’s Threat table can compare it with Starfleet’s Borg records.',
  },
  {
    id: 'e1-adaptation-brief', name: 'Shelby’s adaptation brief', icon: 'padd',
    description: 'Shelby’s observations on Borg adaptation and the specialist time needed for countermeasures. Apply it to the Threat table after preparing a watch plan.',
  },
  {
    id: 'e2-beam-record', name: 'Beam recording', icon: 'record',
    description: 'The tractor and cutting-beam telemetry, including the delay between a phaser hit and the Borg’s response. Shelby’s Spectrum bench can use the timing.',
  },
  {
    id: 'e2-rotation-program', name: 'Rotation program', icon: 'record',
    description: 'A phaser pulse train that changes frequency inside the measured adaptation window. Load it into the Tactical Laboratory’s Emitter sequencer.',
  },
  {
    id: 'e2-nebula-route', name: 'Nebula course', icon: 'padd',
    description: 'A plotted low-shear channel behind the nebula’s dense gas. Apply it at the Helm station after breaking the tractor lock.',
  },
  {
    id: 'e2-deflector-schematic', name: 'Deflector schematic', icon: 'padd',
    description: 'Geordi’s direct warp-power feed for a concentrated main-deflector burst. Compare it with scanned Power distribution before routing the circuit.',
  },
  {
    id: 'e2-induction-shunt', name: 'Induction shunt', icon: 'isolator',
    description: 'A directional coupling rated for the deflector’s induced return load. Its arrow must face the Waveguide’s amber-marked return sink.',
  },
  {
    id: 'e3-node-spectrum', name: 'Node spectrum', icon: 'record',
    description: 'A remote scan isolating the Borg nodes that pulse with the cube’s warp field. Apply it to the Targeting uplink to direct Shelby’s away team.',
  },
  {
    id: 'e3-coolant-profile', name: 'Thermal envelope', icon: 'record',
    description: 'A live measurement of the battle-damaged deflector cooling circuit. The Charge regulator can concentrate the burst within this safe duration.',
  },
  {
    id: 'e3-rendezvous-orders', name: 'Fleet rendezvous orders', icon: 'padd',
    description: 'Hanson’s orders for Enterprise to join the fleet gathering at Wolf 359. Apply them to the bridge Helm repeater after appointing Shelby.',
  },
];

export const act1Evidence: readonly Evidence[] = [
  {
    id: 'e1-colony-void', title: 'Jouret IV: an absent colony', category: 'observation',
    text: 'The colony, its streets, and the ground beneath them are missing. No corresponding debris field or departing evacuation trail explains the absence.',
  },
  {
    id: 'e1-lifted-foundations', title: 'Foundations pulled inward', category: 'observation',
    text: 'Reinforcement rods stretched upward and inward before breaking. The settlement was lifted, not scattered by an explosion.',
  },
  {
    id: 'e1-residue-scan', title: 'Two signatures in the stone', category: 'report',
    text: 'Exposed bedrock carries a narrow residual subspace band mixed with a broader mineral signature. A clean reference is needed before identifying the attacker.',
  },
  {
    id: 'e1-tractor-signature', title: 'A colony-sized tractor beam', category: 'report',
    text: 'Subtracting undisturbed basalt isolates a tractor-field gradient of enormous strength. Together with the stretched foundations, it explains the missing colony mass.',
  },
  {
    id: 'e1-hanson-brief', title: 'Hanson’s preparations', category: 'tactical',
    text: 'Admiral Hanson brings Starfleet’s Borg reference material and Commander Shelby’s specialist knowledge. Fleet readiness is behind the projected need.',
  },
  {
    id: 'e1-borg-identification', title: 'The Borg have arrived', category: 'tactical',
    text: 'Jouret IV’s tractor signature matches Hanson’s Borg archive. The missing settlement is evidence of a Borg incursion, not a conventional bombardment.',
  },
  {
    id: 'e1-command-dilemma', title: 'The command Riker keeps declining', category: 'personal',
    text: 'Picard asks whether refusing Melbourne reflects conviction or comfort. Riker stays with his present duty during the crisis, without treating Shelby’s ambition as a threat he must suppress.',
  },
  {
    id: 'e1-leadership-plan', title: 'Working with Shelby', category: 'personal',
    text: 'Riker records a leadership arrangement for the countermeasure team. Shelby remains technical lead in either arrangement; bridge coverage and responsibility are explicit.',
  },
  {
    id: 'e1-intercept-orders', title: 'Enterprise takes the intercept', category: 'tactical',
    text: 'Hanson departs to assemble the fleet. Enterprise will intercept and report under Picard’s command, with Shelby remaining aboard as Borg specialist.',
  },
  {
    id: 'e2-cutting-beam', title: 'A lock that learns', category: 'tactical',
    text: 'A tractor beam holds Enterprise while a cutting beam erodes her defenses. Repeated phaser settings become ineffective after a measurable adaptation interval.',
  },
  {
    id: 'e2-phaser-rotation', title: 'One maneuver bought', category: 'tactical',
    text: 'A controlled frequency rotation outruns the adaptation long enough to break the tractor lock. The cube itself remains operational.',
  },
  {
    id: 'e2-nebula-cover', title: 'Shelter in the gas', category: 'observation',
    text: 'A low-shear channel carries Enterprise behind dense nebular gas that interferes with Borg sensors. The refuge buys preparation time, not permanent concealment.',
  },
  {
    id: 'e2-deflector-plan', title: 'The deflector proposal', category: 'report',
    text: 'Geordi proposes concentrating a warp-power burst through the main deflector. The ordinary control circuits and induction return must be separated from the weapon’s load.',
  },
  {
    id: 'e2-deflector-alignment', title: 'Aligned, not fired', category: 'report',
    text: 'The rerouted feed and correctly oriented induction shunt pass a low-power alignment test. Full charging and firing still require later orders.',
  },
  {
    id: 'e2-abduction', title: 'Picard taken from the bridge', category: 'report',
    text: 'Borg detonations force Enterprise from the nebula. Intruders beam through her defenses and take Picard. Riker assumes the bridge; the prepared deflector is still unfired.',
  },
  {
    id: 'e3-away-uniform', title: 'A uniform without its captain', category: 'observation',
    text: 'Shelby’s initial away team finds Picard’s torn uniform aboard the cube. Its location helps the search but does not establish that he is dead.',
  },
  {
    id: 'e3-warp-nodes', title: 'Warp distribution interrupted', category: 'tactical',
    text: 'Remote telemetry identifies nodes synchronized with the cube’s warp field. Riker directs Shelby’s team to disable those nodes, temporarily stopping the cube’s warp progress.',
  },
  {
    id: 'e3-assimilation-report', title: 'Picard among the Borg', category: 'medical',
    text: 'The initial team sees Picard with Borg implants. It cannot isolate his transport signature from the surrounding machinery, so there is no lock on him for the party’s recall.',
  },
  {
    id: 'e3-locutus-transmission', title: 'The voice of Locutus', category: 'report',
    text: 'An altered Picard appears on the Borg transmission as Locutus. The communication uses his knowledge and identity in service of the collective, not as evidence of his consent.',
  },
  {
    id: 'e3-deflector-result', title: 'The deflector fails', category: 'tactical',
    text: 'Riker orders the correctly prepared, fully charged discharge. The cube’s defenses absorb it without disabling the ship. Enterprise’s firing assembly is exhausted.',
  },
  {
    id: 'e3-assimilated-tactics', title: 'A countermeasure known in advance', category: 'tactical',
    text: 'The cube shaped its shield response before the burst arrived. Picard knew the deflector plan before his abduction; the Borg assimilated that knowledge and anticipated the shot.',
  },
  {
    id: 'e3-field-promotion', title: 'Riker receives command', category: 'report',
    text: 'After the failed deflector engagement, Hanson grants Riker an emergency field promotion to captain and orders Enterprise toward the fleet at Wolf 359.',
  },
  {
    id: 'e3-first-officer', title: 'Shelby takes the second station', category: 'personal',
    text: 'Riker appoints Shelby first officer. Both leadership histories converge on a command partnership that makes use of her expertise rather than denying it.',
  },
];

export function act1Steps(history: EpisodeHistory): Action[] {
  const actions: Action[] = [];
  const go = (room: string) => actions.push({ type: 'travel', room });
  const interact = (target: string, verb: Verb) => actions.push({ type: 'interact', target, verb });
  const apply = (target: string, item: string) => actions.push({ type: 'item', target, item });
  const choose = (interaction: string, choice: string) => actions.push({ type: 'choose', interaction, choice });

  interact('e1-basin', 'look');
  interact('e1-foundation', 'look');
  interact('e1-bedrock', 'scan');
  interact('e1-clamp', 'use');
  go('e1-lab');
  interact('e1-reference', 'scan');
  apply('e1-spectrometer', 'e1-core-sample');
  go('e1-observation');
  interact('e1-hanson', 'talk');
  apply('e1-threat-table', 'e1-tractor-report');
  interact('e1-shelby', 'talk');
  go('e1-ready');
  interact('e1-picard', 'talk');
  apply('e1-watch-desk', 'padd');
  go('e1-observation');
  apply('e1-threat-table', 'e1-adaptation-brief');
  interact('e1-shelby', 'talk');
  choose('e1-leadership-choice', `e1-${history.leadership}`);
  interact('e1-hanson', 'talk');
  go('e1-ready');
  interact('e1-watch-desk', 'use');

  interact('e2-tactical-board', 'scan');
  go('e2-tactical');
  interact('e2-shelby', 'talk');
  apply('e2-spectrum', 'e2-beam-record');
  apply('e2-sequencer', 'e2-rotation-program');
  go('e2-bridge');
  interact('e2-tactical-board', 'use');
  interact('e2-helm', 'scan');
  apply('e2-helm', 'e2-nebula-route');
  go('e2-engineering');
  interact('e2-geordi', 'talk');
  interact('e2-distribution', 'scan');
  apply('e2-distribution', 'e2-deflector-schematic');
  interact('e2-shunt-locker', 'use');
  go('e2-deflector');
  interact('e2-waveguide', 'look');
  apply('e2-waveguide', 'e2-induction-shunt');
  interact('e2-alignment', 'use');
  go('e2-bridge');
  interact('e2-command', 'use');

  interact('e3-command', 'use');
  go('e3-mission');
  interact('e3-survey-feed', 'look');
  interact('e3-node-telemetry', 'scan');
  apply('e3-targeting', 'e3-node-spectrum');
  interact('e3-survey-feed', 'use');
  interact('e3-transporter-lock', 'use');
  go('e3-bridge');
  interact('e3-hailing', 'use');
  go('e3-engineering');
  interact('e3-coolant', 'scan');
  interact('e3-geordi', 'talk');
  apply('e3-charge', 'e3-coolant-profile');
  go('e3-bridge');
  interact('e3-fire-control', 'use');
  choose('e3-fire-order', 'e3-fire');
  interact('e3-telemetry', 'scan');
  go('e3-ready');
  interact('e3-fleet-comms', 'use');
  interact('e3-shelby', 'talk');
  go('e3-bridge');
  apply('e3-helm', 'e3-rendezvous-orders');
  interact('e3-command', 'use');

  return actions;
}
