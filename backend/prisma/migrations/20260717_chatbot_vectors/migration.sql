-- Enable pgvector (requires the pgvector/pgvector:pg16 image, a drop-in
-- superset of postgres:16-alpine).
CREATE EXTENSION IF NOT EXISTS vector;

-- Chunked, embedded content the chatbot searches over.
-- 384 dims = multilingual-e5-small.
CREATE TABLE IF NOT EXISTS "ChatbotChunk" (
  "id"         TEXT PRIMARY KEY,
  "sourceType" TEXT NOT NULL,            -- 'post' | 'faq' | 'training'
  "sourceId"   TEXT NOT NULL,
  "language"   TEXT NOT NULL DEFAULT 'VI',
  "title"      TEXT,
  "slug"       TEXT,                      -- used to build the source link
  "content"    TEXT NOT NULL,
  "embedding"  vector(384) NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ChatbotChunk_source_idx"
  ON "ChatbotChunk" ("sourceType", "sourceId");

-- Approximate-nearest-neighbour index (cosine). Fine to create up front.
CREATE INDEX IF NOT EXISTS "ChatbotChunk_embedding_idx"
  ON "ChatbotChunk" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);
