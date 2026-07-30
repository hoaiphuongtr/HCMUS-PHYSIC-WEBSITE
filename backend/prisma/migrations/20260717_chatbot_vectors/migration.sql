-- Enable pgvector (requires the pgvector/pgvector:pg16 image, a drop-in
-- superset of postgres:16-alpine).
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable unaccent so post search is accent- AND case-insensitive: "vien hang
-- khong" / "viện hàng không" both match "Viện Hàng không" (see
-- PostService.searchPostIdWhere). Contrib module, ships with the postgres image.
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Chunked, embedded content the chatbot searches over.
-- 768 dims = nomic-embed-text (served by Ollama). If you change EMBED_MODEL to a
-- model with a different dimension, update vector(768) here to match and rebuild.
CREATE TABLE IF NOT EXISTS "ChatbotChunk" (
  "id"         TEXT PRIMARY KEY,
  "sourceType" TEXT NOT NULL,            -- 'post' | 'faq' | 'training' | 'page'
  "sourceId"   TEXT NOT NULL,
  "language"   TEXT NOT NULL DEFAULT 'VI',
  "title"      TEXT,
  "slug"       TEXT,                      -- used to build the source link
  "content"    TEXT NOT NULL,
  "embedding"  vector(768) NOT NULL,
  "sourceDate" TIMESTAMP(3),             -- publish date of the source, for recency-aware answers
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Idempotent add for databases created before sourceDate existed.
ALTER TABLE "ChatbotChunk" ADD COLUMN IF NOT EXISTS "sourceDate" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "ChatbotChunk_source_idx"
  ON "ChatbotChunk" ("sourceType", "sourceId");

-- Approximate-nearest-neighbour index (cosine). Fine to create up front.
CREATE INDEX IF NOT EXISTS "ChatbotChunk_embedding_idx"
  ON "ChatbotChunk" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);
