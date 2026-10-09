import { appHost, type BrandConfig } from '@platform/brands';
import type { AppLink } from '@platform/contracts';

type App = 'passenger' | 'driver';

// A button that opens the Mini App, right on its booking, offer or trip when a link is given
// (docs/65 B5), never only on the main screen. The buttons of a live card are these (G68).
export function appButton(brand: BrandConfig, app: App, text: string, link?: AppLink) {
  const query = link ? `?${link.name}=${encodeURIComponent(link.id)}` : '';
  return { text, web_app: { url: `https://${appHost(brand, app)}/${query}` } };
}

// "Ochish" under a bot message.
export const openButton = (brand: BrandConfig, app: App, text: string, link?: AppLink) => ({
  inline_keyboard: [[appButton(brand, app, text, link)]],
});
