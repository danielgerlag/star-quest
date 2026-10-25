import type { Chapter } from '../model';
import { act, all, evidence, fact, item, next, object, objective, person } from '../campaign/builders';

export const chapter3: Chapter = {
  id: 3,
  title: 'The Captain’s Knowledge',
  subtitle: 'A rescue attempt. One prepared shot. No clean answer.',
  stardate: '43989.5',
  assignment: 'ACTING CAPTAIN',
  intro: [
    'Picard is aboard the Borg cube. Riker takes command of Enterprise while Shelby prepares the initial away mission. The deflector weapon has passed its alignment test, but has not been charged or fired.',
    'Riker will direct the mission from Enterprise. The transporter room’s uplink carries the team’s survey, telemetry, and targeting orders; visiting it does not put him on the cube.',
  ],
  objectives: [
    objective('e3-away', 'Investigate aboard the cube and bring the initial away team home.', all('e3-warp-disabled', 'e3-team-returned'), [
      'Riker commands the team from Enterprise. Begin at the bridge Command chair.',
      'In Away-team Control, Look at the Survey feed, Scan Node telemetry, and apply the Node spectrum to the Targeting uplink.',
      'Use the Survey feed after the warp nodes are disabled, then Use the Transporter lock to extract the team.',
    ]),
    objective('e3-locutus', 'Hear the transmission identifying Locutus.', all('locutus-revealed'), [
      'The uniform is not proof that Picard is dead. The team has to follow the evidence farther.',
      'The Survey feed reveals what has happened after you disable the warp nodes.',
      'After extracting the team, Use the bridge Hailing station. The Borg have a new voice.',
    ]),
    objective('e3-shot', 'Fire the deflector and establish why it failed.', all('deflector-failed', 'e3-knowledge-assimilated'), [
      'The prepared weapon still needs its full-power thermal settings.',
      'After the Locutus transmission, Scan the Coolant manifold in Engineering, talk to Geordi, and apply the Thermal envelope to the Charge regulator.',
      'Use the bridge Deflector fire control and confirm the shot. Then Scan Return telemetry. The shot fails even when correctly prepared.',
    ]),
    objective('e3-assume-command', 'Accept promotion, appoint Shelby, and pursue the cube.', all('riker-promoted', 'shelby-appointed', 'e3-pursuit-laid'), [
      'With the deflector spent, Enterprise still needs a captain and a first officer.',
      'After analyzing the failure, Use Fleet communications in the Ready Room and talk to Shelby.',
      'Apply the Fleet rendezvous orders to the bridge Helm repeater, then Use the Command chair. Hanson’s fleet is gathering at Wolf 359.',
    ]),
  ],
  rooms: [
    {
      id: 'e3-bridge', name: 'Main Bridge', deck: 'Enterprise · Deck 1', visual: 'bridge', atmosphere: 'damaged',
      description: 'Picard’s place is empty. Riker has the center station, but keeps his attention on the away-team board and the cube’s movement reports. A separate firing control waits for the weapon designed while Picard was still aboard.',
      ambient: 'Crew members correct “captain” to “commander,” then stop correcting themselves. There is work to finish.',
      hotspots: [
        { ...object('e3-command', 'Command chair', 1, 'chair', [
          act('e3-command-pursue', 'use', [
            'Riker sends Enterprise after the cube. The deflector is spent, Picard’s knowledge belongs to the enemy, and Hanson’s fleet is gathering between that enemy and Earth.',
            'Shelby takes the first officer’s station. “Pursuit course steady.” Riker answers without looking toward the empty place beside him. “Let’s reach them.”',
          ], {
            when: all('picard-abducted', 'locutus-revealed', 'deflector-failed', 'riker-promoted', 'shelby-appointed', 'e3-pursuit-laid'),
            effects: [next(4, 'e4-observation')],
          }),
          act('e3-command-team-home', 'use', ['The initial away team is home. Hear the Borg transmission, resolve the deflector shot, then receive Fleet’s orders and lay in pursuit.'], { when: all('e3-team-returned') }),
          act('e3-command-team-out', 'use', ['Shelby’s party is aboard the cube. Direct its search through Away-team Control; Riker must remain with Enterprise.'], { when: all('e3-team-away') }),
          act('e3-command-send', 'use', [
            'Riker authorizes Shelby’s initial away mission. Her team will search for Picard and identify a way to delay the cube; Enterprise will maintain the transport link.',
            'He does not join them. Someone has to keep the ship ready to receive the party, and someone has to decide what to do if the search fails.',
          ], { when: all('picard-abducted'), effects: [fact('e3-team-away')] }),
          act('e3-command-look', 'look', ['The center station carries three pending tasks: support the away party, bring the deflector to full charge, and answer Fleet. None can replace the others.']),
        ]), kind: 'object', prop: null, x: 211, y: 141, width: 58, height: 61 },
        { ...object('e3-hailing', 'Hailing station', 0, 'console', [
          act('e3-hailing-locutus', 'use', [
            'The face on the transmission is Picard’s, altered by implants and a fixed mechanical stare. The voice names itself Locutus and describes the Enterprise’s resistance as information already absorbed.',
            'Locutus: “The knowledge you brought against us is no longer yours alone. Your ship’s choices are familiar.” Riker cuts the reply channel before anyone can mistake recognition for consent.',
          ], {
            when: all('e3-assimilation-seen', 'e3-team-returned'),
            speaker: 'locutus',
            effects: [fact('locutus-revealed'), evidence('e3-locutus-transmission')],
          }),
          act('e3-hailing-look', 'look', ['The Borg carrier is waiting. Keep the initial away-team channel clear until O’Brien brings the party back.']),
          act('e3-hailing-wait', 'use', ['The away team is still searching. Follow its Survey feed and recover the party before opening the Borg transmission.']),
        ]), kind: 'console', prop: null, x: 99, y: 60, width: 55, height: 54 },
        { ...object('e3-fire-control', 'Deflector fire control', 0, 'console', [
          act('e3-fire-spent', 'use', [
            'The discharge has already failed. Engineering reports a spent deflector power assembly; there is no identical second shot waiting behind the first.',
            'Scan Return telemetry. The next decision needs an explanation of the failure, not an order to repeat it.',
          ], { when: all('deflector-failed') }),
          act('e3-fire-order', 'use', [
            'The team is home, the cube’s warp nodes are disabled, and Geordi reports full charge. Picard is still aboard the target. There is no remaining part of this decision Riker can assign to an instrument.',
            'Shelby waits at tactical. Riker has to choose whether to fire the weapon they prepared to stop the cube.',
          ], {
            when: { all: ['e3-team-returned', 'e3-warp-disabled', 'locutus-revealed', 'e3-deflector-charged'], none: ['e3-shot-fired'] },
            choices: [
              {
                id: 'e3-fire', label: 'Fire the main deflector',
                description: 'Use the fully charged weapon against the cube while Picard remains aboard.',
                confirm: 'Order the deflector discharge? The away team is safe aboard Enterprise, but Picard is still on the cube. This expends the prepared weapon.',
                requires: { all: ['e3-team-returned', 'e3-deflector-charged', 'locutus-revealed'], none: ['e3-shot-fired'] },
                effects: [fact('e3-shot-fired'), fact('deflector-failed'), evidence('e3-deflector-result')],
                response: [
                  'Riker gives the firing order. Energy pours through the main deflector and strikes the cube. Its shield envelope changes before the peak of the discharge; the hull behind it remains intact.',
                  'The dish goes dark. Geordi reports that the burst reached its specified output and exhausted the assembly. Correct preparation has produced no victory. Riker asks for the return telemetry.',
                ],
              },
              {
                id: 'e3-hold', label: 'Hold while I review the stations',
                description: 'Leave the weapon charged and return to the available evidence.',
                response: ['Riker holds the order. The charge remains available; the crew will not fire until he returns to this control and makes the decision.'],
              },
            ],
          }),
          act('e3-fire-look', 'look', ['This is the bridge firing authorization, not the low-power alignment test. It requires the team aboard, the Locutus transmission heard, and Geordi’s full charge.']),
          act('e3-fire-wait', 'use', ['Recover Shelby’s initial away team, hear the Locutus transmission, and complete the full-power thermal setup in Engineering.']),
        ]), kind: 'console', prop: null, x: 98, y: 155, width: 28, height: 22 },
        { ...object('e3-telemetry', 'Return telemetry', 2, 'console', [
          act('e3-telemetry-scan', 'scan', [
            'The shield response did not begin after the burst arrived. It was already shaped for the weapon’s timing and energy distribution. Your discharge log matches the preparation Picard knew before his abduction.',
            'Shelby: “They didn’t learn this shot from being hit. They learned it from him.” The Borg have assimilated Picard’s tactical knowledge. A perfect execution of a familiar plan is now a vulnerability.',
          ], {
            when: all('deflector-failed'),
            effects: [fact('e3-knowledge-assimilated'), evidence('e3-assimilated-tactics')],
          }),
          act('e3-telemetry-look', 'look', ['The recorder compares outgoing energy with the target’s shield response. It will show whether the planned burst reached the cube, and when the cube reacted.']),
          act('e3-telemetry-wait', 'scan', ['There is no deflector return to analyze yet. Complete the charge and issue the firing order.']),
        ]), kind: 'console', prop: null, x: 323, y: 61, width: 57, height: 53 },
        { ...object('e3-helm', 'Helm repeater', 1, 'console', [
          act('e3-helm-course', { item: 'e3-rendezvous-orders' }, [
            'You plot the fleet rendezvous at Wolf 359 against the cube’s renewed course toward Earth. Shelby assigns pursuit stations while Engineering brings the ship back to sustained warp readiness.',
            'There is no route that gives you the spent deflector shot back. The plot does offer a way to reach Hanson’s fleet and continue the fight.',
          ], {
            when: all('riker-promoted', 'shelby-appointed', 'deflector-failed'),
            effects: [fact('e3-pursuit-laid')],
          }),
          act('e3-helm-course-wait', { item: 'e3-rendezvous-orders' }, ['Appoint Shelby as first officer before assigning pursuit stations. The commission and the working chain of command must agree.']),
          act('e3-helm-look', 'look', ['Fleet rendezvous orders belong in this repeater. Once Shelby has her assignment, it can coordinate pursuit with the restored warp drive.']),
        ]), kind: 'console', prop: null, x: 155, y: 63, width: 55, height: 51 },
        person('e3-troi', 'troi', 1, [
          act('e3-troi-locutus', 'talk', [
            '“Recognizing him is not the same as hearing his choice.” Troi watches the closed transmission channel.',
            '“You can care about Jean-Luc and still be responsible for everyone else. Neither responsibility will make the other painless.”',
          ], { when: all('locutus-revealed') }),
          act('e3-troi-talk', 'talk', ['“The crew are looking for a task because a task has edges. Give them real work, Will. Do not promise an outcome you cannot promise yourself.”']),
        ]),
      ],
    },
    {
      id: 'e3-mission', name: 'Away-team Control', deck: 'Enterprise · Transporter Room 3', visual: 'transporter', atmosphere: 'alert',
      description: 'Riker remains beside the transporter console aboard Enterprise. Shelby’s remote survey fills one display; another tracks the party’s signal through the cube. O’Brien has kept the return controls clear of the tactical targeting uplink.',
      ambient: 'Remote footsteps arrive through the comm channel, slightly delayed. None of them are Riker’s.',
      hotspots: [
        object('e3-survey-feed', 'Survey feed', 0, 'terminal', [
          act('e3-survey-home', 'use', ['The recovered team’s survey is now an archive. Picard remained aboard the cube; the bridge Hailing station holds the next live transmission.'], { when: all('e3-team-returned') }),
          act('e3-survey-assimilation', 'use', [
            'With the warp nodes down, Shelby follows movement beyond the disabled distribution branch. The remote image catches Picard: uniform gone, implants attached, standing among the Borg rather than struggling against them.',
            'Shelby: “We have him in sight, but we cannot separate his signal from the equipment around him. They are reacting to us now.” Riker orders the party back to the transporter window, not deeper into the cube.',
          ], {
            when: all('e3-warp-disabled', 'e3-uniform-found'),
            speaker: 'shelby',
            effects: [fact('e3-assimilation-seen'), evidence('e3-assimilation-report')],
          }),
          act('e3-survey-uniform', 'look', [
            'Shelby’s camera settles on a torn command-red uniform caught beside an alcove. The collar identifies it as Picard’s. There is no body with it.',
            'Riker asks her to preserve the scan and continue searching. The clothing locates where Picard was taken; it does not establish where he is now, or whether he can still be recovered.',
          ], {
            when: all('e3-team-away'),
            speaker: 'shelby',
            effects: [fact('e3-uniform-found'), evidence('e3-away-uniform')],
          }),
          act('e3-survey-look-wait', 'look', ['The remote feed is dark until Riker dispatches Shelby’s initial team from the bridge Command chair.']),
          act('e3-survey-wait', 'use', ['Inspect the uniform on the Survey feed, map the warp nodes with Node telemetry, and send a targeted disruption order through the Targeting uplink.']),
        ]),
        object('e3-node-telemetry', 'Node telemetry', 1, 'console', [
          act('e3-node-scan', 'scan', [
            'The away team’s sensor stream shows two node groups. One cycles with the cube’s warp field; the other remains steady when the field changes. Hitting the bright, steady group would not stop propulsion.',
            'You isolate the phase-locked warp distribution signature and package it as a targeting spectrum. Shelby can disable those nodes without firing indiscriminately around the missing captain.',
          ], {
            when: all('e3-team-away', 'e3-uniform-found'),
            effects: [fact('e3-nodes-mapped'), item('e3-node-spectrum')],
          }),
          act('e3-node-look', 'look', ['The scan command analyzes the team’s remote telemetry, not the transporter-room floor. Correlate node pulses with the cube’s warp field rather than choosing the brightest node.']),
          act('e3-node-wait', 'scan', ['Dispatch the away team and inspect its Survey feed. The uniform discovery marks the area from which the node telemetry was collected.']),
        ]),
        object('e3-targeting', 'Targeting uplink', 2, 'terminal', [
          act('e3-targeting-done', { item: 'e3-node-spectrum' }, ['The warp nodes are already disabled. Shelby’s next report is on the Survey feed; more firing will not improve the search.'], { when: all('e3-warp-disabled') }),
          act('e3-targeting-disrupt', { item: 'e3-node-spectrum' }, [
            'Riker sends only the phase-locked node group to Shelby’s targeting display. She directs the team’s phasers across those junctions in succession.',
            'The cube’s warp field collapses. It can repair the damage, but for now Enterprise has time to complete the deflector charge. The team continues toward the movement beyond the nodes.',
          ], {
            when: all('e3-team-away', 'e3-uniform-found', 'e3-nodes-mapped'),
            speaker: 'shelby',
            effects: [fact('e3-warp-disabled'), evidence('e3-warp-nodes')],
          }),
          act('e3-targeting-look', 'look', ['The uplink transmits target designations to Shelby, not automatic fire commands to Borg machinery. Apply the Node spectrum from the remote scan.']),
          act('e3-targeting-use', 'use', ['A general order to shoot the power nodes would miss the distinction between warp distribution and the surrounding systems. Apply the correlated Node spectrum.']),
        ]),
        { ...object('e3-transporter-lock', 'Transporter lock', 1, 'platform', [
          act('e3-transporter-home', 'use', ['The initial away team is already aboard. Picard’s signature was inseparable from the cube’s local systems; this return did not rescue him.'], { when: all('e3-team-returned') }),
          act('e3-transporter-recover', 'use', [
            'O’Brien catches the party at the remaining transport window. Riker gives the recall order, and the away team appears on Enterprise’s pads as the Borg response closes behind them.',
            'The buffer holds only the away team. Picard was not locked, and did not come with them. Shelby turns toward Riker with the image of the implants still on her display.',
          ], {
            when: all('e3-warp-disabled', 'e3-assimilation-seen'),
            effects: [fact('e3-team-returned')],
          }),
          act('e3-transporter-look', 'look', ['O’Brien is tracking the initial party’s return signals. Keep the recall available while you direct the search; Riker is already on this side of the transporter.']),
          act('e3-transporter-wait', 'use', ['Follow the initial search through the uniform discovery, warp-node disruption, and the team’s next Survey feed report before issuing the recall.']),
        ]), x: 189, y: 229, width: 100, height: 37 },
        person('e3-obrien', 'obrien', 0, [
          act('e3-obrien-talk', 'talk', [
            '“The lock follows our people’s signals. It is not a list of everyone standing near them.” O’Brien keeps his hand above the recall controls.',
            '“If they find the captain tied into that machinery, I will need a separate lock on him. I cannot promise that by widening the beam.”',
          ]),
        ]),
      ],
    },
    {
      id: 'e3-engineering', name: 'Deflector Power Gallery', deck: 'Enterprise · Deck 36', visual: 'engineering', atmosphere: 'damaged',
      description: 'The circuit prepared in the nebula is still intact. Geordi now needs its full-power charge profile. Coolant flow has changed under battle damage, so the safe burst duration must come from a live thermal measurement.',
      ambient: 'The warp core is steady, but the deflector feed is quiet. No energy crosses it without a bridge order.',
      hotspots: [
        object('e3-coolant', 'Coolant manifold', 0, 'conduit', [
          act('e3-coolant-scan', 'scan', [
            'The main coolant loop is intact; an auxiliary branch has lost flow. The available thermal margin supports one concentrated burst, not a prolonged discharge.',
            'You save the measured envelope. A nominal full-flow preset would hold the charge longer than the damaged return assembly can tolerate.',
          ], {
            when: all('locutus-revealed'),
            effects: [fact('e3-thermal-measured'), item('e3-coolant-profile')],
          }),
          act('e3-coolant-look', 'look', ['The auxiliary flow indicator sits below its normal mark. Scan the manifold after the team is home and the Borg transmission has been heard.']),
          act('e3-coolant-wait', 'scan', ['The initial away operation is still in progress. Complete it and hear the bridge transmission before fixing the final charge envelope.']),
        ]),
        object('e3-charge', 'Charge regulator', 1, 'console', [
          act('e3-charge-spent', { item: 'e3-coolant-profile' }, ['The firing assembly has spent its charge and exceeded its reusable duty cycle. A thermal profile cannot restore it; the bridge has the failed shot’s telemetry.'], { when: all('deflector-failed') }),
          act('e3-charge-prepare', { item: 'e3-coolant-profile' }, [
            'You apply the live thermal envelope to Geordi’s pulse design. The regulator concentrates the available energy within the safe duration rather than stretching the burst through the failing auxiliary loop.',
            'Geordi brings the prepared feed to full charge. “Output and alignment are on target. The team is aboard. The bridge has the firing control.”',
          ], {
            when: all('e2-deflector-ready', 'e3-thermal-measured', 'e3-charge-explained', 'e3-team-returned', 'locutus-revealed'),
            effects: [fact('e3-deflector-charged')],
          }),
          act('e3-charge-prepare-wait', { item: 'e3-coolant-profile' }, ['Geordi must explain the full-power pulse before you set its thermal envelope. The initial team must also be safely aboard.']),
          act('e3-charge-look', 'look', ['The regulator accepts the live Thermal envelope, not the older nominal preset. The nebula alignment is complete; this station performs the full charge.']),
          act('e3-charge-use', 'use', ['The nominal duration exceeds the measured cooling capacity. Scan the Coolant manifold, talk to Geordi, and apply the resulting Thermal envelope.']),
        ]),
        object('e3-feed-status', 'Feed status', 2, 'terminal', [
          act('e3-feed-after', 'look', [
            'The spent feed recorded the specified energy leaving the ship. This is not evidence of a loose coupling or a weak charge.',
            'The return recorder on the bridge can explain what the cube did with a correctly delivered shot.',
          ], { when: all('deflector-failed') }),
          act('e3-feed-look', 'look', ['The shunt installed in the nebula remains seated toward the return sink. The low-power work has survived; it does not need to be performed again.']),
        ]),
        person('e3-geordi', 'geordi', 0, [
          act('e3-geordi-after', 'talk', [
            '“The weapon did what we built it to do. The cube was ready for exactly that.” Geordi has already stopped the team from trying to force a second charge into the exhausted assembly.',
            '“Read the return timing, Commander. We need a different idea, not a more determined repetition.”',
          ], { when: all('deflector-failed') }),
          act('e3-geordi-charge', 'talk', [
            '“Shelby bought us a stationary target. We can put the entire burst into the deflector instead of trying to sustain it while chasing their warp field.”',
            'Geordi indicates the coolant manifold. “Read the actual thermal margin and set the regulator from that. The plan is still the one we prepared before the captain was taken.”',
          ], {
            when: all('locutus-revealed'),
            effects: [fact('e3-charge-explained')],
          }),
          act('e3-geordi-wait', 'talk', ['“The nebula modifications are holding. Complete the initial away mission and hear the incoming transmission; I can finish the charge once the ship is ready for the firing decision.”']),
        ]),
      ],
    },
    {
      id: 'e3-ready', name: 'Captain’s Ready Room', deck: 'Enterprise · Deck 1', visual: 'ready-room', atmosphere: 'alert',
      description: 'The Melbourne offer has been pushed aside by an emergency fleet channel. Riker has not moved Picard’s books. A second duty station has been left clear for someone to take up the work he cannot keep doing alone.',
      ambient: 'Fleet traffic arrives in short bursts. More ships acknowledge than can yet reach the same patch of space.',
      hotspots: [
        object('e3-fleet-comms', 'Fleet communications', 0, 'console', [
          act('e3-fleet-established', 'use', ['Hanson’s commission and rendezvous orders are recorded. Appoint Shelby, then put the Fleet rendezvous orders into the bridge Helm repeater.'], { when: all('riker-promoted') }),
          act('e3-fleet-promotion', 'use', [
            'Hanson hears the deflector report without asking Riker to make it less bleak. He grants an emergency field promotion to captain and places Enterprise under Riker’s command.',
            '“The fleet will meet the cube at Wolf 359. Bring your ship back into the line as soon as she can make the run.” The commission arrives with rendezvous orders, not a ceremony.',
          ], {
            when: all('deflector-failed', 'e3-knowledge-assimilated', 'locutus-revealed', 'e3-team-returned'),
            speaker: 'hanson',
            effects: [fact('riker-promoted'), item('e3-rendezvous-orders'), evidence('e3-field-promotion')],
          }),
          act('e3-fleet-look', 'look', ['Hanson is assembling ships at Wolf 359. He needs the result of the deflector engagement and its implications before revising Enterprise’s orders.']),
          act('e3-fleet-wait', 'use', ['Fire the prepared deflector and Scan Return telemetry before giving Hanson your report. A failed shot and an understood failure are not the same report.']),
        ]),
        object('e3-first-officer-desk', 'Second station', 1, 'padd', [
          act('e3-second-station-look', 'look', ['The new roster has two empty command fields, not one. Riker cannot fill both by working harder. Shelby has earned the first officer’s station, whatever their earlier disagreements.']),
        ]),
        object('e3-ready-books', 'Captain’s books', 2, 'locker', [
          act('e3-books-look', 'look', ['The bindings are untouched. Riker can take responsibility for the ship without pretending its missing captain never occupied this room.']),
        ]),
        person('e3-shelby', 'shelby', 1, [
          act('e3-shelby-appointed', 'talk', [
            '“I have the watch, Captain.” Shelby does not linger over the new address. She is checking the pursuit assignments.',
            'Riker has not solved the Borg by appointing her. He has stopped trying to solve command by standing in two places.',
          ], { when: all('shelby-appointed') }),
          act('e3-shelby-appoint-delegate', 'talk', [
            'Riker tells Shelby she is his first officer. “I trusted you with the specialist team. Now I need that judgment across the ship, including when you think mine is wrong.”',
            '“Then I will tell you,” she answers. She takes the roster and begins filling the bridge watch while Riker turns to the pursuit orders.',
          ], {
            when: { all: ['riker-promoted', 'e3-team-returned'], choices: { leadership: 'delegate' } },
            effects: [fact('shelby-appointed'), evidence('e3-first-officer')],
          }),
          act('e3-shelby-appoint-coordinate', 'talk', [
            '“We have spent this crisis learning how to share a tactical problem,” Riker says. “I need you to share command of the ship. You are my first officer.”',
            'Shelby accepts without pretending their disagreements have disappeared. She takes the watch assignments; Riker keeps the final decisions, and no longer has to carry every one alone.',
          ], {
            when: { all: ['riker-promoted', 'e3-team-returned'], choices: { leadership: 'coordinate' } },
            effects: [fact('shelby-appointed'), evidence('e3-first-officer')],
          }),
          act('e3-shelby-wait', 'talk', [
            '“I saw him standing there. Then I watched the weapon fail.” Shelby keeps the away-team report open rather than dressing it up as a successful rescue.',
            '“Hanson needs the facts. After that, we need a command structure that can act on them.”',
          ]),
        ], all('e3-team-returned')),
      ],
    },
  ],
};
