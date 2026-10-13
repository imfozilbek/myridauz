// The looks of the bots and channels on the stand (docs/180): what a bot set, Telegram gives back, so
// the next round of the Cron finds nothing to change, like in Telegram.
const SETS = {
  setMyName: ['name', 'name'],
  setMyDescription: ['description', 'description'],
  setMyShortDescription: ['short', 'short_description'],
  setChatTitle: ['name', 'title'],
  setChatDescription: ['description', 'description'],
};
const PHOTOS = ['setMyProfilePhoto', 'setChatPhoto'];

export function standLooks() {
  const looks = new Map();
  // A channel by its chat, a bot by its token.
  const lookOf = (token, body) => {
    const key = String(body.chat_id ?? token);
    if (!looks.has(key)) looks.set(key, {});
    return looks.get(key);
  };
  const reads = {
    getMyName: (look) => ({ name: look.name ?? '' }),
    getMyDescription: (look) => ({ description: look.description ?? '' }),
    getMyShortDescription: (look) => ({ short_description: look.short ?? '' }),
    getUserProfilePhotos: (look) => ({
      total_count: look.photo ? 1 : 0,
      photos: look.photo ? [[{ file_unique_id: look.photo }]] : [],
    }),
    getChat: (look, body) => ({
      id: body.chat_id,
      title: look.name ?? 'stand',
      ...(look.description ? { description: look.description } : {}),
      ...(look.photo ? { photo: { big_file_unique_id: look.photo } } : {}),
    }),
  };
  // The answer of a method of the looks, undefined for any other method.
  return (method, token, body, id) => {
    const look = lookOf(token, body);
    if (SETS[method]) {
      const [part, field] = SETS[method];
      look[part] = body[field];
      return true;
    }
    if (PHOTOS.includes(method)) {
      look.photo = `stand-photo-${id}`;
      return true;
    }
    return reads[method]?.(look, body);
  };
}
