import type { Chapter } from '../model';
import { act, all, decision, evidence, fact, item, next, object, objective, person } from './builders';

export const chapter4: Chapter = {
  id: 4, title: 'A Human Signal',
  subtitle: 'A person is not an access code.', stardate: '44003.6',
  intro: [
    'Fleet observers have found a small irregularity in the Borg carrier: a rhythm that follows breath rather than a machine’s polling cycle. It may be Picard. It is not permission to command the Collective through him.',
    'A rescue needs a location, an isolated transport path, a real receiving space, and a decision about how much you will ask of a vulnerable mind. The tender commitment will determine what receiving space is actually available.',
  ],
  objectives: [
    objective('c4-trace', 'Locate one human body without treating its signal as authority.', all('trace-locked'), [
      'The sensor picture contains a biological rhythm and a physical opening.',
      'Scan the Respiratory trace, Look at Repair shutters, and talk to Data.',
      'Apply the Fleet support agreement to the Parallax desk to obtain independent observer bearings.',
    ]),
    objective('c4-receive', 'Honor the tender commitment while preparing isolated reception.', all('receiving-ready'), [
      'Ask Crusher for the protocol after locating Picard. Inspect the beds before assigning them.',
      'Passengers aboard: Look at the Partition plan, then use your PADD on Medical dispatch to staff an overflow ward. Escort: Look at Medical dispatch to confirm the shuttle’s assignment.',
      'For Escort, apply the Fleet support agreement to Medical dispatch to reallocate Morrow as the independent buffer. Nobody is abandoned to create a spare resource.',
    ]),
    objective('c4-transport', 'Configure a physically isolated, bounded transport.', all('transport-ready'), [
      'A diagnostic connection can be a return path even when the main system is isolated.',
      'Scan the Diagnostic lead and talk to O’Brien. Apply the Optical isolator to that lead. Apply the Medical isolation kit to the Receiving pad.',
      'Look at the Dwell dial, then Use it after the trace, receiving plan, isolation, and canopy are ready.',
    ]),
    objective('c4-person', 'Choose a contact protocol, extract Picard, and hear the result.', all('picard-debriefed'), [
      'Look at the Patient monitor and talk to Troi in the Isolation Room.',
      'Once transport is ready, talk to Troi again and choose medical or tactical contact. Use the Receiving pad to authorize extraction.',
      'Return to the Isolation Room and Talk to Picard. Then Use the Parallax desk to proceed. His recovery will reflect the protocol you chose.',
    ]),
  ],
  rooms: [
    {
      id: 'c4-sensor', name: 'Long-Range Sensor Gallery', deck: 'Deck 9', visual: 'astrometrics', atmosphere: 'alert',
      description: 'A green carrier trace fills one screen. A smaller amber line underneath refuses to repeat with machine precision. On the hull image, repair shutters expose and cover a narrow cavity. The gallery has become a place for noticing what almost fits.',
      ambient: 'The sensor technician has muted the carrier tone so the room can discuss a person instead of listening to machinery.',
      hotspots: [
        object('c4-cadence', 'Respiratory trace', 0, 'console', [
          act('c4-cadence-scan', 'scan', [
            'The amber modulation changes with respiration. It does not repeat at the carrier’s polling rate. A second return suggests a human circulation pattern under heavy support.',
            'Data labels the observation “candidate life sign,” not “Picard’s message.” It can help locate him without pretending to know his wishes.',
          ], { effects: [fact('human-cadence-seen'), evidence('human-cadence')] }),
          act('c4-cadence-look', 'look', ['One line varies while the larger pattern repeats. Scan the variation; its irregularity may be the useful part.']),
        ]),
        object('c4-shutters', 'Repair shutters', 1, 'viewport', [
          act('c4-shutters-look', 'look', [
            'Repair shutters slide past a small cavity, briefly exposing its interior to the observers. The gap moves with a local maintenance cycle.',
            'This is access to a place, not control of a vessel. The rest of the cube continues its work without noticing that distinction.',
          ], { effects: [fact('maintenance-observed'), evidence('maintenance-gap')] }),
        ]),
        object('c4-parallax', 'Parallax desk', 2, 'console', [
          act('c4-parallax-end', 'use', [
            'Riker seals the medical record against tactical requests beyond the consented protocol. The fleet receives only the operational results it needs.',
            'Picard is aboard. Earth is still in danger. Neither fact cancels the other.',
          ], { when: all('picard-extracted', 'picard-debriefed'), effects: [next(5, 'c5-lab')] }),
          act('c4-parallax-trace', { item: 'support-record' }, [
            'Kestrel takes a second passive bearing while the Enterprise follows the respiratory variation. Data intersects the returns within the observed cavity and excludes the neighboring machinery from the target volume.',
            'You authorize a rescue study, not an assault on the patient. The resulting Human carrier trace can support a bounded transport.',
          ], { when: all('human-cadence-seen', 'maintenance-observed', 'trace-explained'), effects: [fact('trace-locked'), item('picard-trace'), evidence('picard-location')] }),
          act('c4-parallax-wait-record', { item: 'support-record' }, ['First Scan the Respiratory trace, Look at Repair shutters, and ask Data how independent parallax can distinguish a body from a carrier signal.']),
          act('c4-parallax-look', 'look', ['The Fleet support agreement can request a passive observer here. The captain authorizes coordination; Data calculates the location.']),
          act('c4-parallax-wait', 'use', ['Locate Picard, configure safe reception and transport, choose a contact protocol, extract him, and hear the medical debrief before preparing the attack.']),
        ]),
        person('c4-data', 'data', 0, [
          act('c4-data-talk', 'talk', [
            '“The cadence is evidence of physiology. It is not a secret vocabulary, and I cannot translate it into instructions for the Borg.”',
            'Data proposes combining your local scan, the observed shutter gap, and an independent fleet bearing. Apply the Fleet support agreement to the Parallax desk when the observations are recorded.',
            '“The uncertainty may be reduced enough to bring one body home. That is a sufficiently important result without enlarging the claim.”',
          ], { effects: [fact('trace-explained')] }),
        ]),
        person('c4-worf', 'worf', 1, [
          act('c4-worf-talk', 'talk', [
            '“My security detail will protect the receiving room from outside intrusion. It will not stand over his bed with weapons drawn.”',
            'Riker asks for both precautions in writing. Worf nods. “A patient should not have to guess which one we remember.”',
          ]),
        ]),
      ],
    },
    {
      id: 'c4-medical', name: 'Medical Logistics Annex', deck: 'Deck 12 forward', visual: 'sickbay', atmosphere: 'alert',
      description: 'The annex’s bed display shows names rather than abstract capacity. A transparent partition plan is clipped over the room layout. The dispatch console has space for one receiving buffer, and will not assign the same craft two duties.',
      ambient: 'A quartermaster reads assignments back to a nurse. Both wait for the other to finish.',
      hotspots: [
        object('c4-beds', 'Annex beds', 0, 'console', [
          act('c4-beds-aboard', 'look', [
            'Marigold’s passengers occupy the annex, just as your earlier order promised. A sleeping parent has folded a coat beneath the newborn’s carrier.',
            'They cannot be displaced into a corridor to make this board look available. The Partition plan shows where a properly staffed overflow ward could go.',
          ], { when: { choices: { evacuation: 'aboard' } }, effects: [fact('receiving-beds-seen'), evidence('occupied-annex')] }),
          act('c4-beds-escort', 'look', [
            'The annex is available because Marigold remains under shuttle escort. The beds have independent air and power, but the usual shuttle receiving buffer is not here.',
            'Inspect Medical dispatch before treating an empty bed as a complete rescue plan.',
          ], { effects: [fact('receiving-beds-seen')] }),
        ]),
        object('c4-partition', 'Partition plan', 1, 'padd', [
          act('c4-partition-look', 'look', [
            'A lounge can become an overflow ward if Wayfarer provides nurses and the Enterprise installs an independent life-support partition. The plan includes privacy, sanitation, and a parent’s sleeping place.',
            'It is not instant spare capacity. Your PADD can authorize the specific staff and equipment assignment at Medical dispatch.',
          ], { effects: [fact('overflow-plan-seen')] }),
        ]),
        object('c4-med-dispatch', 'Medical dispatch', 2, 'console', [
          act('c4-med-dispatch-aboard', { item: 'padd' }, [
            'You authorize the staffed overflow ward, request Wayfarer’s nurses, and reserve independent life support. Crusher moves the Marigold families only after the new ward passes her inspection.',
            'The annex is now available for isolated reception. The tender passengers retain equivalent care; no one has become an obstacle to a captain’s rescue.',
          ], {
            when: { all: ['receiving-beds-seen', 'overflow-plan-seen', 'extraction-protocol'], choices: { evacuation: 'aboard' } },
            effects: [fact('receiving-ready'), evidence('receiving-plan')],
          }),
          act('c4-med-dispatch-escort', { item: 'support-record' }, [
            'Morrow’s captain accepts the receiving-buffer assignment. The tug’s independent transport volume will hold an emergency pattern if the Enterprise must interrupt reception.',
            'The medical shuttle remains beside Marigold. Crusher verifies the tug’s isolation and signs the receiving plan. A resource was reassigned openly instead of borrowed from a promise.',
          ], {
            when: { all: ['receiving-beds-seen', 'shuttle-assignment-seen', 'extraction-protocol'], choices: { evacuation: 'escort' } },
            effects: [fact('receiving-ready'), evidence('receiving-plan')],
          }),
          act('c4-med-dispatch-look-escort', 'look', [
            'The ready shuttle is marked MARIGOLD ESCORT. Its medical team cannot leave without breaking the tender plan. The Fleet support agreement lists Morrow as a possible independent receiving buffer.',
            'Use that agreement here after Crusher briefs the extraction protocol.',
          ], { when: { choices: { evacuation: 'escort' } }, effects: [fact('shuttle-assignment-seen'), evidence('shuttle-committed')] }),
          act('c4-med-dispatch-look-aboard', 'look', ['The shuttle is available, but the annex beds are occupied. Inspect the beds and Partition plan; then apply your Command PADD here after Crusher’s protocol briefing.']),
          act('c4-med-dispatch-wait-padd', { item: 'padd' }, ['For passengers aboard, inspect Annex beds and Partition plan and ask Crusher for the protocol. For an escorted tender, apply the Fleet support agreement instead to request Morrow.']),
          act('c4-med-dispatch-wait-support', { item: 'support-record' }, ['For an escorted tender, inspect Annex beds and Medical dispatch and ask Crusher for the protocol. If passengers came aboard, authorize the staffed overflow plan with your PADD instead.']),
        ]),
        person('c4-crusher', 'crusher', 0, [
          act('c4-crusher-protocol', 'talk', [
            '“We bring back a person, not an unexplored machine. O’Brien needs a one-way diagnostic coupling. My canopy needs independent life support and a receiving plan that actually has staff.”',
            'She issues the Medical isolation kit. “Look at our beds. If the families are here, authorize the staffed overflow plan. If the shuttle is escorting them, ask Morrow to take the buffer duty.”',
            '“And before you choose tactical contact, talk to Deanna. I want the cost stated before anyone calls it necessary.”',
          ], { when: all('trace-locked'), effects: [fact('extraction-protocol'), item('isolation-kit')] }),
          act('c4-crusher-wait', 'talk', [
            '“First establish a real location with Data and the fleet observer. I will not configure treatment around a voice we merely hope is his.”',
            'She has begun preparing options, but will not call any of them a completed plan.',
          ]),
        ]),
        person('c4-guinan', 'guinan', 1, [
          act('c4-guinan-talk', 'talk', [
            '“When someone is missing, the room they left can become more important than the person. People start trying to put the room back.”',
            'Guinan looks at the receiving assignment. “If he comes home different, Will, let him come home different. He is not responsible for making us comfortable.”',
          ]),
        ]),
      ],
    },
    {
      id: 'c4-transporter', name: 'Isolated Transport Room', deck: 'Deck 6 medical', visual: 'transporter', atmosphere: 'alert',
      description: 'A single receiving pad has been separated from the others by a clear canopy frame. One ordinary diagnostic lead crosses the isolation boundary. The dwell dial beside it has a hand-marked safe sector, awaiting a verified target.',
      ambient: 'O’Brien’s team calls out each cable’s destination before connecting it. Nothing is accepted because it looks familiar.',
      hotspots: [
        object('c4-lead', 'Diagnostic lead', 0, 'conduit', [
          act('c4-lead-isolate', { item: 'isolator' }, [
            'O’Brien replaces the return lead with the one-way optical coupling and tests the diagnostic path from both sides. The unknown carrier has no conductive route into ship controls.',
            'He retains responsibility for the installation. Riker signs the boundary: admit the patient, not the network.',
          ], { when: all('transport-leak-seen', 'transport-briefed', 'extraction-protocol'), effects: [fact('transport-isolated'), evidence('transport-isolated')] }),
          act('c4-lead-wait', { item: 'isolator' }, ['Scan the lead, ask O’Brien about the installation, and obtain Crusher’s extraction protocol first.']),
          act('c4-lead-scan', 'scan', [
            'The ordinary diagnostic lead can return data across the isolation boundary. It would be harmless with a known medical sensor and unacceptable with unfamiliar implants.',
            'Apply the Optical isolator after O’Brien and Crusher have defined the procedure.',
          ], { effects: [fact('transport-leak-seen'), evidence('transport-leak')] }),
          act('c4-lead-look', 'look', ['The neatest cable crosses the most important boundary. Scan where it goes, not just whether its connector fits.']),
        ]),
        object('c4-dwell', 'Dwell dial', 1, 'console', [
          act('c4-dwell-trace', { item: 'picard-trace' }, [
            'O’Brien compares the Human carrier trace with the observed shutter dwell and the isolated receiving configuration. The target volume excludes the surrounding machinery.',
            'Transport is armed within the measured interval. Choose the contact protocol with Troi before authorizing the Receiving pad.',
          ], { when: all('trace-locked', 'receiving-ready', 'transport-isolated', 'canopy-fitted', 'dwell-observed'), effects: [fact('transport-ready')] }),
          act('c4-dwell-ready', 'use', [
            'O’Brien fits the transport sequence inside the observed shutter dwell. The independent canopy, receiving allocation, and trace all pass their checks.',
            'The sequence is armed but not running. There is time to choose the contact protocol and reconsider the evidence before authorizing the pad. No hidden clock has started.',
          ], { when: all('trace-locked', 'receiving-ready', 'transport-isolated', 'canopy-fitted', 'dwell-observed'), effects: [fact('transport-ready')] }),
          act('c4-dwell-look', 'look', [
            'The hand-marked sector matches the interval between the repair shutter opening and its return. It is long enough for one bounded transport, not a conversation with an entire vessel.',
            'Use the dial once the receiving plan, optical isolation, canopy, and location are ready.',
          ], { effects: [fact('dwell-observed'), evidence('transport-dwell')] }),
          act('c4-dwell-wait', 'use', ['Confirm the location and receiving plan, isolate the Diagnostic lead, fit the Medical isolation kit to the Receiving pad, and inspect this dial.']),
        ]),
        object('c4-pad', 'Receiving pad', 2, 'platform', [
          act('c4-pad-returned', 'use', ['Picard is in the Isolation Room. Further transport would add risk without purpose. Talk to him there under Crusher’s limits.'], { when: all('picard-extracted') }),
          act('c4-pad-medical', 'use', [
            'Riker authorizes the clinical protocol. The transport stays within the physical cavity while Crusher protects the patient’s baseline. A single figure resolves beneath the canopy.',
            'Picard flinches at the light. Crusher dims it before anyone asks him a question. His hand finds the blanket, then lets it go.',
            'The Borg vessel continues toward Earth. You have rescued a person, not acquired a switch that can turn it off.',
          ], {
            when: { all: ['transport-ready', 'contact-decided'], choices: { contact: 'medical' } },
            effects: [fact('picard-extracted'), fact('picard-protected'), item('medical-context'), evidence('picard-medical')],
          }),
          act('c4-pad-tactical', 'use', [
            'Riker authorizes the bounded tactical sample. Data records one sector’s repair timing while Crusher watches Picard’s neural load. She calls the limit; O’Brien completes transport immediately.',
            'The useful map arrives with a man who cannot place the order of three ordinary words. Crusher ends the sampling. Nothing in the tactical value makes that injury imaginary.',
            'The record describes one exterior sector, not command access to the Borg vessel.',
          ], {
            when: { all: ['transport-ready', 'contact-decided'], choices: { contact: 'tactical' } },
            effects: [fact('picard-extracted'), fact('picard-strained'), item('neural-map'), evidence('picard-tactical')],
          }),
          act('c4-pad-kit', { item: 'isolation-kit' }, [
            'Crusher’s technicians fit the independent canopy and check its separate life-support supply. The receiving staff have names, a location, and an emergency route.',
          ], { when: all('receiving-ready', 'extraction-protocol'), effects: [fact('canopy-fitted')] }),
          act('c4-pad-kit-wait', { item: 'isolation-kit' }, ['Complete the real receiving allocation in Medical Logistics before fitting its equipment here.']),
          act('c4-pad-look', 'look', ['The canopy frame accepts the Medical isolation kit. Once the Dwell dial is armed and a contact protocol chosen with Troi, Use this pad to authorize extraction.']),
          act('c4-pad-wait', 'use', ['The pad will not start until transport preparation is complete and Troi has recorded your contact decision.']),
        ]),
        person('c4-obrien', 'obrien', 0, [
          act('c4-obrien-talk', 'talk', [
            '“I can hold a person in a transport boundary. I cannot certify a network that happens to be attached to him.”',
            'O’Brien describes the sequence: scan the diagnostic return, authorize the optical isolator, fit Crusher’s canopy, inspect the dwell, then arm the timing. Contact choice comes before final transport authorization.',
            '“My job is to tell you when the machine can do it. Yours is deciding what we are asking it to do.”',
          ], { effects: [fact('transport-briefed')] }),
        ]),
        person('c4-shelby', 'shelby', 1, [
          act('c4-shelby-talk', 'talk', [
            '“The tactical sample could spare ships later. That is a real benefit. It is not the same as saying there is no other way.”',
            'Shelby has asked Kestrel to estimate the cost of an external probe if you choose clinical contact. “A commander should be told the alternative before the sacrifice.”',
          ]),
        ]),
      ],
    },
    {
      id: 'c4-isolation', name: 'Quiet Isolation Room', deck: 'Deck 12 sealed ward', visual: 'quarters', atmosphere: 'normal',
      description: 'The room has been made intentionally ordinary: a dimmed lamp, a blanket, a chair set beside rather than above the bed. The patient monitor is independent of the ship’s network. A clear line on the floor tells visitors where to stop until invited closer.',
      ambient: 'The ventilator is quiet enough that a person will not need to compete with it to be heard.',
      hotspots: [
        object('c4-monitor', 'Patient monitor', 0, 'console', [
          act('c4-monitor-look', 'look', [
            'Two protocols share the same rescue boundary. Clinical contact protects a baseline and gives Picard the best chance of coherent recovery. Tactical contact uses the interval for a limited repair-map sample and adds substantial neural stress.',
            'The monitor does not present the second risk as a percentage small enough to ignore. Crusher has written “possible lasting disorientation” in plain words.',
          ], { effects: [fact('contact-risks-read'), evidence('contact-terms')] }),
        ]),
        object('c4-lamp', 'Bedside lamp', 1, 'lamp', [
          act('c4-lamp-use', 'use', ['Riker lowers the lamp by one setting. A nurse checks the reading and leaves it there. Some useful actions need no ceremony and award no tactical advantage.']),
          act('c4-lamp-look', 'look', ['The lamp has a local control. A patient should not have to ask the ship’s computer for darkness.']),
        ]),
        object('c4-glass', 'Privacy glass', 2, 'viewport', [
          act('c4-glass-look', 'look', ['The glass can show observers a monitor without displaying the bed. Crusher has selected that setting. A rescued captain is not a public briefing.']),
        ]),
        person('c4-troi', 'troi', 0, [
          act('c4-troi-settled', 'talk', ['“The protocol is recorded. Now we must honor its limits. Once O’Brien extracts him, let him be a person before asking him to be a source.”'], { when: all('contact-decided') }),
          act('c4-contact-choice', 'talk', [
            '“He cannot give meaningful consent while connected to that system. We are responsible for the rescue decision and for any additional burden we choose to place on him.”',
            'Clinical contact offers the better personal recovery. Tactical contact yields a local targeting map and avoids the later cost of an external fleet probe, but risks lasting disorientation. Neither path controls the Collective. Both permit every later strategy with the appropriate preparation.',
          ], {
            when: { all: ['transport-ready', 'contact-risks-read', 'contact-briefed'], none: ['contact-decided'] },
            choices: [
              { id: 'medical', label: 'Protect the clinical baseline', description: 'Best chance for Picard’s recovery; external observers must supply tactical detail.',
                confirm: 'Limit contact to Picard’s medical recovery? Tactical detail will have to come from outside observers. A later precision attack will require a fleet probe and reserve shielding.',
                requires: { none: ['contact-decided'] }, effects: [decision('contact', 'medical'), fact('contact-decided')],
                response: ['Troi records the clinical limit. Crusher will end all nonmedical sampling. Shelby begins reserving an external probe in case you later choose a precision attack.'] },
              { id: 'tactical', label: 'Take one bounded tactical sample', description: 'Obtain local targeting detail; accept a disclosed risk of lasting neural injury.',
                confirm: 'Authorize the additional tactical sample? It may spare later reconnaissance resources, but exposes Picard to an additional risk of lasting injury. This cannot be undone by choosing a different attack plan.',
                requires: { none: ['contact-decided'] }, effects: [decision('contact', 'tactical'), fact('contact-decided')],
                response: ['The tactical request is signed in Riker’s name. Crusher retains authority to stop it at the medical limit. The record will not disguise the extra risk as part of ordinary rescue.'] },
            ],
          }),
          act('c4-troi-brief', 'talk', [
            '“Empathy is not authorization. I can help him orient himself if he returns, but I cannot tell you that his silence means yes.”',
            'Troi asks you to inspect the Patient monitor, finish transport preparation, and then speak to her again. The final choice must be made with the practical alternatives already secured.',
          ], { effects: [fact('contact-briefed')] }),
        ]),
        person('c4-picard', 'picard', 1, [
          act('c4-picard-baseline', { item: 'medical-context' }, [
            'With Crusher’s approval, you compare the clinical baseline with his response to a familiar voice. Picard recognizes you, then asks for a moment without questions.',
            'You give him that moment. A baseline is useful because it can tell the medical staff when to stop, not because it gives visitors another test to administer.',
          ], { when: { choices: { contact: 'medical' } }, effects: [fact('picard-debriefed')] }),
          act('c4-picard-medical', 'talk', [
            'Picard follows Riker’s voice before he follows his face. “William?” The word is quiet and completely his own.',
            'Riker tells him where he is and that no report is required. Picard’s eyes close. Crusher says this is orientation, not a promise of instant recovery—but it is a beginning worth protecting.',
          ], { when: { choices: { contact: 'medical' } }, effects: [fact('picard-debriefed')] }),
          act('c4-picard-tactical', 'talk', [
            'Picard recognizes the shape of a familiar face and cannot place its name. He tries to answer a question nobody has asked.',
            'Riker stops the visit before reassurance becomes another test. Crusher explains that the added neural stress has injured his sequencing of memory. The map was useful. The person still needs care, and his long-term recovery is uncertain.',
          ], { effects: [fact('picard-debriefed')] }),
          act('c4-picard-look', 'look', ['The uniform is a hospital garment. No rank insignia is being used to tell this patient how quickly he should recover.']),
        ], all('picard-extracted')),
      ],
    },
  ],
};
