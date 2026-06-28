/**
 * flushCache — clear the backend's Redis read-cache for page-layout responses
 * after writing layouts directly to the DB (which bypasses the page-layout
 * service's cache.clear()).
 *
 * The NestJS CacheInterceptor caches GET /page-layouts/** under the
 * `hcmus-physics` namespace. cache-manager v7 + @keyv/redis double-prefix the
 * key (e.g. `hcmus-physics::hcmus-physics:/page-layouts/slug/trang-chu`), so we
 * scan + DEL the raw keys directly rather than going through cache.del()/clear()
 * which mis-computes the key. Only page-layout keys are removed (targeted, not a
 * full FLUSH of the shared instance).
 */
import { createClient } from '@redis/client';

export async function flushCache(): Promise<void> {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn('flushCache: REDIS_URL not set — skipping cache clear');
    return;
  }
  const client = createClient({ url });
  client.on('error', () => {});
  await client.connect();
  try {
    const toDelete: string[] = [];
    for await (const key of client.scanIterator({
      MATCH: '*page-layouts*',
      COUNT: 500,
    })) {
      const arr = Array.isArray(key) ? key : [key];
      toDelete.push(...arr);
    }
    if (toDelete.length) await client.del(toDelete);
    console.log(`Redis read-cache cleared: ${toDelete.length} page-layout key(s).`);
  } finally {
    await client.destroy();
  }
}

if (require.main === module) {
  flushCache()
    .then(() => process.exit(0))
    .catch((err: unknown) => {
      console.error(err);
      process.exit(1);
    });
}
