import type { Chapter } from '../model';
import { act, all, decision, evidence, fact, item, next, object, objective, person } from '../campaign/builders';

export const chapter1: Chapter = {
  id: 1,
  title: 'A Colony Missing',
  subtitle: 'Jouret IV has not fallen silent. It has been taken.',
  stardate: '43989.1',
  assignment: 'FIRST OFFICER',
  intro: [
    'The Enterprise answers a distress call from Jouret IV. There should be streets below the landing party, and nine hundred people. Commander Riker finds a depression in the earth where the colony stood.',
    'Picard retains command aboard ship while Riker conducts the initial surface survey. Determine what removed the settlement; then return to Enterprise to meet Admiral Hanson and his Borg specialist, Commander Shelby.',
    'Look for physical clues, scan what a visual inspection cannot explain, and apply collected samples or records to the equipment that can interpret them. There is no hidden timer.',
  ],
  objectives: [
    objective('e1-survey', 'Investigate the missing Jouret IV colony.', all('e1-colony-observed', 'e1-sample-collected'), [
      'The shape of the absence matters as much as the wreckage.',
      'Look at the Colony basin and Severed foundation, then Scan the Exposed bedrock.',
      'Use the Sample clamp after inspecting the basin, foundation, and bedrock to recover a residue-bearing core.',
    ]),
    objective('e1-identify', 'Identify the force that removed the settlement.', all('e1-borg-confirmed'), [
      'Do not mistake the planet’s own mineral signature for a weapon.',
      'Scan the Reference basalt in the Survey Laboratory. Apply the Residue core to the Spectrometer.',
      'Talk to Hanson in the Observation Lounge, then apply the Tractor analysis to the Threat table.',
    ]),
    objective('e1-leadership', 'Face the command offer and plan with Shelby.', all('e1-command-discussed', 'e1-leadership-chosen'), [
      'Shelby is looking toward your chair. Picard wants to know why you have not looked beyond it.',
      'Hear Shelby’s assessment, speak to Picard in the Ready Room, and apply your PADD to the Watch assignments.',
      'Apply Shelby’s adaptation brief to the Threat table, then talk to Shelby and choose Delegate or Coordinate. Both retain her technical lead.',
    ]),
    objective('e1-intercept', 'Receive Hanson’s orders and prepare an intercept.', all('e1-intercept-authorized'), [
      'Hanson needs a working Enterprise plan before he leaves to assemble the fleet.',
      'After choosing a leadership arrangement, talk to Hanson again.',
      'Use the Watch assignments in the Ready Room to send the agreed watch plan to the bridge and begin pursuit.',
    ]),
  ],
  rooms: [
    {
      id: 'e1-colony', name: 'Jouret IV — Colony Basin', deck: 'Surface survey', visual: 'colony', atmosphere: 'damaged',
      description: 'Riker stands on the rim of an enormous wound in the ground. Utility trenches end in open air. There are no walls beneath the dust, only a few foundations pulled thin at their severed ends. A survey clamp waits beside a clean patch of exposed stone.',
      ambient: 'Wind whistles through a pipe that used to supply someone’s kitchen. The tricorder finds no answering life signs.',
      hotspots: [
        object('e1-basin', 'Colony basin', 1, 'viewport', [
          act('e1-basin-look', 'look', [
            'The missing area includes buildings, roads, and the ground beneath them. An explosion would have thrown that mass somewhere. There is no corresponding debris field.',
            'Riker reports the absence to Picard without calling it an evacuation. There are no departing warp trails, and nobody left a colony-sized crater by boarding a shuttle.',
          ], { effects: [fact('e1-colony-observed'), evidence('e1-colony-void')] }),
          act('e1-basin-scan', 'scan', ['No survivors or intact structures register inside the basin. Look at its edges: the pattern of removal is more useful than another empty life-sign count.']),
        ]),
        { ...object('e1-foundation', 'Severed foundation', 0, 'conduit', [
          act('e1-foundation-look', 'look', [
            'Reinforcement rods lean upward and inward. Their ends have stretched before breaking; the surrounding soil has not been scorched.',
            'Something lifted the colony as a single load. A weapon crater would push material away from the center, not draw the foundations toward it.',
          ], { effects: [fact('e1-foundation-observed'), evidence('e1-lifted-foundations')] }),
        ]), kind: 'object', prop: null, x: 28, y: 178, width: 128, height: 53 },
        { ...object('e1-bedrock', 'Exposed bedrock', 2, 'sample', [
          act('e1-bedrock-scan', 'scan', [
            'The tricorder finds a narrow residual subspace band trapped in the stone. A second, broader band appears to come from the planet’s minerals.',
            'Record both. The ship’s laboratory can subtract an undisturbed mineral sample; guessing which peak belongs to the attacker would contaminate the conclusion.',
          ], { effects: [fact('e1-residue-scanned'), evidence('e1-residue-scan')] }),
          act('e1-bedrock-look', 'look', ['The stone has a glassy sheen but no soot. A Scan can distinguish a residual field from ordinary volcanic minerals.']),
        ]), kind: 'object', prop: null, x: 153, y: 254, width: 57, height: 23 },
        { ...object('e1-clamp', 'Sample clamp', 0, 'kit', [
          act('e1-clamp-collected', 'use', ['The residue core is already logged. Keep the remaining bedrock undisturbed; the Spectrometer aboard Enterprise needs the sample you have.'], { when: all('e1-sample-collected') }),
          act('e1-clamp-collect', 'use', [
            'You set the clamp outside the fractured edge and lift a core through the residual band. Its outer layer retains the field trace; the interior preserves the mineral background.',
            'Riker seals the core for the Enterprise laboratory. There is no body to recover and no shelter to search. For now, this stone is the colony’s only account of what happened.',
          ], {
            when: all('e1-colony-observed', 'e1-foundation-observed', 'e1-residue-scanned'),
            effects: [fact('e1-sample-collected'), item('e1-core-sample')],
          }),
          act('e1-clamp-look', 'look', ['The coring clamp can preserve the fragile field residue. Inspect the basin and foundation, and scan the bedrock before choosing where to cut.']),
          act('e1-clamp-wait', 'use', ['First Look at the Colony basin and Severed foundation, then Scan the Exposed bedrock. You need to know which layer the clamp must preserve.']),
        ]), kind: 'object', prop: null, x: 36, y: 224, width: 50, height: 51 },
      ],
    },
    {
      id: 'e1-lab', name: 'Survey Laboratory', deck: 'Enterprise · Deck 8', visual: 'astrometrics', atmosphere: 'normal',
      description: 'Back aboard Enterprise, the survey lab offers an undisturbed Jouret basalt sample beside a shielded spectrometer. Its two traces almost overlap. The difference could identify an attacker, or merely expose a careless subtraction.',
      ambient: 'A sample carousel turns with a soft mechanical click. Beyond the door, the ship continues its ordinary watch.',
      hotspots: [
        object('e1-reference', 'Reference basalt', 0, 'sample', [
          act('e1-reference-scan', 'scan', [
            'This core was taken outside the colony’s footprint. It carries the broad mineral band, but none of the narrow residual peak.',
            'Your tricorder saves a clean subtraction profile. The laboratory can now distinguish the planet from whatever touched it.',
          ], { effects: [fact('e1-reference-scanned')] }),
          act('e1-reference-look', 'look', ['The reference core came from undisturbed ground. Scan it before asking the Spectrometer to identify the residue in your collected core.']),
        ]),
        object('e1-spectrometer', 'Spectrometer', 1, 'console', [
          act('e1-spectrometer-analyze', { item: 'e1-core-sample' }, [
            'You subtract the reference band from the collected core. The remaining trace has the field gradient of a tractor beam, at a strength capable of removing bedrock with the buildings.',
            'Geordi: “The bent foundations give us direction. This gives us the mechanism. Whoever did it treated the entire colony as cargo.” The instrument packages the result for Hanson’s comparison.',
          ], {
            when: all('e1-reference-scanned', 'e1-foundation-observed', 'e1-sample-collected'),
            effects: [fact('e1-tractor-identified'), item('e1-tractor-report'), evidence('e1-tractor-signature')],
          }),
          act('e1-spectrometer-wait', { item: 'e1-core-sample' }, ['Scan the Reference basalt first. The residue core contains two signals, and the planet should not be identified as its own attacker.']),
          act('e1-spectrometer-look', 'look', ['The sample slot accepts the Residue core. An empty background channel waits for a tricorder scan of undisturbed basalt.']),
        ]),
        object('e1-survey-map', 'Excavation overlay', 2, 'model', [
          act('e1-survey-map-look', 'look', ['The colony’s old street grid lies over the new contour map. Streets, buildings, and topsoil end at the same boundary. This was not a search for one object inside the settlement.']),
        ]),
        person('e1-geordi', 'geordi', 0, [
          act('e1-geordi-talk', 'talk', [
            '“The tricorder measured a mixture. It didn’t tell us which part matters. Give the spectrometer a sample from the scar and a baseline from outside it.”',
            'Geordi taps the foundation image. “And keep the physical evidence. A beautiful spectrum that disagrees with the ground is a reason to check the spectrum.”',
          ]),
        ]),
      ],
    },
    {
      id: 'e1-observation', name: 'Observation Lounge', deck: 'Enterprise · Deck 1 aft', visual: 'observation', atmosphere: 'normal',
      description: 'Admiral Hanson has brought a fleet-readiness chart. Commander Shelby has brought an annotated account of the Enterprise’s first Borg encounter. Neither leaves much room on the long table for a comforting interpretation of Jouret IV.',
      ambient: 'The stars turn slowly beyond the windows. Shelby has already marked three gaps in the current tactical assumptions.',
      hotspots: [
        object('e1-threat-table', 'Threat table', 1, 'model', [
          act('e1-threat-identify', { item: 'e1-tractor-report' }, [
            'The tractor gradient matches the Borg material in Hanson’s archive. With the lifted foundations and missing colony mass, the comparison is decisive: the Borg have reached Federation territory.',
            'Hanson’s fleet markers suddenly look very far apart. Riker asks for the nearest operational ships, not the optimistic total on the first page.',
          ], {
            when: all('e1-tractor-identified', 'e1-hanson-briefed'),
            effects: [fact('e1-borg-confirmed'), evidence('e1-borg-identification')],
          }),
          act('e1-threat-identify-wait', { item: 'e1-tractor-report' }, ['Talk to Hanson before comparing the Tractor analysis. He carries Starfleet’s Borg reference material.']),
          act('e1-threat-stations', { item: 'e1-adaptation-brief' }, [
            'Shelby’s notes identify a practical bottleneck: the same officers cannot keep the bridge covered and spend an entire watch developing phaser remodulation.',
            'You lay her specialist assignments over the watch plan. A protected research team can work under her direction; alternatively, you can coordinate its tactical trials yourself while she retains the technical lead.',
          ], {
            when: all('e1-watch-plan', 'e1-command-discussed'),
            effects: [fact('e1-stations-mapped')],
          }),
          act('e1-threat-stations-wait', { item: 'e1-adaptation-brief' }, ['Discuss the command offer with Picard and apply your PADD to the Ready Room’s Watch assignments before allocating the specialist team.']),
          act('e1-threat-look', 'look', ['The table has a Borg reference overlay and a staffing overlay. Apply the Tractor analysis to the first, then Shelby’s adaptation brief once you have prepared a watch plan.']),
        ]),
        object('e1-fleet-chart', 'Fleet readiness', 0, 'padd', [
          act('e1-fleet-look', 'look', ['Too many hulls are marked REFIT, DISTANT, or UNDER CREW. The Melbourne is among the available ships. Beside its name is a vacant captain’s assignment.']),
        ]),
        object('e1-lounge-window', 'Jouret orbit', 2, 'viewport', [
          act('e1-lounge-window-look', 'look', ['From orbit the planet still looks inhabited. Riker can pick out the cloud bank above the survey site; the missing settlement is too small to see.']),
        ]),
        person('e1-hanson', 'hanson', 0, [
          act('e1-hanson-orders-repeat', 'talk', ['“The intercept order stands. Picard has the ship; I will gather every hull that can reach the rendezvous. Put your watch plan into effect before we part company.”'], { when: all('e1-intercept-authorized') }),
          act('e1-hanson-orders', 'talk', [
            'Hanson receives the specialist assignments. “Enterprise will intercept and report. I will assemble the fleet behind you. If that cube crosses your path, we need its course and its capabilities, not a heroic guess.”',
            'His launch is ready. Shelby remains aboard as the Borg specialist. The decision about Melbourne has not vanished; it has been overtaken by the need to keep this ship alive.',
          ], {
            when: all('e1-borg-confirmed', 'e1-leadership-chosen'),
            effects: [fact('e1-intercept-authorized'), evidence('e1-intercept-orders')],
          }),
          act('e1-hanson-brief', 'talk', [
            '“I brought Shelby because she has spent the interval studying an enemy the rest of us hoped would stay distant. Let her see your physical evidence.”',
            'Hanson opens the fleet archive. “Our preparations are behind our projections. Before I ask Command for every available ship, show me whether Jouret belongs beside the earlier Borg encounters.”',
          ], {
            when: all('e1-tractor-identified'),
            effects: [fact('e1-hanson-briefed'), evidence('e1-hanson-brief')],
          }),
          act('e1-hanson-wait', 'talk', ['“Bring me a cause, Commander. An empty settlement tells me what we have lost. Your laboratory may tell us what the fleet is about to face.”']),
        ]),
        person('e1-shelby', 'shelby', 1, [
          act('e1-shelby-settled', 'talk', [
            '“I have my team and you have bridge coverage. That settles how we start, not whether I will argue when a reading changes.”',
            'Riker: “I would rather hear the argument here than discover it in a damage report.” She turns back to the phaser notes.',
          ], { when: all('e1-leadership-chosen') }),
          act('e1-leadership-choice', 'talk', [
            'Shelby studies the station map. “Let me drive the countermeasure work. You can give me a defined team and hold me to the results, or stay in the tactical loop while I direct the technical work.”',
            'Riker: “I won’t turn expertise into a competition for the captain’s attention. But we need one clear answer when the bridge asks who is deciding.”',
          ], {
            when: { all: ['e1-stations-mapped', 'e1-command-discussed'], none: ['e1-leadership-chosen'] },
            choices: [
              {
                id: 'e1-delegate', label: 'Delegate the countermeasure team',
                description: 'Give Shelby an autonomous specialist team; Riker concentrates on shipwide readiness.',
                confirm: 'Give Shelby day-to-day authority over the countermeasure team? Riker will retain command responsibility and rely on her technical recommendations. This leadership arrangement remains in the mission history.',
                requires: { none: ['e1-leadership-chosen'] },
                effects: [decision('leadership', 'delegate'), fact('e1-leadership-chosen'), evidence('e1-leadership-plan')],
                response: [
                  '“The team is yours,” Riker says. “Bring me the limits as well as the results. I will keep the rest of the ship ready to use what you find.”',
                  'Shelby assigns specialists instead of asking them to fit the work between bridge shifts. She has room to move, and responsibility for making that room count.',
                ],
              },
              {
                id: 'e1-coordinate', label: 'Coordinate the tactical work together',
                description: 'Riker joins tactical planning; Shelby retains the technical lead and directs the specialists.',
                confirm: 'Keep Riker in the countermeasure planning loop? Shelby remains technical lead, while Riker commits more of his time to coordinating tests with bridge operations. This leadership arrangement remains in the mission history.',
                requires: { none: ['e1-leadership-chosen'] },
                effects: [decision('leadership', 'coordinate'), fact('e1-leadership-chosen'), evidence('e1-leadership-plan')],
                response: [
                  'Riker moves the bridge trial slots beside Shelby’s experiments. “You decide how the equipment works. We will decide together when the ship can afford the test.”',
                  'Shelby keeps the specialist assignments. Riker accepts the extra demands on his watch rather than disguising close coordination as a lack of confidence in her.',
                ],
              },
            ],
          }),
          act('e1-shelby-assessment', 'talk', [
            '“The Borg change their defenses after contact. Repeating the strongest shot may accomplish less than changing the shot.” Shelby hands you her adaptation brief.',
            'She is equally direct about Melbourne. “I want a first officer’s assignment. That doesn’t make your experience disposable.” Riker replies that ambition will not be a problem; competing chains of command would be.',
          ], {
            when: all('e1-borg-confirmed'),
            effects: [fact('e1-shelby-briefed'), item('e1-adaptation-brief')],
          }),
          act('e1-shelby-wait', 'talk', ['“Let’s identify the attacker before we design a response. Hanson’s reference data belongs beside your Tractor analysis on the table.”']),
        ]),
      ],
    },
    {
      id: 'e1-ready', name: 'Captain’s Ready Room', deck: 'Enterprise · Deck 1', visual: 'ready-room', atmosphere: 'normal',
      description: 'Picard’s desk holds the Melbourne offer beside a watch roster. One concerns the career Riker might have; the other concerns the people who already depend on him. Neither is hidden beneath the other.',
      ambient: 'A distant bridge acknowledgment reaches the room whenever the door opens.',
      hotspots: [
        object('e1-watch-desk', 'Watch assignments', 1, 'console', [
          act('e1-watch-depart', 'use', [
            'The bridge accepts your watch assignments. Picard orders an intercept course while Hanson departs to gather the fleet; Shelby’s research team stays aboard.',
            'Riker takes his station beside the captain. Whatever comfort this ship once offered, the next duty will not be comfortable.',
          ], {
            when: all('e1-borg-confirmed', 'e1-leadership-chosen', 'e1-intercept-authorized'),
            effects: [next(2, 'e2-bridge')],
          }),
          act('e1-watch-plan', { item: 'padd' }, [
            'You move qualified relief officers into the exposed bridge shifts and reserve an uninterrupted block for anti-Borg work. No one has been assigned to two stations at once.',
            'The plan leaves a genuine choice: give Shelby operational latitude, or share the tactical scheduling burden with her. Her adaptation brief will show the staffing consequences at the lounge table.',
          ], {
            when: all('e1-command-discussed', 'e1-shelby-briefed'),
            effects: [fact('e1-watch-plan')],
          }),
          act('e1-watch-plan-wait', { item: 'padd' }, ['Hear Shelby’s assessment and speak to Picard before revising the watch. The problem is an allocation of responsibility, not an empty form.']),
          act('e1-watch-look', 'look', ['Your PADD can balance bridge coverage against Shelby’s research work. Use this station to implement the final plan after Hanson gives the intercept order.']),
          act('e1-watch-wait', 'use', ['Finish the Borg identification, agree a leadership arrangement with Shelby, and obtain Hanson’s intercept orders.']),
        ]),
        object('e1-melbourne-offer', 'Melbourne offer', 0, 'padd', [
          act('e1-melbourne-look', 'look', ['A command of his own is not an abstract possibility. Riker’s name is on the offer. Declining it would preserve a life he values, but Picard has asked him to distinguish that from standing still.']),
        ]),
        object('e1-ready-window', 'Orbit window', 2, 'viewport', [
          act('e1-ready-window-look', 'look', ['Jouret IV turns below. An argument about the future can feel indulgent beside that planet, until Riker remembers that ships are led by people who have to decide what they are becoming.']),
        ]),
        person('e1-picard', 'picard', 0, [
          act('e1-picard-dilemma', 'talk', [
            'Picard asks why Riker keeps refusing a ship of his own. Riker answers that the Enterprise is work he believes in, not a waiting room. Then he admits Shelby’s arrival has made that answer feel less settled.',
            '“She is ready to advance,” Picard says. “That need not be an accusation against you. But decide what you are staying for, Will.” Riker looks again at the offer before turning to the watch roster.',
            'He will not accept a command merely to escape an uncomfortable colleague. For this crisis he chooses his present duty—and must make room for someone whose strengths differ from his own.',
          ], {
            when: all('e1-borg-confirmed', 'e1-shelby-briefed'),
            effects: [fact('e1-command-discussed'), evidence('e1-command-dilemma')],
          }),
          act('e1-picard-wait', 'talk', ['“Hanson needs the Jouret evidence. Hear his specialist’s assessment as well. Then we should talk about Melbourne—and about how you intend to work with Commander Shelby.”']),
        ]),
      ],
    },
  ],
};
