// The Bot API of the stand (docs/75): it keeps every call of the bots so scenarios can read the
// messages and their buttons (GET /__sent), and answers like Telegram. Nothing leaves the computer.
import { createServer } from 'node:http';
import { standLooks } from './telegram-looks.mjs';

const SENT_PATH = '/__sent';
const CALL = /^\/bot([^/]+)\/(\w+)$/u;
// A file a bot got (a voice message): a few bytes are enough for the backend (docs/50).
const FILE = /^\/file\/bot[^/]+\//u;
// A picture of the site for the looks of the bots and channels (docs/180): SITE_URL of the stand.
const SITE = /^\/__site\//u;
const KEEP_ALIVE_MS = 60 * 1000;
const JSON_TYPE = { 'content-type': 'application/json' };

// What Telegram answers to each method, enough for the backend to go on.
const resultOf = (method, id) => {
  if (method === 'getChatMember')
    return { status: 'administrator', can_post_messages: true, can_edit_messages: true };
  if (method === 'savePreparedInlineMessage') return { id: `prepared-${id}`, expiration_date: 0 };
  if (method === 'sendMediaGroup') return [{ message_id: id }];
  if (method === 'getFile') return { file_path: `voice/${id}.oga` };
  if (method === 'createChatInviteLink') return { invite_link: `https://t.me/+stand${id}` };
  if (method.startsWith('send') || method === 'editMessageText') return { message_id: id };
  return true;
};

// A form (an album, a voice): its text fields, so scenarios see who got it and its caption.
const FIELD = /name="(\w+)"\r\n\r\n([^\r]*)\r\n/gu;
const formOf = (raw) => {
  const fields = Object.fromEntries([...raw.matchAll(FIELD)].map(([, key, value]) => [key, value]));
  return { multipart: true, ...fields, ...(fields.chat_id ? { chat_id: Number(fields.chat_id) } : {}) };
};

const bodyOf = (raw, type) => {
  if (!type?.includes('application/json')) return formOf(raw);
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export function serveTelegram(port) {
  let sent = [];
  // Message ids never repeat, also after a clear: a reply must reach its own message (docs/50).
  let lastId = 0;
  const looks = standLooks();
  const server = createServer((incoming, outgoing) => {
    const url = incoming.url ?? '/';
    if (url === SENT_PATH) {
      if (incoming.method === 'DELETE') sent = [];
      outgoing.writeHead(200, JSON_TYPE).end(JSON.stringify(sent));
      return;
    }
    if (FILE.test(url)) {
      outgoing.writeHead(200, { 'content-type': 'audio/ogg' }).end(Buffer.from([1, 2, 3]));
      return;
    }
    if (SITE.test(url)) {
      outgoing.writeHead(200, { 'content-type': 'image/jpeg' }).end(Buffer.from(url));
      return;
    }
    const [, token, method] = CALL.exec(url) ?? [];
    if (!token || !method) {
      outgoing.writeHead(404, JSON_TYPE).end(JSON.stringify({ ok: false }));
      return;
    }
    let raw = '';
    incoming.on('data', (chunk) => (raw += chunk));
    incoming.on('end', () => {
      lastId += 1;
      const id = lastId;
      const body = bodyOf(raw, incoming.headers['content-type']);
      // The id a sent message got: a snapshot draws the edits and the answers on it (G68).
      sent.push({ token, method, body, at: Date.now(), ...(method.startsWith('send') ? { id } : {}) });
      const result = looks(method, token, body, id) ?? resultOf(method, id);
      outgoing.writeHead(200, JSON_TYPE).end(JSON.stringify({ ok: true, result }));
    });
  });
  // A scenario reuses its connection: the stub keeps it longer than the client, or under the load of
  // stands side by side it closes one the scenario is just sending on («other side closed»).
  server.keepAliveTimeout = KEEP_ALIVE_MS;
  server.listen(port);
  return server;
}
