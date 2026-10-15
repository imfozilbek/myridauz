import type { BrandConfig } from '@platform/brands';
import { VIA_SITE, withVia } from '@platform/contracts';

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
// The link of the search says it came from the site (G55, docs/116).
export const passengerLink = (bot: string, start?: string) =>
  start ? `${telegramLink(bot)}?startapp=${withVia(start, VIA_SITE)}` : telegramLink(bot);

// While the list of waiting is open (G83, docs/181) a button of the site leads to the main bot: its
// questionnaire asks the role. The same button into the trips waits next to it, hidden: the script
// shows it when the owner closes the list (client/list.ts), so no link is built in the browser.
export const entryButton = (brand: BrandConfig, className: string, text: string, trips: string, mark = '') =>
  `<a class="${className}" data-list href="${telegramLink(brand.bots.main)}?start=${VIA_SITE}">${text}</a>` +
  `<a class="${className}" data-trips hidden ${mark}href="${trips}">${text}</a>`;
