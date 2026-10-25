import type { Chapter } from '../model';
import { act, all, decision, evidence, fact, item, next, object, objective, person } from '../campaign/builders';

export const chapter5: Chapter = {
  id: 5, title: 'Inside the Screen',
  subtitle: 'The diversion is loud. The rescue must be quiet.',
  stardate: '44003.1', assignment: 'ACTING CAPTAIN',
  intro: [
    'The saucer and stardrive have separated cleanly. Riker commands from the stardrive battle bridge. The saucer is ready to draw attention with an antimatter spread, but Data and Worf’s shuttle is still in its bay.',
    'The selected approach must fit the real screen, the receiving transporter must be ready, and the away team must open a local transport path. The cube is not stopping for any of it.',
  ],
  objectives: [
    objective('e5-course', 'Prepare the selected shuttle course beneath the saucer’s antimatter screen.', all('e5-course-ready'), [
      'The close and wide approaches use different parts of the same screen.',
      'Look at Earthward track and Scan the Antimatter screen projection on the battle bridge.',
      'Talk to Worf in the Stardrive Shuttlebay, then apply the Screen timing profile to the Shuttle course. Your chapter 4 choice determines the calculation.',
    ]),
    objective('e5-diversion', 'Prepare reception, deploy the screen, and launch Data and Worf.', all('e5-shuttle-launched'), [
      'Prepare a way back before sending the shuttle out.',
      'In Transporter Control, Scan the Return pad, talk to O’Brien, and apply your PADD to the pad.',
      'On the battle bridge, Use the Antimatter screen and then Use Shuttle mission. Riker stays aboard to command the operation.',
    ]),
    objective('e5-rescue', 'Open the local transport barrier and bring Locutus and the team home.', all('picard-rescued', 'e5-team-returned'), [
      'The away team must identify the barrier around Locutus, not try to disable the entire cube.',
      'After launch, Scan Shuttle mission for Data’s barrier measurement.',
      'Apply the Local barrier waveform to Shuttle mission to authorize Worf’s focused shot. Use the mission station to retrieve the team and Locutus.',
    ]),
    objective('e5-link', 'Receive Locutus and establish Data’s monitored neural interface.', all('data-linked'), [
      'The cube will continue toward Earth after the rescue. Its connection to Locutus remains.',
      'In Stardrive Medical, Scan the Patient monitor, talk to Crusher, then apply the Neural coupler to the Interface cradle.',
      'Talk to Data and choose paced samples or continuous contact. Use the Interface cradle to proceed with the chosen policy.',
    ]),
  ],
  rooms: [
    {
      id: 'e5-battle', name: 'Stardrive Battle Bridge', deck: 'Stardrive command deck',
      visual: 'battle-bridge', atmosphere: 'alert',
      description: 'The smaller command deck carries separate saucer and shuttle tracks. A screen-expansion plot sits beside the mission channel. Riker’s chair stays at the center of the operation, not aboard the away team’s shuttle.',
      ambient: 'The saucer reports ready. Data waits for a course and a launch order.',
      hotspots: [
        {
          ...object('e5-screen', 'Antimatter screen', 0, 'console', [
            act('e5-screen-active', 'use', ['The saucer’s screen is deployed. The next order belongs at Shuttle mission.'], { when: all('e5-screen-active') }),
            act('e5-screen-deploy', 'use', [
              'Riker orders the saucer’s diversion. Its antimatter spread blooms across the Borg sensors while the saucer keeps a recoverable course outside the cube’s path.',
              'The cube turns its attention toward the obvious threat. A quiet corridor opens inside the glare. Data reports the shuttle ready to use it.',
            ], {
              when: all('saucer-separated', 'e5-earth-vector', 'e5-screen-measured', 'e5-course-ready', 'e5-receiver-ready', 'e5-boarding-briefed'),
              effects: [fact('e5-screen-active'), evidence('e5-antimatter-diversion')],
            }),
            act('e5-screen-scan', 'scan', [
              'The projection shows a dense inner shadow and an expanding outer band. The antimatter will obscure the cube’s sensors; it will not stop the Borg propulsion system.',
              'Data saves both edges in a Screen timing profile. Apply it to the Shuttle course so the selected approach stays covered on the way in and out.',
            ], {
              when: all('saucer-separated'),
              effects: [fact('e5-screen-measured'), item('e5-screen-profile'), evidence('e5-screen-geometry')],
            }),
            act('e5-screen-look', 'look', ['Scan the projection for the shuttle’s timing profile. Deploy only after the selected course and transporter reception are ready.']),
            act('e5-screen-wait', 'use', ['Read Earthward track, prepare the selected Shuttle course with Worf, and ready the Return pad before ordering the saucer’s spread.']),
          ]), kind: 'console', prop: null, x: 43, y: 132, width: 115, height: 44,
        },
        {
          ...object('e5-mission', 'Shuttle mission', 1, 'chair', [
            act('e5-mission-returned', 'use', ['Data, Worf, and Locutus are aboard. Crusher is waiting in Stardrive Medical; the cube is still moving toward Earth.'], { when: all('e5-team-returned') }),
            act('e5-mission-retrieve', 'use', [
              '“Bring them home.” The shuttle beams Data, Worf, and Locutus out through the opened local barrier. Data retraces the covered return course; O’Brien receives Locutus into stardrive medical care as the shuttle docks.',
              'The Borg vessel neither turns nor slows. Its mission continues toward Earth without its spokesman. Picard is aboard, but the connection in his implants is still active.',
            ], {
              when: all('e5-shuttle-launched', 'e5-local-barrier-down', 'e5-receiver-ready', 'e5-course-ready', 'e5-screen-active'),
              effects: [fact('picard-rescued'), fact('e5-team-returned'), fact('e5-cube-earthbound'), evidence('e5-rescue'), evidence('e5-cube-continues')],
            }),
            act('e5-mission-holding', 'use', [
              'The shuttle has delivered Data and Worf to the target compartment. Scan their mission report, then apply the measured Local barrier waveform here before ordering extraction.',
            ], { when: all('e5-shuttle-launched') }),
            act('e5-mission-launch', 'use', [
              'Riker authorizes launch from the battle bridge. Data takes the shuttle beneath the saucer’s antimatter screen; Worf watches the covered return line instead of firing at distant targets.',
              'The shuttle reaches the measured compartment. Data and Worf beam aboard beyond the outer screening field and find Locutus behind a local transport barrier.',
            ], {
              when: all('saucer-separated', 'e4-location-fixed', 'e5-screen-active', 'e5-course-ready', 'e5-receiver-ready', 'e5-boarding-briefed'),
              effects: [fact('e5-shuttle-launched'), evidence('e5-shuttle-insertion')],
            }),
            act('e5-mission-barrier-scan', 'scan', [
              'Data’s tricorder report isolates the emitter enclosing Locutus. The shuttle can reach the compartment, but it cannot transport him through this separate field.',
              'The emitter drops to a lower duty cycle between pulses. Data sends the Local barrier waveform so Riker can authorize a focused phaser shot at that interval.',
            ], {
              when: { all: ['e5-shuttle-launched'], none: ['e5-team-returned'] },
              speaker: 'data', effects: [fact('e5-barrier-measured'), item('e5-barrier-waveform'), evidence('e5-local-barrier')],
            }),
            act('e5-mission-barrier-open', { item: 'e5-barrier-waveform' }, [
              'The local field is already down. Worf holds fire; Use Shuttle mission to bring the team home if they have not yet returned.',
            ], { when: all('e5-local-barrier-down') }),
            act('e5-mission-open-barrier', { item: 'e5-barrier-waveform' }, [
              'Riker transmits the measured interval. Worf fires at the local emitter during its low-duty pulse; the field around Locutus collapses without damaging the shuttle’s beam-in point.',
              'Worf restrains Locutus while Data calls the shuttle. They have opened one transport path, not disabled the cube.',
            ], {
              when: { all: ['e5-shuttle-launched', 'e5-barrier-measured', 'e5-receiver-ready'], none: ['e5-team-returned'] },
              speaker: 'worf', effects: [fact('e5-local-barrier-down')],
            }),
            act('e5-mission-look', 'look', ['Use to launch once the screen is active. Scan the away-team report, apply its Local barrier waveform, then Use to order retrieval.']),
            act('e5-mission-scan-wait', 'scan', ['There is no away-team barrier report yet. Prepare the course and Return pad, deploy the screen, then launch.']),
            act('e5-mission-waveform-wait', { item: 'e5-barrier-waveform' }, ['A local barrier shot is useful only while the team is aboard the cube and the return transporter is ready.']),
            act('e5-mission-wait', 'use', ['Prepare the shuttle and Return pad, then deploy the saucer’s Antimatter screen before launching.']),
          ]), kind: 'object', prop: null, x: 218, y: 128, width: 42, height: 45,
        },
        {
          ...object('e5-track', 'Earthward track', 2, 'console', [
            act('e5-track-after', 'look', [
              'The shuttle has returned. The cube’s velocity toward Earth is unchanged. It has not diverted to recover Locutus.',
              'Whatever happens in sickbay must account for a vessel that can act without him.',
            ], { when: all('picard-rescued') }),
            act('e5-track-look', 'look', [
              'Earth lies ahead of the cube’s course. The saucer is offset to one side, with the stardrive following outside its screen.',
              'The rescue must work during pursuit. Waiting for the enemy to stop is not part of the plan.',
            ], { effects: [fact('e5-earth-vector')] }),
          ]), kind: 'console', prop: null, x: 380, y: 63, width: 58, height: 45,
        },
      ],
    },
    {
      id: 'e5-shuttle', name: 'Stardrive Shuttlebay', deck: 'Stardrive launch deck',
      visual: 'shuttlebay', atmosphere: 'alert',
      description: 'A compact shuttle waits behind the launch barrier. Its course display overlays the saucer’s outline and the two edges of the proposed antimatter cloud. Worf has set his equipment beside the hatch.',
      ambient: 'The launch crew holds at ready. No countdown runs while the course is incomplete.',
      hotspots: [
        object('e5-course', 'Shuttle course', 0, 'console', [
          act('e5-course-close', { item: 'e5-screen-profile' }, [
            'Data fits the close approach into the narrow shadow just below the saucer. He delays the crossing until the inner edge of the antimatter spread covers the shuttle’s engine signature.',
            'The return course follows the same moving notch. Short distance, exact timing: the course now matches the method Riker chose.',
          ], {
            when: { all: ['e5-screen-measured', 'e5-boarding-briefed', 'e4-location-fixed'], choices: { rescue: 'close' }, none: ['e5-shuttle-launched'] },
            effects: [fact('e5-course-ready'), fact('e5-close-course'), evidence('e5-close-approach')],
          }),
          act('e5-course-wide', { item: 'e5-screen-profile' }, [
            'Data curves the wide approach under the outer antimatter band and reduces impulse to match its expansion. The shuttle gains turning room without outrunning its cover.',
            'A second arc brings it home under the remaining screen. Longer distance, matched motion: the course now fits Riker’s selected method.',
          ], {
            when: { all: ['e5-screen-measured', 'e5-boarding-briefed', 'e4-location-fixed'], choices: { rescue: 'wide' }, none: ['e5-shuttle-launched'] },
            effects: [fact('e5-course-ready'), fact('e5-wide-course'), evidence('e5-wide-approach')],
          }),
          act('e5-course-look', 'look', ['The Screen timing profile converts the chosen close or wide approach into an actual flight path. Talk to Worf before loading it.']),
          act('e5-course-wait', { item: 'e5-screen-profile' }, ['Hear Worf’s boarding plan before plotting the selected course. Once the shuttle launches, its prepared course is in use.']),
        ]),
        object('e5-hatch', 'Shuttle hatch', 2, 'hatch', [
          act('e5-hatch-away', 'look', ['The launch cradle is empty. Riker follows the away team through Shuttle mission on the battle bridge.'], { when: { all: ['e5-shuttle-launched'], none: ['e5-team-returned'] } }),
          act('e5-hatch-home', 'look', ['The shuttle is secured in its cradle. Data and Worf returned with Locutus; the mission channel now belongs to Crusher.'], { when: all('e5-team-returned') }),
          act('e5-hatch-look', 'look', ['Data and Worf are the boarding team. Riker stays aboard Enterprise and issues the launch and retrieval orders from the battle bridge.']),
        ]),
        person('e5-worf', 'worf', 0, [
          act('e5-worf-brief', 'talk', [
            '“We pass beneath the screen, locate the captain, and remove whatever field prevents his transport. We do not turn this into a boarding assault.”',
            'Worf checks his phaser’s narrow setting. “Let Data measure the local emitter before you authorize the shot. A blind burst could close our only exit.”',
          ], { effects: [fact('e5-boarding-briefed')] }),
        ], { none: ['e5-shuttle-launched'] }),
        person('e5-data-flight', 'data', 1, [
          act('e5-data-flight-talk', 'talk', [
            '“Both approaches require concealment. A wide course outside the screen would simply provide the Borg with a longer observation.”',
            '“The profile from the battle bridge will let me match our motion to the part of the screen you selected.”',
          ]),
        ], { none: ['e5-shuttle-launched'] }),
      ],
    },
    {
      id: 'e5-transport', name: 'Transporter Control', deck: 'Stardrive receiving deck',
      visual: 'transporter', atmosphere: 'alert',
      description: 'One receiving pad is set aside for Locutus. O’Brien has the shuttle’s transporter trace beside the stardrive’s: the separated ship now has a different motion and a different shield boundary.',
      ambient: 'A test pattern resolves cleanly, then stretches as the saucer track moves away.',
      hotspots: [
        object('e5-pad', 'Return pad', 1, 'platform', [
          act('e5-pad-scan', 'scan', [
            'The old transport compensation still assumes a joined Enterprise. The stardrive’s offset motion would smear a return pattern transferred from the shuttle.',
            'A new solution must reference the stardrive alone and reserve a receiving interval in its shield cycle.',
          ], { effects: [fact('e5-return-measured'), evidence('e5-return-compensation')] }),
          act('e5-pad-prepare', { item: 'padd' }, [
            'O’Brien replaces the joined-hull compensation with the measured stardrive motion. The shield controller reserves a short receiving interval tied to the shuttle’s return beacon.',
            'A test pattern arrives without drift. Medical can receive Locutus while the shuttle docks with Data and Worf.',
          ], {
            when: all('saucer-separated', 'e5-return-measured', 'e5-transporter-briefed'),
            effects: [fact('e5-receiver-ready')],
          }),
          act('e5-pad-look', 'look', ['Scan the pad’s compensation, hear O’Brien, and apply your PADD to synchronize the return with the separated stardrive.']),
          act('e5-pad-wait', { item: 'padd' }, ['Scan the Return pad and ask O’Brien about its motion compensation before reserving reception.']),
        ]),
        object('e5-shuttle-beacon', 'Return beacon repeater', 0, 'beacon', [
          act('e5-shuttle-beacon-look', 'look', ['This repeater will follow the shuttle home. It cannot create a transport path through the local barrier around Locutus. Data and Worf must open that path themselves.']),
        ]),
        person('e5-obrien', 'obrien', 0, [
          act('e5-obrien-talk', 'talk', [
            '“We’re not where the saucer is anymore. The old compensation would try to put the patient halfway between two different flight paths.”',
            '“Scan the pad, then authorize the stardrive solution with your PADD. I’ll receive him when the shuttle returns; Data handles the beam out of the cube.”',
          ], { effects: [fact('e5-transporter-briefed')] }),
        ]),
      ],
    },
    {
      id: 'e5-medical', name: 'Stardrive Medical', deck: 'Stardrive emergency sickbay',
      visual: 'sickbay', atmosphere: 'alert',
      description: 'An emergency biobed faces a neural-interface cradle. Crusher’s monitor has its own power supply. The room is small enough that nobody can mistake the patient for a distant tactical symbol.',
      ambient: 'The medical monitor beats against the slower rhythm of Borg telemetry.',
      hotspots: [
        object('e5-monitor', 'Patient monitor', 0, 'console', [
          act('e5-monitor-scan', 'scan', [
            'Human cortical activity persists beneath the implants’ carrier. The machinery is still exchanging signals with the cube even though Locutus is no longer aboard it.',
            'Crusher records Picard’s baseline before Data makes contact. The interface must carry that monitor alongside every neural sample.',
          ], {
            when: all('picard-rescued', 'e5-team-returned'),
            effects: [fact('e5-neural-baseline'), evidence('e5-neural-baseline')],
          }),
          act('e5-monitor-look', 'look', ['After the rescue, Scan this monitor before asking Crusher to prepare Data’s coupling.']),
          act('e5-monitor-wait', 'scan', ['The receiving bed is ready, but the patient is still aboard the cube. Complete the shuttle rescue first.']),
        ]),
        object('e5-interface', 'Interface cradle', 2, 'conduit', [
          act('e5-interface-proceed', 'use', [
            'Data confirms the neural connection. Crusher’s monitor runs beside it under the selected contact policy; neither stream is hidden from the other.',
            'Riker receives a new position from the battle bridge: the cube is approaching Earth. He asks Data what the connection can actually reach.',
          ], {
            when: all(
              'saucer-separated', 'picard-rescued', 'e5-team-returned', 'e5-cube-earthbound',
              'e5-neural-baseline', 'e5-medical-briefed', 'e5-interface-ready', 'e5-link-chosen', 'data-linked',
            ),
            effects: [next(6, 'e6-medical')],
          }),
          act('e5-interface-fit', { item: 'e5-neural-coupler' }, [
            'Crusher connects Locutus’s implant lead through the neural coupler. Data takes the second connection; the independent patient monitor remains live beside his diagnostic feed.',
            'The hardware is ready. Data waits for Riker to choose the contact cadence before opening the link.',
          ], {
            when: all('picard-rescued', 'e5-neural-baseline', 'e5-medical-briefed'),
            effects: [fact('e5-interface-ready')],
          }),
          act('e5-interface-look', 'look', ['Fit Crusher’s Neural coupler here after recording the patient’s baseline. Then talk to Data about contact cadence.']),
          act('e5-interface-fit-wait', { item: 'e5-neural-coupler' }, ['Receive Locutus, Scan the Patient monitor, and hear Crusher before connecting Data.']),
          act('e5-interface-wait', 'use', ['Complete the rescue, fit the monitored Neural coupler, and choose Data’s contact policy before proceeding.']),
        ]),
        person('e5-crusher', 'crusher', 0, [
          act('e5-crusher-coupler', 'talk', [
            '“The implants are part of the connection, and right now part of keeping him alive. Pulling them out at once is not a shortcut.”',
            'Crusher prepares the Neural coupler. “Data can listen through it. I watch the patient, and the monitor stays connected whichever cadence you choose.”',
          ], {
            when: all('picard-rescued', 'e5-neural-baseline'),
            effects: [fact('e5-medical-briefed'), item('e5-neural-coupler')],
          }),
          act('e5-crusher-wait', 'talk', ['“Bring him aboard, then Scan the Patient monitor. I need his baseline before we add Data’s interface.”']),
        ]),
        person('e5-data-link', 'data', 1, [
          act('e5-data-linked', 'talk', ['“Contact is established. The chosen cadence and Doctor Crusher’s monitor will govern the next tests.”'], { when: all('data-linked') }),
          act('e5-link-choice', 'talk', [
            '“Locutus remains connected to the Collective. I can examine that connection in paced samples or maintain continuous contact while Doctor Crusher observes.”',
            '“Samples leave recovery intervals but interrupt the trace. Continuous contact preserves the trace but requires active load control. Neither grants me command of the Borg.”',
          ], {
            when: { all: ['picard-rescued', 'e5-interface-ready', 'e5-neural-baseline'], none: ['e5-link-chosen'] },
            choices: [
              {
                id: 'paced', label: 'Paced neural samples',
                description: 'Insert monitored recovery intervals between samples. Reacquire the carrier after each pause.',
                requires: { all: ['picard-rescued', 'e5-interface-ready', 'e5-neural-baseline'], none: ['e5-link-chosen'] },
                confirm: 'Use paced samples? The next chapter must set safe recovery intervals and reacquire the carrier between them.',
                effects: [decision('link', 'paced'), fact('e5-link-chosen'), fact('data-linked'), evidence('e5-paced-link')],
                response: [
                  'Data opens the first short sample, then releases it. Crusher follows Picard’s response through the quiet interval.',
                  'Riker orders the recovery timing checked against the live load before any command-system test.',
                ],
              },
              {
                id: 'continuous', label: 'Continuous monitored contact',
                description: 'Keep the carrier unbroken while Crusher watches an independent load monitor and cutoff.',
                requires: { all: ['picard-rescued', 'e5-interface-ready', 'e5-neural-baseline'], none: ['e5-link-chosen'] },
                confirm: 'Maintain continuous contact? The next chapter must set the live neural-load limiter while Crusher’s monitor remains independent.',
                effects: [decision('link', 'continuous'), fact('e5-link-chosen'), fact('data-linked'), evidence('e5-continuous-link')],
                response: [
                  'Data holds the carrier. Crusher keeps the patient trace on a separate display, with the cutoff under her hand.',
                  'Riker orders the load limiter set from the live measurement before Data attempts a command.',
                ],
              },
            ],
          }),
          act('e5-data-link-wait', 'talk', ['“Record the patient’s baseline and fit Doctor Crusher’s Neural coupler to the Interface cradle. Then we can choose a contact cadence.”']),
        ], all('e5-team-returned')),
      ],
    },
  ],
};
