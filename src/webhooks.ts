import type Database from 'better-sqlite3';

export interface WebhookSubscription {
  id: string;
  url: string;
  events: string;
  createdAt: string;
}

export class WebhookManager {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS webhooks (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        events TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `);
  }

  register(url: string, events: string[]): WebhookSubscription {
    const id = `wh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    this.db.prepare('INSERT INTO webhooks (id, url, events, createdAt) VALUES (?, ?, ?, ?)')
      .run(id, url, events.join(','), now);
    return { id, url, events: events.join(','), createdAt: now };
  }

  unregister(id: string): void {
    this.db.prepare('DELETE FROM webhooks WHERE id = ?').run(id);
  }

  getAll(): WebhookSubscription[] {
    return this.db.prepare('SELECT * FROM webhooks ORDER BY createdAt DESC').all() as WebhookSubscription[];
  }

  async publish(event: string, payload: Record<string, unknown>): Promise<void> {
    const subs = this.getAll().filter(s => s.events.split(',').includes(event));

    for (const sub of subs) {
      this.deliver(sub, event, payload).catch(err => {
        console.error(`[WEBHOOK] Delivery failed to ${sub.url}: ${err.message}`);
      });
    }
  }

  private async deliver(sub: WebhookSubscription, event: string, payload: Record<string, unknown>): Promise<void> {
    const body = JSON.stringify({ event, timestamp: new Date().toISOString(), payload });

    console.log(`[WEBHOOK] Delivering ${event} to ${sub.url}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(sub.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'MCARS-Webhook/1.0' },
        body,
        signal: controller.signal,
      });

      if (!res.ok) {
        console.warn(`[WEBHOOK] ${sub.url} responded with ${res.status}`);
      } else {
        console.log(`[WEBHOOK] ${sub.url} acknowledged (${res.status})`);
      }
    } catch (err: any) {
      console.error(`[WEBHOOK] Failed to reach ${sub.url}: ${err.message}`);
    } finally {
      clearTimeout(timeout);
    }
  }
}

let globalWebhookManager: WebhookManager | null = null;

export function getWebhookManager(db: Database.Database): WebhookManager {
  if (!globalWebhookManager) {
    globalWebhookManager = new WebhookManager(db);
  }
  return globalWebhookManager;
}
