// Where the local stand keeps its data and listens (docs/75): the database, the bucket, the Durable
// Objects, the test tokens of the bots, the ports of the backend and of the three Mini Apps.
export const STAND_DIR = '.stand';
export const STAND_STATE = `${STAND_DIR}/state`;
// The clean state after the migrations and the map: --fresh starts from a copy of it.
export const STAND_BASE = `${STAND_DIR}/base`;
export const STAND_VARS = `${STAND_DIR}/dev.vars`;
export const STAND_MAP_READY = `${STAND_STATE}/map-ready`;
export const STAND_API_PORT = 8787;
// The Bot API stub: the bots of the stand talk to it, not to Telegram.
export const STAND_TELEGRAM_PORT = 8790;
export const STAND_APPS = { passenger: 4201, driver: 4202, admin: 4203 };
// The Telegram id of the owner on the stand: the team list of the backend (docs/02).
export const STAND_OWNER_ID = 900001;
