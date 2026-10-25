import type { Chapter } from '../model';
import { act, all, decision, evidence, fact, next, object, objective, person } from './builders';

const plans = ['precision-tested', 'fleet-tested', 'sacrifice-tested'] as const;

export const chapter5: Chapter = {
  id: 5, title: 'Another Way to Fight',
  subtitle: 'Test the promise before asking anyone to pay for it.', stardate: '44004.0',
  intro: [
    'Picard is aboard, but the Borg vessel remains on course. The fleet can help within limits it has stated honestly. You have evidence of local repair behavior, not a universal weakness.',
    'Three plans are possible: a narrow strike against a verified seam, a coordinated fleet displacement attack, or an interception using an evacuated engineering hull. Before choosing, test all three, protect the dependents, and make sure no resource has been promised twice.',
  ],
  objectives: [
    objective('c5-tests', 'Demonstrate three bounded, physically plausible attack plans.', all(...plans), [
      'The laboratory can reject a false control hypothesis and test a local seam. Other plans need other rooms.',
      'Scan the Armor sample, talk to Data, and apply Origin proof to the Control model. Apply the tactical sample—or Fleet support agreement with medical contact—to the Seam bench.',
      'For fleet fire, talk to Worf, inspect the Formation chart, and apply Fleet support at the Firing model. For sacrifice, inspect the Tow model, talk to Geordi, and apply the Certified power cell to the model.',
    ]),
    objective('c5-dependents', 'Evacuate dependents without breaking the tender promise.', all('dependents-safe'), [
      'People must have names and destinations, not merely a reduced life-sign total.',
      'Ask Crusher about the evacuation in the Wardroom. Scan the Headcount board in Separation Hangar.',
      'Apply the Marigold manifest to the Evacuation desk. The count includes the birth and preserves either the staffed ward or shuttle escort.',
    ]),
    objective('c5-rehearsal', 'Allocate actual resources and brief every specialist.', all('crew-briefed'), [
      'A tested plan still needs a budget and a crew that understands its limits.',
      'Look at the Asset board. After all three tests and the evacuation, apply your PADD there.',
      'Talk to Worf again after allocation. He will conduct the full cross-specialist rehearsal, including abort conditions.',
    ]),
    objective('c5-strategy', 'Choose the cost you can defend.', all('strategy-chosen'), [
      'No strategy is hidden behind an earlier “correct” moral answer.',
      'All three plans must be tested, the dependents safe, and the specialist rehearsal complete.',
      'Use the Decision console to select Precision, Fleet, or Sacrifice. The choice is final. Use it again to begin execution.',
    ]),
  ],
  rooms: [
    {
      id: 'c5-lab', name: 'Materials Analysis Laboratory', deck: 'Deck 16', visual: 'engineering', atmosphere: 'normal',
      description: 'An inert exterior fragment rests beneath a microscope. Tiny repaired seams bend around old test marks instead of closing over them uniformly. On a separate bench, the false evacuation packet sits beside a deliberately disconnected model controller.',
      ambient: 'A test pulse sounds, then a long silence while the sample is measured rather than fired upon again.',
      hotspots: [
        object('c5-armor', 'Armor sample', 0, 'sample', [
          act('c5-armor-scan', 'scan', [
            'A low-energy test closes one seam and opens a weaker margin beside it. Repetition strengthens the tested region. The material repairs locally; it does not become either invulnerable or universally vulnerable.',
            'The useful hypothesis is one staggered strike within one repair cycle. It must be checked against current hull behavior at execution.',
          ], { effects: [fact('armor-cycle-seen'), evidence('armor-cycle')] }),
          act('c5-armor-look', 'look', ['The fresh seam bends around older scars. A Scan can measure whether repair redistributes the weakness rather than erasing it.']),
        ]),
        object('c5-control-model', 'Control model', 1, 'console', [
          act('c5-control-proof', { item: 'proof-record' }, [
            'Data applies the replayed order to an isolated model. The signed words still authenticate; no physical mechanism connects their authority to the Borg repair material.',
            'The demonstration rejects a tempting false plan: neither Picard’s voice nor a familiar command packet is a universal key. Local physical timing remains testable.',
            'Riker: “Put the rejected hypothesis in the briefing too. I want to know which easy answer we checked, not merely that we stopped mentioning it.”',
          ], { when: all('attack-physics-briefed'), effects: [fact('control-hypothesis-rejected')] }),
          act('c5-control-wait', { item: 'proof-record' }, ['Talk to Data about the limits of authority and physical control before conducting the model test.']),
          act('c5-control-look', 'look', ['This isolated controller can replay the Origin proof’s order without touching a live ship. A failed hypothesis is safest tested here.']),
        ]),
        object('c5-seam', 'Seam bench', 2, 'console', [
          act('c5-seam-tactical', { item: 'neural-map' }, [
            'Data compares the bounded tactical sample with the measured armor cycle. One exterior sector shows the predicted moving seam. A staggered firing rehearsal opens it once before the model adapts.',
            'Precision is feasible without an extra reconnaissance pass. The report states where the data came from and does not pretend its medical cost disappeared into a successful test.',
          ], { when: all('armor-cycle-seen', 'control-hypothesis-rejected'), effects: [fact('precision-tested'), evidence('precision-test')] }),
          act('c5-seam-medical', { item: 'support-record' }, [
            'Kestrel offers an unmanned close probe under Sable’s reserve shield cover. The probe’s exterior measurements replace the tactical data you declined to take from Picard.',
            'The physical model yields the predicted single-cycle opening. Precision is now feasible, but a real probe and reserve shielding are pledged if you select it. Clinical contact did not make tactical knowledge appear for free.',
          ], {
            when: { all: ['armor-cycle-seen', 'control-hypothesis-rejected'], choices: { contact: 'medical' } },
            effects: [fact('precision-tested'), fact('precision-probe-pledged'), evidence('precision-test')],
          }),
          act('c5-seam-support-tactical', { item: 'support-record' }, ['The fleet can supply external observations, but your bounded Tactical sample already contains the necessary local data. Apply that record here after the sample scan and control-model test.'], { when: { choices: { contact: 'tactical' } } }),
          act('c5-seam-map-wait', { item: 'neural-map' }, ['Scan the Armor sample, ask Data about the physics, and test Origin proof on the Control model first.']),
          act('c5-seam-support-wait', { item: 'support-record' }, ['Scan the Armor sample and reject the universal-control hypothesis at the Control model first.']),
          act('c5-seam-look', 'look', ['The bench accepts a Limited tactical sample, or a Fleet support agreement for an explicitly resourced external probe after medical contact. It tests one seam and one firing cycle.']),
        ]),
        person('c5-data', 'data', 0, [
          act('c5-data-talk', 'talk', [
            '“We should separate three claims. We have authenticated records. We have local repair behavior. We do not have command access to the Collective.”',
            'Data proposes testing the false control hypothesis with Origin proof, then comparing the Armor sample with either the tactical sample or a fleet probe. A small reproducible advantage is more useful than an enormous untested one.',
            '“If the current hull differs from the model, I will say so before Worf fires.”',
          ], { effects: [fact('attack-physics-briefed')] }),
        ]),
        person('c5-shelby', 'shelby', 1, [
          act('c5-shelby-talk', 'talk', [
            '“I came aboard wanting a weakness we could name. I would settle now for an interval we can measure.”',
            'Shelby has drafted three plans rather than one favorite with two straw alternatives. Precision spends observer cover. Fleet displacement spends allied shields. An uncrewed hull intercept spends the ship. All protect the civilian lane.',
          ]),
        ]),
      ],
    },
    {
      id: 'c5-wardroom', name: 'Fleet Liaison Wardroom', deck: 'Deck 2', visual: 'observation', atmosphere: 'alert',
      description: 'The broad table is divided between a formation chart and a list of dependents. A firing model shows two passes for Sable, then an empty third slot crossed through by its captain. Nobody has erased the line to make the plan look symmetrical.',
      ambient: 'An allied captain apologizes for a pause while a damage team passes through her bridge. Nobody asks her to hurry.',
      hotspots: [
        object('c5-formation', 'Formation chart', 0, 'padd', [
          act('c5-formation-look', 'look', [
            'The ships can approach on separate clocks and displace the cube’s shielding with staggered broad strikes. No ship must remain in the same firing lane long enough to invite a repeated response.',
            'Sable can survive two shielded passes, not three. The civilian lane sits outside every arc.',
          ], { effects: [fact('formation-observed')] }),
        ]),
        object('c5-firing', 'Firing model', 1, 'console', [
          act('c5-firing-support', { item: 'support-record' }, [
            'Using Worf’s local-clock doctrine and the observed formation limits, Shelby rehearses the broad displacement attack with the allied captains.',
            'The sequence exposes the drive structure long enough for Enterprise to strike, but the returning fire will batter allied shields and likely disable our propulsion. Earth’s uncrewed outer platforms would intercept escaping fire and may be lost. Each captain accepts a specific pass and retains a stated abort condition.',
            'The model passes without demanding a third pass from Sable or moving civilians into the firing geometry.',
          ], { when: all('formation-observed', 'fleet-doctrine'), effects: [fact('fleet-tested'), evidence('fleet-test')] }),
          act('c5-firing-wait', { item: 'support-record' }, ['Look at the Formation chart and ask Worf in the Planning Bridge for the firing doctrine before requesting a fleet rehearsal.']),
          act('c5-firing-look', 'look', ['The Fleet support agreement can authorize a rehearsal here, once Worf’s doctrine and the ships’ actual formation limits have been examined.']),
        ]),
        object('c5-names', 'Dependent list', 2, 'padd', [
          act('c5-names-look', 'look', [
            'The list includes civilian specialists, families, and the Marigold passengers. Neri has a name and a destination rather than an asterisk attached to a count.',
            'There is a box for the person receiving each group. “Departed” alone will not complete it.',
          ]),
        ]),
        person('c5-crusher', 'crusher', 0, [
          act('c5-crusher-talk', 'talk', [
            '“We can move the dependents now, while we still have choices about the route. The receiving ward and escort assignments from the earlier operation remain in force.”',
            'Crusher asks for a fresh Scan of the hangar Headcount board, then comparison with the Marigold manifest at the Evacuation desk. Her staff will reconcile names and receiving teams, not simply reduce the ship’s life-sign total.',
            '“And Picard stays on medical power. No weapons rehearsal borrows that circuit.”',
          ], { effects: [fact('dependent-protocol')] }),
        ]),
        person('c5-guinan', 'guinan', 1, [
          act('c5-guinan-talk', 'talk', [
            '“People will ask later whether there was another way.” Guinan studies the three plan tabs. “It’s a better question if you asked it first.”',
            'Riker says none of the alternatives are painless. “I didn’t say that. I said another way. Knowing the difference may be part of how you live with this.”',
          ]),
        ]),
      ],
    },
    {
      id: 'c5-hangar', name: 'Separation Service Hangar', deck: 'Deck 18', visual: 'shuttlebay', atmosphere: 'alert',
      description: 'A physical split-hull model stands in a tow cradle. Its saucer is marked CREW and its engineering section is marked EMPTY BEFORE RELEASE. Nearby, the headcount board follows actual transport groups instead of trying to infer them from departing craft.',
      ambient: 'A tug operator practices the intercept at low power while a second operator checks the civilian exclusion boundary.',
      hotspots: [
        object('c5-tow', 'Tow model', 0, 'model', [
          act('c5-tow-cell', { item: 'support-cell' }, [
            'Geordi uses the certified cell for an isolated guidance rehearsal. The empty engineering hull can be separated, guided by independent bearings, and driven into the repair wake while the fleet forces a turn.',
            'The model jams the turn and exposes the drive lattice. It does not explode the entire enemy by itself. Fleet fire is still required, and the Enterprise will be lost as a functioning starship. The mixed wreckage would also close two outer approach corridors until clearance crews finish; Earth’s inhabited lanes remain outside the intercept.',
            'The test cell is recharged and returned. No living pilot is required aboard the intercepting hull.',
          ], { when: all('mass-limit-seen', 'separation-briefed'), effects: [fact('sacrifice-tested'), evidence('sacrifice-test')] }),
          act('c5-tow-look', 'look', [
            'The engineering hull is massive enough to obstruct a repair wake during a turn. Its crew spaces can be emptied before separation. The saucer has a protected route away from the intercept.',
            'A sacrifice plan need not hide a person inside the word “hull.”',
          ], { effects: [fact('mass-limit-seen'), evidence('mass-limit')] }),
          act('c5-tow-wait', { item: 'support-cell' }, ['Inspect the Tow model and ask Geordi how the uncrewed separation would work before authorizing a powered rehearsal.']),
        ]),
        object('c5-headcount', 'Headcount board', 1, 'console', [
          act('c5-headcount-aboard', 'scan', [
            'The staffed overflow ward reports each Marigold passenger present. Wayfarer has receiving teams ready. The Enterprise’s dependents are grouped by destination and care needs.',
            'The scan agrees with the physical muster, including the infant. The manifest must still be compared at the Evacuation desk before departure.',
          ], { when: { choices: { evacuation: 'aboard' } }, effects: [fact('dependents-counted')] }),
          act('c5-headcount-escort', 'scan', [
            'The escort shuttle confirms thirteen aboard Marigold, then keeps station. Wayfarer has receiving teams for Enterprise dependents; Morrow’s rescue buffer duty is retained until transport reports clear.',
            'The manifest comparison must preserve the escort assignment rather than silently counting the shuttle as available lift.',
          ], { effects: [fact('dependents-counted')] }),
          act('c5-headcount-look', 'look', ['The board accepts fresh physical counts, not just yesterday’s departure totals. Scan it before committing evacuation.']),
        ]),
        object('c5-evac', 'Evacuation desk', 2, 'console', [
          act('c5-evac-manifest', { item: 'manifest' }, [
            'The manifest, birth addition, live count, and receiving-team acknowledgements reconcile. Crusher authorizes the medical moves; O’Brien schedules lift outside every attack corridor.',
            'Dependents reach the protected fleet refuge. Marigold’s people retain either staffed care or their promised escort, according to your first decision. Nobody has been erased from a ledger to simplify a firing plan.',
          ], { when: all('dependents-counted', 'dependent-protocol'), effects: [fact('dependents-safe'), evidence('dependents-safe')] }),
          act('c5-evac-wait', { item: 'manifest' }, ['Ask Crusher for the dependent protocol and Scan the Headcount board first.']),
          act('c5-evac-look', 'look', ['Use the Marigold manifest here after the fresh count and medical briefing. Its old count is meaningful only when compared with the birth and current receiving records.']),
        ]),
        person('c5-geordi', 'geordi', 0, [
          act('c5-geordi-talk', 'talk', [
            '“I can separate an empty engineering hull and keep its guidance independent. I will not make someone stay behind because a manual pilot sounds more heroic.”',
            'Geordi explains that the mass disrupts a turn, not the whole enemy. The fleet must force that turn and finish the exposed drive structure. Inspect the Tow model and apply the Certified power cell to authorize a physical rehearsal.',
            '“The saucer gets the people. The ship does not come back the way we know her. Put both statements in the decision.”',
          ], { effects: [fact('separation-briefed')] }),
        ]),
        person('c5-obrien', 'obrien', 1, [
          act('c5-obrien-talk', 'talk', [
            '“Guidance failure will mean coasting down the cleared intercept. It will not mean accepting the next voice that claims to be the captain.”',
            'The lesson of the false dispatch has reached the machine’s actual behavior. O’Brien seems more satisfied by that than by any speech about vigilance.',
          ]),
        ]),
      ],
    },
    {
      id: 'c5-command', name: 'Auxiliary Planning Bridge', deck: 'Deck 8 command module', visual: 'battle-bridge', atmosphere: 'alert',
      description: 'The planning board shows three incompatible allocations, not three copies of the same reserve. A separate blue line for rescue power is physically masked against reassignment. Earth is visible on a delayed optical image, ordinary weather turning beneath a terrible approach.',
      ambient: 'Officers rehearse abort phrases in normal speaking voices. Nobody wants the first use to be shouted.',
      hotspots: [
        object('c5-assets', 'Asset board', 0, 'console', [
          act('c5-assets-padd', { item: 'padd' }, [
            'You reconcile all three rehearsals with the current resource ledger. Precision uses observer cover and, after clinical contact, an external probe and reserve shielding. Fleet displacement uses two allied passes and risks our propulsion. Sacrifice uses an evacuated engineering hull.',
            'The allocation protects medical power, the civilian lane, and the tender commitment in every plan. Unselected conditional reservations will be released when the strategy is chosen.',
          ], { when: all(...plans, 'dependents-safe', 'assets-observed'), effects: [fact('resources-allocated'), evidence('resource-plan')] }),
          act('c5-assets-look', 'look', [
            'The rescue allocation is already spoken for. The remaining reserve cannot power a close probe, a third allied firing pass, and a hull-separation margin simultaneously.',
            'Your PADD can reconcile the tested alternatives once the dependents are safe. The selected plan will spend its own stated resource, not a convenient invisible surplus.',
          ], { effects: [fact('assets-observed')] }),
          act('c5-assets-wait', { item: 'padd' }, ['Complete the precision, fleet, and separation tests; evacuate dependents; and Look at this board before allocating.']),
        ]),
        object('c5-decision', 'Decision console', 1, 'console', [
          act('c5-decision-end', 'use', [
            'Riker confirms the plan already chosen. Conditional resources for the other plans are released to rescue and repair. The ship moves to the final approach.',
            'There will still be observations to make, specialists to hear, and physical stages to authorize. Choosing a plan has not executed it.',
          ], { when: all('strategy-chosen'), effects: [next(6, 'c6-bridge')] }),
          act('c5-strategy-choice', 'use', [
            'Three tested plans remain. Precision offers the best chance of bringing the Enterprise home intact. Fleet displacement is robust but exposes damaged allies and risks our propulsion. The uncrewed hull intercept protects more fleet endurance by ending the Enterprise’s service.',
            'Picard’s recovery follows the contact protocol already used; this choice cannot rewrite it. Earth can be protected by any of the three plans if the remaining execution checks are completed.',
          ], {
            when: { all: [...plans, 'dependents-safe', 'resources-allocated', 'crew-briefed'], none: ['strategy-chosen'] },
            choices: [
              { id: 'precision', label: 'Precision: strike the moving seam', description: 'Preserve the Enterprise if possible; spend observer cover and the pledged probe after clinical contact.',
                confirm: 'Commit to the staggered seam strike? Independent observers and the appropriate reconnaissance reserves will be assigned. Other plans will be released; fresh execution checks still come next.',
                requires: { all: ['precision-tested'], none: ['strategy-chosen'] },
                effects: [decision('strategy', 'precision'), fact('strategy-chosen')],
                response: ['Riker selects one staggered seam strike. Shelby activates the observer reservation. Data requires a fresh armor alignment before Worf may fire; Geordi protects the medical reserve.'] },
              { id: 'fleet', label: 'Fleet: coordinate displacement fire', description: 'Expose allied ships for two staggered passes; expect heavy damage and a tow home.',
                confirm: 'Commit the allied ships to two displacement passes? You are accepting the forecast damage to the fleet and the Enterprise’s propulsion in exchange for the more robust attack.',
                requires: { all: ['fleet-tested'], none: ['strategy-chosen'] },
                effects: [decision('strategy', 'fleet'), fact('strategy-chosen')],
                response: ['The captains receive their pass assignments and independent abort conditions. The third-pass slot remains crossed out. Riker accepts responsibility for bringing damaged ships into the line of fire.'] },
              { id: 'sacrifice', label: 'Sacrifice: intercept with the empty hull', description: 'Evacuate and separate the engineering hull; save its people but lose the Enterprise as a starship.',
                confirm: 'Commit to sacrificing the engineering hull? Every crew member must be evacuated before separation. The saucer can escape, but the Enterprise will not return as a functioning starship.',
                requires: { all: ['sacrifice-tested'], none: ['strategy-chosen'] },
                effects: [decision('strategy', 'sacrifice'), fact('strategy-chosen')],
                response: ['Riker orders a name-by-name engineering-hull evacuation, not immediate separation. The crew will command from the saucer reserve bridge. No living pilot will remain aboard the intercepting hull.'] },
            ],
          }),
          act('c5-decision-look', 'look', ['The three strategies require real tests, safe dependents, a reconciled resource plan, and the specialist rehearsal. Earlier tender, relay, and contact choices do not lock any strategy away.']),
          act('c5-decision-wait', 'use', ['Finish all three tests, evacuate dependents, allocate with the PADD at the Asset board, then talk to Worf for the complete rehearsal.']),
        ]),
        object('c5-earth', 'Earth image', 2, 'viewport', [
          act('c5-earth-look', 'look', [
            'A storm turns over an ocean. People beneath it have ordinary reasons to be awake: work, a crying child, a conversation they have delayed too long.',
            'Riker lets the image remain. A target symbol would be easier to look at and less accurate.',
          ]),
        ]),
        person('c5-worf', 'worf', 0, [
          act('c5-worf-rehearse', 'talk', [
            'The specialists rehearse in sequence. Data checks timing. Geordi owns power and separation. O’Brien verifies independent guidance. Crusher can halt an unsafe patient transfer. Shelby coordinates the allies. Worf controls the firing boundary. Troi checks that crew assent is not being confused with silence.',
            'Each officer names a condition that would stop the operation. Riker names his own: “If the civilian lane is not clear, no plan is authorized.”',
            'The rehearsal ends without applause. Everyone knows what their part means and whose voice to question if it changes.',
          ], { when: all('resources-allocated'), effects: [fact('crew-briefed'), evidence('crew-brief')] }),
          act('c5-worf-doctrine', 'talk', [
            '“The fleet sequence uses independent local clocks. A received change in orders will require a witnessed acknowledgement, not immediate obedience.”',
            'Worf supplies the two-pass doctrine for the Wardroom’s Firing model. After resource allocation, return to him for the full specialist rehearsal.',
          ], { effects: [fact('fleet-doctrine')] }),
        ]),
        person('c5-troi', 'troi', 1, [
          act('c5-troi-talk', 'talk', [
            '“Do not offer the crew a choice you intend to punish them for making.” Troi has arranged confidential relief requests before the final watch assignments.',
            'Riker asks whether many have used them. “Enough that asking mattered. The people at their stations now know they were heard.”',
          ]),
        ]),
      ],
    },
  ],
};
