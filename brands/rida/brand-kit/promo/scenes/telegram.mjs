// 88.47 → 92.75 s: everything is inside Telegram. The bot and the channels, nothing to install.
import { C } from '../../lib/palette.mjs';
import { text } from '../../lib/text.mjs';
import { COPY, bg, lines, rise, enter, SOFT, CX } from '../kit.mjs';
import { phone } from '../phone.mjs';
import { chats } from '../screens/chats.mjs';

const K = COPY.map;

export function telegram(t) {
  return bg(SOFT) + phone(chats(t), { withChrome: false, cam: 80 + 420 * (1 - enter(t, 0, 0.6)) }) +
    rise(lines(K.telegram, { cy: 300, size: 80 }), enter(t, 0.1, 0.4), 25) +
    rise(text(K.telegramSub, { x: CX, y: 400, anchor: 'middle', fill: C.muted, weight: 600, size: 44 }), enter(t, 0.45, 0.4), 20);
}
