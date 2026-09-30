import { appHost, type BrandConfig } from '@platform/brands';
import type { AppLink } from '@platform/contracts';

// "Ochish" under a bot message: opens the Mini App, right on its booking, offer or trip when a link
// is given (docs/65 B5), never only on the main screen.
export function openButton(brand: BrandConfig, app: 'passenger' | 'driver', text: string, link?: AppLink) {
  const query = link ? `?${link.name}=${encodeURIComponent(link.id)}` : '';
  return { inline_keyboard: [[{ text, web_app: { url: `https://${appHost(brand, app)}/${query}` } }]] };
}
