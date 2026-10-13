import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadBrand } from '../brands/index.ts';
import { resourcesOf, withEnvironment } from './deploy/worker-config.mjs';

const { id } = loadBrand();
const BASE = readFileSync(`brands/${id}/wrangler.toml`, 'utf8');
const VALUES = { host: 'api.example.uz', databaseId: 'db-of-the-account', environment: 'production' };

// docs/179: one settings file of the Worker, each environment with its address and database.
describe('the Worker of an environment', () => {
  it('names what an empty account needs', () => {
    expect(resourcesOf(BASE)).toEqual({
      database: `${id}-db`,
      queue: `${id}-notifications`,
      media: `${id}-media`,
    });
  });

  it('takes the address, the database and the name of the environment, the rest stays', () => {
    const config = withEnvironment(BASE, VALUES);
    expect(config).toContain('routes = [{ pattern = "api.example.uz", custom_domain = true }]');
    expect(config).toContain('database_id = "db-of-the-account"');
    expect(config).toContain(`[vars]\nENVIRONMENT = "production"\nBRAND = "${id}"`);
    expect(config.split('\n')).toHaveLength(BASE.split('\n').length + 1);
  });

  it('stops when the settings changed their shape', () => {
    expect(() => withEnvironment('name = "x"', VALUES)).toThrow(/is not in wrangler.toml/u);
    expect(() => resourcesOf('name = "x"')).toThrow('deploy: no database in wrangler.toml');
  });
});
