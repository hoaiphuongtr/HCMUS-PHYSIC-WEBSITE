import { Injectable, Logger } from '@nestjs/common';

/**
 * Embeddings via Google Gemini (gemini-embedding-001), 768-dim to match the
 * ChatbotChunk.embedding column. Fast API calls instead of slow local CPU
 * inference — this lets us index the whole site (thousands of items) in minutes
 * instead of hours, and removes the Ollama dependency entirely.
 *
 * Uses asymmetric task types (RETRIEVAL_DOCUMENT vs RETRIEVAL_QUERY) for better
 * retrieval, and retries on 429 (rate limit) so a large reindex doesn't abort.
 * Requires GEMINI_API_KEY.
 */
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly apiKey = process.env.GEMINI_API_KEY || '';
  private readonly model = process.env.EMBED_MODEL || 'gemini-embedding-001';

  private async embed(
    text: string,
    taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY',
  ): Promise<number[]> {
    if (!this.apiKey) {
      this.logger.error('GEMINI_API_KEY is not set');
      throw new Error('Embedding not configured');
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:embedContent`;
    const body = JSON.stringify({
      model: `models/${this.model}`,
      content: { parts: [{ text: text.slice(0, 8000) }] },
      outputDimensionality: 768,
      taskType,
    });

    for (let attempt = 0; attempt < 6; attempt++) {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body,
      });
      // Retry on rate limit (429) AND transient server errors (500/502/503/504 —
      // Gemini overload during a large reindex), with increasing back-off.
      if ((res.status === 429 || res.status >= 500) && attempt < 5) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) {
        const errBody = await res.text();
        this.logger.error(`Gemini embed failed: ${res.status} ${errBody}`);
        throw new Error('Embedding request failed');
      }
      const json = (await res.json()) as { embedding?: { values?: number[] } };
      const values = json.embedding?.values;
      if (!values?.length) throw new Error('Empty embedding from Gemini');
      return values;
    }
    throw new Error('Embedding failed after retries (rate limited)');
  }

  embedQuery(text: string): Promise<number[]> {
    return this.embed(text, 'RETRIEVAL_QUERY');
  }

  embedDocument(text: string): Promise<number[]> {
    return this.embed(text, 'RETRIEVAL_DOCUMENT');
  }

  /** Serialize a JS number[] into the pgvector text literal: [0.1,0.2,...] */
  toVectorLiteral(vec: number[]): string {
    return `[${vec.join(',')}]`;
  }
}
