// The rules of the R2 buckets of a brand as plain data (G57, docs/117): tested, then sent by deploy.
const DAY_SECONDS = 86_400;
// The browser keeps the answer to a preflight this long (the same as the API, G56).
const PREFLIGHT_SECONDS = 7200;
const STORIES_RULE = 'stories-1-day';
const ARCHIVE = /^map\/[a-z0-9-]+\.pmtiles$/u;

// The map is OpenStreetMap data, nothing about people: its own public bucket, never the private
// MEDIA bucket with the photos of people.
export const mapBucket = (brand) => `${brand.id}-map`;

// The pictures of driver stories live a day: Telegram reads one once when the story is posted, and
// every new story uploads a new picture. The other rules of the bucket stay as they are.
export const withStoriesRule = (rules) => [
  ...rules.filter((rule) => rule.id !== STORIES_RULE),
  {
    id: STORIES_RULE,
    enabled: true,
    conditions: { prefix: 'stories/' },
    deleteObjectsTransition: { condition: { type: 'Age', maxAge: DAY_SECONDS } },
  },
];

// Only the Mini Apps of the brand read the map, by parts of the archive.
export const mapCors = (origins) => ({
  rules: [
    {
      allowed: { origins, methods: ['GET', 'HEAD'], headers: ['range'] },
      exposeHeaders: ['accept-ranges', 'content-length', 'content-range', 'etag'],
      maxAgeSeconds: PREFLIGHT_SECONDS,
    },
  ],
});

// The archives of older builds: the bucket keeps only the one the Mini Apps read.
export const oldArchives = (keys, current) =>
  keys.filter((key) => ARCHIVE.test(key) && key !== `map/${current}`);
