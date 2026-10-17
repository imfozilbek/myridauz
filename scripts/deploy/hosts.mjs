import { readdirSync } from 'node:fs';
import { apiHost, appHost, mapHost } from '../../brands/index.ts';

// The Mini Apps of the platform: one folder apps/miniapp-<app> each (docs/11).
export const miniApps = () =>
  readdirSync('apps')
    .filter((dir) => dir.startsWith('miniapp-'))
    .map((dir) => dir.replace('miniapp-', ''));

// Every address of a brand in its environment (docs/22): the landing, the API, the map, the Mini Apps.
export const hostsOf = (brand) => [
  brand.domain,
  `www.${brand.domain}`,
  apiHost(brand),
  mapHost(brand),
  ...miniApps().map((app) => appHost(brand, app)),
];
