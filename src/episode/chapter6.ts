import type { Chapter } from '../model';
import { act, all, evidence, fact, item, object, objective, person } from '../campaign/builders';

const linkReady = ['picard-rescued', 'data-linked', 'e6-monitor-stable'] as const;
const regenerationReady = [
  ...linkReady, 'e6-command-rejected', 'e6-human-clue', 'e6-regeneration-found',
  'e6-command-tested', 'e6-earth-range', 'e6-sections-clear',
] as const;

export const chapter6: Chapter = {
  id: 6, title: 'A Place to Rest',
  subtitle: 'A guarded command can fail where an ordinary need succeeds.',
  stardate: '44003.3', assignment: 'ACTING CAPTAIN',
  intro: [
    'Locutus is aboard, but the Borg cube is still heading for Earth. Data has a neural connection, not control of the vessel. Crusher’s monitor must remain part of every attempt.',
    'The Enterprise is still in two sections. Riker commands from the stardrive, looking for something in the connection that the Borg did not think worth defending.',
  ],
  objectives: [
    objective('e6-guarded', 'Stabilize the chosen link policy and test the Borg command systems.', all('e6-monitor-stable', 'e6-command-rejected'), [
      'The live neural load determines how the chosen contact policy is operated.',
      'Scan the Neural monitor, then apply your PADD to it. Paced contact needs recovery intervals; continuous contact needs an active load limiter.',
      'In Neural Diagnostics, Use the Command-system probe. Its rejection is evidence, not a reason to keep forcing it.',
    ]),
    objective('e6-regeneration', 'Follow Picard’s human clue to the less-protected regeneration routines.', all('e6-command-tested'), [
      'Once the command systems reject Data, return to Picard in medical.',
      'Talk to Locutus. Apply the resulting Regeneration trace to the Regeneration index in Neural Diagnostics.',
      'Use the Routine rehearsal to check the less-protected sleep instruction and understand its feedback risk.',
    ]),
    objective('e6-earth', 'Send the regeneration instruction and survive the cube’s feedback.', all('regeneration-command', 'cube-destroyed', 'earth-safe'), [
      'Riker must give the order from the battle bridge with both sections clear.',
      'Scan Earth approach, then Use the Command chair to authorize regeneration. Scan Earth approach again to measure the developing feedback.',
      'Apply your PADD to the Command chair to order Crusher to disconnect Data while keeping the patient monitor on. Use the chair to hold clear and witness the cube’s destruction.',
    ]),
    objective('e6-home', 'Rejoin the Enterprise and bring the crew out of the battle.', all('ship-rejoined', 'e6-picard-home', 'e6-riker-remains'), [
      'Both sections survived. Rejoining is a controlled maneuver, not another attack.',
      'After the cube is destroyed, Scan Docking control, apply your PADD to match the sections’ motion, then Use it to rejoin.',
      'In the Recovery Lounge, Scan Recovery monitor, talk to Picard and Shelby, then Use the Captain’s log to close the adventure.',
    ]),
  ],
  rooms: [
    {
      id: 'e6-medical', name: 'Stardrive Medical', deck: 'Stardrive emergency sickbay',
      visual: 'sickbay', atmosphere: 'alert',
      description: 'Locutus lies beneath the medical light. Data’s interface and Crusher’s independent monitor remain connected side by side. The faint human trace never quite disappears under the carrier.',
      ambient: 'Crusher listens to the patient monitor, not the louder machine attached to it.',
      hotspots: [
        object('e6-monitor', 'Neural monitor', 0, 'console', [
          act('e6-monitor-released-scan', 'scan', [
            'Data’s coupling is open. Picard’s independent medical trace remains steady. There is no Borg contact to retune.',
          ], { when: all('e6-link-released') }),
          act('e6-monitor-scan', 'scan', [
            'The Borg carrier is pressing against the human baseline. Brief pauses let the load fall; an unbroken trace instead needs a limiter that trims the coupling before the patient’s activity is suppressed.',
            'Crusher keeps the physiological monitor independent. Your PADD can configure the chosen method from this live measurement.',
          ], {
            when: all('picard-rescued', 'data-linked'),
            effects: [fact('e6-load-measured'), evidence('e6-live-neural-load')],
          }),
          act('e6-monitor-paced', { item: 'padd' }, [
            'Crusher sets a recovery interval long enough for Picard’s trace to return to baseline. Data reacquires the carrier after each pause rather than extrapolating across a missing sample.',
            'The monitor remains live through both contact and rest. The paced link is ready for a bounded command-system test.',
          ], {
            when: { all: ['picard-rescued', 'data-linked', 'e6-load-measured'], choices: { link: 'paced' }, none: ['e6-link-released'] },
            effects: [fact('e6-monitor-stable'), fact('e6-paced-safe'), evidence('e6-paced-monitor')],
          }),
          act('e6-monitor-continuous', { item: 'padd' }, [
            'Crusher sets the coupling limiter below the measured suppression point. Data holds the carrier while her separate monitor and manual cutoff remain active.',
            'The full trace stays available without letting its load dictate Picard’s condition. Continuous contact is ready for a bounded command-system test.',
          ], {
            when: { all: ['picard-rescued', 'data-linked', 'e6-load-measured'], choices: { link: 'continuous' }, none: ['e6-link-released'] },
            effects: [fact('e6-monitor-stable'), fact('e6-continuous-safe'), evidence('e6-continuous-monitor')],
          }),
          act('e6-monitor-look', 'look', ['Scan the live load, then apply your PADD to operate the contact policy chosen in the previous chapter. The medical trace must remain independent.']),
          act('e6-monitor-wait', { item: 'padd' }, ['Measure the live load before setting recovery timing or the limiter. After the link is released, do not reconnect it.']),
        ]),
        object('e6-coupling', 'Neural coupling', 2, 'conduit', [
          act('e6-coupling-released', 'look', ['The coupling to Data is open. Crusher’s patient monitor is still running; disconnecting the Borg path did not disconnect medical care.'], { when: all('e6-link-released') }),
          act('e6-coupling-look', 'look', ['A separate medical lead runs alongside Data’s coupling. The connection can be stopped without losing Picard’s life-sign monitor.']),
        ]),
        person('e6-locutus', 'locutus', 1, [
          act('e6-locutus-clue-known', 'talk', [
            'His eyes close again. Crusher points to the captured Regeneration trace. “Follow what he managed to give us. Don’t make him struggle through it twice.”',
          ], { when: all('e6-human-clue') }),
          act('e6-locutus-clue', 'talk', [
            'The formal cadence breaks. His hand catches Riker’s sleeve, then loosens. “So tired. There has to be a place to stop.” For a moment the effort belongs unmistakably to Picard.',
            'Crusher marks the fatigue impulse where it crosses the implant signal. “That wasn’t a command. He’s showing us a need.” She saves a Regeneration trace for Data to compare with the cube’s routine traffic.',
          ], {
            when: all(...linkReady, 'e6-command-rejected'),
            effects: [fact('e6-human-clue'), item('e6-regeneration-trace'), evidence('e6-picard-clue')],
          }),
          act('e6-locutus-before', 'talk', [
            'Locutus watches Riker without recognition. The implant carrier remains steady over the human trace.',
            'Crusher keeps the contact brief. Stabilize the monitor and see what Data can reach before pressing him further.',
          ]),
        ], { all: ['picard-rescued'], none: ['cube-destroyed'] }),
        person('e6-crusher', 'crusher', 0, [
          act('e6-crusher-after', 'talk', [
            '“Data is disconnected. The patient monitor isn’t.” Crusher checks the ordinary rhythm beneath the fading implant noise.',
            '“Now we can start taking the machinery away without asking it to keep him alive.”',
          ], { when: all('e6-link-released') }),
          act('e6-crusher-talk', 'talk', [
            '“Paced contact needs a real recovery interval. Continuous contact needs a real limiter. Calling either one safe doesn’t set its controls.”',
            'She indicates the Neural monitor. “Scan the live load, then authorize the settings with your PADD. I stay with him.”',
          ]),
        ]),
      ],
    },
    {
      id: 'e6-link', name: 'Neural Diagnostics', deck: 'Stardrive medical annex',
      visual: 'engineering', atmosphere: 'alert',
      description: 'A medical diagnostic bench displays Borg requests without connecting them to Enterprise’s controls. Command-system returns occupy one screen; ordinary maintenance cycles scroll past on another.',
      ambient: 'Every rejected request sounds the same small tone. The room does not mistake repetition for progress.',
      hotspots: [
        object('e6-command-probe', 'Command-system probe', 0, 'console', [
          act('e6-command-probe-known', 'use', [
            'The command interfaces remain protected. Repeating the same request will not turn a neural connection into authority. Return to Picard in medical.',
          ], { when: all('e6-command-rejected') }),
          act('e6-command-probe-test', 'use', [
            'Data attempts bounded navigation and weapons-control requests. Both are rejected at the cube’s command layer; Locutus’s connection carries information but does not hand an outsider the bridge.',
            '“I cannot order a halt or redirect their weapons,” Data reports. Riker ends the command tests rather than increase the pressure on Picard.',
          ], {
            when: all(...linkReady), speaker: 'data',
            effects: [fact('e6-command-rejected'), evidence('e6-command-denials')],
          }),
          act('e6-command-probe-look', 'look', ['Use only after the selected link policy is set from the live Neural monitor. Failure here may tell you where not to keep pushing.']),
          act('e6-command-probe-wait', 'use', ['Scan the Neural monitor and configure the selected contact policy with your PADD first.']),
        ]),
        object('e6-regeneration', 'Regeneration index', 1, 'console', [
          act('e6-regeneration-match', { item: 'e6-regeneration-trace' }, [
            'Data matches Picard’s fatigue impulse to a routine regeneration request. Unlike navigation and weapons, this maintenance traffic has little protection: the Collective expects its drones to need rest.',
            '“This is not another door into command. It is a function they have left available.” The request can spread through the linked drones as a regeneration instruction.',
          ], {
            when: all(...linkReady, 'e6-command-rejected', 'e6-human-clue'),
            speaker: 'data', effects: [fact('e6-regeneration-found'), evidence('e6-regeneration-path')],
          }),
          act('e6-regeneration-look', 'look', ['Routine maintenance requests continue beneath the rejected command traffic. Picard’s Regeneration trace can identify which ordinary function matters.']),
          act('e6-regeneration-wait', { item: 'e6-regeneration-trace' }, ['Keep the monitored link stable and establish that the command systems reject access before comparing Picard’s clue.']),
        ]),
        object('e6-rehearsal', 'Routine rehearsal', 2, 'padd', [
          act('e6-rehearsal-test', 'use', [
            'Data checks the regeneration instruction against the captured routine, without sending it yet. It would put the linked drones into their rest cycle rather than seize their command stations.',
            'The model predicts an unstable feedback loop if regeneration spreads while the cube is operating. Riker orders both Enterprise sections kept clear and Crusher ready to disconnect Data after transmission.',
          ], {
            when: all(...linkReady, 'e6-command-rejected', 'e6-human-clue', 'e6-regeneration-found'),
            effects: [fact('e6-command-tested'), evidence('e6-regeneration-feedback')],
          }),
          act('e6-rehearsal-look', 'look', ['Use after identifying the regeneration routine. This checks the instruction locally; only Riker’s battle-bridge order will transmit it.']),
          act('e6-rehearsal-wait', 'use', ['Apply Picard’s Regeneration trace to the Regeneration index first.']),
        ]),
      ],
    },
    {
      id: 'e6-battle', name: 'Stardrive Battle Bridge', deck: 'Stardrive command deck',
      visual: 'battle-bridge', atmosphere: 'alert',
      description: 'Earth fills the viewer beyond the cube. Both Enterprise sections remain on the plot. A docking display is dark beside the active approach trace, waiting for something other than combat.',
      ambient: 'Earth’s defense reports grow shorter. Riker asks for Data, then for the positions of both halves of his ship.',
      hotspots: [
        {
          ...object('e6-command', 'Command chair', 1, 'chair', [
            act('e6-command-after', 'use', [
              'The cube is destroyed and Earth is safe. The next order is to bring the Enterprise back together: Scan Docking control, match the sections with your PADD, then Use it to rejoin.',
            ], { when: all('cube-destroyed') }),
            act('e6-command-feedback', 'use', [
              'Riker holds both sections outside the expanding feedback zone. The sleeping drones do not correct the cascade. Power surges through the cube until its structure breaks apart above Earth.',
              'No final volley causes the explosion. The regeneration feedback destroys the cube; Earth reports the attack ended. The saucer and stardrive both answer Riker’s call.',
            ], {
              when: all(
                ...regenerationReady, 'regeneration-command', 'e6-borg-asleep',
                'e6-feedback-measured', 'e6-link-released',
              ),
              effects: [fact('cube-destroyed'), fact('earth-safe'), fact('e6-enterprise-survived'), evidence('e6-cube-destruction')],
            }),
            act('e6-command-asleep', 'use', [
              'The regeneration instruction has been sent. Scan Earth approach for the feedback state, then apply your PADD here to order the neural disconnect before holding clear.',
            ], { when: all('regeneration-command') }),
            act('e6-command-regenerate', 'use', [
              '“Data, transmit the regeneration instruction.” The less-protected routine accepts it. Across the linked cube, drones leave their tasks and enter regeneration.',
              'Weapons fall silent. The engines cease driving toward Earth. Data has put the Borg to sleep, not become their commander.',
            ], {
              when: all(...regenerationReady),
              effects: [fact('regeneration-command'), fact('e6-borg-asleep'), evidence('e6-borg-regeneration')],
            }),
            act('e6-command-cutoff-done', { item: 'padd' }, ['Data is already disconnected. Crusher’s medical monitor remains on; no further contact is needed.'], { when: all('e6-link-released') }),
            act('e6-command-disconnect', { item: 'padd' }, [
              'Riker relays the measured feedback to Crusher. She opens Data’s neural coupling before the surge can reach either of them, while keeping Picard’s physiological monitor powered.',
              'Data confirms that the regeneration request has already propagated. The connection is no longer needed to keep the drones asleep.',
            ], {
              when: all(...regenerationReady, 'regeneration-command', 'e6-borg-asleep', 'e6-feedback-measured'),
              effects: [fact('e6-link-released'), evidence('e6-medical-disconnect')],
            }),
            act('e6-command-look', 'look', ['Use to send the tested regeneration instruction after scanning Earth approach. When feedback develops, apply your PADD to order the medical disconnect; then Use to hold clear.']),
            act('e6-command-cutoff-wait', { item: 'padd' }, ['Send the tested regeneration instruction and Scan Earth approach for feedback before ordering the post-transmission disconnect.']),
            act('e6-command-wait', 'use', ['Stabilize the monitored link, record the rejected command attempts, follow Picard’s clue, test the regeneration routine, and Scan Earth approach before transmitting.']),
          ]), kind: 'object', prop: null, x: 218, y: 128, width: 42, height: 45,
        },
        {
          ...object('e6-earth', 'Earth approach', 2, 'console', [
            act('e6-earth-safe', 'scan', ['Earth’s defense stations report no continuing Borg attack. Both Enterprise sections remain intact outside the debris field.'], { when: all('cube-destroyed') }),
            act('e6-earth-feedback', 'scan', [
              'The cube’s drones are regenerating. Its unattended power network is feeding the same correction back into itself, with each cycle larger than the last.',
              'The surge will destroy the cube. Both Enterprise sections are clear, but Data’s neural connection is still a possible return path. Order Crusher to disconnect it from the Command chair.',
            ], {
              when: all('regeneration-command', 'e6-borg-asleep'),
              effects: [fact('e6-feedback-measured'), evidence('e6-feedback-rise')],
            }),
            act('e6-earth-approach', 'scan', [
              'The cube has passed the outer defenses and is approaching Earth. The saucer and stardrive have room to hold outside its immediate power field.',
              'Riker keeps both sections clear of the predicted feedback zone. The plan needs a neural instruction, not an Enterprise hull on a collision course.',
            ], {
              when: all('e6-command-tested', 'saucer-separated'),
              effects: [fact('e6-earth-range'), fact('e6-sections-clear')],
            }),
            act('e6-earth-look', 'look', ['Earth’s atmosphere is visible behind the cube. Scan after the regeneration rehearsal to set a safe stand-off for both sections; Scan again after transmission to measure feedback.']),
            act('e6-earth-wait', 'scan', ['Complete the regeneration rehearsal so the approach plot can include its predicted feedback zone.']),
          ]), kind: 'console', prop: null, x: 380, y: 63, width: 58, height: 45,
        },
        {
          ...object('e6-docking', 'Docking control', 0, 'console', [
            act('e6-docking-joined', 'use', ['The Enterprise is whole again. Visit the Recovery Lounge before closing the captain’s log.'], { when: all('ship-rejoined') }),
            act('e6-docking-join', 'use', [
              'The saucer settles onto the matched stardrive. The collar latches engage, utilities reconnect, and the two power traces become one ship’s display again.',
              '“Separation mode secured.” Enterprise is battered, intact, and rejoined. Riker releases the emergency stations and goes to see his captain.',
            ], {
              when: all('saucer-separated', 'cube-destroyed', 'earth-safe', 'e6-enterprise-survived', 'e6-link-released', 'e6-docking-measured', 'e6-motion-matched'),
              effects: [fact('ship-rejoined'), evidence('e6-enterprise-rejoined')],
            }),
            act('e6-docking-scan', 'scan', [
              'The saucer retains a small roll from its diversion turn. Closing on the collar now would bring one latch into contact before the others.',
              'Geordi requests matched rotation and zero relative drift before the final approach. Your PADD can authorize that alignment without releasing the docking latches.',
            ], {
              when: { all: ['cube-destroyed', 'earth-safe', 'e6-enterprise-survived'], none: ['ship-rejoined'] },
              effects: [fact('e6-docking-measured')],
            }),
            act('e6-docking-match', { item: 'padd' }, [
              'Riker orders the stardrive to match the saucer’s roll, then trim both sections to a common attitude. Relative drift falls to zero with the collars aligned.',
              'Geordi confirms the latches remain clear. The sections are ready for the final docking order.',
            ], {
              when: { all: ['cube-destroyed', 'earth-safe', 'e6-docking-measured'], none: ['ship-rejoined'] },
              effects: [fact('e6-motion-matched')],
            }),
            act('e6-docking-look', 'look', ['After the cube is destroyed, Scan the relative motion, apply your PADD to match it, then Use to rejoin. Both sections are coming home.']),
            act('e6-docking-scan-wait', 'scan', ['Keep the sections clear until the Borg cube is destroyed. If docking is complete, the relative-motion test is no longer needed.']),
            act('e6-docking-match-wait', { item: 'padd' }, ['Scan the sections’ relative motion after the cube is destroyed and before rejoining.']),
            act('e6-docking-wait', 'use', ['The cube must be destroyed and the neural link released. Then Scan this control and use your PADD to match the sections’ motion before docking.']),
          ]), kind: 'console', prop: null, x: 43, y: 132, width: 115, height: 44,
        },
      ],
    },
    {
      id: 'e6-recovery', name: 'Recovery Lounge', deck: 'Stardrive medical level',
      visual: 'quarters', atmosphere: 'normal',
      description: 'A quiet room off medical has a window, a recovery display, and space for a few visitors. The battle log is waiting on a small table. Nobody has placed it on the patient’s chair.',
      ambient: 'The ordinary ventilation is audible again. It is enough.',
      hotspots: [
        object('e6-recovery-monitor', 'Recovery monitor', 0, 'console', [
          act('e6-recovery-scan', 'scan', [
            'Crusher’s treatment record shows the Borg implants removed in stages, with Picard’s vital signs stable. His own neural activity now carries the whole trace.',
            'Physical recovery is underway. Riker leaves the rest out of the timetable.',
          ], {
            when: all('cube-destroyed', 'e6-link-released', 'ship-rejoined'),
            effects: [fact('e6-recovery-recorded'), evidence('e6-picard-recovery')],
          }),
          act('e6-recovery-look', 'look', ['Crusher will post the recovery record here after the cube is destroyed, Data is disconnected, and Enterprise rejoins.']),
          act('e6-recovery-wait', 'scan', ['The rescue is not over yet. End the cube’s attack, disconnect the neural link, and rejoin the Enterprise first.']),
        ]),
        object('e6-log', 'Captain’s log', 2, 'padd', [
          act('e6-log-finish', 'use', [
            'Riker closes the emergency command log: the cube destroyed by regeneration feedback, Earth safe, Picard recovering, and the Enterprise rejoined and surviving.',
            'Shelby has a fleet to help rebuild. Riker still has a place on this ship. Beyond the window, Earth turns beneath an unbroken Enterprise.',
          ], {
            when: all(
              ...regenerationReady, 'regeneration-command', 'e6-borg-asleep', 'e6-feedback-measured', 'e6-link-released',
              'cube-destroyed', 'earth-safe', 'e6-enterprise-survived', 'ship-rejoined',
              'e6-recovery-recorded', 'e6-picard-home', 'e6-fleet-rebuilding', 'e6-riker-remains',
            ),
            effects: [{ type: 'ending', id: 'home-again' }],
          }),
          act('e6-log-look', 'look', ['Close the log after rejoining, reading Crusher’s recovery record, and speaking with Picard and Shelby.']),
          act('e6-log-wait', 'use', ['End the Borg attack, preserve the monitored patient, rejoin Enterprise, and hear Picard and Shelby before closing the log.']),
        ]),
        person('e6-picard', 'picard', 0, [
          act('e6-picard-talk', 'talk', [
            'Picard runs a thumb along the smooth arm of the chair. “I remember your voices. Not always the words.”',
            'Riker pulls up another chair. “Then we can start with an easy report. You’re aboard the Enterprise. All of it.” Picard looks toward the window and lets the silence remain.',
          ], {
            when: all('ship-rejoined', 'e6-recovery-recorded'),
            effects: [fact('e6-picard-home')],
          }),
          act('e6-picard-wait', 'talk', ['Picard is resting. Read Crusher’s Recovery monitor before beginning the visit.']),
        ], all('ship-rejoined', 'e6-link-released')),
        person('e6-shelby', 'shelby', 1, [
          act('e6-shelby-talk', 'talk', [
            '“They’ve asked me to help rebuild the fleet,” Shelby says. “After Wolf 359, it will take more than replacing hulls.” Riker offers her every lesson Enterprise can give her.',
            'She asks about his next command. He glances through the door toward Picard. “For now, I’m staying.” Shelby nods. There is no argument left to win between them.',
          ], {
            when: all('ship-rejoined', 'earth-safe', 'e6-picard-home'),
            effects: [fact('e6-fleet-rebuilding'), fact('e6-riker-remains'), evidence('e6-new-watch')],
          }),
          act('e6-shelby-wait', 'talk', ['“See the captain first. We can talk about our next assignments when he knows where he is.”']),
        ], all('ship-rejoined')),
      ],
    },
  ],
};
