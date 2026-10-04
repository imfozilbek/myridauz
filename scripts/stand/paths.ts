// Where the local stand keeps its data and listens (docs/75): the database, the bucket, the Durable
// Objects, the test tokens of the bots, the ports of the backend and of the three Mini Apps.
// STAND_SHARD=n: the n-th of the stands that run side by side (pnpm stand:check), each with its own
// copy of the data and its own ports, so the scenarios of one never touch another (lesson 125).
const SHARD = Number(process.env['STAND_SHARD'] ?? '0');
const STEP = 100;
const shift = (port: number) => port + SHARD * STEP;

export const STAND_DIR = '.stand';
export const STAND_STATE = SHARD === 0 ? `${STAND_DIR}/state` : `${STAND_DIR}/state-${SHARD}`;
// The clean state after the migrations and the map: --fresh starts from a copy of it.
export const STAND_BASE = `${STAND_DIR}/base`;
export const STAND_VARS = `${STAND_DIR}/dev.vars`;
export const STAND_MAP_READY = `${STAND_STATE}/map-ready`;
export const STAND_API_PORT = shift(8787);
// The Bot API stub: the bots of the stand talk to it, not to Telegram.
export const STAND_TELEGRAM_PORT = shift(8790);
// The debugger port of the local Worker: one per stand.
export const STAND_INSPECTOR_PORT = shift(9229);
export const STAND_APPS = { passenger: shift(4201), driver: shift(4202), admin: shift(4203) };
// The Telegram id of the owner on the stand: the team list of the backend (docs/02).
export const STAND_OWNER_ID = 900001;
