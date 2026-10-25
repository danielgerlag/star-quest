import type { Chapter } from '../model';
import { act, all, evidence, fact, item, next, object, objective, person } from './builders';

export const chapter3: Chapter = {
  id: 3, title: 'The Scattered Fleet',
  subtitle: 'Find the ships before asking them to follow.', stardate: '44003.0',
  intro: [
    'The fleet is not a line of intact ships waiting for a speech. It is separated crews, damaged engines, and uncertain coordinates. A rescue tug has sent one short request: “Tell us where it is safe to go.”',
    'Your relay decision is now a working constraint. Radio silence requires physical triangulation. Supervised reception requires a fresh noise comparison. The fleet will need evidence, usable support equipment, and an evacuation lane before it can offer reliable help.',
  ],
  objectives: [
    objective('c3-locate', 'Reconstruct fleet positions using the chosen relay procedure.', all('fleet-located'), [
      'Ask Data to explain the two position methods. Follow the one your relay supports.',
      'Cut relay: Look at the Split star, Scan the Dead buoy, Look at the Mast crescent, then Use the Sight shutter. Supervised: Scan the Carrier reader.',
      'For supervised reception, apply the Supervised noise profile to the Carrier reader after the live Scan and Data’s briefing. Both routes produce Fleet coordinates.',
    ]),
    objective('c3-salvage', 'Certify practical support from the recovered pallet.', all('salvage-certified'), [
      'The usable object is not necessarily the most impressive crate.',
      'Look at the Salvage pallet, Scan the Load bench, and talk to Geordi.',
      'Use the Release console after those checks. Geordi issues a rechargeable Certified power cell and reserves rescue gear.',
    ]),
    objective('c3-warn', 'Give the scattered captains a warning they can independently verify.', all('fleet-warned'), [
      'Coordinates tell you where to send a warning; proof tells them why to act.',
      'First locate the fleet and certify the support equipment.',
      'Apply Origin proof to the Carrier reader in the Rescue Array. You need not reconnect the suspect relay to send a narrow-beam warning.',
    ]),
    objective('c3-lane', 'Prepare a physically safe evacuation lane and accept support.', all('lane-ready'), [
      'A plotted route is not ready until its hardware and patient limits are checked.',
      'Look at the Frosted hatch and talk to Crusher. Apply the Certified power cell to Beacon sockets.',
      'Apply your PADD to the Lane board after locating the fleet and warming the beacons. With the warning also sent, Use Rendezvous in Cartography.',
    ]),
  ],
  rooms: [
    {
      id: 'c3-chart', name: 'Stellar Cartography', deck: 'Deck 10', visual: 'astrometrics', atmosphere: 'alert',
      description: 'The star map has been stripped of decorative grids. A paired blue star and a dark navigation buoy remain as measured objects. Fleet symbols sit in a margin labeled UNCONFIRMED, rather than at coordinates nobody can defend.',
      ambient: 'Data reads uncertainties aloud. Worf repeats the largest one before entering a bearing.',
      hotspots: [
        object('c3-star', 'Split star', 0, 'viewport', [
          act('c3-star-look', 'look', [
            'A dark notch divides two blue stars through the damaged aperture. Their separation is distinctive enough to serve as the first visual bearing.',
            'A bearing is a direction, not a location. Data will need two independent companions before calling it a position.',
          ], { effects: [fact('bearing-one'), evidence('bearing-one')] }),
        ]),
        object('c3-buoy', 'Dead buoy', 1, 'console', [
          act('c3-buoy-scan', 'scan', [
            'The buoy will not transmit, but its metal body returns your scan. Its range and bearing form a second independent measurement.',
            'Its stored coordinates are deliberately ignored. A broken instrument can still be a useful object.',
          ], { effects: [fact('bearing-two'), evidence('bearing-two')] }),
          act('c3-buoy-look', 'look', ['The buoy’s image is dark, but its sunlit edge is sharp. Scan the physical object instead of asking it for a navigation message.']),
        ]),
        object('c3-rendezvous', 'Rendezvous', 2, 'console', [
          act('c3-rendezvous-end', 'use', [
            'Four captains acknowledge the full plan. Sable can make two shielded firing passes. Kestrel can observe without transmitting a command carrier. Wayfarer offers medical staff. The tug Morrow offers rescue lift.',
            'Shelby records their limits beside their names. Riker accepts cooperation, not obedience. The support agreement can now authorize later requests without conjuring resources from an empty map.',
            'One passive observer reports a breathing irregularity inside the Borg vessel. It is not a message. It may be a person.',
          ], {
            when: all('fleet-located', 'salvage-certified', 'fleet-warned', 'lane-ready'),
            effects: [fact('fleet-supported'), evidence('fleet-support'), item('support-record'), next(4, 'c4-sensor')],
          }),
          act('c3-rendezvous-look', 'look', ['Each captain’s name has four blank fields: verified position, support capacity, authenticated warning, and safe evacuation lane. Cooperation must rest on all four.']),
          act('c3-rendezvous-wait', 'use', ['Locate the fleet, certify salvage support, send the Origin proof through the Rescue Array, and prepare the evacuation lane before accepting rendezvous.']),
        ]),
        person('c3-data', 'data', 0, [
          act('c3-data-cut', 'talk', [
            '“With the relay cut, we need three independent measurements: the split star here, the dead buoy’s reflected range, and the crescent behind the rescue mast at the array.”',
            '“Observe the star, scan the buoy, observe the crescent. Then authorize the array’s Sight shutter. I will calculate the intersecting uncertainty regions.”',
            'Riker: “Not a point?” Data: “A point would imply more certainty than we possess.”',
          ], { when: { choices: { relay: 'cut' } }, effects: [fact('coordinate-method')] }),
          act('c3-data-supervised', 'talk', [
            '“Supervised reception preserves local-clock samples, not clean ones. The carrier’s noise has changed since Geordi recorded it.”',
            '“Scan the Carrier reader at the Rescue Array. Then apply the stored noise profile there. I can fit the old and new spectra without treating either as an instruction.”',
            'He will reject the solution if it depends on an unverified command header. Riker authorizes the slower check.',
          ], { effects: [fact('coordinate-method')] }),
        ]),
        person('c3-worf', 'worf', 1, [
          act('c3-worf-talk', 'talk', [
            '“A captain cannot protect a ship that exists only as a symbol on our map.” Worf has removed the customary arrows from the unconfirmed positions.',
            'Riker asks whether that looks discouraging. “It looks like work still to be done.”',
          ]),
        ]),
      ],
    },
    {
      id: 'c3-wreck', name: 'Salvage Receiving Hold', deck: 'Deck 23', visual: 'cargo', atmosphere: 'damaged',
      description: 'A recovered pallet is secured to the deck by four bright straps. A rescue beacon has survived beside a crushed weapons casing. The power cell’s test leads have been attached but not energized. A chalk circle keeps hurried feet outside the unsafe scrap.',
      ambient: 'A loose fragment ticks against a strap whenever the ship changes attitude.',
      hotspots: [
        object('c3-pallet', 'Salvage pallet', 0, 'crate', [
          act('c3-pallet-look', 'look', [
            'Tow couplings and beacon housings are intact. The weapons casing is crushed into its own trigger assembly. The rechargeable power cell has no visible swelling.',
            'The useful salvage will help people move safely. There is no need to make the most dangerous object justify the trip.',
          ], { effects: [fact('salvage-observed'), evidence('salvage-map')] }),
        ]),
        object('c3-load', 'Load bench', 1, 'console', [
          act('c3-load-scan', 'scan', [
            'The cell holds voltage under the simulated beacon load. The recovery curve is stable. A scar in the casing is superficial; Geordi’s thermal check finds no internal breach.',
            'The cell can be recharged and reused after configuration tests. It is not a second warp core.',
          ], { effects: [fact('cell-tested'), evidence('cell-test')] }),
        ]),
        object('c3-release', 'Release console', 2, 'console', [
          act('c3-release-use', 'use', [
            'Geordi certifies the power cell, assigns a service team, and releases the beacon housings for the evacuation lane. The unsafe weapons scrap remains inert under guard.',
            'Riker signs for support capacity rather than a trophy. Shelby adds the tow couplings to the fleet’s rescue offer.',
          ], { when: all('salvage-observed', 'cell-tested', 'salvage-briefed'), effects: [fact('salvage-certified'), item('support-cell')] }),
          act('c3-release-wait', 'use', ['Inspect the pallet, Scan the load test, and ask Geordi what the salvage can safely support.']),
          act('c3-release-look', 'look', ['The release fields separate tested rescue equipment from unsafe weapon remnants. A captain’s signature cannot substitute for the missing load test.']),
        ]),
        person('c3-geordi', 'geordi', 0, [
          act('c3-geordi-talk', 'talk', [
            '“We can get reliable beacon power and a tow connection out of this. If we chase the weapons pack, we could lose the hold.”',
            '“Look at the pallet, scan the load bench, then authorize release. My crew will do the servicing. You tell the fleet what we can genuinely offer.”',
            'Riker: “Sometimes command means not asking for the miracle.” Geordi: “Today I’ll settle for a clear inventory.”',
          ], { effects: [fact('salvage-briefed')] }),
        ]),
        person('c3-shelby', 'shelby', 1, [
          act('c3-shelby-talk', 'talk', [
            '“I was trained to ask what a wreck could add to the next attack.” Shelby looks at the beacon housings. “A way out is an answer I should have asked for sooner.”',
            'She will not promise the fleet unlimited support. A cell, a lane, and a truthful warning are enough to begin a relationship.',
          ]),
        ]),
      ],
    },
    {
      id: 'c3-array', name: 'Rescue Signal Array', deck: 'Deck 4', visual: 'relay', atmosphere: 'damaged',
      description: 'A manual sight shutter has been fitted over a scarred sensor aperture. Through it, a sliver of moon hangs behind a distant broken mast. A carrier reader and a separate narrow-beam transmitter share a desk, but not a data path.',
      ambient: 'A volunteer reads each outgoing header aloud while another checks its local signature.',
      hotspots: [
        object('c3-crescent', 'Mast crescent', 0, 'viewport', [
          act('c3-crescent-look', 'look', [
            'The thin moon just clears Morrow’s broken sensor mast. Their angular separation supplies the third visual bearing. The mast is a real object with a shadow, not an authenticated position report.',
            'With the split star and buoy range, the Sight shutter can now support a solution in radio silence.',
          ], { effects: [fact('bearing-three'), evidence('bearing-three')] }),
        ]),
        object('c3-shutter', 'Sight shutter', 1, 'shutter', [
          act('c3-shutter-solve', 'use', [
            'O’Brien steps the shutter through the three measured directions. Data intersects the uncertainty regions and checks the fleet against the resulting picture.',
            'Three damaged ships and a tug acquire positions with honest margins. The silence has cost labor, not safety.',
          ], {
            when: { all: ['bearing-one', 'bearing-two', 'bearing-three', 'coordinate-method'], choices: { relay: 'cut' } },
            effects: [fact('fleet-located'), evidence('fleet-coordinates')],
          }),
          act('c3-shutter-supervised', 'use', ['Your supervised relay supports a different procedure: Scan the Carrier reader, then apply the Supervised noise profile after Data’s briefing.'], { when: { choices: { relay: 'supervised' } } }),
          act('c3-shutter-wait', 'use', ['Ask Data for the method, Look at the Split star, Scan the Dead buoy, and Look at the Mast crescent. Three independent measurements are required.']),
          act('c3-shutter-look', 'look', ['The shutter has physical index marks for three directions. It can constrain a visual solution; it cannot manufacture a missing bearing.']),
        ]),
        object('c3-carrier', 'Carrier reader', 2, 'console', [
          act('c3-carrier-warning', { item: 'proof-record' }, [
            'You authorize a narrow-beam transmission of the three-part proof to the verified positions. This independent transmitter does not reopen the suspect command relay.',
            'The captains reproduce the receipt and origin tests. One replies, “We can explain that to our own people.” The answer is better than an automatic acknowledgement.',
          ], { when: all('fleet-located', 'salvage-certified'), effects: [fact('fleet-warned'), evidence('fleet-warning')] }),
          act('c3-carrier-warning-wait', { item: 'proof-record' }, ['First establish reliable fleet coordinates and certified support. The warning will then include a usable offer of help, not just a reason to be afraid.']),
          act('c3-carrier-noise', { item: 'noise-profile' }, [
            'Data aligns the stored noise spectrum against the live measurement. The changing peak is removed from the navigation samples, not mistaken for a moving ship.',
            'Independent local-clock returns now resolve three damaged ships and Morrow. The supervised route has preserved information, at the cost of active verification.',
          ], {
            when: { all: ['live-noise-scanned', 'coordinate-method'], choices: { relay: 'supervised' } },
            effects: [fact('fleet-located'), evidence('fleet-coordinates')],
          }),
          act('c3-carrier-noise-wait', { item: 'noise-profile' }, ['A stored noise profile needs a fresh Scan of this reader and Data’s position-method briefing.']),
          act('c3-carrier-scan-live', 'scan', [
            'The noise peak has shifted since the relay decision. If the old correction were applied unchanged, it would drag a fleet marker across the debris field.',
            'You store the live spectrum. Apply the Supervised noise profile here so Data can fit both measurements.',
          ], { when: { choices: { relay: 'supervised' } }, effects: [fact('live-noise-scanned'), evidence('live-interference')] }),
          act('c3-carrier-scan-cut', 'scan', ['The suspect carrier is physically cut. There is no live sample to clean. Use the visual method Data described; the independent outgoing transmitter remains available.']),
          act('c3-carrier-look', 'look', ['The incoming reader and outgoing narrow-beam set have separate power indicators. Origin proof can be sent without restoring the carrier that delivered the false order.']),
        ]),
        person('c3-obrien', 'obrien', 0, [
          act('c3-obrien-talk', 'talk', [
            '“Incoming navigation is one piece of equipment. Outgoing narrow-beam rescue traffic is another. Cutting the first doesn’t mean we have to wave our arms out a window.”',
            'He will aim the warning only after the positions are verified. “A fine message sent to the wrong piece of space is still the wrong message.”',
          ]),
        ]),
        person('c3-vale', 'vale', 1, [
          act('c3-vale-talk', 'talk', [
            'Vale is representing the civilian vessels at a relay terminal. “Tell captains why a route is safe, not just that you’ve named it safe.”',
            'She knows Morrow’s damaged silhouette. Its crew towed her station’s last lifeboat before answering the Enterprise. The broken mast has already earned its place in your navigation solution.',
          ]),
        ]),
      ],
    },
    {
      id: 'c3-lane', name: 'Aft Evacuation Bay', deck: 'Deck 13 aft', visual: 'shuttlebay', atmosphere: 'damaged',
      description: 'A pale frost band crosses the outer hatch. Beside it, beacon sockets wait under flexible covers. The lane board has separate columns for ship clearance and patient acceleration; neither is subordinate to the other.',
      ambient: 'A cargo handler counts down a lift movement, then waits for the medic’s answer before moving.',
      hotspots: [
        object('c3-hatch', 'Frosted hatch', 0, 'hatch', [
          act('c3-hatch-look', 'look', [
            'Ice from a ruptured tank reaches the beacon contacts. Full power would flash it into a cloud directly across the approach sensors.',
            'The obstruction needs a controlled warm-up. The power cell can supply that under a technician’s supervision.',
          ], { effects: [fact('lane-hazard-seen'), evidence('lane-hazard')] }),
        ]),
        object('c3-sockets', 'Beacon sockets', 1, 'beacon', [
          act('c3-sockets-cell', { item: 'support-cell' }, [
            'Your authorization assigns the certified cell and service team to a staged warm-up. The ice loosens without a blinding vapor plume; the beacon housings lock into clean contacts.',
            'The cell is recharged after the test and returned to your equipment allocation. The installed beacons now use the repaired bay supply.',
          ], { when: all('lane-hazard-seen', 'patient-spacing'), effects: [fact('lane-lit')] }),
          act('c3-sockets-wait', { item: 'support-cell' }, ['Look at the Frosted hatch and ask Crusher for patient-safe spacing before energizing the lane.']),
          act('c3-sockets-look', 'look', ['The sockets are physically intact, but their icy contacts need a staged warm-up using the Certified power cell.']),
        ]),
        object('c3-lane-board', 'Lane board', 2, 'console', [
          act('c3-lane-padd', { item: 'padd' }, [
            'You compare the verified fleet margins with Crusher’s acceleration limits and the live beacon checks. Shelby plots a lane outside both the debris field and the future firing approach.',
            'The protected lane is entered into every captain’s plan. It is not available for weapons merely because the next tactical display needs more room.',
          ], { when: all('fleet-located', 'lane-lit', 'salvage-certified'), effects: [fact('lane-ready'), evidence('lane-ready')] }),
          act('c3-lane-wait', { item: 'padd' }, ['The board needs verified fleet positions, certified salvage support, and warmed, working beacons.']),
          act('c3-lane-look', 'look', ['The final comparison belongs here: use your Command PADD after observing the hardware and preparing the beacon sockets.']),
        ]),
        person('c3-crusher', 'crusher', 0, [
          act('c3-crusher-talk', 'talk', [
            '“An evacuation lane cannot demand the acceleration of a torpedo. Some of these people have spinal injuries. Others have been awake for two days.”',
            'Crusher supplies spacing and acceleration limits. “Warm the iced contacts gradually, test the beacons, then compare the route with the fleet’s measured positions.”',
          ], { effects: [fact('patient-spacing')] }),
        ]),
        person('c3-troi', 'troi', 1, [
          act('c3-troi-talk', 'talk', [
            '“A way out changes how people hear a request to stand and fight. It means we are not depending on their having no alternative.”',
            'She has asked each ship to tell its civilians where they will go, rather than promise they will never have to leave.',
          ]),
        ]),
      ],
    },
  ],
};
