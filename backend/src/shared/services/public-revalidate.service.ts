import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PublicRevalidateService {
  private readonly logger = new Logger(PublicRevalidateService.name);
  private readonly url = process.env.PUBLIC_REVALIDATE_URL;
  private readonly token = process.env.REVALIDATE_TOKEN;

  trigger(tags: string[]): void {
    if (!this.url || !this.token) return;
    if (tags.length === 0) return;
    const endpoint = `${this.url.replace(/\/$/, '')}/api/revalidate`;
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-revalidate-token': this.token,
      },
      body: JSON.stringify({ tags }),
    })
      .then((res) => {
        if (!res.ok) {
          this.logger.warn(
            `Revalidate webhook returned ${res.status} for tags ${tags.join(',')}`,
          );
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Revalidate webhook failed: ${msg}`);
      });
  }
}
