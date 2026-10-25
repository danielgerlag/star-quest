import type { Campaign } from '../model';
import { chapter1 } from './chapter1';
import { chapter2 } from './chapter2';
import { chapter3 } from './chapter3';
import { chapter4 } from './chapter4';
import { chapter5 } from './chapter5';
import { chapter6 } from './chapter6';
import { endings, evidence, items, speakers } from './catalog';

export const campaign: Campaign = {
  id: 'burden-of-command',
  title: 'Star Quest: The Burden of Command',
  protagonist: 'riker',
  commitmentLabels: {
    evacuation: {
      aboard: 'Receive Marigold passengers aboard; reserve the isolation annex for their care.',
      escort: 'Keep Marigold under medical-shuttle escort; preserve the annex and honor the escort commitment.',
    },
    relay: {
      cut: 'Suspect relay cut; independent visual bearings and witnessed signals replaced automatic navigation.',
      supervised: 'One-way relay supervised; live noise rejection preserved navigation without granting command authority.',
    },
    contact: {
      medical: 'Protect Picard’s clinical baseline and prioritize his recovery.',
      tactical: 'Authorize one bounded tactical sample, accepting the disclosed medical risk.',
    },
    strategy: {
      precision: 'Execute a verified, staggered seam strike with independent observer cover.',
      fleet: 'Commit to two coordinated fleet passes with protected rescue reserves.',
      sacrifice: 'Evacuate the engineering hull and use it for a guided, uncrewed interception.',
    },
  },
  initialItems: ['tricorder', 'padd'],
  speakers,
  chapters: [chapter1, chapter2, chapter3, chapter4, chapter5, chapter6],
  evidence,
  items,
  endings,
};
