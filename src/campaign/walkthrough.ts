import { z } from 'zod';
import type { Action, Verb } from '../model';

export const walkthroughOptionsSchema = z.object({
  evacuation: z.enum(['aboard', 'escort']).default('aboard'),
  relay: z.enum(['cut', 'supervised']).default('cut'),
  contact: z.enum(['medical', 'tactical']).default('medical'),
  strategy: z.enum(['precision', 'fleet', 'sacrifice']).default('precision'),
});
export type WalkthroughOptions = z.input<typeof walkthroughOptionsSchema>;

/** A reproducible test fixture using only the same actions available in the interface. */
export function walkthrough(options: WalkthroughOptions = {}): Action[] {
  const { evacuation, relay, contact, strategy } = walkthroughOptionsSchema.parse(options);
  const actions: Action[] = [];
  const go = (room: string) => actions.push({ type: 'travel', room });
  const interact = (target: string, verb: Verb) => actions.push({ type: 'interact', target, verb });
  const apply = (target: string, item: string) => actions.push({ type: 'item', target, item });
  const choose = (interaction: string, choice: string) => actions.push({ type: 'choose', interaction, choice });

  interact('c1-chair', 'look');
  interact('c1-worf', 'talk');
  interact('c1-seal', 'use');
  interact('c1-board', 'look');
  go('c1-engineering');
  interact('c1-bypass', 'scan');
  interact('c1-geordi', 'talk');
  apply('c1-repair', 'padd');
  go('c1-tender');
  interact('c1-manifest', 'look');
  interact('c1-vale', 'talk');
  interact('c1-crate', 'scan');
  go('c1-sickbay');
  interact('c1-birth', 'look');
  interact('c1-crusher', 'talk');
  apply('c1-med-records', 'padd');
  interact('c1-beds', 'look');
  interact('c1-crusher', 'talk');
  go('c1-tender');
  interact('c1-crate', 'use');
  go('c1-bridge');
  interact('c1-shelby', 'talk');
  choose('c1-tender-choice', evacuation);
  interact('c1-chair', 'use');

  interact('c2-dispatch', 'look');
  interact('c2-stamp', 'scan');
  go('c2-relay');
  interact('c2-antenna', 'look');
  interact('c2-logger', 'scan');
  interact('c2-geordi', 'talk');
  interact('c2-kit', 'use');
  go('c2-computer');
  interact('c2-data', 'talk');
  apply('c2-signature', 'dispatch-record');
  apply('c2-route', 'padd');
  go('c2-observation');
  apply('c2-model', 'proof-record');
  interact('c2-troi', 'talk');
  go('c2-ready');
  interact('c2-shelby', 'talk');
  choose('c2-relay-choice', relay);
  interact('c2-desk', 'use');

  interact('c3-data', 'talk');
  if (relay === 'cut') {
    interact('c3-star', 'look');
    interact('c3-buoy', 'scan');
    go('c3-array');
    interact('c3-crescent', 'look');
    interact('c3-shutter', 'use');
  } else {
    go('c3-array');
    interact('c3-carrier', 'scan');
    apply('c3-carrier', 'noise-profile');
  }
  go('c3-wreck');
  interact('c3-pallet', 'look');
  interact('c3-load', 'scan');
  interact('c3-geordi', 'talk');
  interact('c3-release', 'use');
  go('c3-array');
  apply('c3-carrier', 'proof-record');
  go('c3-lane');
  interact('c3-hatch', 'look');
  interact('c3-crusher', 'talk');
  apply('c3-sockets', 'support-cell');
  apply('c3-lane-board', 'padd');
  go('c3-chart');
  interact('c3-rendezvous', 'use');

  interact('c4-cadence', 'scan');
  interact('c4-shutters', 'look');
  interact('c4-data', 'talk');
  apply('c4-parallax', 'support-record');
  go('c4-medical');
  interact('c4-beds', 'look');
  interact('c4-crusher', 'talk');
  if (evacuation === 'aboard') {
    interact('c4-partition', 'look');
    apply('c4-med-dispatch', 'padd');
  } else {
    interact('c4-med-dispatch', 'look');
    apply('c4-med-dispatch', 'support-record');
  }
  go('c4-transporter');
  interact('c4-lead', 'scan');
  interact('c4-obrien', 'talk');
  apply('c4-lead', 'isolator');
  apply('c4-pad', 'isolation-kit');
  interact('c4-dwell', 'look');
  interact('c4-dwell', 'use');
  go('c4-isolation');
  interact('c4-monitor', 'look');
  interact('c4-troi', 'talk');
  interact('c4-troi', 'talk');
  choose('c4-contact-choice', contact);
  go('c4-transporter');
  interact('c4-pad', 'use');
  go('c4-isolation');
  interact('c4-picard', 'talk');
  go('c4-sensor');
  interact('c4-parallax', 'use');

  interact('c5-armor', 'scan');
  interact('c5-data', 'talk');
  apply('c5-control-model', 'proof-record');
  apply('c5-seam', contact === 'medical' ? 'support-record' : 'neural-map');
  go('c5-command');
  interact('c5-worf', 'talk');
  go('c5-wardroom');
  interact('c5-formation', 'look');
  apply('c5-firing', 'support-record');
  interact('c5-crusher', 'talk');
  go('c5-hangar');
  interact('c5-tow', 'look');
  interact('c5-geordi', 'talk');
  apply('c5-tow', 'support-cell');
  interact('c5-headcount', 'scan');
  apply('c5-evac', 'manifest');
  go('c5-command');
  interact('c5-assets', 'look');
  apply('c5-assets', 'padd');
  interact('c5-worf', 'talk');
  interact('c5-decision', 'use');
  choose('c5-strategy-choice', strategy);
  interact('c5-decision', 'use');

  if (strategy === 'precision') {
    go('c6-engineering');
    interact('c6-grid', 'look');
    interact('c6-data', 'talk');
    apply('c6-phase', 'padd');
    go('c6-control');
    interact('c6-aperture', 'scan');
    interact('c6-obrien', 'talk');
    apply('c6-aim', 'support-record');
  } else if (strategy === 'fleet') {
    go('c6-control');
    interact('c6-aperture', 'scan');
    interact('c6-passes', 'look');
    interact('c6-obrien', 'talk');
    apply('c6-passes', 'support-record');
    go('c6-engineering');
    interact('c6-grid', 'look');
    interact('c6-geordi', 'talk');
    apply('c6-grid', 'support-cell');
  } else {
    go('c6-medical');
    interact('c6-lockers', 'look');
    interact('c6-crusher', 'talk');
    apply('c6-casualties', 'manifest');
    go('c6-engineering');
    interact('c6-clutch', 'scan');
    interact('c6-geordi', 'talk');
    apply('c6-clutch', 'padd');
    go('c6-control');
    interact('c6-aperture', 'look');
    interact('c6-aperture', 'scan');
    interact('c6-obrien', 'talk');
    apply('c6-aim', 'support-record');
  }
  go('c6-bridge');
  interact('c6-plot', 'look');
  interact('c6-worf', 'talk');
  interact('c6-command', 'use');
  go('c6-medical');
  interact('c6-casualties', 'scan');
  interact('c6-crusher', 'talk');
  apply('c6-earth', 'padd');
  go('c6-bridge');
  interact('c6-command', 'use');
  return actions;
}
