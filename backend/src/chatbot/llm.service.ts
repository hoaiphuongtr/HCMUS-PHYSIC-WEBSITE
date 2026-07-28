import { Injectable, Logger } from '@nestjs/common';

/**
 * Answer generation via Google Gemini (2.5 Flash-Lite), grounded STRICTLY on the
 * retrieved site content passed in as CONTEXT. No local model — fast + accurate,
 * and (unlike a tiny local model) it actually obeys the "answer only from context"
 * instruction, so it won't invent facts that aren't on the faculty website.
 *
 * Requires GEMINI_API_KEY (free key from https://aistudio.google.com/apikey).
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly apiKey = process.env.GEMINI_API_KEY || '';
  // Full Flash (not flash-lite): better at synthesising a complete answer from
  // several retrieved chunks — fewer "listed 4 of 8" truncations. The `-latest`
  // alias avoids the "model not available to new projects" pinning issues.
  private readonly model = process.env.GEMINI_MODEL || 'gemini-flash-latest';

  async answer(params: {
    question: string;
    context: string;
    language: 'VI' | 'EN';
  }): Promise<string> {
    const { question, context, language } = params;
    if (!this.apiKey) {
      this.logger.error('GEMINI_API_KEY is not set');
      throw new Error('LLM not configured');
    }
    const lang = language === 'EN' ? 'English' : 'Vietnamese';
    const system =
      'You are "Trợ lý Khoa" — the official virtual assistant of the Faculty of ' +
      'Physics - Engineering Physics, VNUHCM University of Science (HCMUS). You ' +
      'help students, prospective students, parents and visitors with ' +
      'faculty-specific information taken from the faculty website.\n' +
      '\n' +
      'PERSONALITY & STYLE:\n' +
      '- Warm, friendly and natural, like a helpful faculty staff member — NOT a ' +
      'generic AI. In Vietnamese, refer to yourself as "mình" and the user as ' +
      '"bạn"; keep an approachable, respectful tone. Never say "As an AI" or ' +
      'similar robotic phrasing.\n' +
      '- Answer directly and briefly. No long preambles, no restating the ' +
      'question, no filler. Prefer short paragraphs or bullet points.\n' +
      '- When the answer is in the CONTEXT, answer confidently. When useful, point ' +
      'the user to the relevant page or the faculty office for more.\n' +
      '\n' +
      'GROUNDING (strict — this is what makes you more reliable than ChatGPT):\n' +
      '1. Use ONLY the CONTEXT below (real content from the faculty website). ' +
      'Never use outside or general knowledge.\n' +
      '2. NEVER state a name, title, number, date, or contact unless it appears ' +
      'VERBATIM in the CONTEXT. Do not guess or paraphrase a person’s name. If the ' +
      'specific answer is not in the CONTEXT, briefly say you don’t have it yet ' +
      'and suggest contacting the faculty office or checking the website — do NOT ' +
      'invent anything.\n' +
      '3. Only answer questions about this Faculty. For anything unrelated, ' +
      'politely say it’s outside your scope and offer to help with faculty topics ' +
      'instead.\n' +
      `4. Reply in ${lang}.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [
          {
            role: 'user',
            parts: [{ text: `CONTEXT:\n${context}\n\nQUESTION: ${question}` }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          // gemini-flash's internal "thinking" tokens count against
          // maxOutputTokens. Trying to disable thinking via thinkingConfig is
          // rejected (400 INVALID_ARGUMENT) by the -latest alias, so instead give
          // a large budget: thinking + the full answer both fit and the reply is
          // never truncated mid-sentence.
          maxOutputTokens: 8192,
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`Gemini failed: ${res.status} ${body}`);
      throw new Error('LLM request failed');
    }
    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = json.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? '')
      .join('')
      .trim();
    return text ?? '';
  }
}
