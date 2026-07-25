import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from './embedding.service';
import { LlmService } from './llm.service';

type Localized = { vi?: string; en?: string } | string | null;

const pickLang = (v: Localized, lang: 'VI' | 'EN'): string => {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return (lang === 'EN' ? v.en : v.vi) || v.vi || v.en || '';
};

// Puck layout noise pollutes embeddings and confuses the LLM (CSS classes, ids,
// slugs, URLs, hex colors, size tokens). Keep only human-readable text.
const isNoise = (s: string): boolean => {
  const t = s.trim();
  if (!t) return true;
  if (/\s/.test(t)) return false; // contains a space → real text, keep
  if (/^(https?:|\/|#|data:)/i.test(t)) return true; // url / path / hex / data-uri
  if (/[-_/]/.test(t)) return true; // css class / slug / id like "leaders-sp-new"
  if (/^[a-z]{1,4}$/.test(t)) return true; // util/size tokens: sm, lg, md, base, full
  return false;
};

// Flatten Puck/rich body JSON into plain text, dropping layout noise.
const flattenBody = (body: unknown): string => {
  const out: string[] = [];
  const walk = (n: any) => {
    if (n == null) return;
    if (typeof n === 'string') {
      if (!isNoise(n)) out.push(n);
      return;
    }
    if (Array.isArray(n)) {
      n.forEach(walk);
      return;
    }
    if (typeof n === 'object') Object.values(n).forEach(walk);
  };
  walk(body);
  return out.join(' ').replace(/\s+/g, ' ').trim();
};

const chunk = (text: string, size = 900, overlap = 150): string[] => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= size) return clean ? [clean] : [];
  const chunks: string[] = [];
  for (let i = 0; i < clean.length; i += size - overlap) {
    chunks.push(clean.slice(i, i + size));
  }
  return chunks;
};

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embedding: EmbeddingService,
    private readonly llm: LlmService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private cuid(): string {
    return 'c' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  private async insertChunk(row: {
    sourceType: string;
    sourceId: string;
    language: 'VI' | 'EN';
    title: string | null;
    slug: string | null;
    content: string;
  }) {
    const vec = await this.embedding.embedDocument(
      [row.title, row.content].filter(Boolean).join('. '),
    );
    const lit = this.embedding.toVectorLiteral(vec);
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "ChatbotChunk"
         ("id","sourceType","sourceId","language","title","slug","content","embedding","updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::vector,CURRENT_TIMESTAMP)`,
      this.cuid(),
      row.sourceType,
      row.sourceId,
      row.language,
      row.title,
      row.slug,
      row.content,
      lit,
    );
  }

  /** Re-index one post (both languages). Call from the post publish flow. */
  async indexPost(postId: string) {
    await this.prisma.$executeRawUnsafe(
      'DELETE FROM "ChatbotChunk" WHERE "sourceType" = $1 AND "sourceId" = $2',
      'post',
      postId,
    );
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        layouts: { where: { isPublished: true }, select: { slug: true } },
      },
    });
    if (!post || post.status !== 'PUBLISHED') return;
    const slug = post.layouts[0]?.slug ?? post.slug;

    for (const lang of ['VI', 'EN'] as const) {
      const title = pickLang(post.title as Localized, lang);
      const excerpt = pickLang(post.excerpt as Localized, lang);
      const bodyText =
        post.aiSummary ||
        pickLang(post.body as Localized, lang) ||
        flattenBody(post.body);
      const full = [excerpt, bodyText].filter(Boolean).join('\n');
      if (!title && !full) continue;
      for (const c of chunk(full || title)) {
        await this.insertChunk({
          sourceType: 'post',
          sourceId: post.id,
          language: lang,
          title,
          slug,
          content: c,
        });
      }
    }
  }

  /** Re-index one layout page. Call from the page-layout publish flow. */
  async indexPage(layoutId: string) {
    await this.removePage(layoutId);
    const layout = await this.prisma.pageLayout.findUnique({
      where: { id: layoutId },
      select: {
        id: true,
        name: true,
        slug: true,
        isPublished: true,
        publishedPuckData: true,
        puckData: true,
      },
    });
    if (!layout || !layout.isPublished) return;
    const text = flattenBody(layout.publishedPuckData ?? layout.puckData);
    if (!text) return;
    for (const c of chunk(text)) {
      await this.insertChunk({
        sourceType: 'page',
        sourceId: layout.id,
        language: 'VI',
        slug: layout.slug,
        title: layout.name,
        content: c,
      });
    }
  }

  /** Drop a layout's chunks (e.g. on unpublish/delete). */
  async removePage(layoutId: string) {
    await this.prisma.$executeRawUnsafe(
      'DELETE FROM "ChatbotChunk" WHERE "sourceType" = $1 AND "sourceId" = $2',
      'page',
      layoutId,
    );
  }

  /** Re-index one curated Q&A (training) entry incrementally. */
  async indexTraining(id: string) {
    await this.prisma.$executeRawUnsafe(
      'DELETE FROM "ChatbotChunk" WHERE "sourceType" = $1 AND "sourceId" = $2',
      'training',
      id,
    );
    const t = await this.prisma.chatbotTraining.findUnique({ where: { id } });
    if (!t || !t.isActive) return;
    await this.insertChunk({
      sourceType: 'training',
      sourceId: t.id,
      language: t.language as 'VI' | 'EN',
      slug: null,
      title: t.question,
      content: `${t.question}\n${t.answer}${t.context ? '\n' + t.context : ''}`,
    });
  }

  /**
   * Add curated Q&A the faculty wants answered authoritatively (dean, contact,
   * admissions…). Persists to ChatbotTraining so it survives a future full
   * reindex, and indexes just these few entries — no 31k-chunk rebuild. These
   * curated answers are what make the bot reliably better than generic ChatGPT.
   */
  async train(
    items: {
      question: string;
      answer: string;
      language: 'VI' | 'EN';
      context?: string;
    }[],
  ) {
    const admin = await this.prisma.user.findFirst({ select: { id: true } });
    if (!admin) throw new Error('No user to attribute curated Q&A to');

    let indexed = 0;
    for (const it of items) {
      const row = await this.prisma.chatbotTraining.create({
        data: {
          question: it.question,
          answer: it.answer,
          context: it.context ?? null,
          language: it.language,
          createdBy: admin.id,
        },
      });
      await this.indexTraining(row.id);
      indexed++;
    }
    await this.cache.clear();
    return { indexed };
  }

  /** Full rebuild: published posts + active FAQ + curated ChatbotTraining. */
  async reindexAll() {
    await this.prisma.$executeRawUnsafe('TRUNCATE TABLE "ChatbotChunk"');
    const posts = await this.prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true },
    });
    for (const p of posts) await this.indexPost(p.id);

    const faqs = await this.prisma.fAQ.findMany({ where: { isActive: true } });
    for (const f of faqs) {
      await this.insertChunk({
        sourceType: 'faq',
        sourceId: f.id,
        language: 'VI',
        slug: null,
        title: f.question,
        content: `${f.question}\n${f.answer}`,
      });
    }

    const training = await this.prisma.chatbotTraining.findMany({
      where: { isActive: true },
    });
    for (const t of training) {
      await this.insertChunk({
        sourceType: 'training',
        sourceId: t.id,
        language: t.language as 'VI' | 'EN',
        slug: null,
        title: t.question,
        content: `${t.question}\n${t.answer}${t.context ? '\n' + t.context : ''}`,
      });
    }

    // Published layout pages (Puck content) — this is where standalone pages like
    // the homepage / "who is the dean" info live; posts alone don't cover them.
    const layouts = await this.prisma.pageLayout.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        name: true,
        slug: true,
        publishedPuckData: true,
        puckData: true,
      },
    });
    for (const l of layouts) {
      const text = flattenBody(l.publishedPuckData ?? l.puckData);
      if (!text) continue;
      for (const c of chunk(text)) {
        await this.insertChunk({
          sourceType: 'page',
          sourceId: l.id,
          language: 'VI',
          slug: l.slug,
          title: l.name,
          content: c,
        });
      }
    }

    await this.cache.clear();
    return {
      posts: posts.length,
      faqs: faqs.length,
      training: training.length,
      pages: layouts.length,
    };
  }

  /** Answer a question with RAG. */
  async ask(question: string, language: 'VI' | 'EN' = 'VI') {
    const q = question.trim();
    if (!q) return { answer: '', sources: [] };

    const cacheKey = `chatbot:${language}:${q.toLowerCase()}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const qvec = await this.embedding.embedQuery(q);
    const lit = this.embedding.toVectorLiteral(qvec);

    const rows = await this.prisma.$queryRawUnsafe<
      {
        title: string | null;
        slug: string | null;
        content: string;
        sourceType: string;
        dist: number;
      }[]
    >(
      `SELECT "title","slug","content","sourceType",
              ("embedding" <=> $1::vector) AS dist
         FROM "ChatbotChunk"
        ORDER BY "embedding" <=> $1::vector
        LIMIT 12`,
      lit,
    );

    // Grounding gate: cosine distance is 0 (identical) … 2 (opposite). If even the
    // closest chunk is farther than the threshold, the question isn't covered by the
    // site content — return the fallback WITHOUT calling the LLM, so off-topic
    // questions can never be answered from the model's general knowledge.
    const maxDist = Number(process.env.CHATBOT_MAX_DISTANCE) || 0.7;
    if (!rows.length || rows[0].dist > maxDist) {
      return {
        answer:
          language === 'EN'
            ? "I don't have information on that yet. Please contact the faculty office."
            : 'Mình chưa có thông tin về nội dung này. Vui lòng liên hệ văn phòng Khoa.',
        sources: [],
      };
    }

    const context = rows
      .map((r, i) => `[${i + 1}] ${r.title ?? ''}\n${r.content}`)
      .join('\n\n');
    const answer = await this.llm.answer({ question: q, context, language });

    // Only surface the few closest, on-topic sources (below the grounding
    // threshold) — dumping all 12 retrieved rows makes the widget look noisy and
    // lists posts that were only tangentially related.
    const seen = new Set<string>();
    const sources = rows
      .filter(
        (r) =>
          (r.sourceType === 'post' || r.sourceType === 'page') &&
          r.dist <= maxDist &&
          r.slug &&
          !seen.has(r.slug) &&
          seen.add(r.slug),
      )
      .slice(0, 3)
      .map((r) => ({ title: r.title, slug: r.slug }));

    const result = { answer, sources };
    await this.cache.set(cacheKey, result, 30 * 60 * 1000); // 30 min
    return result;
  }
}
