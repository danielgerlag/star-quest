import type { Campaign, Ending, Speaker } from '../model';
import { speakers as originalSpeakers, items as originalItems } from '../campaign/catalog';
import { chapter1 } from './chapter1';
import { chapter2 } from './chapter2';
import { chapter3 } from './chapter3';
import { chapter4 } from './chapter4';
import { chapter5 } from './chapter5';
import { chapter6 } from './chapter6';
import { act1Evidence, act1Items } from './act1';
import { act2Evidence, act2Items } from './act2';

const speakers: readonly Speaker[] = [
  ...originalSpeakers.filter((speaker) => speaker.id !== 'vale').map((speaker): Speaker => {
    if (speaker.id === 'riker') return { ...speaker, name: 'William T. Riker', role: 'USS Enterprise command',
      description: 'Riker has turned down a captaincy before. Shelby makes the question harder to avoid. He knows this crew, but knowing them is not the same as deciding what comes next.' };
    if (speaker.id === 'picard') return { ...speaker, role: 'Captain, USS Enterprise',
      description: 'Picard listens without making the uncertainty disappear. The confidence of the bridge gathers around his chair, and he is careful about what he asks people to do with it.',
      appearance: { ...speaker.appearance, uniform: '#a33749' } };
    if (speaker.id === 'shelby') return { ...speaker, name: 'Lt. Commander Shelby', role: 'Borg specialist',
      description: 'Shelby has spent months studying an enemy that can learn in seconds. Her impatience is real, but so is the work behind it. Riker will need more than rank to answer her.' };
    return speaker;
  }),
  { id: 'hanson', name: 'Admiral Hanson', role: 'Starfleet command',
    description: 'Hanson brings fleet orders and an old confidence in Picard. He studies Riker with the look of someone who thinks a younger officer has waited long enough.',
    appearance: { skin: '#d8b399', hair: '#bbb2a4', uniform: '#9f3449', style: 'bald' } },
  { id: 'locutus', name: 'Locutus', role: 'Picard, assimilated by the Borg',
    description: 'The voice and the face are Picard\'s. The machinery has made both into instruments of an enemy. Riker watches for a response that belongs to the man, not the network.',
    appearance: { skin: '#b7b4aa', hair: '#242e30', uniform: '#344247', style: 'borg' } },
];

const endings: readonly Ending[] = [{
  id: 'home-again', title: 'The Man Behind the Voice',
  subtitle: 'Earth is safe. The Enterprise is whole. Recovery takes longer.',
  tone: 'hope',
  paragraphs: [
    'Data reaches the regeneration systems through Picard. Across the cube, the drones become still. The feedback building inside their vessel finishes what the Enterprise\'s strongest weapon could not. The cube breaks apart before it can take Earth.',
    'Saucer and stardrive reunite. The Enterprise enters the repair yard as one ship, carrying the people who served in both sections. Wolf 359 cannot be undone. The missing ships remain missing, and their names are not lost inside the victory report.',
    'Crusher removes the Borg implants. Picard can speak for himself again, but the familiar room does not make the experience leave him. His crew gives him time instead of asking him to prove that he is already well.',
    { when: { choices: { leadership: 'delegate' } },
      text: 'Shelby helped build a plan that neither officer could have made alone. Riker credits her work without treating that admission as a surrender of command.' },
    { when: { choices: { leadership: 'coordinate' } },
      text: 'Riker and Shelby finish with a clearer understanding of one another. Coordination mattered, but so did listening when the specialist saw something the captain had missed.' },
    { when: { choices: { rescue: 'close' } },
      text: 'Data and Worf bring their close-approach shuttle home with scoring along its hull. The damage is repairable. The person they brought back cannot be replaced.' },
    { when: { choices: { rescue: 'wide' } },
      text: 'The wider shuttle course used every moment of the saucer\'s cover. Worf records the timing for the next crew that must bring someone home through an enemy\'s shields.' },
    { when: { choices: { link: 'paced' } },
      text: 'Crusher keeps the paced interface record with Picard\'s recovery notes. Data found the opening without treating his captain\'s mind as an inexhaustible resource.' },
    { when: { choices: { link: 'continuous' } },
      text: 'The continuous connection leaves Picard exhausted. Crusher ends every remaining diagnostic session and keeps the ward quiet. Useful information is not a reason to delay his rest.' },
    'Shelby leaves to help rebuild the fleet. Riker remains aboard as first officer. When Picard returns to the bridge, the chair is waiting for him. No one mistakes that return for the end of what he must recover from.',
  ],
}];

export const campaign: Campaign = {
  id: 'best-of-both-worlds',
  title: 'Star Quest: The Best of Both Worlds',
  protagonist: 'riker',
  commitmentLabels: {
    leadership: {
      delegate: 'Delegate Borg research to Shelby and make the tactical plan together.',
      coordinate: 'Coordinate the research teams directly while keeping Shelby as the Borg specialist.',
    },
    rescue: {
      close: 'Send Data and Worf close to the cube under the saucer\'s antimatter cover.',
      wide: 'Use a wider shuttle approach with a longer, carefully timed antimatter screen.',
    },
    link: {
      paced: 'Pace Data\'s neural connection with Crusher\'s monitored recovery intervals.',
      continuous: 'Maintain a continuous neural connection with Crusher watching the medical limits.',
    },
  },
  initialItems: ['tricorder', 'padd'],
  speakers,
  chapters: [chapter1, chapter2, chapter3, chapter4, chapter5, chapter6],
  items: [...originalItems.filter((item) => item.id === 'padd' || item.id === 'tricorder'), ...act1Items, ...act2Items],
  evidence: [...act1Evidence, ...act2Evidence],
  endings,
};
