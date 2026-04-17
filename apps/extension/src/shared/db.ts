import Dexie, { type Table } from 'dexie';
import type { KnowledgeCard } from '@noteseed/shared-types';

const MAX_CARDS = 100;

export interface LocalCard {
  id: string;
  card: KnowledgeCard;
  /** When the card was stored locally (used for LRU ordering). */
  storedAt: string;
}

export interface LocalSetting {
  key: string;
  value: string;
}

class NoteSeedDB extends Dexie {
  cards!: Table<LocalCard, string>;
  settings!: Table<LocalSetting, string>;

  constructor() {
    super('noteseed-extension');
    this.version(1).stores({
      cards: 'id, storedAt',
      settings: 'key',
    });
  }

  async saveCard(card: KnowledgeCard): Promise<void> {
    const storedAt = new Date().toISOString();
    await this.cards.put({ id: card.id, card, storedAt });
    await this.trimToMaxCards();
  }

  async listRecentCards(limit: number): Promise<LocalCard[]> {
    return this.cards.orderBy('storedAt').reverse().limit(limit).toArray();
  }

  async getSetting(key: string): Promise<string | undefined> {
    const row = await this.settings.get(key);
    return row?.value;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await this.settings.put({ key, value });
  }

  /** Drop oldest entries when there are more than {@link MAX_CARDS} cards. */
  private async trimToMaxCards(): Promise<void> {
    const count = await this.cards.count();
    if (count <= MAX_CARDS) return;
    const excess = count - MAX_CARDS;
    const oldestKeys = await this.cards.orderBy('storedAt').limit(excess).primaryKeys();
    await this.cards.bulkDelete(oldestKeys);
  }
}

export const db = new NoteSeedDB();
