import { z } from 'zod';
import { stateSchema } from './model';
import type { Campaign, GameState } from './model';
import { decodeState } from './engine';

const envelopeSchema = z.object({
  format: z.literal('star-quest'),
  version: z.literal(1),
  savedAt: z.string().datetime(),
  label: z.string().max(160),
  state: stateSchema,
}).strict();

export type SaveEnvelope = z.infer<typeof envelopeSchema>;
export type SaveSlot = 'auto' | 'checkpoint' | 'manual-1' | 'manual-2' | 'manual-3';

export function encodeSave(state: GameState, label: string): SaveEnvelope {
  return { format: 'star-quest', version: 1, savedAt: new Date().toISOString(), label, state };
}

export function decodeSave(campaign: Campaign, value: unknown): SaveEnvelope {
  const save = envelopeSchema.parse(value);
  return { ...save, state: decodeState(campaign, save.state) };
}

export function parseSaveFile(campaign: Campaign, text: string): SaveEnvelope {
  if (text.length > 2_000_000) throw new Error('This file is too large to be a Star Quest save.');
  const value: unknown = JSON.parse(text);
  return decodeSave(campaign, value);
}

function resultOf(request: IDBRequest): Promise<unknown> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const value: unknown = request.result;
      resolve(value);
    };
    request.onerror = () => reject(request.error ?? new Error('The save database request failed.'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error('The save transaction was interrupted.'));
    transaction.onerror = () => reject(transaction.error ?? new Error('The browser could not write this save.'));
  });
}

export class SaveStore {
  private database: Promise<IDBDatabase>;

  constructor(scope: 'mission' | 'testing' = 'mission', adventure: 'original' | 'episode' = 'original') {
    this.database = new Promise((resolve, reject) => {
      const databases = {
        original: { mission: 'star-quest-missions', testing: 'star-quest-testing' },
        episode: { mission: 'star-quest-episode', testing: 'star-quest-episode-testing' },
      };
      const request = indexedDB.open(databases[adventure][scope], 1);
      request.onupgradeneeded = () => request.result.createObjectStore('saves');
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => database.close();
        resolve(database);
      };
      request.onerror = () => reject(request.error ?? new Error('Local save storage is unavailable.'));
      request.onblocked = () => reject(new Error('Another tab is blocking save storage. Close other Star Quest tabs and reload.'));
    });
  }

  async read(slot: SaveSlot, campaign: Campaign): Promise<SaveEnvelope | null> {
    const database = await this.database;
    const transaction = database.transaction('saves', 'readonly');
    const done = transactionDone(transaction);
    const value = await resultOf(transaction.objectStore('saves').get(slot));
    await done;
    return value === undefined ? null : decodeSave(campaign, value);
  }

  async write(slot: SaveSlot, state: GameState, label: string): Promise<void> {
    const database = await this.database;
    const transaction = database.transaction('saves', 'readwrite');
    const done = transactionDone(transaction);
    transaction.objectStore('saves').put(encodeSave(state, label), slot);
    await done;
  }
}
