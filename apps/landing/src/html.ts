// Every text goes through escape: translations and brand values never become markup.
const ENTITIES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escape = (text: string) => text.replace(/[&<>"']/gu, (char) => ENTITIES[char] ?? char);

export const telegramLink = (bot: string) => `https://t.me/${bot}`;
// The passenger bot; on a page of a direction it opens the search with the route (docs/89 S4).
export const passengerLink = (bot: string, start?: string) =>
  start ? `${telegramLink(bot)}?startapp=${start}` : telegramLink(bot);
