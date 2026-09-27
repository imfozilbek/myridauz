// 88.47 → 92.75 s: everything is inside Telegram. The bot and the channels, nothing to install.
import { C } from '../../lib/palette.mjs';
import { COPY, enter } from '../kit.mjs';
import { phone } from '../phone.mjs';
import { words } from '../type.mjs';
import { stage } from '../world.mjs';
import { chats } from '../screens/chats.mjs';

const K = COPY.map;

export function telegram(t) {
  const cam = 80 + 420 * (1 - enter(t, 0, 0.6)) + Math.sin(t * 1.4) * 8, tilt = 5 * (1 - enter(t, 0, 0.8));
  return stage(t) + phone(chats(t), { withChrome: false, cam, tilt, zoom: 1 + 0.05 * enter(t, 0.5, 3) }) +
    words(K.telegram, t, 0.1, { cy: 300, size: 84 }) + words([K.telegramSub], t, 0.5, { cy: 400, size: 44, fill: C.muted, weight: 600, stagger: 0.04 });
}
