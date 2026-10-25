import type { Chapter } from '../model';
import { act, all, decision, evidence, fact, item, next, object, objective, person } from '../campaign/builders';

export const chapter4: Chapter = {
  id: 4, title: 'After Wolf 359',
  subtitle: 'Picard knows our playbook. Write a different one.',
  stardate: '44002.9', assignment: 'ACTING CAPTAIN',
  intro: [
    'The Enterprise reaches Wolf 359 too late. The fleet has become a field of broken hulls. Somewhere among them is the Melbourne, the command Riker might have accepted.',
    'Admiral Hanson does not answer. The Borg have carried Picard’s knowledge through the fleet and are continuing toward Earth. Riker must search the wreckage, then find an approach his captain would not expect.',
  ],
  objectives: [
    objective('e4-aftermath', 'Search Wolf 359 and establish what happened to Hanson’s fleet.', all('e4-search-complete', 'e4-cube-tracked'), [
      'The repeating distress signal may be wreckage, not a survivor.',
      'Look at the Melbourne, Scan the Distress echoes, and talk to Data.',
      'Apply the Wreck echo filter to the Search sweep, then Scan the sweep to pick up the cube’s departing trail.',
    ]),
    objective('e4-strategy', 'Work with Guinan on a plan Picard will not anticipate.', all('e4-rescue-proposed'), [
      'A second attempt at the same attack will meet the same knowledge.',
      'After the search, talk to Guinan in the Ready Room.',
      'Apply your PADD to the Tactical sketch to develop a rescue diversion instead of another conventional attack.',
    ]),
    objective('e4-location', 'Locate Locutus and choose the shuttle’s rescue approach.', all('e4-location-fixed', 'e4-rescue-planned'), [
      'A conversation can reveal where a transmitter is without persuading its operator.',
      'Use the Borg channel on the bridge, then Scan it while Locutus is answering.',
      'Talk to Shelby and choose a close shadow approach or a wide screened approach. Both depend on the saucer’s antimatter diversion.',
    ]),
    objective('e4-separation', 'Give both sections independent power and execute the rescue separation.', all('saucer-separated'), [
      'Separation must leave two functioning sections, not one expendable hull.',
      'In Separation Control, Scan Impulse feeds, talk to Geordi, then apply your PADD to the feeds.',
      'Apply the Locutus position fix to the Section formation and Use the Mating collar. Return to the bridge and Use the Command chair.',
    ]),
  ],
  rooms: [
    {
      id: 'e4-observation', name: 'Wolf 359 Observation Gallery', deck: 'Deck 2',
      visual: 'wolf359', atmosphere: 'alert',
      description: 'An observation window frames a broken saucer and a drifting nacelle. The name MELBOURNE remains legible on one scorched fragment. Search instruments pick through the wreckage without covering the view.',
      ambient: 'A distress beacon repeats to a fleet that can no longer answer it.',
      hotspots: [
        object('e4-melbourne', 'Ruined Melbourne', 0, 'viewport', [
          act('e4-melbourne-look', 'look', [
            'The Melbourne’s forward hull is torn open. Riker recognizes the registry before the computer finishes reading it.',
            'That could have been his bridge. He leaves the image in view and asks for a search of every hull, not just the one whose name he knows.',
          ], { effects: [fact('e4-melbourne-seen'), evidence('e4-melbourne')] }),
        ]),
        object('e4-echoes', 'Distress echoes', 1, 'console', [
          act('e4-echoes-scan', 'scan', [
            'One automatic beacon is reflecting from several wrecks. Each apparent answer carries the same damaged syllable and the same fading battery curve.',
            'The reflections are hiding weaker returns. Data can use their repeated delays as a filter without suppressing an independent life sign.',
          ], { effects: [fact('e4-echoes-measured'), evidence('e4-distress-echoes')] }),
          act('e4-echoes-look', 'look', ['Several lights blink together. Scan their timing before counting them as separate distress calls.']),
        ]),
        object('e4-search', 'Search sweep', 2, 'console', [
          act('e4-search-filter', { item: 'e4-echo-filter' }, [
            'Data subtracts the measured reflections. The search resolves empty compartments, failing reactors, and the last automatic calls of destroyed ships. No surviving life signs are found in the sweep.',
            'Hanson’s flagship is among the losses; his command channel has ended. Riker records the admiral as lost with the fleet. There is no reply to wait for.',
          ], {
            when: all('e4-melbourne-seen', 'e4-echoes-measured', 'e4-search-briefed'),
            effects: [fact('e4-search-complete'), evidence('e4-fleet-losses')],
          }),
          act('e4-search-trail', 'scan', [
            'Beyond the wrecks, a single transwarp wake continues toward the Sol system. There is no battle line between the cube and Earth.',
            'The wake gives Enterprise a pursuit course. It does not offer a way to win the battle that has already been lost.',
          ], { when: all('e4-search-complete'), effects: [fact('e4-cube-tracked'), evidence('e4-earthward-trail')] }),
          act('e4-search-scan-wait', 'scan', ['Clear the overlapping distress reflections first. Data can prepare a filter from the measured echoes.']),
          act('e4-search-look', 'look', ['The sweep needs the Wreck echo filter. Inspect the Melbourne, Scan the Distress echoes, and ask Data for the filter.']),
          act('e4-search-filter-wait', { item: 'e4-echo-filter' }, ['Inspect the Melbourne and measure the Distress echoes before applying the search filter.']),
        ]),
        person('e4-data', 'data', 0, [
          act('e4-data-filter', 'talk', [
            '“The strongest signal is also the least informative. It has repeated unchanged since we entered sensor range.”',
            'Data prepares the Wreck echo filter from the measured delays. “This will remove copies of that beacon, not everything that resembles a human heartbeat.”',
          ], {
            when: all('e4-echoes-measured'),
            effects: [fact('e4-search-briefed'), item('e4-echo-filter')],
          }),
          act('e4-data-wait', 'talk', ['“Scan the Distress echoes. If they are reflections of one source, their timing will let us see what is behind them.”']),
        ]),
        person('e4-worf', 'worf', 1, [
          act('e4-worf-talk', 'talk', [
            '“They held their positions.” Worf stops enlarging the tactical display. It contains no maneuver that would turn the wrecks back into ships.',
            'Riker asks him to keep the search channel open until Data has completed the sweep.',
          ]),
        ]),
      ],
    },
    {
      id: 'e4-ready', name: 'Ready Room', deck: 'Deck 1',
      visual: 'ready-room', atmosphere: 'alert',
      description: 'Picard’s books have not moved. A tactical sketch lies on the desk where his next report should have been. Guinan stands beside it without sitting in his chair.',
      ambient: 'Beyond the door, the watch changes. Inside, the room seems to be waiting for the wrong captain.',
      hotspots: [
        object('e4-sketch', 'Tactical sketch', 1, 'padd', [
          act('e4-sketch-plan', { item: 'padd' }, [
            'Riker erases the line marked ATTACK. He draws the saucer moving off-axis and a small shuttle inside the cover of an antimatter spread.',
            '“We make the conspicuous move with the saucer. Data and Worf make the useful one. First I need Locutus to answer us long enough to locate him.”',
          ], {
            when: all('e4-new-strategy', 'e4-cube-tracked'),
            effects: [fact('e4-rescue-proposed'), evidence('e4-rescue-design')],
          }),
          act('e4-sketch-look', 'look', ['The standard attack courses are crossed out. Talk to Guinan, then use your PADD here to draw a different operation.']),
          act('e4-sketch-wait', { item: 'padd' }, ['Finish the Wolf 359 search and hear Guinan before drafting another plan.']),
        ]),
        object('e4-books', 'Picard’s books', 0, 'padd', [
          act('e4-books-look', 'look', ['A marker waits halfway through a book. Riker leaves it there. Rescuing Picard need not mean deciding his life is over.']),
        ]),
        person('e4-guinan', 'guinan', 0, [
          act('e4-guinan-strategy', 'talk', [
            '“You keep looking for the decision he would make. So do they.” Guinan rests a hand on the unused chair. “You aren’t a less experienced version of Jean-Luc. Start there.”',
            'Riker studies the cube’s course. “Then I stop trying to beat him at his own battle. I give him something to watch while we bring him back.”',
            '“That sounds like your idea,” she says. “Let your crew help you make it work.”',
          ], {
            when: all('e4-search-complete', 'deflector-failed', 'riker-promoted'),
            effects: [fact('e4-new-strategy'), evidence('e4-guinan-counsel')],
          }),
          act('e4-guinan-wait', 'talk', [
            '“Finish looking for them, Will. You won’t be able to think about what comes next while you’re still listening for Hanson.”',
          ]),
        ]),
      ],
    },
    {
      id: 'e4-bridge', name: 'Main Bridge', deck: 'Deck 1',
      visual: 'bridge', atmosphere: 'alert',
      description: 'The central chair faces the cube’s distant image. Communications occupies the tactical rail; the section-status display glows on the back wall. Shelby has cleared the ordinary attack overlays from her station.',
      ambient: 'The pursuit course repeats quietly. No one calls it an intercept yet.',
      hotspots: [
        {
          ...object('e4-command', 'Command chair', 1, 'chair', [
            act('e4-command-separate', 'use', [
              '“Execute saucer separation. Keep both sections in the operation.” Riker transfers command to the stardrive battle bridge; Shelby’s diversion team takes its assigned saucer stations.',
              'Independent power is steady. The collar releases, and the two sections ease apart into their planned formation. The shuttle is still aboard. Its rescue run comes next.',
            ], {
              when: all(
                'picard-abducted', 'locutus-revealed', 'deflector-failed', 'riker-promoted', 'shelby-appointed',
                'e4-search-complete', 'e4-cube-tracked', 'e4-new-strategy', 'e4-rescue-proposed',
                'e4-location-fixed', 'e4-rescue-planned', 'e4-independent-power', 'e4-formation-ready', 'e4-collar-ready',
              ),
              effects: [fact('saucer-separated'), evidence('e4-separation'), next(5, 'e5-battle')],
            }),
            act('e4-command-look', 'look', ['The chair’s section indicators await independent impulse power, the rescue formation, and a cleared mating collar. Separation is a diversion, not an impact course.']),
            act('e4-command-wait', 'use', ['Complete the Wolf 359 search, Guinan’s new plan, the Locutus fix, Shelby’s approach choice, and all three Separation Control preparations.']),
          ]), kind: 'object', prop: null, x: 211, y: 141, width: 58, height: 61,
        },
        {
          ...object('e4-channel', 'Borg channel', 0, 'console', [
            act('e4-channel-opened', 'use', ['The reply is already being tracked. Scan this channel to locate its source rather than repeating the hail.'], { when: all('e4-locutus-answering') }),
            act('e4-channel-hail', 'use', [
              'Locutus fills the viewer. “Your remaining vessel cannot change the result.” Behind his voice, the transmission carries the cube’s local relay timing.',
              'Riker keeps the channel open. “Then you can afford to listen.” At the rail, the communications team quietly starts the bearing recorder.',
            ], {
              when: all('e4-rescue-proposed', 'locutus-revealed'),
              speaker: 'locutus', effects: [fact('e4-locutus-answering')],
            }),
            act('e4-channel-locate', 'scan', [
              'Data separates the voice relay from the cube’s main carrier. Its internal delay places Locutus in a forward compartment, close enough to a local transporter barrier for a small team to reach him.',
              'The conversation has yielded a location, not a surrender. Data saves the Locutus position fix for the section-formation calculation.',
            ], {
              when: all('e4-locutus-answering'),
              effects: [fact('e4-location-fixed'), item('e4-location-record'), evidence('e4-locutus-location')],
            }),
            act('e4-channel-look', 'look', ['Use the channel after drafting the rescue plan. While Locutus replies, Scan its relay timing for a position fix.']),
            act('e4-channel-scan-wait', 'scan', ['There is no local reply to measure yet. Use this channel after developing the rescue diversion.']),
            act('e4-channel-wait', 'use', ['Draft the rescue diversion with Guinan’s advice before giving the Borg another look at your bridge.']),
          ]), kind: 'console', prop: null, x: 98, y: 155, width: 28, height: 22,
        },
        {
          ...object('e4-section-status', 'Section status', 2, 'console', [
            act('e4-section-status-look', 'look', [
              'Two hull outlines share one power trace. Separation Control must split the impulse loads, plot the diversion around Locutus’s location, and clear the mating collar.',
              'The saucer will draw the cube’s attention and scatter antimatter across its sensors. Neither section is a weapon to be thrown away.',
            ]),
          ]), kind: 'console', prop: null, x: 323, y: 61, width: 57, height: 53,
        },
        person('e4-shelby', 'shelby', 1, [
          act('e4-shelby-settled', 'talk', [
            '“The shuttle approach is recorded. Now give me two maneuverable sections and I can put the screen where Data needs it.”',
            'Shelby points Riker toward Separation Control. The selected course will still need preparation in the stardrive shuttlebay.',
          ], { when: all('e4-rescue-planned') }),
          act('e4-rescue-choice', 'talk', [
            '“The saucer’s antimatter spread will blind their sensors, not knock out their engines. Our shuttle has to use that interval.”',
            'Shelby sketches two routes. One hugs the saucer’s sensor shadow; the other curves through a wider part of the expanding screen. Neither asks the saucer to absorb a fatal hit.',
          ], {
            when: { all: ['e4-location-fixed', 'e4-rescue-proposed', 'shelby-appointed'], none: ['e4-rescue-planned'] },
            choices: [
              {
                id: 'close', label: 'Close shadow approach',
                description: 'Keep the shuttle close to the saucer’s sensor shadow. A short crossing requires precise launch timing.',
                requires: { all: ['e4-location-fixed', 'e4-rescue-proposed', 'shelby-appointed'], none: ['e4-rescue-planned'] },
                confirm: 'Commit to the close approach? Chapter 5 will require a precisely timed launch beneath the saucer’s antimatter screen.',
                effects: [decision('rescue', 'close'), fact('e4-rescue-planned')],
                response: [
                  '“Close approach. Keep the crossing short.” Shelby marks the launch notch inside the saucer’s silhouette.',
                  'Data will have to match that notch to the live antimatter expansion before the shuttle can launch.',
                ],
              },
              {
                id: 'wide', label: 'Wide screened approach',
                description: 'Curve through the outer antimatter screen. More clearance requires a longer, matched impulse course.',
                requires: { all: ['e4-location-fixed', 'e4-rescue-proposed', 'shelby-appointed'], none: ['e4-rescue-planned'] },
                confirm: 'Commit to the wide approach? Chapter 5 will require an impulse course that stays inside the expanding antimatter screen.',
                effects: [decision('rescue', 'wide'), fact('e4-rescue-planned')],
                response: [
                  '“Wide approach. Give the shuttle room to turn.” Shelby draws the arc under the spreading antimatter cloud.',
                  'Data will have to match the shuttle’s speed to the moving cover; wider does not mean unprotected.',
                ],
              },
            ],
          }),
          act('e4-shelby-wait', 'talk', ['“Give me a rescue plan and a position for Locutus. Then we can choose an approach instead of guessing where to send the shuttle.”']),
        ]),
      ],
    },
    {
      id: 'e4-engineering', name: 'Separation Control', deck: 'Neck engineering junction',
      visual: 'engineering', atmosphere: 'alert',
      description: 'Saucer impulse feeds run past a model of the two sections. The mating-collar mechanism is exposed beneath a clear service cover. Its indicator shows power, utilities, and structural latches as separate circuits.',
      ambient: 'Geordi’s technicians read the load on each section before moving a single switch.',
      hotspots: [
        object('e4-feeds', 'Impulse feeds', 0, 'conduit', [
          act('e4-feeds-scan', 'scan', [
            'The saucer’s impulse system is ready, but auxiliary loads still draw across the neck. Opening the collar now would trip those feeds and interrupt the diversion.',
            'The loads must move onto each section’s own supply before the umbilicals can retract.',
          ], { effects: [fact('e4-feeds-measured'), evidence('e4-power-routing')] }),
          act('e4-feeds-route', { item: 'padd' }, [
            'Geordi brings the saucer’s independent supply under load, then transfers the remaining auxiliaries. Both shield grids hold without drawing across the neck.',
            'The feeds settle into two steady traces. Enterprise will separate into two working ships, each with power to come home.',
          ], {
            when: all('e4-feeds-measured', 'e4-engineering-briefed', 'e4-rescue-planned'),
            effects: [fact('e4-independent-power')],
          }),
          act('e4-feeds-look', 'look', ['Scan the shared loads, ask Geordi about the transfer, then use your PADD to authorize independent power.']),
          act('e4-feeds-wait', { item: 'padd' }, ['Choose the rescue approach, Scan these feeds, and hear Geordi before transferring the loads.']),
        ]),
        object('e4-formation', 'Section formation', 1, 'model', [
          act('e4-formation-plot', { item: 'e4-location-record' }, [
            'The position fix places the saucer’s diversion across the cube’s view of the target compartment. The stardrive takes an offset pursuit course with a clear shuttle return path.',
            'Geordi reserves maneuvering power for both sections. The antimatter spread and the shuttle launch remain separate orders for the battle bridge.',
          ], {
            when: all('e4-location-fixed', 'e4-rescue-planned', 'e4-independent-power'),
            effects: [fact('e4-formation-ready')],
          }),
          act('e4-formation-look', 'look', ['The Locutus position fix belongs here after independent power is ready. It determines where the saucer’s diversion must cover the shuttle.']),
          act('e4-formation-wait', { item: 'e4-location-record' }, ['Choose the shuttle approach and establish independent impulse power before plotting the section formation.']),
        ]),
        object('e4-collar', 'Mating collar', 2, 'clutch', [
          act('e4-collar-ready', 'use', [
            'The neck utility connections retract only after their loads have transferred. Geordi arms the structural latches; they remain engaged until the bridge orders separation.',
            '“Two good power traces, clean utilities, matched vectors. You can give the order from the chair.”',
          ], {
            when: all('e4-independent-power', 'e4-formation-ready', 'e4-engineering-briefed'),
            effects: [fact('e4-collar-ready')],
          }),
          act('e4-collar-look', 'look', ['Utilities must retract before structural latches release. Independent power and a plotted formation are the prerequisites.']),
          act('e4-collar-wait', 'use', ['Transfer the Impulse feeds and load the Locutus position fix into Section formation first.']),
        ]),
        person('e4-geordi', 'geordi', 0, [
          act('e4-geordi-talk', 'talk', [
            '“The latches are the easy part. If we leave those auxiliary loads on the neck, the saucer loses power at exactly the wrong moment.”',
            '“Scan the feeds, transfer them with your PADD, then give the formation model our target fix. I’ll clear the collar once both halves can fly.”',
          ], { effects: [fact('e4-engineering-briefed')] }),
        ]),
      ],
    },
  ],
};
