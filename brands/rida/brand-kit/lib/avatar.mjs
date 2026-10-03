// Bot avatars (owner decision 03.10.2026): the R of the brand and a badge with the sign of the role,
// so a person sees at once whom the bot is for. The support bot wears its own colors.
import { icon } from '../promo/icons.mjs';
import { COMBOS, svg } from './palette.mjs';
import { markR } from './text.mjs';

const ROLES = {
  passenger: { combo: 1, sign: 'User' },
  driver: { combo: 6, sign: 'CarFront' },
  admin: { combo: 5, sign: 'ShieldCheck' },
  support: { combo: 2, sign: 'Headset' },
};
// Telegram shows an avatar as a circle: the badge stays inside it.
const R_CENTER = 0.42, R_HEIGHT = 0.5, BADGE_CENTER = 0.7, BADGE_RADIUS = 0.17, SIGN = 0.18;

export function botAvatar(role, S = 640) {
  const { bg, fg } = COMBOS[ROLES[role].combo];
  const at = (part) => S * part;
  const body = `<rect width="${S}" height="${S}" fill="${bg}"/>` +
    markR({ cx: at(R_CENTER), cy: at(R_CENTER), h: at(R_HEIGHT), fill: fg }) +
    `<circle cx="${at(BADGE_CENTER)}" cy="${at(BADGE_CENTER)}" r="${at(BADGE_RADIUS)}" fill="${fg}" stroke="${bg}" stroke-width="${at(0.02)}"/>` +
    icon(ROLES[role].sign, at(BADGE_CENTER), at(BADGE_CENTER), at(SIGN), bg, 2.2);
  return svg(S, S, body);
}
