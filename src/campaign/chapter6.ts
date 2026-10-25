import type { Chapter, Effect } from '../model';
import { act, all, evidence, fact, object, objective, person } from './builders';

const execution = ['final-aligned', 'final-staged', 'final-executed', 'final-verified'] as const;
const finish: readonly Effect[] = [fact('final-verified'), fact('earth-safe'), evidence('earth-confirmation')];

export const chapter6: Chapter = {
  id: 6, title: 'The Burden of Command',
  subtitle: 'A decision becomes real in the people who carry it out.', stardate: '44004.5',
  intro: [
    'Earth is close enough to resolve weather. The protected civilian lane lies outside the firing approach. Every remaining asset has a name and a limit.',
    'Your strategy is fixed; its execution is not automatic. Precision requires fresh phase alignment and two observers. Fleet fire requires independent acknowledgements and an honest power allocation. Sacrifice requires an empty hull, controlled separation, and independently verified guidance.',
    'Riker commands. Specialists execute their disciplines. The final firing control will wait until the prepared operation is real, and victory must be confirmed by the people you intended to save.',
  ],
  objectives: [
    objective('c6-align', 'Establish the selected operation’s first safe condition.', all('final-aligned'), [
      'Precision starts in Engineering. Fleet starts in Signal Control. Sacrifice starts with a crew muster in Casualty Coordination.',
      'Precision: inspect the Power grid, talk to Data, apply your PADD to the Phase bench. Fleet: scan the Lane aperture, inspect Pass assignments, talk to O’Brien, apply Fleet support to Pass assignments.',
      'Sacrifice: Look at Emergency lockers, talk to Crusher, then apply the Manifest to the Casualty monitor. The engineering hull must be empty before it may separate.',
    ]),
    objective('c6-stage', 'Stage the physical resources and verify the protected lane.', all('final-staged'), [
      'The next stage is different for each strategy; no final choice substitutes for it.',
      'Precision: scan the Lane aperture, talk to O’Brien, apply Fleet support to the Aiming station. Fleet: inspect the Power grid, talk to Geordi, apply the Certified power cell to the grid.',
      'Sacrifice: Scan the Separation clutch, talk to Geordi, apply your PADD to the clutch; then inspect and Scan the Lane aperture, talk to O’Brien, and apply Fleet support to the Aiming station.',
    ]),
    objective('c6-execute', 'Authorize the prepared operation against a verified firing corridor.', all('final-executed'), [
      'A completed plan does not yet mean the firing corridor is clear.',
      'On the Final Approach Bridge, Look at Engagement plot and talk to Worf.',
      'With alignment and staging complete, Use the Command control. Worf and the specialists execute only the selected operation.',
    ]),
    objective('c6-confirm', 'Verify Earth’s safety and the human consequences before closing the log.', all('final-verified'), [
      'A disappearing enemy marker is not a civilian safety report.',
      'After execution, Scan the Casualty monitor and talk to Crusher. Apply your PADD to Earth channel.',
      'Read the direct confirmation, then return to the bridge and Use Command control to close the campaign. Outcomes retain all earlier commitments.',
    ]),
  ],
  rooms: [
    {
      id: 'c6-bridge', name: 'Final Approach Bridge', deck: 'Saucer reserve command deck', visual: 'battle-bridge', atmosphere: 'alert',
      description: 'The reserve bridge faces a direct optical view of Earth. The engagement plot leaves a broad blank corridor for civilians and refuses to draw a weapon line across it. Riker’s command control has separate indications for preparation, execution, and independent confirmation.',
      ambient: 'Nobody counts down until the operation has been authorized. The watch has time to notice what is wrong.',
      hotspots: [
        object('c6-command', 'Command control', 0, 'console', [
          act('c6-end-recovery', 'use', [
            'Earth confirms safety. The Enterprise retains reduced propulsion. The observers have spent their cover and probe reserve without spending Picard’s clinical baseline.',
            'Riker closes the combat log and opens the rescue-and-repair watch. A hopeful result still needs people willing to do tomorrow’s work.',
          ], {
            when: { all: execution, choices: { strategy: 'precision', contact: 'medical' } },
            effects: [{ type: 'ending', id: 'recovery' }],
          }),
          act('c6-end-precision-cost', 'use', [
            'Earth confirms safety and the Enterprise can return under reduced power. The narrow strike has spared the fleet a broad exchange.',
            'Picard’s tactical sample helped align it. His injured memory remains the cost that did not appear on a shield display. Riker signs both truths into the same record.',
          ], {
            when: { all: execution, choices: { strategy: 'precision', contact: 'tactical' } },
            effects: [{ type: 'ending', id: 'costly-victory' }],
          }),
          act('c6-end-fleet', 'use', [
            'Earth confirms safety. Sable and Enterprise require tows; Wayfarer has taken wounded from the firing ships. The fleet remains a fleet, but not one ready for another battle today.',
            'Riker records every accepted pass and every name on the casualty list. The captain’s treatment continues under the contact protocol already chosen. The victory does not overwrite that decision.',
          ], {
            when: { all: execution, choices: { strategy: 'fleet' } },
            effects: [{ type: 'ending', id: 'costly-victory' }],
          }),
          act('c6-end-sacrifice', 'use', [
            'Earth confirms safety. The saucer and the allied ships retain their people and a path home. The engineering hull’s last carrier has gone silent.',
            'Riker closes the Enterprise’s final combat log from the surviving saucer. No one is left aboard the hull he spent. That does not make the loss small.',
          ], {
            when: { all: execution, choices: { strategy: 'sacrifice' } },
            effects: [{ type: 'ending', id: 'last-command' }],
          }),
          act('c6-command-after', 'use', [
            'The operation has executed. Do not fire again merely because this control remains available. Visit Casualty Coordination: Scan the monitor, hear Crusher, and apply the PADD to Earth channel for independent confirmation.',
          ], { when: all('final-executed') }),
          act('c6-fire-precision', 'use', [
            '“Execute the measured sequence.” Data calls the current seam interval. Geordi holds the reserve boundary. Worf fires two staggered bursts, not a repeated maximum-power volley.',
            'The first forces a repair shift. The second crosses the opening and breaks the drive trunk behind it. The cube’s approach bends away from the inhabited lanes; Shelby directs the fleet against the disabled sections.',
            'The observers report physical breakup, not universal shutdown. Riker asks for Earth’s own confirmation before using the word safe.',
          ], {
            when: { all: ['final-aligned', 'final-staged', 'final-plot-seen', 'final-tactics'], choices: { strategy: 'precision' } },
            effects: [fact('final-executed'), fact('enterprise-mobile'), evidence('final-attack')],
          }),
          act('c6-fire-fleet', 'use', [
            '“All captains, execute your acknowledged passes.” The local clocks hold. Sable displaces the outer shield while Enterprise and the second firing ship alternate broad strikes.',
            'The drive structure opens under the staggered assault. Returning fire tears through Enterprise’s remaining propulsion margin and disables Sable’s outer shield. Shelby cancels any third pass before anyone has to request it.',
            'The cube loses its Earth approach. Rescue craft are already moving on the protected route. Riker requests a casualty report and independent surface confirmation.',
          ], {
            when: { all: ['final-aligned', 'final-staged', 'final-plot-seen', 'final-tactics'], choices: { strategy: 'fleet' } },
            effects: [fact('final-executed'), fact('enterprise-disabled'), fact('fleet-battered'), evidence('final-attack')],
          }),
          act('c6-fire-sacrifice', 'use', [
            '“Fleet, force the turn. Release the intercept.” Worf’s bounded fire drives the cube into the verified repair wake. The empty engineering hull enters along the independent optical solution.',
            'Its mass jams the turn. The collapsing structure exposes the drive lattice; the waiting fleet strikes it before the vessel can realign toward Earth.',
            'From the saucer reserve bridge, Riker watches the hull’s telemetry end. The crew muster remains complete. What disappears from the screen is a ship they loved, not a repair party forgotten inside it.',
          ], {
            when: { all: ['final-aligned', 'final-staged', 'sacrifice-separated', 'final-plot-seen', 'final-tactics'], choices: { strategy: 'sacrifice' } },
            effects: [fact('final-executed'), fact('enterprise-lost'), evidence('final-attack')],
          }),
          act('c6-command-look', 'look', ['The control will execute the selected strategy only after its unique alignment and staging procedure, a fresh Engagement plot inspection, and Worf’s tactical briefing. After execution it awaits independent confirmation.']),
          act('c6-command-wait', 'use', ['Complete the strategy-specific alignment and staging objectives. Then Look at Engagement plot and talk to Worf before authorizing execution.']),
        ]),
        object('c6-plot', 'Engagement plot', 1, 'console', [
          act('c6-plot-look', 'look', [
            'The protected lane is physically outside the proposed engagement. Live markers agree with the observer picture; no civilian symbol is hiding beneath a firing arc.',
            'A broad gray band marks uncertainty around the Borg approach. The operation targets a structure and a vector, not an assumption that every hostile system will stop at once.',
          ], { effects: [fact('final-plot-seen')] }),
        ]),
        object('c6-window', 'Forward window', 2, 'viewport', [
          act('c6-window-after', 'look', ['Small rescue lights move against the planet. The largest light in the sky has become several smaller ones. There are people below who will never know which quiet observation made this outcome possible.'], { when: all('final-executed') }),
          act('c6-window-look', 'look', ['Earth’s atmosphere is a thin blue edge, not a tactical shield. Riker leaves the optical view uncovered while the specialists work.']),
        ]),
        person('c6-worf', 'worf', 0, [
          act('c6-worf-precision', 'talk', [
            '“Two staggered bursts. No repetition after the repair shift. If Data withdraws the interval, I hold fire.”',
            'Worf confirms that the independent observers own the lane-clear report. The weapons station cannot certify its own target geometry merely because it is ready to shoot.',
          ], { when: { choices: { strategy: 'precision' } }, effects: [fact('final-tactics')] }),
          act('c6-worf-fleet', 'talk', [
            '“Each ship has acknowledged two passes and its own abort condition. If a captain breaks off, we do not turn that absence into an order for someone else to take a third pass.”',
            'Worf will use the verified local clocks and preserve the civilian corridor even if the shield picture becomes untidy.',
          ], { when: { choices: { strategy: 'fleet' } }, effects: [fact('final-tactics')] }),
          act('c6-worf-sacrifice', 'talk', [
            '“The fleet forces the turn. The empty hull blocks it. We fire on the exposed drive lattice. None of those actions can substitute for the others.”',
            'Worf has checked the saucer’s escape line against the intercept. Riker will give the release from this bridge after the muster and guidance are verified.',
          ], { effects: [fact('final-tactics')] }),
        ]),
        person('c6-shelby', 'shelby', 1, [
          act('c6-shelby-cut', 'talk', [
            '“The fleet is holding the visual solution. No one is waiting for a command carrier we chose to silence.” Shelby’s liaison team reads back each optical acknowledgement.',
            '“It’s slower than the old picture. It is also a picture every captain knows how to question.”',
          ], { when: { choices: { relay: 'cut' } } }),
          act('c6-shelby-supervised', 'talk', [
            '“The supervised receiver is still behind a one-way boundary. Noise readers are separate from the officers authorizing the passes.”',
            'A new carrier instruction appears and is quarantined without interrupting the verified schedule. Shelby keeps it for the inquiry rather than giving it the attention it asks for.',
          ]),
        ]),
      ],
    },
    {
      id: 'c6-engineering', name: 'Final Power Control', deck: 'Remote engineering station', visual: 'engineering', atmosphere: 'alert',
      description: 'The power grid exposes its reserves as separate physical loads. The medical line is capped in blue. A phase bench carries the current armor observation, while a separation clutch display mirrors the couplings that would turn one ship into two.',
      ambient: 'Geordi asks for numbers without rounding them. Data replies with the uncertainty before the mean.',
      hotspots: [
        object('c6-grid', 'Power grid', 0, 'console', [
          act('c6-grid-fleet', { item: 'support-cell' }, [
            'Geordi uses the certified cell to validate the firing-bus transition, then restores it to its service allocation. The high-energy attack uses the ship’s real reserves, not the portable test cell.',
            'The local-clock fleet acknowledgements are loaded. Medical power remains protected; the propulsion reserve is explicitly committed. Everyone can see why Enterprise may need a tow afterward.',
          ], {
            when: { all: ['final-aligned', 'final-grid-seen', 'final-engineering-brief'], choices: { strategy: 'fleet' } },
            effects: [fact('final-staged'), fact('fleet-power-staged')],
          }),
          act('c6-grid-look', 'look', [
            'The blue medical draw is small but continuous. The remaining reserve is lower than the display’s tempting total. Rescue power is already doing a job; it is not idle capacity.',
            'Precision needs a measured phase budget. Fleet displacement commits the propulsion margin. Separation reserves enough impulse for the saucer to clear the intercept.',
          ], { effects: [fact('final-grid-seen'), evidence('final-grid')] }),
          act('c6-grid-cell-wait', { item: 'support-cell' }, ['Fleet strategy uses this test after independent pass acknowledgements, a Look at the grid, and Geordi’s briefing. Other strategies use the Phase bench or Separation clutch.']),
        ]),
        object('c6-phase', 'Phase bench', 1, 'console', [
          act('c6-phase-ready', { item: 'padd' }, [
            'The current Precision alignment is recorded. Its observer reservation has already been spent or confirmed; repeating authorization will not produce another probe.',
            'Continue at the Aiming station after scanning the civilian lane and hearing O’Brien.',
          ], { when: { all: ['final-aligned'], choices: { strategy: 'precision' } } }),
          act('c6-phase-medical', { item: 'padd' }, [
            'The pledged unmanned probe enters the close observation interval under Sable’s reserve cover. It returns the current seam timing, then is lost to the adapting repair surface.',
            'Data compares the return with the tested model and Geordi’s visible power limits. The current opening is narrow but sufficient. You have bought the information with a probe and reserve shielding, not with further demands on Picard.',
          ], {
            when: { all: ['final-grid-seen', 'final-physics-brief', 'precision-probe-pledged'], choices: { strategy: 'precision', contact: 'medical' } },
            effects: [fact('final-aligned'), fact('precision-probe-spent'), evidence('final-precision')],
          }),
          act('c6-phase-tactical', { item: 'padd' }, [
            'Data compares the tactical map’s local prediction with a fresh passive hull reading. The moving seam remains within the tested tolerance; a different reading would have invalidated the firing solution.',
            'Geordi fits the burst schedule inside the visible power budget. The alignment is current and bounded. The medical cost of obtaining the initial map remains in a separate, unaltered record.',
          ], {
            when: { all: ['final-grid-seen', 'final-physics-brief'], choices: { strategy: 'precision', contact: 'tactical' } },
            effects: [fact('final-aligned'), evidence('final-precision')],
          }),
          act('c6-phase-look', 'look', ['For Precision, Look at the Power grid, talk to Data, then apply your PADD here to authorize a fresh alignment. Earlier testing alone is not enough.']),
          act('c6-phase-wait', { item: 'padd' }, ['This is the Precision alignment station. Inspect the actual Power grid and hear Data’s final tolerance briefing first.']),
        ]),
        object('c6-clutch', 'Separation clutch', 2, 'clutch', [
          act('c6-clutch-separated', { item: 'padd' }, [
            'The engineering hull is already separated. Guidance, not another release, is the next task. Inspect and Scan the Lane aperture, hear O’Brien, then apply Fleet support to the Aiming station.',
          ], { when: all('sacrifice-separated') }),
          act('c6-clutch-split', { item: 'padd' }, [
            'Crusher’s name-by-name muster and independent hull scan agree. Geordi uncouples the engineering section under controlled thrust and verifies that the saucer has cleared the separation envelope.',
            'The empty hull retains guidance and power. Riker remains on the saucer reserve bridge. The next authorization belongs at Signal Control, where independent observers must lock the intercept.',
          ], {
            when: { all: ['final-aligned', 'clutch-scanned', 'final-engineering-brief'], choices: { strategy: 'sacrifice' } },
            effects: [fact('sacrifice-separated'), evidence('final-separation')],
          }),
          act('c6-clutch-scan', 'scan', [
            'The mechanical couplings have matched pressure and independent release power. Two service hatches still report closed; a name-by-name muster must establish that no one is behind them.',
            'There is no fault requiring a volunteer to remain. The manual-looking hardware has a tested remote release.',
          ], { effects: [fact('clutch-scanned')] }),
          act('c6-clutch-look', 'look', ['The physical coupling telemetry is separate from the guidance carrier. Scan it and ask Geordi for the release procedure; a sacrifice plan begins with accounting for people.']),
          act('c6-clutch-wait', { item: 'padd' }, ['For Sacrifice, first complete the muster in Casualty Coordination. Scan the clutch and talk to Geordi before authorizing separation.']),
        ]),
        person('c6-geordi', 'geordi', 0, [
          act('c6-geordi-talk', 'talk', [
            '“The portable cell certifies a transition. It does not power the attack. The power board shows what the ship will actually spend.”',
            'For fleet fire, Geordi requires the independent pass acknowledgements and a grid inspection before the cell test. For sacrifice, he requires Crusher’s hull muster and a clutch Scan before accepting the PADD authorization.',
            '“Whatever we choose, medical support remains on its own reserve. I’m not asking Beverly to win a power argument while she treats someone.”',
          ], { effects: [fact('final-engineering-brief')] }),
        ]),
        person('c6-data', 'data', 1, [
          act('c6-data-talk', 'talk', [
            '“The model predicts a moving seam. The final observation must confirm that prediction. A successful rehearsal is not evidence that the enemy has agreed to repeat its conditions.”',
            'For Precision, inspect the Power grid and apply your PADD to the Phase bench. Clinical contact invokes the explicitly pledged external probe; tactical contact uses the limited map with a fresh passive check.',
            '“If either measurement disagrees, the weapon remains held. The control does not count our impatience as another observation.”',
          ], { effects: [fact('final-physics-brief')] }),
        ]),
      ],
    },
    {
      id: 'c6-control', name: 'Independent Signal Control', deck: 'Saucer dorsal station', visual: 'relay', atmosphere: 'alert',
      description: 'The aiming station accepts observer bearings through isolated channels. Pass assignments are written against ship names and local times. An optical aperture shows the civilian lane directly; its empty space must be measured, not assumed from a departure message.',
      ambient: 'One officer reads a number. Another points at its source before acknowledging it.',
      hotspots: [
        object('c6-aperture', 'Lane aperture', 0, 'viewport', [
          act('c6-aperture-scan', 'scan', [
            'The last civilian marker has physically cleared the attack boundary. The protected lane is empty within the observers’ stated margins.',
            'This is a current measurement, not a reused “departed” message. It can support a firing or guidance authorization.',
          ], { effects: [fact('final-civilians-clear'), evidence('final-civilians')] }),
          act('c6-aperture-look', 'look', [
            'The repair wake bends away from the civilian lane during a forced turn. A damaged exterior mast produces a brief, repeatable shadow at its edge.',
            'That physical feature supplies the intercept’s angular limit. Scan the lane as well before committing any empty hull to this path.',
          ], { effects: [fact('wake-observed')] }),
        ]),
        object('c6-passes', 'Pass assignments', 1, 'console', [
          act('c6-passes-support', { item: 'support-record' }, [
            'Shelby requests witnessed local-clock acknowledgements from each captain. They return their two-pass assignments and abort conditions, independently of any incoming command carrier.',
            'Sable’s third slot remains closed. The lane is currently clear. Fleet alignment is complete; Engineering must now stage the actual power transition.',
          ], {
            when: { all: ['pass-limits-seen', 'final-civilians-clear', 'final-guidance-brief'], choices: { strategy: 'fleet' } },
            effects: [fact('final-aligned'), evidence('final-fleet')],
          }),
          act('c6-passes-look', 'look', [
            'The assignments are not simultaneous volleys. They are staggered local-clock passes with time to break away. A red line physically masks the nonexistent third pass.',
            'For fleet strategy, apply the Fleet support agreement after scanning the lane and hearing O’Brien’s independent-channel briefing.',
          ], { effects: [fact('pass-limits-seen')] }),
          act('c6-passes-wait', { item: 'support-record' }, ['This station aligns the Fleet strategy. Inspect its limits, Scan the Lane aperture, and talk to O’Brien first.']),
        ]),
        object('c6-aim', 'Aiming station', 2, 'console', [
          act('c6-aim-precision', { item: 'support-record' }, [
            'Kestrel and the Enterprise’s passive observer independently confirm the fresh phase solution and the empty civilian lane. The firing geometry intersects only the bounded seam target.',
            'O’Brien locks the one-way observer inputs. The specialist responsible for firing cannot silently revise the evidence authorizing that fire.',
          ], {
            when: { all: ['final-aligned', 'final-civilians-clear', 'final-guidance-brief'], choices: { strategy: 'precision' } },
            effects: [fact('final-staged'), fact('precision-observers-ready')],
          }),
          act('c6-aim-sacrifice', { item: 'support-record' }, [
            'Morrow and Kestrel fix the separated hull’s intercept against the observed wake boundary. O’Brien tests the lost-signal behavior: maintain the cleared course, reject unverified replacement commands.',
            'The saucer escape line remains outside the intercept. The empty hull is staged. Only Riker’s bridge authorization can now begin the fleet turn and release sequence.',
          ], {
            when: { all: ['sacrifice-separated', 'wake-observed', 'final-civilians-clear', 'final-guidance-brief'], choices: { strategy: 'sacrifice' } },
            effects: [fact('final-staged'), fact('intercept-locked'), evidence('final-trajectory')],
          }),
          act('c6-aim-look', 'look', ['Precision uses Fleet support here after Engineering alignment and a live lane scan. Sacrifice uses it after hull separation, a wake observation, and the same live safety check. Ask O’Brien to verify the independent channels.']),
          act('c6-aim-wait', { item: 'support-record' }, ['Precision needs final phase alignment. Sacrifice needs an empty, separated hull and observed wake. Both need a fresh Lane aperture Scan and O’Brien’s briefing. Fleet uses Pass assignments instead.']),
        ]),
        person('c6-obrien', 'obrien', 0, [
          act('c6-obrien-cut', 'talk', [
            '“We kept the command carrier cut. Our bearings and acknowledgements are visual or narrow-beam, and each has a local witness. No cached coordinates have wandered back in as a convenience.”',
            'He requires a live Lane aperture Scan before any staging. Sacrifice also needs the visible wake boundary. Fleet needs the pass limits inspected before its agreement is applied.',
          ], { when: { choices: { relay: 'cut' } }, effects: [fact('final-guidance-brief')] }),
          act('c6-obrien-supervised', 'talk', [
            '“The supervised carrier has a fresh noise rejection check and no route to an actuator. Our final acknowledgements still come from independent local witnesses.”',
            'He requires a live Lane aperture Scan before staging. The retained navigation samples are useful; they are not allowed to certify their own correctness.',
          ], { effects: [fact('final-guidance-brief')] }),
        ]),
        person('c6-troi', 'troi', 1, [
          act('c6-troi-talk', 'talk', [
            '“The crew are afraid, and they understand what they are doing. Those statements do not contradict each other.”',
            'Troi has kept the relief requests and the assignments separate from the commendation list. No one should have to earn the right to be frightened.',
          ]),
        ]),
      ],
    },
    {
      id: 'c6-medical', name: 'Casualty Coordination Room', deck: 'Saucer medical command', visual: 'sickbay', atmosphere: 'alert',
      description: 'A casualty monitor shares a table with a name-by-name muster. Emergency lockers stand open, showing the supplies actually aboard the saucer. The Earth channel is a plain receiver set to independent surface and orbital stations, not the tactical display’s interpretation of them.',
      ambient: 'Crusher keeps the room quiet enough for a tired orderly to ask a question without raising a hand.',
      hotspots: [
        object('c6-casualties', 'Casualty monitor', 0, 'console', [
          act('c6-casualties-muster', { item: 'manifest' }, [
            'Crusher reconciles the ship’s live personnel roster with the dependent manifest and the current transport groups. Repair parties, transport workers, and the last service technician answer by name.',
            'An independent scan finds no life signs in the engineering hull. The remaining people are on the saucer or acknowledged by receiving ships. Separation is now ethically and physically prepared, not merely technically possible.',
          ], {
            when: { all: ['emergency-capacity-seen', 'final-medical-brief'], choices: { strategy: 'sacrifice' } },
            effects: [fact('final-aligned'), fact('engineering-hull-empty'), evidence('final-muster')],
          }),
          act('c6-casualties-scan-after', 'scan', [
            'The monitor resolves actual casualty and rescue reports against ship positions. Some entries are still being updated; none are silently counted as safe because their transmitter went quiet.',
            'Crusher can now distinguish medical response priorities from the independent question of Earth’s immediate safety.',
          ], { when: all('final-executed'), effects: [fact('final-casualties-reviewed')] }),
          act('c6-casualties-scan-before', 'scan', ['The live muster is available, but there is no post-operation casualty report yet. For Sacrifice, inspect Emergency lockers, hear Crusher, and apply the Manifest here.']),
          act('c6-casualties-look', 'look', ['Before a hull sacrifice, this station reconciles the Manifest with a live crew muster. After execution, Scan it for actual human consequences.']),
          act('c6-casualties-wait', { item: 'manifest' }, ['The Sacrifice muster requires a Look at Emergency lockers and Crusher’s briefing. The other strategies do not evacuate the engineering hull.']),
        ]),
        object('c6-lockers', 'Emergency lockers', 1, 'locker', [
          act('c6-lockers-look', 'look', [
            'The saucer has the recorded emergency supplies, oxygen capacity, and life-support reserve for the remaining crew. A shelf is empty because those supplies already went with the dependents.',
            'The count is sufficient without assuming a second shipment from a hull you intend to lose.',
          ], { effects: [fact('emergency-capacity-seen')] }),
        ]),
        object('c6-earth', 'Earth channel', 2, 'console', [
          act('c6-earth-precision', { item: 'padd' }, [
            'You compare the attack record with direct surface reports and two independent orbital observers. The disabled sections have broken up outside the inhabited lanes. No surviving approach threatens Earth.',
            'Earth’s orbital docks and defense platforms remain operational. Enterprise has reduced propulsion, the fleet retains rescue capacity, and Picard’s treatment continues under the limits already recorded. Crusher will not let the victory report replace her clinical one.',
          ], {
            when: { all: ['final-executed', 'final-casualties-reviewed', 'final-medical-brief'], choices: { strategy: 'precision' } },
            effects: [...finish, fact('earth-orbital-services-intact')],
          }),
          act('c6-earth-fleet', { item: 'padd' }, [
            'Surface stations and orbital observers independently confirm breakup outside the inhabited lanes. The planet is safe from this approach.',
            'Earth’s outer defense platforms intercepted the broad exchange’s escaping fire; two uncrewed platforms are lost and the orbital defense network needs rebuilding. Sable and Enterprise need tows. Medical teams are treating wounded across the firing ships.',
            'The protected lane has allowed rescue to begin immediately. The surface and civilian habitats are intact; the defense and fleet costs are recorded rather than hidden beneath the word success.',
          ], {
            when: { all: ['final-executed', 'final-casualties-reviewed', 'final-medical-brief'], choices: { strategy: 'fleet' } },
            effects: [...finish, fact('earth-defense-platforms-lost')],
          }),
          act('c6-earth-sacrifice', { item: 'padd' }, [
            'The surface and orbital reports agree: the intercept and fleet strike broke the approach outside the inhabited lanes. The saucer has reached its safe escape corridor.',
            'Crusher’s muster still reconciles. The engineering hull is lost, but nobody is missing aboard it. Allied ships retain enough endurance to escort the saucer and continue rescue work.',
            'Earth’s habitats and defense platforms survived. Two outer approach corridors must remain closed while the mixed wreckage is cleared; civilian shipping will use the longer surveyed lane. Saving the planet did not leave its next morning unchanged.',
          ], {
            when: { all: ['final-executed', 'final-casualties-reviewed', 'final-medical-brief'], choices: { strategy: 'sacrifice' } },
            effects: [...finish, fact('earth-outer-approaches-closed')],
          }),
          act('c6-earth-look', 'look', ['A Command PADD can compare the execution record with Earth’s own reports after a casualty Scan and Crusher’s briefing. A tactical icon disappearing is not sufficient confirmation.']),
          act('c6-earth-wait', { item: 'padd' }, ['Execute the prepared operation first. Then Scan the Casualty monitor and talk to Crusher before asking Earth to confirm the outcome.']),
        ]),
        person('c6-crusher', 'crusher', 0, [
          act('c6-crusher-talk', 'talk', [
            '“For separation, I need the emergency stores inspected and the manifest reconciled against a live, name-by-name muster. An empty corridor is not an empty hull.”',
            '“After any attack, scan the casualty reports here, then compare our record with Earth’s own channel using your PADD. My patients do not become statistics in a targeting solution.”',
            'Crusher looks toward the quiet chair beside the medical screen. “His recovery is not over just because your operation is.”',
          ], { effects: [fact('final-medical-brief')] }),
        ]),
        person('c6-picard', 'picard', 1, [
          act('c6-picard-medical', 'talk', [
            'Picard is permitted a short visit to the quieter coordination room. He asks whether the civilian ships have somewhere to go. Riker can answer with names and assignments.',
            '“Good,” Picard says. He does not ask for the captain’s chair. Crusher ends the visit while it is still enough.',
          ], { when: { choices: { contact: 'medical' } } }),
          act('c6-picard-tactical', 'talk', [
            'Picard’s visit is brief and medically supervised. He studies a list of familiar ship names, then turns it face down when the effort becomes too much.',
            'Riker sits beside him without asking for a memory. The silence is not evidence of consent, recovery, or failure. It is simply time they can share without taking anything else.',
          ]),
        ]),
      ],
    },
  ],
};
