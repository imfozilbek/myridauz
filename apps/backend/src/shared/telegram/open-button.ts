import { appHost, type BrandConfig } from '@platform/brands';
import { botVia, VIA_PARAM, type AppLink } from '@platform/contracts';

// main: the questionnaire of the main bot (G83, docs/181).
type App = 'passenger' | 'driver' | 'admin' | 'main';

// The address of a Mini App under a bot message: its parameters and the mark bot-<kind> (G87 V4,
// docs/116), so «Statistika» tells a tap on a bot message from a direct visit.
export function botAppUrl(
  brand: BrandConfig,
  app: App,
  kind: string,
  params: Readonly<Record<string, string>> = {},
) {
  const query = new URLSearchParams({ ...params, [VIA_PARAM]: botVia(kind) });
  return `https://${appHost(brand, app)}/?${query.toString()}`;
}

// A button that opens the Mini App, right on its booking, offer or trip when a link is given
// (docs/65 B5), never only on the main screen. The buttons of a live card are these (G68).
export function appButton(brand: BrandConfig, app: App, text: string, link?: AppLink) {
  const url = link
    ? botAppUrl(brand, app, link.name, { [link.name]: link.id })
    : botAppUrl(brand, app, 'home');
  return { text, web_app: { url } };
}

// "Ochish" under a bot message.
export const openButton = (brand: BrandConfig, app: App, text: string, link?: AppLink) => ({
  inline_keyboard: [[appButton(brand, app, text, link)]],
});
