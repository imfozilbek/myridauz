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
