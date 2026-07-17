import { Injectable, Logger } from '@nestjs/common';

/**
 * Fully self-hosted answer generation via Ollama (CPU).
 * Default model: qwen2.5:1.5b-instruct (~1.2GB). Drop to qwen2.5:0.5b-instruct
 * if you see memory pressure. No API key, no limits, private.
 *
 * Runs as a sibling container — see docker-compose.additions.yml.
 * CPU inference is slow (~10-40s per answer); fine for a low-traffic site.
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly baseUrl = process.env.OLLAMA_URL || 'http://ollama:11434';
  private readonly model = process.env.OLLAMA_MODEL || 'qwen2.5:1.5b-instruct';

  async answer(params: {
    question: string;
    context: string;
    language: 'VI' | 'EN';
  }): Promise<string> {
    const { question, context, language } = params;
    const lang = language === 'EN' ? 'English' : 'Vietnamese';
    const system =
      'You are the assistant for the Faculty of Physics - Engineering Physics ' +
      'website (HCMUS). Answer ONLY from the CONTEXT below. If the answer is not ' +
      "in the context, say you don't have that information and suggest contacting " +
      `the faculty. Reply in ${lang}. Be concise. Cite sources by their title ` +
      'when relevant.';

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        options: { temperature: 0.2, num_ctx: 4096 },
        messages: [
          { role: 'system', content: system },
          {
            role: 'user',
            content: `CONTEXT:\n${context}\n\nQUESTION: ${question}`,
          },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`Ollama failed: ${res.status} ${body}`);
      throw new Error('LLM request failed');
    }
    const json = (await res.json()) as { message?: { content: string } };
    return json.message?.content?.trim() ?? '';
  }
}
