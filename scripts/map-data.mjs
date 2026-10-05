// The map of the Mini App (G22, docs/67): pnpm map-data --brand=<brand> [--dry-run] [--local]
// Cuts Uzbekistan out of the Protomaps build of OpenStreetMap (the data date is in MAP_ARCHIVE),
// fills the search index of place names in D1 from it (G23), takes the fonts of the labels and puts both
// into the public map bucket of the brand at map.<domain> (G57; locally: the MEDIA bucket of the stand). Needs
// CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID; runs from the workflow "Map data" (docs/32).
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadBrand } from '../brands/index.ts';
import { MAP_ARCHIVE, MAP_FONTS } from '../packages/contracts/src/map.ts';
import border from '../packages/contracts/src/uzbekistan-border.json' with { type: 'json' };
import { writePlaceIndex } from './map-places.mjs';
import { STAND_STATE } from './stand/paths.ts';
import { dropOldMaps, ensureMapBucket, putMapObject } from './deploy/map-bucket.mjs';

// The command line tool of PMTiles, pinned by version and checksum.
const PMTILES = {
  url: 'https://github.com/protomaps/go-pmtiles/releases/download/v1.28.1/go-pmtiles_1.28.1_Linux_x86_64.tar.gz',
  sha256: 'e2b6480cf8bcb3edb5b857a7658fff488fa73dd3107dc3e92a5f037ed457289e',
};
// The mirror of the Protomaps build on Source Cooperative: build.protomaps.com cuts long downloads.
const SOURCE = 'https://data.source.coop/protomaps/openstreetmap/v4.pmtiles';
const DATA_DATE = 'planetiler:osm:osmosisreplicationtime';
const FONTS = 'https://raw.githubusercontent.com/protomaps/basemaps-assets/main/fonts';
// Latin, Latin extended, the oʻ and gʻ letters, Cyrillic, quotes and dashes of names.
const FONT_RANGES = ['0-255', '256-511', '512-767', '1024-1279', '8192-8447'];
// wrangler puts one object of at most 300 MB: the archive must stay under it.
const MAX_OBJECT_BYTES = 300 * 1000 * 1000;
const WORK = '.map-data';
// A network failure of the download is tried again after a pause.
const EXTRACT_ATTEMPTS = 5;
const RETRY_PAUSE_SECONDS = 30;

const brandArg = process.argv.find((arg) => arg.startsWith('--brand='));
if (!brandArg) throw new Error('map-data: --brand=<brand> is required');
const brand = loadBrand(brandArg.split('=')[1]);
const dryRun = process.argv.includes('--dry-run');
// --local fills the local stand instead of Cloudflare (docs/75): the same data, no keys needed.
const local = process.argv.includes('--local');
const target = local ? ['--local', '--persist-to', STAND_STATE] : ['--remote'];
const config = readFileSync(`brands/${brand.id}/wrangler.toml`, 'utf8');
const media = /binding = "MEDIA"\s+bucket_name = "([^"]+)"/u.exec(config)?.[1];
if (!media) throw new Error('map-data: no MEDIA bucket in wrangler.toml');
const miniApps = readdirSync('apps')
  .filter((dir) => dir.startsWith('miniapp-'))
  .map((dir) => dir.replace('miniapp-', ''));
const bucket = local || dryRun ? media : await ensureMapBucket(brand, miniApps);
const build = /^uzbekistan-(\d{8})\.pmtiles$/u.exec(MAP_ARCHIVE)?.[1];
if (!build) throw new Error(`map-data: ${MAP_ARCHIVE} is not uzbekistan-YYYYMMDD.pmtiles`);

const run = (command, args) => execFileSync(command, args, { stdio: 'inherit' });
const read = (command, args) => execFileSync(command, args, { encoding: 'utf8' });
const download = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`map-data: ${url} answered ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
};
const put = (key, file, type) => (local ? putLocal(key, file, type) : putMapObject(bucket, key, file));
const putLocal = (key, file, type) =>
  run('pnpm', [
    'exec',
    'wrangler',
    'r2',
    'object',
    'put',
    `${bucket}/${key}`,
    '--file',
    file,
    '--content-type',
    type,
    ...target,
  ]);

mkdirSync(WORK, { recursive: true });
const tool = await download(PMTILES.url);
if (createHash('sha256').update(tool).digest('hex') !== PMTILES.sha256)
  throw new Error('map-data: pmtiles checksum');
writeFileSync(join(WORK, 'pmtiles.tar.gz'), tool);
run('tar', ['xzf', join(WORK, 'pmtiles.tar.gz'), '-C', WORK, 'pmtiles']);

// The mirror moves to a new build from time to time: the name must say the date of the data.
const metadata = JSON.parse(read(join(WORK, 'pmtiles'), ['show', '--metadata', SOURCE]));
const date = String(metadata[DATA_DATE] ?? '')
  .slice(0, 10)
  .replaceAll('-', '');
if (date !== build)
  throw new Error(
    `map-data: the source has the data of ${date}, set MAP_ARCHIVE to uzbekistan-${date}.pmtiles`,
  );

const region = join(WORK, 'uzbekistan.geojson');
writeFileSync(region, JSON.stringify({ type: 'MultiPolygon', coordinates: border }));
const archive = join(WORK, MAP_ARCHIVE);
const extract = ['extract', SOURCE, archive, `--region=${region}`];
for (let attempt = 1; ; attempt += 1) {
  try {
    run(join(WORK, 'pmtiles'), dryRun ? [...extract, '--dry-run'] : extract);
    break;
  } catch (error) {
    if (attempt === EXTRACT_ATTEMPTS) throw error;
    console.log(`map-data: extract failed, attempt ${attempt + 1} of ${EXTRACT_ATTEMPTS}`);
    run('sleep', [String(RETRY_PAUSE_SECONDS)]);
  }
}
if (dryRun) process.exit(0);
const size = statSync(archive).size;
if (size > MAX_OBJECT_BYTES)
  throw new Error(`map-data: the archive has ${size} bytes, more than one put takes`);
put(`map/${MAP_ARCHIVE}`, archive, 'application/vnd.pmtiles');

for (const font of MAP_FONTS)
  for (const range of FONT_RANGES) {
    const file = join(WORK, `${font}-${range}.pbf`);
    writeFileSync(file, await download(`${FONTS}/${encodeURIComponent(font)}/${range}.pbf`));
    put(`map/fonts/${font}/${range}.pbf`, file, 'application/x-protobuf');
  }
if (!local) await dropOldMaps(media, bucket, MAP_ARCHIVE);
console.log(`map-data: ${MAP_ARCHIVE} (${Math.round(size / 1e6)} MB) and the fonts are in ${bucket}`);

// The search by name (G23): the places of the same archive, the whole index made again in D1.
const placesFile = join(WORK, 'places.sql');
const places = await writePlaceIndex(archive, placesFile);
run('pnpm', [
  'exec',
  'wrangler',
  'd1',
  'execute',
  'DB',
  ...target,
  '--yes',
  '--config',
  `brands/${brand.id}/wrangler.toml`,
  '--file',
  placesFile,
]);
console.log(`map-data: ${places} places are in the search index`);
