// The looks of the channels on the stand (docs/180): what a bot set, Telegram gives back, so the next
// round of the Cron finds nothing to change, like in Telegram. The method comes from the address of a
// request: it is only compared with known names, never used to call a function (lesson 285).
const SETS = new Map([
  ['setMyName', ['name', 'name']],
  ['setChatTitle', ['name', 'title']],
  ['setChatDescription', ['description', 'description']],
]);

const chatOf = (look, body) => ({
  id: body.chat_id,
  title: look.name ?? 'stand',
  ...(look.description ? { description: look.description } : {}),
  ...(look.photo ? { photo: { big_file_unique_id: look.photo } } : {}),
});

export function standLooks() {
  const looks = new Map();
  // A channel by its chat, a bot by its token.
  const lookOf = (token, body) => {
    const key = String(body.chat_id ?? token);
    if (!looks.has(key)) looks.set(key, {});
    return looks.get(key);
  };
  // The answer of a method of the looks, undefined for any other method.
  return (method, token, body, id) => {
    const look = lookOf(token, body);
    const set = SETS.get(method);
    if (set) {
      const [part, field] = set;
      look[part] = body[field];
      return true;
    }
    if (method === 'setChatPhoto') {
      look.photo = `stand-photo-${id}`;
      return true;
    }
    if (method === 'getMyName') return { name: look.name ?? '' };
    if (method === 'getChat') return chatOf(look, body);
    return undefined;
  };
}
