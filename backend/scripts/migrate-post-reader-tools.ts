import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import KeyvRedis from '@keyv/redis';
import { PrismaClient } from '../src/generated/prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

type PuckNode = {
  type?: string;
  props?: Record<string, any>;
};

type PuckTree = {
  root?: unknown;
  content?: PuckNode[];
  zones?: Record<string, PuckNode[]>;
};

// Find the first article Container (one that holds a PostHeader/PostBody/etc.)
const isArticleContainer = (node: PuckNode): boolean => {
  if (node.type !== 'Container') return false;
  const content = (node.props?.content ?? []) as PuckNode[];
  return content.some((c) =>
    ['PostHeader', 'PostBody', 'PostCoverImage', 'PostTitle'].includes(
      c.type ?? '',
    ),
  );
};

const moveReaderToolsIntoArticle = (tree: PuckTree): boolean => {
  const content = tree.content;
  if (!Array.isArray(content)) return false;
  const readerIdx = content.findIndex((n) => n.type === 'PostReaderTools');
  if (readerIdx < 0) return false;
  const articleIdx = content.findIndex(isArticleContainer);
  if (articleIdx < 0) return false;
  // If reader is already inside the article container, no-op
  const reader = content[readerIdx];
  const article = content[articleIdx];
  const articleContent = (article.props!.content ?? []) as PuckNode[];
  if (articleContent.some((n) => n.type === 'PostReaderTools')) return false;
  // Move
  content.splice(readerIdx, 1);
  articleContent.unshift(reader);
  article.props!.content = articleContent;
  return true;
};

async function main() {
  const layouts = await prisma.pageLayout.findMany({
    select: { id: true, name: true, puckData: true, publishedPuckData: true },
  });
  let touched = 0;
  for (const l of layouts) {
    const pp = JSON.parse(JSON.stringify(l.puckData ?? {})) as PuckTree;
    const moved1 = moveReaderToolsIntoArticle(pp);
    let moved2 = false;
    let pub: PuckTree | null = null;
    if (l.publishedPuckData) {
      pub = JSON.parse(JSON.stringify(l.publishedPuckData)) as PuckTree;
      moved2 = moveReaderToolsIntoArticle(pub);
    }
    if (!moved1 && !moved2) continue;
    await prisma.pageLayout.update({
      where: { id: l.id },
      data: {
        puckData: moved1 ? (pp as any) : undefined,
        publishedPuckData: moved2 ? (pub as any) : undefined,
      },
    });
    touched++;
    console.log(`Migrated: ${l.name}`);
  }
  console.log(`Done. ${touched} layouts migrated.`);

  if (process.env.REDIS_URL) {
    const store = new KeyvRedis(process.env.REDIS_URL);
    try {
      await store.clear();
      console.log('Redis cache flushed');
    } finally {
      try {
        await store.disconnect();
      } catch {
        // ignore
      }
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
