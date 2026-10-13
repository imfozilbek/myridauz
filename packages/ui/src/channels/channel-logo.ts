import type { BrandChannel } from '@platform/brands';

// The logo of a channel of the brand, the same picture the channel has in Telegram (owner decision
// 13.10.2026, docs/176): the avatar of its region, a file of the brand (brand kit: pnpm logos).
export const channelLogo = (channel: Pick<BrandChannel, 'code'>) =>
  `${import.meta.env.BASE_URL}channels/${channel.code}.webp`;
