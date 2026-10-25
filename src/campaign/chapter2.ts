import type { Chapter } from '../model';
import { act, all, decision, evidence, fact, item, next, object, objective, person } from './builders';

export const chapter2: Chapter = {
  id: 2, title: 'Borrowed Authority',
  subtitle: 'A true signature can carry a false instruction.', stardate: '44002.4',
  intro: [
    'The dispatch orders civilian transports toward a corridor no one aboard has observed. Its Starfleet signature is genuine. Its alleged issue time falls after its physical receipt.',
    'Someone—or something—is using the habits of an emergency to make verification feel disloyal. Riker asks for a proof that another captain could reproduce without trusting him personally.',
  ],
  objectives: [
    objective('c2-clock', 'Establish the dispatch’s physical receipt time.', all('dispatch-timed'), [
      'A network header can be rewritten. A write-once cylinder has another clock.',
      'Look at the Dispatch cylinder in the Ready Room, then Scan the Stamp reader.',
      'Keep the cylinder. Data needs the original medium, not a paraphrase of its order.',
    ]),
    objective('c2-origin', 'Prove the difference between signer and source.', all('origin-proved'), [
      'Inspect the antenna itself before accepting its status lamp.',
      'In the Relay Alcove, Look at the Antenna feed, Scan the Thermal logger, and talk to Geordi. Ask Data about signatures in the Computer Archive.',
      'Apply the Dispatch cylinder to the Signature reader, then your PADD to the Route comparator after gathering the physical timestamps.',
    ]),
    objective('c2-impact', 'Prepare a safe, informed relay decision.', all('relay-impact-known', 'isolator-issued'), [
      'A relay decision affects navigation as well as orders.',
      'Use the optical Kit after talking to Geordi. Bring the Origin proof to the Observation Lounge.',
      'Apply Origin proof to the Traffic model. It shows the real cost of silence and the real work required for supervision.',
    ]),
    objective('c2-choice', 'Choose who may listen, and who may command.', all('relay-decided'), [
      'The choice belongs in the command record, after the evidence.',
      'Return to Shelby in the Ready Room with the origin proof, impact model, and isolator.',
      'Talk to Shelby, choose Cut or Supervised, then Use the Command desk. Both choices remain viable.',
    ]),
  ],
  rooms: [
    {
      id: 'c2-ready', name: 'Captain’s Ready Room', deck: 'Deck 1', visual: 'ready-room', atmosphere: 'alert',
      description: 'Picard’s books are still where he left them. Riker has made a working space at the far edge of the desk rather than move them. A dispatch cylinder throws a narrow shadow across an unlit reader. The physical receipt stamp is small enough to overlook.',
      ambient: 'The door opens onto bridge voices, then closes on a silence that belongs to someone else.',
      hotspots: [
        object('c2-dispatch', 'Dispatch cylinder', 0, 'cylinder', [
          act('c2-dispatch-look', 'look', [
            'The order bears an authentic evacuation authority. It redirects civilian ships through the Vela approach, claiming the corridor has been cleared at 03:23.',
            'The cylinder’s write-once jacket is intact. You take the medium for an independent signature check, not because possessing it makes the order true.',
          ], { effects: [fact('dispatch-read'), item('dispatch-record'), evidence('order-content')] }),
        ]),
        object('c2-stamp', 'Stamp reader', 1, 'console', [
          act('c2-stamp-scan', 'scan', [
            'The cylinder was physically stamped at 03:19. Its metal-backed time track agrees with the reader’s independent oscillator. The alleged 03:23 issue time is four minutes later.',
            'That is a contradiction worth preserving, not yet a complete explanation. A wrong clock and a replay would call for very different responses.',
          ], { when: all('dispatch-read'), effects: [fact('dispatch-timed'), evidence('dispatch-time')] }),
          act('c2-stamp-wait', 'scan', ['Look at the Dispatch cylinder first so the reader can inspect the actual medium.']),
          act('c2-stamp-look', 'look', ['The reader has its own power cell. A mechanical witness line sits beside the digital time. Scan it with the dispatch loaded.']),
        ]),
        object('c2-desk', 'Command desk', 2, 'console', [
          act('c2-desk-end', 'use', [
            'Riker records the physical evidence and the relay disposition together. “Distribute the method. I don’t want the fleet replacing blind trust in that order with blind trust in us.”',
            'The next task is not a speech. It is finding the ships that still have people aboard.',
          ], { when: all('relay-decided', 'origin-proved'), effects: [next(3, 'c3-chart')] }),
          act('c2-desk-look', 'look', ['The desk’s command field is deliberately empty. It awaits a relay disposition whose costs have been examined in the Observation Lounge.']),
          act('c2-desk-wait', 'use', ['Establish the proof, model the relay consequences, obtain the isolator, and make the decision with Shelby.']),
        ]),
        person('c2-shelby', 'shelby', 0, [
          act('c2-shelby-settled', 'talk', ['“Our disposition is recorded. The relay crew has already acted on it. We will build the next operation around that reality.”'], { when: all('relay-decided') }),
          act('c2-relay-choice', 'talk', [
            '“Cutting the carrier denies the replay path and stops the noise. It also removes the navigation samples. We would need visual triangulation to find the fleet.”',
            '“Supervision keeps a one-way receiver and our navigation samples. Independent readers can reject false orders, but the interference still has to be measured and subtracted. Neither option gives us a free sensor picture.”',
            'Riker looks at the two assignments. Neither includes a button labeled TRUST.',
          ], {
            when: { all: ['origin-proved', 'relay-impact-known', 'isolator-issued'], none: ['relay-decided'] },
            choices: [
              { id: 'cut', label: 'Cut the suspect relay', description: 'Silence the carrier; reconstruct fleet positions visually.',
                confirm: 'Physically sever the compromised relay? You will lose automatic fleet navigation and must establish three independent visual bearings instead.',
                requires: { none: ['relay-decided'] },
                effects: [decision('relay', 'cut'), fact('relay-decided'), evidence('relay-cut')],
                response: ['Geordi physically opens the carrier path. The bridge grows quieter. Automatic fleet positions disappear with the noise; three independent visual bearings will replace them.'] },
              { id: 'supervised', label: 'Maintain supervised reception', description: 'Keep navigation samples; reject noise with active independent checks.',
                confirm: 'Retain the one-way supervised receiver? Navigation samples will remain available, but you must measure and reject changing interference before relying on them.',
                requires: { none: ['relay-decided'] },
                effects: [decision('relay', 'supervised'), fact('relay-decided'), item('noise-profile'), evidence('relay-supervised')],
                response: ['Geordi installs one-way reception and stations two independent readers. You receive a stored noise profile. It will need a fresh interference scan before it can yield reliable positions.'] },
            ],
          }),
          act('c2-shelby-talk', 'talk', [
            '“If this order is wrong, people are flying into danger because it looks exactly like the kind of order we teach them to obey.”',
            'She wants a physical chronology, a signature-versus-origin comparison, and a traffic impact model. “And the isolation hardware in hand. A policy is not an air gap.”',
          ]),
        ]),
        person('c2-worf', 'worf', 1, [
          act('c2-worf-talk', 'talk', [
            '“I have not erased the message. I have stopped it from issuing commands.” Worf can regard an object as dangerous without destroying the evidence it contains.',
            'Riker asks if the distinction will confuse anyone. “Then I will explain it twice.”',
          ]),
        ]),
      ],
    },
    {
      id: 'c2-relay', name: 'Emergency Relay Alcove', deck: 'Deck 6', visual: 'relay', atmosphere: 'damaged',
      description: 'An antenna plug hangs a finger’s width from its socket. The adjacent status lamp says CONNECTED. Frost on a local logger’s case is broken by one warm line. An optical coupling kit sits behind a clear cover, still sealed.',
      ambient: 'The command carrier makes a faint ticking in a maintenance speaker. Nobody mistakes it for a voice.',
      hotspots: [
        object('c2-antenna', 'Antenna feed', 0, 'conduit', [
          act('c2-antenna-look', 'look', [
            'There is daylight between plug and socket. The contact faces are clean, with no fresh arc. The connected lamp is reporting a logical session, not a physical path.',
            'Something can be received from a local cache while the actual antenna remains disconnected. Scan the independent logger to establish when the gap began.',
          ], { effects: [fact('antenna-observed'), evidence('antenna-gap')] }),
        ]),
        object('c2-logger', 'Thermal logger', 1, 'console', [
          act('c2-logger-scan', 'scan', [
            'The independent logger places the disconnection at 03:11. Its cooling curve agrees with the unmarked contact faces. This reading does not rely on the command carrier’s clock.',
            'Any instruction received later was delivered by something on this side of the gap.',
          ], { effects: [fact('isolation-timed'), evidence('isolation-time')] }),
        ]),
        object('c2-kit', 'Optical kit', 2, 'kit', [
          act('c2-kit-take', 'use', [
            'Geordi checks the coupling and assigns it to your command kit. It passes light in one direction without a conductive return path. The coupling is reusable; its installation will always remain a specialist’s job.',
            '“It stops a conversation becoming a connection. It doesn’t make a dangerous device safe to hold.”',
          ], { when: all('relay-explained'), effects: [item('isolator'), fact('isolator-issued')] }),
          act('c2-kit-look', 'look', ['The kit contains a one-way optical coupling, not a mysterious Borg component. Ask Geordi what it can and cannot isolate.']),
          act('c2-kit-wait', 'use', ['Ask Geordi for the isolation briefing before issuing equipment.']),
        ]),
        person('c2-geordi', 'geordi', 0, [
          act('c2-geordi-talk', 'talk', [
            '“An emergency cache exists so a broken antenna doesn’t stop a warning reaching the bridge. Someone is using that helpful behavior to borrow authority.”',
            '“The lamp only tells us the software remembers a connection. Look at the plug. Scan the local logger. Then Data can test what arrived against what could have arrived.”',
            'He authorizes the optical kit for later work. He will retain a separate coupling for the supervised relay if you choose to keep it.',
          ], { effects: [fact('relay-explained')] }),
        ]),
        person('c2-obrien', 'obrien', 1, [
          act('c2-obrien-talk', 'talk', [
            '“We used to call these witness marks old-fashioned.” O’Brien rubs a thumb near the logger’s physical index, without touching it. “Then somebody improved the software until all the clocks could agree on the same wrong answer.”',
            'He will photograph the gap before repairing anything. An orderly room can be a poor substitute for an honest record.',
          ]),
        ]),
      ],
    },
    {
      id: 'c2-computer', name: 'Computer Archive Annex', deck: 'Deck 8', visual: 'corridor', atmosphere: 'normal',
      description: 'The archive is a narrow room with more labels than chairs. Two isolated readers face each other across a scratched work surface. One verifies signatures; the other reconstructs routes. A small discarded printer ribbon lies beneath a sealed evidence drawer.',
      ambient: 'A physical reader advances one notch at a time. The sound makes an unhurried argument.',
      hotspots: [
        object('c2-signature', 'Signature reader', 0, 'console', [
          act('c2-signature-check', { item: 'dispatch-record' }, [
            'Data verifies the signed body. The authority is genuine. The transport header, however, was regenerated locally after the antenna was disconnected.',
            '“The signature answers who approved these words. It does not answer who placed them in our receiver, or whether the circumstances for that approval still exist.”',
          ], { when: all('signature-explained', 'antenna-observed', 'isolation-timed'), effects: [fact('signature-verified'), evidence('signature-check')] }),
          act('c2-signature-wait', { item: 'dispatch-record' }, ['Data needs the physical antenna observation, its independent isolation time, and a conversation about what this check proves.']),
          act('c2-signature-look', 'look', ['A marked slot accepts the original Dispatch cylinder. A valid result here cannot establish the route the cylinder’s contents took.']),
        ]),
        object('c2-route', 'Route comparator', 1, 'console', [
          act('c2-route-prove', { item: 'padd' }, [
            'You arrange three independent records: antenna isolated at 03:11, physical receipt at 03:19, alleged issue at 03:23. Data overlays the local header reconstruction.',
            'The signed body was replayed from the local emergency cache. A receipt cannot precede its claimed issue, and no new external message crossed an unplugged antenna.',
            'Data packages the records with instructions for reproducing the check. This is proof the fleet can use without taking Riker’s word for it.',
          ], { when: all('dispatch-timed', 'isolation-timed', 'signature-verified'), effects: [fact('origin-proved'), evidence('origin-proof'), item('proof-record')] }),
          act('c2-route-wait', { item: 'padd' }, ['Compare only after scanning the physical Stamp reader and Thermal logger and verifying the Dispatch cylinder at the Signature reader.']),
          act('c2-route-look', 'look', ['A three-column timeline waits for physical receipt, antenna isolation, and signature-origin analysis. Your PADD holds the observations.']),
        ]),
        object('c2-drawer', 'Evidence drawer', 2, 'locker', [
          act('c2-drawer-look', 'look', ['The drawer preserves the old printer ribbon alongside the modern cylinder. Data has kept the mundane material because an accusation should survive the failure of its prettiest display.']),
        ]),
        person('c2-data', 'data', 0, [
          act('c2-data-talk', 'talk', [
            '“Authentication is often described as trust. It is more precise to describe it as an answer to a limited question.”',
            'Data will verify the signer when you apply the Dispatch cylinder to the Signature reader. The physical antenna and logger observations establish whether that signer’s message could have arrived by the claimed route.',
            '“A familiar voice may be real and still be used against its owner. That applies to a captain as well as a cryptographic signature.” Riker does not need to ask which captain he means.',
          ], { effects: [fact('signature-explained')] }),
        ]),
        person('c2-crusher', 'crusher', 1, [
          act('c2-crusher-talk', 'talk', [
            'Crusher is checking whether the false route touches a hospital transport. “If we warn them, send the reason. A frightened medical officer should not have to choose between two authoritative voices.”',
            'She marks the transport’s needs on the traffic model for your visit to the lounge.',
          ]),
        ]),
      ],
    },
    {
      id: 'c2-observation', name: 'Observation Lounge', deck: 'Deck 1 aft', visual: 'observation', atmosphere: 'alert',
      description: 'The long table holds a traffic model instead of a briefing display. A string of amber markers represents civilian ships; empty spaces show where the sensors can no longer locate them. Beyond the windows, stars offer an older sort of navigational evidence.',
      ambient: 'The model clicks as a marker changes from an assumed position to an unknown one.',
      hotspots: [
        object('c2-model', 'Traffic model', 0, 'console', [
          act('c2-model-proof', { item: 'proof-record' }, [
            'The unverified evacuation route disappears. Without the relay, the fleet must be located from three independent visual bearings. That is slower work, but no suspect carrier enters the solution.',
            'With supervised reception, local-clock samples survive. Noise rejection must compare a stored profile with a fresh live measurement; a copied old correction would move the error rather than remove it.',
            'Neither mode is safer merely because it has a reassuring name. Both can work with the correct procedure.',
          ], { effects: [fact('relay-impact-known'), evidence('relay-impact')] }),
          act('c2-model-look', 'look', ['The civilian markers lie beneath two overlays: SILENT and SUPERVISED. Apply the Origin proof to see what each mode actually removes from the picture.']),
        ]),
        object('c2-window', 'Star window', 1, 'viewport', [
          act('c2-window-look', 'look', ['A star is not a complete navigation solution, but it also cannot tell you who to obey. In silence, three measured bearings can replace one compromised stream of coordinates.']),
        ]),
        object('c2-chair', 'Briefing place', 2, 'chair', [
          act('c2-chair-look', 'look', ['Shelby has left a place beside Riker’s, not opposite it. Her notes include disagreements in ordinary handwriting. They are easier to trust than a perfect record of unanimous confidence.']),
        ]),
        person('c2-troi', 'troi', 0, [
          act('c2-troi-talk', 'talk', [
            '“People may experience a request to verify an order as an accusation. Explain that the check protects the person who gave the original order too.”',
            'Riker says that may not be the quickest message to send. “Then send the short version first: we are asking you to think, not asking you to surrender your judgment to us.”',
          ]),
        ]),
        person('c2-guinan', 'guinan', 1, [
          act('c2-guinan-talk', 'talk', [
            '“You don’t have to prove that everyone who ever trusted the system was foolish.” Guinan turns an empty cup between her hands. “You have to show them where it stopped deserving that trust.”',
            'She looks toward the stars. “And leave them something sound to stand on while they change their minds.”',
          ]),
        ]),
      ],
    },
  ],
};
