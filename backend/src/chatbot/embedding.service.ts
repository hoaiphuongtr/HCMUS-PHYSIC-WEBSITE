import { Injectable, Logger } from '@nestjs/common';

/**
 * Self-hosted embeddings via Ollama — the SAME container that serves the answer
 * LLM. This deliberately avoids in-process native modules (onnxruntime-node,
 * sharp) that don't build/load cleanly on this deployment, and offloads the
 * embedding RAM to the Ollama container instead of the Node process.
 *
 * Model: nomic-embed-text (768-dim). Pull it once:
 *   docker compose ... exec ollama ollama pull nomic-embed-text
 * nomic convention: prefix documents with "search_document: " and queries with
 * "search_query: ". The vector dimension (768) must match ChatbotChunk.embedding.
 */
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly baseUrl = process.env.OLLAMA_URL || 'http://ollama:11434';
  private readonly model = process.env.EMBED_MODEL || 'nomic-embed-text';

  private async embed(text: string): Promise<number[]> {
    const res = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, prompt: text.slice(0, 2000) }),
    });
    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`Ollama embeddings failed: ${res.status} ${body}`);
      throw new Error('Embedding request failed');
    }
    const json = (await res.json()) as { embedding?: number[] };
    if (!json.embedding?.length) throw new Error('Empty embedding from Ollama');
    return json.embedding;
  }

  embedQuery(text: string): Promise<number[]> {
    return this.embed(`search_query: ${text}`);
  }

  embedDocument(text: string): Promise<number[]> {
    return this.embed(`search_document: ${text}`);
  }

  /** Serialize a JS number[] into the pgvector text literal: [0.1,0.2,...] */
  toVectorLiteral(vec: number[]): string {
    return `[${vec.join(',')}]`;
  }
}
