import type { Chapter } from '../model';
import { act, all, decision, evidence, fact, item, next, object, objective, person } from './builders';

export const chapter1: Chapter = {
  id: 1,
  title: 'The Empty Chair',
  subtitle: 'First, make the ship capable of telling you the truth.',
  stardate: '44002.1',
  intro: [
    'Jean-Luc Picard has been taken from the Enterprise. The Borg vessel is moving toward Earth. Its last transmission used his face, but Riker will not let that image become the only fact anyone remembers about him.',
    'Starfleet’s scattered emergency traffic contradicts itself. The ship has damage, frightened families, and a civilian tender asking for help. Riker is the acting captain. No one else will make his decisions, and he cannot do everyone else’s work.',
    'There is no hidden countdown. Inspect the ship, ask the specialists what their readings mean, and apply records or equipment where the evidence belongs. A command may be urgent without being blind.',
  ],
  objectives: [
    objective('c1-command', 'Establish witnessed local command.', all('command-secured'), [
      'A working chair is not the same thing as lawful command.',
      'Look at the empty chair and talk to Worf about the command transfer.',
      'After looking at the Chair and talking to Worf, Use the Command seal on the bridge.',
    ]),
    objective('c1-damage', 'Reconcile the bridge report with the actual power damage.', all('damage-reconciled'), [
      'The green damage board and engineering’s warning cannot both describe the same moment.',
      'Look at the bridge Damage board, scan the engineering Bypass, and ask Geordi how reports are queued.',
      'Use the Command PADD on the Repair desk after those three observations.',
    ]),
    objective('c1-quarantine', 'Clear the passengers without overlooking the cargo.', all('quarantine-secured'), [
      'A life-sign count is not an accusation. Find two independent records.',
      'Read the tender Manifest, talk to Crusher, look at the Birth record, and compare with your PADD at Records. Scan the tender Crate separately.',
      'After comparison and the crate scan, talk to Crusher again for authorization. Use the Crate to order powerless containment.',
    ]),
    objective('c1-tender', 'Make and record a viable tender disposition.', all('evacuation-decided'), [
      'Either safe option costs something the ship may need later.',
      'Look at Sickbay’s Bed board to learn the bed-versus-shuttle constraint.',
      'With command, repairs, quarantine, and logistics settled, talk to Shelby on the bridge. Choose a disposition; then Use the Chair.',
    ]),
  ],
  rooms: [
    {
      id: 'c1-bridge', name: 'Main Bridge', deck: 'Deck 1', visual: 'bridge', atmosphere: 'damaged',
      description: 'The center chair is turned a few degrees away from the viewscreen. A forgotten cup has left a pale ring on its arm. Above the tactical rail, a black seam crosses a display that insists everything is green. The crew have left room for Riker, but not yet made a ritual of watching him sit down.',
      ambient: 'A relay clicks twice where it used to click once. The bridge crew are speaking quietly and precisely.',
      hotspots: [
        { ...object('c1-chair', 'Chair', 1, 'chair', [
          act('c1-chair-end', 'use', [
            'Riker rests one hand on the arm of the chair. “The tender has a safe disposition. Engineering has a report we can stand behind. We will not confuse a loud signal with an order.”',
            'Shelby transfers a newly arrived dispatch to the ready-room reader. Its authentication strip is flawless. Its timing is not.',
          ], { when: all('command-secured', 'damage-reconciled', 'quarantine-secured', 'evacuation-decided'), effects: [next(2, 'c2-ready')] }),
          act('c1-chair-look', 'look', [
            'The chair’s command inset still displays PICARD. The damage control inset is dark. Neither tells you whether the ship will recognize your authority when the next external instruction arrives.',
            'Riker: “Leave his personal settings alone. Change the authorization chain.” Worf glances toward the command seal.',
          ], { effects: [fact('chair-observed')] }),
          act('c1-chair-wait', 'use', [
            'There is work that cannot be done by sitting here: establish local command, reconcile the damage, quarantine the suspect cargo, and decide how to protect the tender. The objective log records what remains.',
          ]),
        ]), kind: 'object', prop: null, x: 211, y: 141, width: 58, height: 61 },
        { ...object('c1-seal', 'Command seal', 0, 'console', [
          act('c1-seal-done', 'use', ['Your command seal is already active. No remote message can quietly replace the officer responsible for this ship.'], { when: all('command-secured') }),
          act('c1-seal-authorize', 'use', [
            'Worf witnesses the transfer. Data’s procedural check accepts Riker as the local command authority. Emergency traffic remains available, but it can no longer execute instructions merely by arriving.',
            'Worf: “The crew will know whose decision they are carrying out.” Riker: “And whose decision they may question.”',
          ], { when: all('chair-observed', 'command-protocol'), effects: [fact('command-secured'), evidence('command-seal')] }),
          act('c1-seal-look', 'look', ['A recessed seal switch is separate from the ordinary communications controls. Its witness field is empty. Worf can explain why the separation matters.']),
          act('c1-seal-wait', 'use', ['Inspect the Chair and ask Worf to witness local command before authorizing the transfer.']),
        ]), kind: 'console', prop: null, x: 98, y: 155, width: 28, height: 22 },
        { ...object('c1-board', 'Damage board', 2, 'console', [
          act('c1-board-look', 'look', [
            'A narrow burn crosses the primary telemetry indicator. Behind the damaged glass the all-clear repeats at identical intervals, even when the engineering warning sounds.',
            'The bridge log is a snapshot, not a measurement. Your PADD can compare it with an actual engineering reading.',
          ], { effects: [fact('bridge-damage-seen'), evidence('bridge-damage')] }),
          act('c1-board-scan', 'scan', ['The display is healthy enough to repeat stale data. Scanning it does not measure the engine room. Look at its physical damage, then ask Engineering for a local test.']),
        ]), kind: 'console', prop: null, x: 323, y: 61, width: 57, height: 53 },
        person('c1-worf', 'worf', 0, [
          act('c1-worf-talk', 'talk', [
            '“An authenticated order can reach the ship while her captain cannot. We must not allow the first to stand in for the second.”',
            'Worf explains the witness procedure: inspect the command assignment, obtain a bridge officer’s witness, then authorize the separate command seal. He will retain the incoming messages as evidence rather than destroy them.',
            'Riker: “Keep the chain of responsibility short enough for a frightened ensign to understand.” Worf: “Yours. Then ours.”',
          ], { effects: [fact('command-protocol')] }),
          act('c1-worf-look', 'look', ['Worf has moved a security station so its operator can see the main entrance without turning away from the board. There is vigilance here, not a search for someone to blame.']),
        ]),
        person('c1-shelby', 'shelby', 1, [
          act('c1-shelby-settled', 'talk', [
            '“The tender’s disposition is in the log. Changing our minds now would strand people between procedures. Finish the bridge authorization and we can examine the new dispatch.”',
          ], { when: all('evacuation-decided') }),
          act('c1-tender-choice', 'talk', [
            'Shelby places two resource assignments side by side. “We can take thirteen people aboard and preserve our ready shuttle. Or keep their own vessel flying under shuttle escort and preserve the annex.”',
            '“Aboard means those medical beds stay occupied until we arrange a staffed alternative. Escort means the shuttle is not ours to spend twice. I recommend we record the constraint as carefully as the promise.”',
          ], {
            when: { all: ['command-secured', 'damage-reconciled', 'quarantine-secured', 'logistics-read'], none: ['evacuation-decided'] },
            choices: [
              { id: 'aboard', label: 'Bring the passengers aboard', description: 'Safest immediate care; the isolation annex will be occupied.',
                confirm: 'Receive all thirteen passengers aboard? Their care will occupy the isolation annex until you arrange a staffed alternative. Your ready shuttle remains available.',
                requires: { none: ['evacuation-decided'] }, effects: [decision('evacuation', 'aboard'), fact('evacuation-decided')],
                response: ['Crusher receives the families into the annex. The Marigold follows under remote tow with its powerless cargo enclosure locked. Your ready shuttle remains available, but those beds now belong to people.'] },
              { id: 'escort', label: 'Keep the tender under shuttle escort', description: 'Preserve the annex; commit the ready medical shuttle.',
                confirm: 'Commit the medical shuttle to Marigold? You will retain the isolation annex, but the shuttle cannot be reassigned without honoring its passengers and escort duty.',
                requires: { none: ['evacuation-decided'] }, effects: [decision('evacuation', 'escort'), fact('evacuation-decided')],
                response: ['Vale retains her bridge and her passengers. A medical team transfers to the Enterprise’s shuttle and takes station beside Marigold. The annex remains available; the shuttle has a duty it cannot simply abandon.'] },
            ],
          }),
          act('c1-shelby-talk', 'talk', [
            '“I would like every able hull facing the threat. But an unexamined quarantine can paralyze us as effectively as an attack.”',
            'She asks for a witnessed command transfer, a reconciled damage report, a safe cargo disposition, and a bed-and-shuttle assessment before recommending a tender plan. “Then it will be your choice, not the first choice we thought of.”',
          ]),
        ]),
      ],
    },
    {
      id: 'c1-engineering', name: 'Primary Power Gallery', deck: 'Deck 36', visual: 'engineering', atmosphere: 'damaged',
      description: 'The warp core’s light is steady, which makes the damage around it more conspicuous. An empty conduit rests on padded blocks beside a cable carrying the load it once carried. Someone has drawn arrows on a transparent repair board instead of trusting its automatic colors.',
      ambient: 'The bypass has a low, uneven hum. Engineers answer one another by name before touching a control.',
      hotspots: [
        object('c1-bypass', 'Bypass', 0, 'conduit', [
          act('c1-bypass-scan', 'scan', [
            'The bypass is warm under a real load. The burned primary is cold. The engineering alarm refers to the primary’s loss; the bridge all-clear predates it.',
            'Geordi’s team signs the measurement. You are not being asked to repair a plasma bus with a handheld instrument—only to compare the evidence before assigning the ship a job.',
          ], { effects: [fact('bus-tested'), evidence('bus-damage')] }),
          act('c1-bypass-look', 'look', ['Amber light travels along the temporary cable while the original conduit sits dark on blocks. This is a useful place for a Scan; a green icon elsewhere cannot tell you what is carrying power.']),
        ]),
        object('c1-repair', 'Repair desk', 1, 'console', [
          act('c1-repair-padd', { item: 'padd' }, [
            'You place the bridge snapshot beside Geordi’s local load test. Once the timestamps are aligned, the contradiction disappears. The ship has working propulsion and an unreliable primary telemetry path.',
            'Riker authorizes the bypass inspection and reserves engineering time for local verification. Geordi assigns his technicians. “That I can build a schedule around.”',
          ], { when: all('bridge-damage-seen', 'bus-tested', 'damage-explained'), effects: [fact('damage-reconciled'), evidence('damage-reconciled')] }),
          act('c1-repair-wait', { item: 'padd' }, ['The comparison needs the bridge Damage board, a Scan of the Bypass, and Geordi’s explanation of the report queue.']),
          act('c1-repair-look', 'look', ['Two empty comparison columns are labeled REPORTED and MEASURED. A Command PADD can place independent records side by side here.']),
        ]),
        object('c1-scar', 'Old conduit', 2, 'conduit', [
          act('c1-scar-look', 'look', [
            'A jagged split runs through the outer sheath. Beneath it, a technician has written the names of the people who verified the replacement.',
            'Riker remembers a junior officer once asking whether an engineer’s signature was really necessary on a captain’s report. He has a better answer today.',
          ]),
        ]),
        person('c1-geordi', 'geordi', 0, [
          act('c1-geordi-talk', 'talk', [
            '“The bridge is showing the last complete report. Mine is the first incomplete one. Put them together and you get a damaged ship that still works—not an engineer who cried wolf.”',
            'Reports wait in separate queues when the primary bus drops. Geordi asks you to inspect the bridge board and scan the physical bypass before putting your PADD on the repair desk.',
            '“Give me an honest mission profile. I’ll give you an honest limit. Please don’t let a green rectangle negotiate between us.”',
          ], { effects: [fact('damage-explained')] }),
        ]),
        person('c1-obrien', 'obrien', 1, [
          act('c1-obrien-talk', 'talk', [
            '“People think a backup is another copy of the same thing. Sometimes it’s one person reading a gauge while another writes it down.”',
            'He has assigned runners to critical systems. The arrangement is slow enough to notice when two reports disagree. He considers that an advantage.',
          ]),
        ]),
      ],
    },
    {
      id: 'c1-tender', name: 'Marigold Docking Vestibule', deck: 'Port docking collar', visual: 'tender', atmosphere: 'normal',
      description: 'The tender’s vestibule smells of warm insulation and boiled water. A child’s mitten has been wedged beneath a rattling panel. A sealed crate sits on an insulated pallet, pointedly not plugged into the convenient charging socket beside it.',
      ambient: 'Beyond the inner hatch, someone is singing quietly to a child who was not aboard at departure.',
      hotspots: [
        object('c1-manifest', 'Manifest', 0, 'console', [
          act('c1-manifest-read', 'look', [
            'Twelve passengers are listed at departure. An addition in a different hand reads “medical change en route—ask Dr. Crusher.” Cargo includes a sealed depot recovery crate, collected after the station evacuation.',
            'Vale gives you a copy. The record is useful precisely because it admits something changed.',
          ], { effects: [item('manifest'), fact('manifest-read'), evidence('tender-manifest')] }),
        ]),
        object('c1-crate', 'Crate', 1, 'crate', [
          act('c1-crate-secured', 'use', ['The crate is already sealed in a powerless enclosure. Worf’s team retains the scan and Crusher’s authorization; nobody has had to surrender their name to a suspicion.'], { when: all('quarantine-secured') }),
          act('c1-crate-contain', 'use', [
            'At your authorization, security moves the pallet into a powerless enclosure. The medical team screens the passengers through a separate route.',
            'Vale asks whether her people are prisoners. Riker answers, “No. The cargo is a hazard. Your people are people.” The distinction goes into the written order.',
          ], { when: all('quarantine-authorized'), effects: [fact('quarantine-secured')] }),
          act('c1-crate-scan', 'scan', [
            'Thin conductive filaments lie beneath the seal, concentrated around a salvaged power connector. They are dormant now; a tiny induced current makes them contract.',
            'The extra life sign did not explain this. Record the scan and ask Crusher to authorize separate cargo containment after the passenger records are reconciled.',
          ], { effects: [fact('cargo-scanned'), evidence('cargo-filaments')] }),
          act('c1-crate-look', 'look', ['The socket beside the pallet has been taped over. The crate’s seal is intact, but an intact seal only proves nobody opened it after salvage.']),
          act('c1-crate-wait', 'use', ['Containment needs a scanned hazard, reconciled passenger records, and Crusher’s explicit authorization. Do not plug the crate into anything.']),
        ]),
        object('c1-dock-window', 'Dock window', 2, 'viewport', [
          act('c1-dock-window-look', 'look', ['Marigold’s patched bow hangs against the Enterprise’s lights. A small ship has very little room to hide damage, or fear. Its maneuvering thrusters are functional; escort is a genuine option, not a polite name for abandonment.']),
        ]),
        person('c1-vale', 'vale', 0, [
          act('c1-vale-talk', 'talk', [
            '“We took the crate because the depot label said medical power. My mechanic stopped us connecting it. He said it felt too light.”',
            'Vale does not ask you to certify her judgment. She asks you to tell her passengers what is happening before moving them. “They’ve had enough instructions from voices behind doors.”',
            'She confirms the departure manifest predates the birth. “Thirteen now. It should be good news.”',
          ]),
        ]),
        person('c1-troi', 'troi', 1, [
          act('c1-troi-talk', 'talk', [
            '“Fear makes a discrepancy feel like an explanation. If we call the thirteenth life sign an intruder before checking the records, every fact afterward will have to fight that first word.”',
            'Troi has arranged for the passengers to hear the quarantine terms in person. She cannot scan the cargo with empathy, and does not pretend otherwise.',
          ]),
        ]),
      ],
    },
    {
      id: 'c1-sickbay', name: 'Sickbay Intake', deck: 'Deck 12', visual: 'sickbay', atmosphere: 'normal',
      description: 'The intake ward is ready for more patients than it can comfortably hold. A fresh infant wristband curls beside an older departure record. On the capacity board, the same shuttle symbol appears beside both evacuation and emergency receiving duty.',
      ambient: 'A nurse asks someone how they would like their name pronounced before printing it.',
      hotspots: [
        object('c1-birth', 'Birth record', 0, 'padd', [
          act('c1-birth-look', 'look', [
            'The wristband reads NERI. Its time is later than the Marigold’s departure. The incubator record agrees: one infant, one mother, no unexplained adult life sign.',
            'The band is not yours to take. You record its time with permission.',
          ], { effects: [fact('birth-observed'), evidence('birth-band')] }),
        ]),
        object('c1-med-records', 'Records', 1, 'console', [
          act('c1-records-compare', { item: 'padd' }, [
            'Twelve people at departure, a documented birth, thirteen people at arrival. Crusher signs the reconciled count. The salvaged crate remains a separate unresolved hazard.',
            'Riker: “No one is to refer to the infant as the anomaly.” Crusher: “I have already corrected two reports.”',
          ], { when: all('manifest-read', 'medical-report-read', 'birth-observed'), effects: [fact('manifest-compared'), evidence('manifest-compared')] }),
          act('c1-records-manifest', { item: 'manifest' }, [
            'Crusher compares the departure names with her medical report and the birth record. The count reconciles exactly. The cargo scan is still required.',
          ], { when: all('medical-report-read', 'birth-observed'), effects: [fact('manifest-compared'), evidence('manifest-compared')] }),
          act('c1-records-medical', { item: 'medical-report' }, [
            'The signed medical report and observed wristband account for the departure manifest’s missing name. Neri is added to the living count.',
          ], { when: all('manifest-read', 'birth-observed'), effects: [fact('manifest-compared'), evidence('manifest-compared')] }),
          act('c1-records-wait', { item: 'padd' }, ['Read the tender Manifest, talk to Crusher for the medical report, and Look at the Birth record before comparing.']),
          act('c1-records-look', 'look', ['The intake console accepts a manifest, a medical report, or your Command PADD as a comparison record. It cannot supply an observation you have not made.']),
        ]),
        object('c1-beds', 'Bed board', 2, 'console', [
          act('c1-beds-look', 'look', [
            'The annex can accommodate all thirteen passengers, but then it cannot receive an isolated surgical case without a staffed overflow plan. The ready shuttle can instead escort the tender, but then it cannot serve as a receiving buffer.',
            'Crusher insists both commitments be entered in the resource log. “There is no square on this board marked ‘somewhere else.’”',
          ], { effects: [fact('logistics-read'), evidence('tender-logistics')] }),
        ]),
        person('c1-crusher', 'crusher', 0, [
          act('c1-crusher-authorize', 'talk', [
            '“The people are accounted for. The crate is not harmless. Keep it unpowered and physically separate; screen the passengers without detaining them as suspects.”',
            'Crusher signs the procedure and asks Worf to witness containment. Return to the tender and Use the Crate to authorize her plan.',
          ], { when: all('manifest-compared', 'cargo-scanned'), effects: [fact('quarantine-authorized'), evidence('quarantine-plan')] }),
          act('c1-crusher-report', 'talk', [
            '“A birth, Will. Not a disguised boarding party. The mother and child are stable. Here is my signed report; compare it with the manifest and the band at intake.”',
            '“That clears a discrepancy, not every object on the tender. Scan the cargo separately. Then bring me both results and I will authorize a quarantine that fits the actual risk.”',
          ], { effects: [item('medical-report'), fact('medical-report-read'), evidence('tender-medical')] }),
        ]),
        person('c1-guinan', 'guinan', 1, [
          act('c1-guinan-talk', 'talk', [
            'Guinan is holding a cup that has not been offered as medicine. “A captain used to ask me whether people were ready. Usually they were asking whether they were ready themselves.”',
            'Riker looks toward the empty annex. “And what did you tell them?”',
            '“Mostly? Who needed another blanket.” She nods toward the capacity board. “The large questions will wait while you answer one of the small ones honestly.”',
          ]),
        ]),
      ],
    },
  ],
};
