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
  private readonly model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

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
      'You are the virtual assistant for the Faculty of Physics - Engineering ' +
      'Physics website (HCMUS). You answer ONLY from the CONTEXT below, which is ' +
      'content taken from the faculty website. Rules you must follow strictly:\n' +
      '1. Use ONLY the CONTEXT. Never use outside or general knowledge.\n' +
      "2. If the answer is not clearly in the CONTEXT, say you don't have that " +
      'information yet and suggest contacting the faculty office. Never guess or ' +
      'invent names, numbers, dates, or facts.\n' +
      '3. Only answer questions about the Faculty of Physics. Politely decline ' +
      'anything unrelated (it is outside your scope).\n' +
      `4. Reply in ${lang}. Be concise, accurate, and helpful.`;

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
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
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
