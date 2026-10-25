import type {
  Action, Campaign, Chapter, Dialogue, Effect, GameState, Hotspot, Interaction,
  Requirement, Room, Transition,
} from './model';
import { stateSchema } from './model';

export function chapterFor(campaign: Campaign, state: GameState): Chapter {
  const chapter = campaign.chapters.find((entry) => entry.id === state.chapter);
  if (!chapter) throw new Error(`Unknown chapter ${state.chapter}.`);
  return chapter;
}

export function roomFor(campaign: Campaign, state: GameState): Room {
  const room = chapterFor(campaign, state).rooms.find((entry) => entry.id === state.room);
  if (!room) throw new Error(`Unknown room ${state.room} in chapter ${state.chapter}.`);
  return room;
}

export function meets(state: GameState, requirement?: Requirement): boolean {
  if (!requirement) return true;
  return (!requirement.all || requirement.all.every((id) => state.facts.includes(id)))
    && (!requirement.any || requirement.any.some((id) => state.facts.includes(id)))
    && (!requirement.none || requirement.none.every((id) => !state.facts.includes(id)))
    && (!requirement.choices || Object.entries(requirement.choices)
      .every(([key, value]) => state.commitments[key] === value));
}

export function visibleHotspots(campaign: Campaign, state: GameState): readonly Hotspot[] {
  return roomFor(campaign, state).hotspots.filter((target) => meets(state, target.visible));
}

export function startCampaign(campaign: Campaign): GameState {
  const chapter = campaign.chapters[0];
  const room = chapter?.rooms[0];
  if (!chapter || !room) throw new Error('The campaign has no opening room.');
  return {
    schema: 1, campaign: campaign.id, chapter: chapter.id, room: room.id,
    facts: [], inventory: [...campaign.initialItems], evidence: [], commitments: {},
    visited: [`${chapter.id}:${room.id}`], moves: 0, activeInteraction: null, ending: null,
    log: [],
  };
}

function appendUnique(list: string[], id: string): void {
  if (!list.includes(id)) list.push(id);
}

function applyEffects(state: GameState, effects: readonly Effect[]): string[] {
  const discoveries: string[] = [];
  for (const effect of effects) {
    switch (effect.type) {
      case 'fact':
        appendUnique(state.facts, effect.id);
        break;
      case 'item':
        if (!state.inventory.includes(effect.id)) discoveries.push(`item:${effect.id}`);
        appendUnique(state.inventory, effect.id);
        break;
      case 'remove-item':
        state.inventory = state.inventory.filter((id) => id !== effect.id);
        break;
      case 'evidence':
        if (!state.evidence.includes(effect.id)) discoveries.push(`evidence:${effect.id}`);
        appendUnique(state.evidence, effect.id);
        break;
      case 'commit':
        state.commitments[effect.key] = effect.value;
        break;
      case 'chapter':
        state.chapter = effect.chapter;
        state.room = effect.room;
        state.activeInteraction = null;
        appendUnique(state.visited, `${effect.chapter}:${effect.room}`);
        break;
      case 'ending':
        state.ending = effect.id;
        state.activeInteraction = null;
        break;
      default: {
        const exhaustive: never = effect;
        throw new Error(`Unsupported effect ${exhaustive}.`);
      }
    }
  }
  return discoveries;
}

function rejected(state: GameState, message: string): Transition {
  return {
    state, changed: false, discoveries: [],
    dialogue: { title: 'Not yet', speaker: 'computer', lines: [message], interaction: null, choices: [] },
  };
}

function complete(
  campaign: Campaign, previous: GameState, state: GameState,
  dialogue: Dialogue | null, discoveries: readonly string[],
): Transition {
  roomFor(campaign, state);
  state.moves = previous.moves + 1;
  if (dialogue) {
    state.log.push(...dialogue.lines.map((text) => ({ speaker: dialogue.speaker, text })));
    state.log = state.log.slice(-400);
  }
  return { state, dialogue, discoveries, changed: true };
}

function matchingInteraction(target: Hotspot, action: Action, state: GameState): Interaction | undefined {
  return target.interactions.find((entry) => {
    const triggerMatches = action.type === 'interact'
      ? 'verb' in entry.trigger && entry.trigger.verb === action.verb
      : action.type === 'item' && 'item' in entry.trigger && entry.trigger.item === action.item;
    return triggerMatches && meets(state, entry.when);
  });
}

export function activeDialogue(campaign: Campaign, state: GameState): Dialogue | null {
  if (!state.activeInteraction) return null;
  const target = roomFor(campaign, state).hotspots.find((entry) =>
    entry.interactions.some((interaction) => interaction.id === state.activeInteraction));
  const interaction = target?.interactions.find((entry) => entry.id === state.activeInteraction);
  if (!interaction) throw new Error('The active conversation is not available in this compartment.');
  return {
    title: interaction.title ?? target?.label ?? 'Conversation',
    speaker: interaction.speaker ?? target?.speaker ?? campaign.protagonist,
    lines: interaction.lines,
    interaction: interaction.id,
    choices: interaction.choices ?? [],
  };
}

export function resolve(campaign: Campaign, previous: GameState, action: Action): Transition {
  if (previous.ending) return rejected(previous, 'This mission has ended. Start a new timeline or load a saved mission.');
  const state = structuredClone(previous);
  const targets = visibleHotspots(campaign, state);
  if (action.type === 'travel') {
    const destination = chapterFor(campaign, state).rooms.find((room) => room.id === action.room);
    if (!destination) return rejected(previous, 'That location is not available during this operation.');
    state.room = destination.id;
    state.activeInteraction = null;
    appendUnique(state.visited, `${state.chapter}:${state.room}`);
    return complete(campaign, previous, state, null, []);
  }
  if (action.type === 'choose') {
    const interaction = roomFor(campaign, state).hotspots.flatMap((target) => target.interactions)
      .find((entry) => entry.id === action.interaction);
    if (!interaction || previous.activeInteraction !== interaction.id) {
      return rejected(previous, 'That conversation has changed. Speak with the officer or access the station again.');
    }
    const choice = interaction.choices?.find((entry) => entry.id === action.choice);
    if (!choice) return rejected(previous, 'That order is not available here.');
    if (!meets(state, choice.requires)) {
      return rejected(previous, choice.unavailable ?? 'Gather the required evidence and preparations before issuing this order.');
    }
    state.activeInteraction = null;
    const discoveries = applyEffects(state, choice.effects ?? []);
    return complete(campaign, previous, state, {
      title: interaction.title ?? 'Order acknowledged',
      speaker: choice.speaker ?? interaction.speaker ?? campaign.protagonist,
      lines: choice.response, interaction: null, choices: [],
    }, discoveries);
  }
  const target = targets.find((entry) => entry.id === action.target);
  if (!target) return rejected(previous, 'That person or station is no longer available in this compartment.');
  if (action.type === 'item' && !state.inventory.includes(action.item)) {
    return rejected(previous, 'That item is not in your inventory.');
  }
  const interaction = matchingInteraction(target, action, state);
  if (!interaction) {
    const item = action.type === 'item' ? campaign.items.find((entry) => entry.id === action.item) : null;
    const person = target.kind === 'person' ? campaign.speakers.find((entry) => entry.id === target.speaker) : null;
    const text = item
      ? `${item.name} does not address this part of the problem. Inspect ${target.label.toLowerCase()} or consult the crew for a relevant use.`
      : action.type === 'interact' && action.verb === 'look' && person
        ? person.description
        : action.type === 'interact' && action.verb === 'use' && person
          ? `${person.name} is available for conversation. Choose Talk, or present relevant evidence with an inventory item.`
      : action.type === 'interact' && action.verb === 'talk' && target.kind !== 'person'
        ? 'This is a station, not a person. Look at it for context or use it to access its controls.'
        : action.type === 'interact' && action.verb === 'scan'
          ? 'The tricorder finds no additional evidence here. A conversation or closer inspection may be more useful.'
          : `There is nothing further to ${action.type === 'interact' ? action.verb : 'do'} here at present. Check your mission objectives or consult the crew.`;
    state.activeInteraction = null;
    return complete(campaign, previous, state, {
      title: target.label, speaker: target.speaker ?? campaign.protagonist, lines: [text],
      interaction: null, choices: [],
    }, []);
  }
  const discoveries = applyEffects(state, interaction.effects ?? []);
  state.activeInteraction = interaction.choices?.length && state.chapter === previous.chapter && !state.ending
    ? interaction.id : null;
  return complete(campaign, previous, state, {
    title: interaction.title ?? target.label,
    speaker: interaction.speaker ?? target.speaker ?? campaign.protagonist,
    lines: interaction.lines,
    interaction: state.activeInteraction,
    choices: interaction.choices ?? [],
  }, discoveries);
}

export function decodeState(campaign: Campaign, value: unknown): GameState {
  const state = stateSchema.parse(value);
  if (state.campaign !== campaign.id) throw new Error('This save belongs to a different adventure.');
  const room = roomFor(campaign, state);
  const allInteractions = campaign.chapters.flatMap((chapter) => chapter.rooms)
    .flatMap((entry) => entry.hotspots).flatMap((target) => target.interactions);
  const allEffects = allInteractions.flatMap((entry) => [
    ...(entry.effects ?? []), ...(entry.choices ?? []).flatMap((choice) => choice.effects ?? []),
  ]);
  const validFacts = new Set(allEffects.filter((effect) => effect.type === 'fact').map((effect) => effect.id));
  const validCommitments = new Map<string, Set<string>>();
  for (const effect of allEffects) {
    if (effect.type !== 'commit') continue;
    const values = validCommitments.get(effect.key) ?? new Set<string>();
    values.add(effect.value);
    validCommitments.set(effect.key, values);
  }
  for (const [key, chosen] of Object.entries(state.commitments)) {
    if (!validCommitments.get(key)?.has(chosen)) throw new Error(`Unknown saved commitment: ${key}.`);
  }
  if (state.facts.some((id) => !validFacts.has(id))) throw new Error('The save contains unrecognized mission facts.');
  for (const values of [state.facts, state.evidence, state.inventory, state.visited]) {
    if (values.length !== new Set(values).size) throw new Error('The save contains duplicate mission records.');
  }
  const knownRooms = new Set(campaign.chapters.flatMap((chapter) => chapter.rooms.map((entry) => `${chapter.id}:${entry.id}`)));
  if (state.visited.some((id) => !knownRooms.has(id))) throw new Error('The save contains an unknown visited compartment.');
  for (const id of state.inventory) {
    if (!campaign.items.some((item) => item.id === id)) throw new Error(`Unknown saved item: ${id}.`);
  }
  for (const id of state.evidence) {
    if (!campaign.evidence.some((entry) => entry.id === id)) throw new Error(`Unknown saved evidence: ${id}.`);
  }
  if (state.ending && !campaign.endings.some((entry) => entry.id === state.ending)) {
    throw new Error('The saved ending is not part of this campaign.');
  }
  if (state.activeInteraction && !room.hotspots.flatMap((target) => target.interactions)
    .some((entry) => entry.id === state.activeInteraction)) {
    throw new Error('The saved conversation is not part of the current compartment.');
  }
  return state;
}

export function validateCampaign(campaign: Campaign): string[] {
  const errors: string[] = [];
  const interactions = new Set<string>();
  const speakers = new Set(campaign.speakers.map((entry) => entry.id));
  if (!speakers.has(campaign.protagonist)) errors.push('The campaign protagonist is not defined.');
  const items = new Set(campaign.items.map((entry) => entry.id));
  const evidence = new Set(campaign.evidence.map((entry) => entry.id));
  const endings = new Set(campaign.endings.map((entry) => entry.id));
  for (const id of campaign.initialItems) if (!items.has(id)) errors.push(`Missing starting item ${id}.`);
  const checkEffects = (effects: readonly Effect[], at: string) => {
    for (const effect of effects) {
      if ((effect.type === 'item' || effect.type === 'remove-item') && !items.has(effect.id)) {
        errors.push(`${at}: missing item ${effect.id}.`);
      }
      if (effect.type === 'evidence' && !evidence.has(effect.id)) errors.push(`${at}: missing evidence ${effect.id}.`);
      if (effect.type === 'ending' && !endings.has(effect.id)) errors.push(`${at}: missing ending ${effect.id}.`);
      if (effect.type === 'chapter' && !campaign.chapters
        .some((chapter) => chapter.id === effect.chapter && chapter.rooms.some((room) => room.id === effect.room))) {
        errors.push(`${at}: missing destination ${effect.chapter}/${effect.room}.`);
      }
    }
  };
  for (const chapter of campaign.chapters) {
    const roomIds = new Set<string>();
    for (const room of chapter.rooms) {
      if (roomIds.has(room.id)) errors.push(`Duplicate room ${chapter.id}/${room.id}.`);
      roomIds.add(room.id);
      const targetIds = new Set<string>();
      for (const target of room.hotspots) {
        if (targetIds.has(target.id)) errors.push(`Duplicate hotspot ${room.id}/${target.id}.`);
        targetIds.add(target.id);
        if (target.x < 0 || target.y < 0 || target.x + target.width > 480 || target.y + target.height > 300) {
          errors.push(`Out-of-bounds hotspot ${room.id}/${target.id}.`);
        }
        if (target.speaker && !speakers.has(target.speaker)) errors.push(`Missing speaker ${target.speaker}.`);
        for (const interaction of target.interactions) {
          if (interactions.has(interaction.id)) errors.push(`Duplicate interaction ${interaction.id}.`);
          interactions.add(interaction.id);
          if (interaction.speaker && !speakers.has(interaction.speaker)) errors.push(`Missing speaker ${interaction.speaker}.`);
          if ('item' in interaction.trigger && !items.has(interaction.trigger.item)) {
            errors.push(`${interaction.id}: missing trigger item ${interaction.trigger.item}.`);
          }
          checkEffects(interaction.effects ?? [], interaction.id);
          const choiceIds = new Set<string>();
          for (const choice of interaction.choices ?? []) {
            if (choiceIds.has(choice.id)) errors.push(`Duplicate choice ${interaction.id}/${choice.id}.`);
            choiceIds.add(choice.id);
            if (choice.effects?.some((effect) => effect.type === 'commit') && !choice.confirm?.trim()) {
              errors.push(`${interaction.id}/${choice.id}: irreversible commitment needs a confirmation that explains its cost.`);
            }
            checkEffects(choice.effects ?? [], `${interaction.id}/${choice.id}`);
            if (choice.speaker && !speakers.has(choice.speaker)) errors.push(`Missing speaker ${choice.speaker}.`);
          }
        }
      }
    }
  }
  return errors;
}
