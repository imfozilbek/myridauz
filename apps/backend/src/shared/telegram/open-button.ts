import { appHost, type BrandConfig } from '@platform/brands';
import { BOT_VIA_PARAM, botVia, type AppLink } from '@platform/contracts';

// main: the questionnaire of the main bot (G83, docs/181).
type App = 'passenger' | 'driver' | 'main';

// The main screen, for a button without a link.
const HOME = 'home';

// A button under a message of a bot names it in the mark of the launch (G87, docs/191): «Statistika»
// tells an open from a message from one from the menu. kind: the link it opens, «chat», «review» …
export function botMessageUrl(url: string, kind: string): string {
  const address = new URL(url);
  address.searchParams.set(BOT_VIA_PARAM, botVia(kind));
  return address.toString();
}

// A button that opens the Mini App, right on its booking, offer or trip when a link is given
// (docs/65 B5), never only on the main screen. The buttons of a live card are these (G68).
export function appButton(brand: BrandConfig, app: App, text: string, link?: AppLink) {
  const query = link ? `?${link.name}=${encodeURIComponent(link.id)}` : '';
  const url = botMessageUrl(`https://${appHost(brand, app)}/${query}`, link?.name ?? HOME);
  return { text, web_app: { url } };
}

// The button of the answer to /start opens the app as its menu does: no mark of a message (G87).
export const startButton = (brand: BrandConfig, app: App, text: string) => ({
  text,
  web_app: { url: `https://${appHost(brand, app)}/` },
});

// "Ochish" under a bot message.
export const openButton = (brand: BrandConfig, app: App, text: string, link?: AppLink) => ({
  inline_keyboard: [[appButton(brand, app, text, link)]],
});
