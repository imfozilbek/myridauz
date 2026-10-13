import { readFileSync, writeFileSync } from 'node:fs';
import { apiHost } from '../../brands/index.ts';
import { cloudflare } from './cloudflare.mjs';

// The Worker of one environment (docs/179): brands/<brand>/wrangler.toml with the address, the database
// and the name of the environment. On an empty account the database, the queue and the private bucket
// are made here once: their names are the same in every account, only the database id differs.
const DATABASES = '/accounts/:account/d1/database';
const QUEUES = '/accounts/:account/queues';
const BUCKETS = '/accounts/:account/r2/buckets';

const valueOf = (config, pattern, what) => {
  const value = pattern.exec(config)?.[1];
  if (!value) throw new Error(`deploy: no ${what} in wrangler.toml`);
  return value;
};
const replaced = (config, pattern, value) => {
  if (!pattern.test(config)) throw new Error(`deploy: ${pattern} is not in wrangler.toml`);
  return config.replace(pattern, value);
};

async function ensureDatabase(name) {
  const found = (await cloudflare('GET', `${DATABASES}?name=${encodeURIComponent(name)}`)) ?? [];
  const database = found.find((one) => one.name === name) ?? (await cloudflare('POST', DATABASES, { name }));
  return database.uuid;
}

async function ensureQueue(name) {
  const queues = (await cloudflare('GET', `${QUEUES}?per_page=100`)) ?? [];
  if (!queues.some((queue) => queue.queue_name === name))
    await cloudflare('POST', QUEUES, { queue_name: name });
}

async function ensureBucket(name) {
  if (!(await cloudflare('GET', `${BUCKETS}/${name}`))) await cloudflare('POST', BUCKETS, { name });
}

// The names of what the Worker needs on its account.
export const resourcesOf = (base) => ({
  database: valueOf(base, /database_name = "([^"]+)"/u, 'database'),
  queue: valueOf(base, /\[\[queues\.producers\]\][^[]*queue = "([^"]+)"/u, 'queue'),
  media: valueOf(base, /binding = "MEDIA"\s+bucket_name = "([^"]+)"/u, 'MEDIA bucket'),
});

// The settings with the address, the database and the name of the environment.
export function withEnvironment(base, { host, databaseId, environment }) {
  const config = replaced(base, /pattern = "api\.[^"]+"/u, `pattern = "${host}"`);
  const withDatabase = replaced(config, /database_id = "[^"]+"/u, `database_id = "${databaseId}"`);
  return replaced(withDatabase, /\[vars\]\n/u, `[vars]\nENVIRONMENT = "${environment}"\n`);
}

// Writes brands/<brand>/wrangler.<environment>.toml next to the settings (their paths are relative) and
// returns its path; git never keeps it.
export async function workerConfig(brand, environment) {
  const base = readFileSync(`brands/${brand.id}/wrangler.toml`, 'utf8');
  const { database, queue, media } = resourcesOf(base);
  const id = await ensureDatabase(database);
  await ensureQueue(queue);
  await ensureBucket(media);
  const path = `brands/${brand.id}/wrangler.${environment}.toml`;
  writeFileSync(path, withEnvironment(base, { host: apiHost(brand), databaseId: id, environment }));
  return path;
}
