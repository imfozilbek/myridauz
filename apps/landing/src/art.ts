import { escape } from './html';

// Pictures from the promo drawings (docs/59), in brands/<brand>/landing/art.
const SIZES = {
  hero: [1080, 700],
  crowd: [900, 733],
  phone: [560, 951],
} as const;

type Art = { readonly name: string; readonly alt: string; readonly size: keyof typeof SIZES };

// The first screen loads at once; everything below loads when it comes near.
export function art({ name, alt, size }: Art, { eager = false, className = '' } = {}) {
  const [width, height] = SIZES[size];
  const loading = eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"';
  return `<img class="${className}" src="/art/${name}.webp" alt="${escape(alt)}" width="${width}" height="${height}" ${loading}>`;
}
