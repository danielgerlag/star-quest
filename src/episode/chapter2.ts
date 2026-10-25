import type { Chapter } from '../model';
import { act, all, evidence, fact, item, next, object, objective, person } from '../campaign/builders';

export const chapter2: Chapter = {
  id: 2,
  title: 'A Moving Frequency',
  subtitle: 'Break the tractor lock. Buy time for one untested weapon.',
  stardate: '43989.3',
  assignment: 'FIRST OFFICER',
  intro: [
    'The Enterprise intercepts the Borg cube. Its demand is unexpectedly specific: Jean-Luc Picard. Picard refuses, and a tractor beam catches the ship while a cutting beam begins working through her defenses.',
    'Riker remains first officer. Picard holds the bridge while Riker coordinates a countermeasure with Shelby and Engineering. A single phaser setting will not stay useful for long.',
  ],
  objectives: [
    objective('e2-escape', 'Break the Borg tractor beam with rotating phaser frequencies.', all('e2-tractor-broken'), [
      'The first pulse works briefly. Repeating it teaches the Borg what to block.',
      'Scan the Tactical board, talk to Shelby in the Tactical Laboratory, and apply the Beam recording to the Spectrum bench.',
      'Apply the Rotation program to the Emitter sequencer. Return to the bridge and Use the Tactical board.',
    ]),
    objective('e2-refuge', 'Plot a sheltered course into the nebula.', all('e2-in-nebula'), [
      'Breaking free is not the same as escaping the cube’s sensors.',
      'After breaking the tractor lock, Scan the Helm station for a route through the nebula’s magnetic turbulence.',
      'Apply the Nebula course to the Helm station. Its low-shear channel keeps the ship inside the sensor-obscuring gas.',
    ]),
    objective('e2-power', 'Route warp power for a main-deflector discharge.', all('e2-power-routed'), [
      'The deflector can handle a high-energy pulse only if its ordinary return path is isolated.',
      'Once sheltered, talk to Geordi in Engineering and Scan the Power distribution.',
      'Apply the Deflector schematic to Power distribution. Then Use the Shunt locker to obtain the hardware for the new route.',
    ]),
    objective('e2-align-deflector', 'Align the deflector weapon before the Borg force you out.', all('e2-deflector-ready'), [
      'The new power path has an old connection that could feed energy back into the ship.',
      'Look at the Waveguide in Deflector Control. Apply the Induction shunt to its return branch.',
      'Use the Alignment console for a low-power test, then return to the bridge and Use the Captain’s station to report ready.',
    ]),
  ],
  rooms: [
    {
      id: 'e2-bridge', name: 'Main Bridge', deck: 'Enterprise · Deck 1', visual: 'bridge', atmosphere: 'alert',
      description: 'The cube fills the forward screen. Picard stands clear of the center chair so the tactical crew can see him. The cutting beam traces a slow line across the shield display; the ship shudders whenever it reaches a weakened section.',
      ambient: 'Shield alarms compete with measured damage reports. Picard keeps his questions short.',
      hotspots: [
        { ...object('e2-command', 'Captain’s station', 1, 'chair', [
          act('e2-command-depart', 'use', [
            'Riker reports the low-power alignment complete. Before Picard can order a full charge, Borg detonations begin stripping away the nebula’s cover. He takes Enterprise back into open space rather than wait for a blind direct hit.',
            'The cube closes. Transporter light appears on the bridge despite the shields; security’s first shots do not stop the intruders. Picard vanishes with them. Riker has the bridge, and the deflector remains unfired.',
          ], {
            when: all('e2-tractor-broken', 'e2-in-nebula', 'e2-power-routed', 'e2-deflector-ready'),
            effects: [fact('picard-abducted'), evidence('e2-abduction'), next(3, 'e3-bridge')],
          }),
          act('e2-command-look', 'look', [
            'Picard has not yielded command. Riker is free to coordinate the countermeasure because the captain is keeping the ship’s immediate fight in hand.',
            'Report here when the deflector’s low-power test succeeds. No one has authorized firing it yet.',
          ]),
          act('e2-command-wait', 'use', ['Picard needs the tractor lock broken, a nebula refuge, and a safely aligned deflector power path before considering the new weapon.']),
        ]), kind: 'object', prop: null, x: 211, y: 141, width: 58, height: 61 },
        { ...object('e2-tactical-board', 'Tactical board', 2, 'console', [
          act('e2-tactical-escaped', 'use', ['The tractor lock is already broken. Do not spend the frequency sequence on an empty bearing; the Helm station needs a route into cover.'], { when: all('e2-tractor-broken') }),
          act('e2-tactical-break', 'use', [
            'Worf sends the programmed sequence through the phaser arrays. Each pulse shifts before the cube can settle on the previous frequency. For a moment the tractor emitter loses its hold.',
            'Picard uses that moment, ordering full impulse clear of the cutting beam. The cube is not disabled. You have bought a maneuver, not won an engagement.',
          ], {
            when: all('e2-rotation-loaded'),
            effects: [fact('e2-tractor-broken'), evidence('e2-phaser-rotation')],
          }),
          act('e2-tactical-scan-after', 'scan', ['The recorded beam cycle is preserved in your PADD. The live lock is gone; the next useful sensor task is plotting the nebula channel at Helm.'], { when: all('e2-tractor-broken') }),
          act('e2-tactical-scan', 'scan', [
            'The first phaser pulse disturbed the tractor beam. The second met a shifted shield response and did almost nothing. The cutting beam continues removing shield capacity while the tractor holds your heading.',
            'You save the sequence, including the brief interval before each adaptation. Shelby needs that timing, not merely a report that the phasers failed.',
          ], { effects: [fact('e2-beam-sampled'), item('e2-beam-record'), evidence('e2-cutting-beam')] }),
          act('e2-tactical-look', 'look', ['Two traces share a clock: your phaser pulse and the Borg response. Scan the timing, then let Shelby’s laboratory turn it into a sequence the phaser arrays can execute.']),
          act('e2-tactical-wait', 'use', ['A repeated frequency is already failing. Scan the beam response, develop a rotating program with Shelby, and install it at the Emitter sequencer first.']),
        ]), kind: 'console', prop: null, x: 323, y: 61, width: 57, height: 53 },
        { ...object('e2-helm', 'Helm station', 0, 'console', [
          act('e2-helm-chart', 'scan', [
            'The nearby nebula is dense enough to confuse the cube’s sensors. Its bright outer rim carries violent magnetic shear; a darker channel bends behind the densest gas.',
            'You record a course along the low-shear channel. A straight dash toward the nearest cloud would expose the ship’s damaged shields to the worst of the turbulence.',
          ], {
            when: all('e2-tractor-broken'),
            effects: [fact('e2-nebula-charted'), item('e2-nebula-route')],
          }),
          act('e2-helm-chart-wait', 'scan', ['The tractor lock fixes the ship’s attitude and floods the close-range solution. Break that lock before plotting a navigable channel through the nebula.']),
          act('e2-helm-refuge', { item: 'e2-nebula-route' }, [
            'Picard accepts the plotted channel. Enterprise slips past the luminous rim and into the heavier gas. The cube disappears from the main viewer as the sensors lose their clean picture.',
            'Riker orders repair teams to use the respite. Cover is useful precisely because it is temporary; the Borg know which cloud you entered.',
          ], {
            when: all('e2-tractor-broken', 'e2-nebula-charted'),
            effects: [fact('e2-in-nebula'), evidence('e2-nebula-cover')],
          }),
          act('e2-helm-look', 'look', ['A nebula lies within impulse reach. The brightest opening is not the safest route; Scan its magnetic structure after the tractor lock is broken.']),
        ]), kind: 'console', prop: null, x: 98, y: 155, width: 28, height: 22 },
        person('e2-picard', 'picard', 1, [
          act('e2-picard-covered', 'talk', [
            '“We have used one surprise. Let us not assume it will work twice.” Picard wants Engineering’s deflector proposal prepared while the gas masks the ship.',
            'He has no explanation for the Borg’s interest in him. Riker does not offer a comforting one merely to fill the silence.',
          ], { when: all('e2-in-nebula') }),
          act('e2-picard-talk', 'talk', [
            '“They asked for me before they began cutting. That may tell us something about their intentions. It does not change our duty to this ship.”',
            'Picard asks Riker to get Shelby a usable beam recording. “If they are adapting to us, make them do more work.”',
          ]),
        ]),
        person('e2-worf', 'worf', 0, [
          act('e2-worf-talk', 'talk', [
            '“A stronger shot at the same frequency is producing a weaker result.” Worf has kept the firing records instead of overwriting them with the next attempt.',
            '“Give me a sequence faster than their adaptation cycle. I can aim it at the tractor emitter.”',
          ]),
        ]),
      ],
    },
    {
      id: 'e2-tactical', name: 'Tactical Laboratory', deck: 'Enterprise · Deck 8', visual: 'astrometrics', atmosphere: 'alert',
      description: 'Shelby has spread the first-contact records around a live spectrum bench. An emitter sequencer can translate a countermeasure into actual phaser timing. Its current program repeats a single powerful pulse.',
      ambient: 'The lights dip with each shield impact. Nobody waits for them to recover before finishing a calculation.',
      hotspots: [
        object('e2-spectrum', 'Spectrum bench', 0, 'console', [
          act('e2-spectrum-program', { item: 'e2-beam-record' }, [
            'The recording reveals a delay between the phaser hit and the cube’s adjusted response. You place each new frequency inside that delay rather than extending the previous pulse.',
            'Shelby checks the array limits. “Not random firing. A controlled rotation that stays one step ahead for long enough to loosen the tractor.” The bench writes a sequencer-ready program.',
          ], {
            when: all('e2-beam-sampled', 'e2-adaptation-window'),
            effects: [fact('e2-rotation-designed'), item('e2-rotation-program')],
          }),
          act('e2-spectrum-wait', { item: 'e2-beam-record' }, ['Ask Shelby how to use the adaptation delay before building the sequence. Changing frequency after the Borg have already adapted wastes the opening.']),
          act('e2-spectrum-look', 'look', ['The bench can compare an incoming Beam recording with Shelby’s adaptation model. It cannot reprogram the phaser arrays by itself.']),
          act('e2-spectrum-use', 'use', ['The repeated-pulse preset is the very pattern the Borg have already learned. Apply the Beam recording to construct a changing sequence.']),
        ]),
        object('e2-sequencer', 'Emitter sequencer', 1, 'terminal', [
          act('e2-sequencer-install', { item: 'e2-rotation-program' }, [
            'You load the sequence into the ship’s emitter controller. Shelby offsets the array handovers so no gap in firing stretches into a repeatable pause.',
            'The program is ready at Worf’s station. Riker returns the firing decision to the bridge, where it can be matched to Picard’s escape maneuver.',
          ], {
            when: all('e2-rotation-designed'),
            effects: [fact('e2-rotation-loaded')],
          }),
          act('e2-sequencer-look', 'look', ['A dedicated loading port takes the Rotation program. The spectrum bench designs the pulse train; this controller makes the real emitters follow it.']),
        ]),
        object('e2-tactical-notes', 'Adaptation notes', 2, 'padd', [
          act('e2-tactical-notes-look', 'look', ['Shelby has crossed out MAXIMUM OUTPUT and written RESPONSE TIME beneath it. The question is not how hard the ship can hit, but how long the enemy needs to understand the hit.']),
        ]),
        person('e2-shelby', 'shelby', 0, [
          act('e2-shelby-delegate', 'talk', [
            '“Your standing assignment let me keep the research team together. We have an adaptation model; your live recording tells us where its timing is wrong.”',
            'Shelby points to the interval after the first effective pulse. “Build the next frequency inside that window. Then load the result into the sequencer and let Worf put it on the tractor emitter.”',
          ], {
            when: { all: ['e2-beam-sampled'], choices: { leadership: 'delegate' } },
            effects: [fact('e2-adaptation-window')],
          }),
          act('e2-shelby-coordinate', 'talk', [
            '“We kept the bridge trials tied to the lab work. Now your firing record gives us the missing timing.” Shelby moves your agreed test slots beside the live response.',
            '“The rotation has to advance before the cube finishes adapting. Apply that recording here; I will check the emitter limits while you coordinate Worf’s firing window.”',
          ], {
            when: { all: ['e2-beam-sampled'], choices: { leadership: 'coordinate' } },
            effects: [fact('e2-adaptation-window')],
          }),
          act('e2-shelby-wait', 'talk', ['“I need the failed shots as much as the successful one. Scan the bridge Tactical board and bring the complete timing record.”']),
        ]),
      ],
    },
    {
      id: 'e2-engineering', name: 'Main Engineering', deck: 'Enterprise · Deck 36', visual: 'engineering', atmosphere: 'alert',
      description: 'Geordi’s team has opened the deflector power diagram across a distribution desk. A direct warp-energy feed could give the dish far more power than its ordinary navigational duty requires. The return branches were never designed for that service.',
      ambient: 'The core holds a steady pulse. Tools have been clipped to every available work surface against another sudden impact.',
      hotspots: [
        object('e2-distribution', 'Power distribution', 0, 'console', [
          act('e2-distribution-scan', 'scan', [
            'The auxiliary bus can carry alignment power, but not the proposed burst. A direct warp feed can do it; its return path presently runs through the navigational electronics.',
            'Your scan marks the overloaded branch on Geordi’s diagram. The solution must bypass that branch, not reinforce it and hope.',
          ], { when: all('e2-in-nebula'), effects: [fact('e2-power-mapped')] }),
          act('e2-distribution-scan-wait', 'scan', ['The ship is still feeding the battle load. Reach the nebula refuge before measuring a stable deflector power route.']),
          act('e2-distribution-route', { item: 'e2-deflector-schematic' }, [
            'You overlay the planned warp feed on the measured load paths. Geordi’s engineers take the navigational electronics out of the burst circuit and reserve the direct feed for the dish.',
            '“The controls are separated,” Geordi reports. “The induction return still needs a physical shunt in Deflector Control. Software cannot persuade that current to stop being current.”',
          ], {
            when: all('e2-power-mapped', 'e2-deflector-proposed', 'e2-in-nebula'),
            effects: [fact('e2-power-routed')],
          }),
          act('e2-distribution-route-wait', { item: 'e2-deflector-schematic' }, ['Scan Power distribution while the ship is sheltered. The schematic must fit the measured load path, not the nominal one.']),
          act('e2-distribution-look', 'look', ['The schematic shows a direct feed and a dangerous return branch. Scan the actual distribution, then apply Geordi’s Deflector schematic.']),
        ]),
        object('e2-shunt-locker', 'Shunt locker', 1, 'locker', [
          act('e2-shunt-installed', 'use', ['The induction shunt is installed in the Waveguide return. Leave it seated and test the alignment in Deflector Control.'], { when: all('e2-deflector-coupled') }),
          act('e2-shunt-issued', 'use', ['The correctly rated induction shunt is already in your inventory. Apply it to the Waveguide return in Deflector Control.'], { when: all('e2-shunt-issued') }),
          act('e2-shunt-take', 'use', [
            'With the route selected, Geordi chooses a shunt rated for the induced return load. You carry it to Deflector Control while his team secures the warp-power feed.',
            'The component has a directional coupling. Its arrow must face the return sink, not the emitter throat; the waveguide inspection marks will identify which is which.',
          ], {
            when: all('e2-power-routed'),
            effects: [fact('e2-shunt-issued'), item('e2-induction-shunt')],
          }),
          act('e2-shunt-look', 'look', ['Several similar shunts have very different current ratings. Establish the power route before taking one.']),
          act('e2-shunt-wait', 'use', ['Apply Geordi’s schematic to the scanned Power distribution first. He needs the actual load to select a shunt that will survive it.']),
        ]),
        object('e2-warp-feed', 'Warp feed', 2, 'conduit', [
          act('e2-warp-feed-look', 'look', ['The new feed draws on the same energy that normally moves the ship. A deflector discharge will be a major expenditure, not another phaser setting.']),
        ]),
        person('e2-geordi', 'geordi', 0, [
          act('e2-geordi-proposal', 'talk', [
            '“The main deflector can concentrate energy the phaser arrays cannot carry. If we couple a warp-power burst through it, we may punch through before their defenses adjust.”',
            'Geordi hands over the schematic. “It is a shot, not a sustained weapon. Map the distribution, isolate the ordinary circuits, and fit a shunt at the dish. Picard will decide when we charge it.”',
          ], {
            when: all('e2-in-nebula'),
            effects: [fact('e2-deflector-proposed'), item('e2-deflector-schematic'), evidence('e2-deflector-plan')],
          }),
          act('e2-geordi-wait', 'talk', ['“The ship is still fighting the tractor beam. Get us out of its grip and into cover; then I can take a stable power system apart long enough to build you another option.”']),
        ]),
      ],
    },
    {
      id: 'e2-deflector', name: 'Deflector Control', deck: 'Enterprise · Secondary hull', visual: 'relay', atmosphere: 'alert',
      description: 'A shielded waveguide disappears toward the great dish. Blue inspection marks lead toward the emitter; amber ones trace a return sink beneath the deck. A low-power alignment console is deliberately separate from the bridge’s firing control.',
      ambient: 'The deck carries a deep vibration from the dish. At present it is only navigational power.',
      hotspots: [
        object('e2-waveguide', 'Waveguide', 0, 'conduit', [
          act('e2-waveguide-look', 'look', [
            'The blue branch ends at the emitter throat. The amber branch leads away from it to the return sink. Installing the shunt toward the blue marks would send induced current back into the controls.',
            'Riker checks the directional arrow against the amber marks. The task is to give the returning energy somewhere harmless to go.',
          ], { effects: [fact('e2-return-identified')] }),
          act('e2-waveguide-fit', { item: 'e2-induction-shunt' }, [
            'With the feed locked out, you seat the shunt on the amber return branch, arrow toward the sink. The control circuit’s induced load falls away from the alignment display.',
            'Engineering confirms the connection from its end. The dish can now accept a test pulse without sending the pulse back through its own controls.',
          ], {
            when: all('e2-return-identified', 'e2-power-routed', 'e2-shunt-issued'),
            effects: [fact('e2-deflector-coupled'), { type: 'remove-item', id: 'e2-induction-shunt' }],
          }),
          act('e2-waveguide-fit-wait', { item: 'e2-induction-shunt' }, ['Look at the Waveguide first. The shunt is directional; identify the return sink before seating its coupling.']),
        ]),
        object('e2-alignment', 'Alignment console', 1, 'console', [
          act('e2-alignment-test', 'use', [
            'A low-power pulse crosses the dish. The emitter stays aligned and the return sink absorbs the induced current without feeding the control bus.',
            'Geordi’s voice reaches you over the intercom. “The path holds. Report ready to the captain. Full charging and firing remain bridge orders.”',
          ], {
            when: all('e2-in-nebula', 'e2-power-routed', 'e2-deflector-coupled'),
            effects: [fact('e2-deflector-ready'), evidence('e2-deflector-alignment')],
          }),
          act('e2-alignment-look', 'look', ['This station tests the alignment only. Route the warp feed in Engineering and shunt the Waveguide return before using it.']),
          act('e2-alignment-wait', 'use', ['The test is inhibited until Engineering routes the power and the Waveguide’s induction return is coupled to its sink.']),
        ]),
        object('e2-dish-window', 'Dish inspection port', 2, 'viewport', [
          act('e2-dish-window-look', 'look', ['The deflector was built to push dust out of the ship’s path. The proposed burst will ask it to become a weapon for a few seconds. No one can promise what it will look like afterward.']),
        ]),
      ],
    },
  ],
};
