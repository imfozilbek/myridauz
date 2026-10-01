// The Bot API of the stand (docs/75): it keeps every call of the bots so scenarios can read the
// messages and their buttons (GET /__sent), and answers like Telegram. Nothing leaves the computer.
import { createServer } from 'node:http';

const SENT_PATH = '/__sent';
const CALL = /^\/bot([^/]+)\/(\w+)$/u;
const JSON_TYPE = { 'content-type': 'application/json' };

// What Telegram answers to each method, enough for the backend to go on.
const resultOf = (method, id) => {
  if (method === 'getChatMember')
    return { status: 'administrator', can_post_messages: true, can_edit_messages: true };
  if (method === 'savePreparedInlineMessage') return { id: `prepared-${id}`, expiration_date: 0 };
  if (method === 'sendMediaGroup') return [{ message_id: id }];
  if (method.startsWith('send') || method === 'editMessageText') return { message_id: id };
  return true;
};

const bodyOf = (raw, type) => {
  if (!type?.includes('application/json')) return { multipart: true };
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export function serveTelegram(port) {
  let sent = [];
  const server = createServer((incoming, outgoing) => {
    const url = incoming.url ?? '/';
    if (url === SENT_PATH) {
      if (incoming.method === 'DELETE') sent = [];
      outgoing.writeHead(200, JSON_TYPE).end(JSON.stringify(sent));
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
      const id = sent.length + 1;
      sent.push({ token, method, body: bodyOf(raw, incoming.headers['content-type']), at: Date.now() });
      outgoing.writeHead(200, JSON_TYPE).end(JSON.stringify({ ok: true, result: resultOf(method, id) }));
    });
  });
  server.listen(port);
  return server;
}
