import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

/**
 * Fully self-hosted embeddings — runs in-process on CPU, no API key, no limits.
 * Model: Xenova/multilingual-e5-small (384 dims, ~120MB, ~400MB peak RAM).
 * Strong on Vietnamese + English, matching the site's bilingual content.
 *
 * Install: npm i @xenova/transformers
 * e5 convention: prefix queries with "query: " and documents with "passage: ".
 */
@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private extractor: any = null;
  private loading: Promise<void> | null = null;

  async onModuleInit() {
    // Warm the model on boot so the first request isn't slow.
    this.load().catch((e) => this.logger.error('Model preload failed', e));
  }

  private async load() {
    if (this.extractor) return;
    if (!this.loading) {
      this.loading = (async () => {
        const { pipeline, env } = await import('@xenova/transformers');
        // Cache weights on disk so they download only once.
        env.cacheDir = process.env.HF_CACHE_DIR || './.hf-cache';
        this.extractor = await pipeline(
          'feature-extraction',
          'Xenova/multilingual-e5-small',
        );
        this.logger.log('Embedding model loaded (multilingual-e5-small)');
      })();
    }
    await this.loading;
  }

  private async run(text: string): Promise<number[]> {
    await this.load();
    const output = await this.extractor(text.slice(0, 2000), {
      pooling: 'mean',
      normalize: true,
    });
    return Array.from(output.data as Float32Array);
  }

  embedQuery(text: string): Promise<number[]> {
    return this.run(`query: ${text}`);
  }

  embedDocument(text: string): Promise<number[]> {
    return this.run(`passage: ${text}`);
  }

  /** Serialize a JS number[] into the pgvector text literal: [0.1,0.2,...] */
  toVectorLiteral(vec: number[]): string {
    return `[${vec.join(',')}]`;
  }
}
