import { GROWTH_ICONS } from './growth-icons';
import { PLACE_ICONS } from './place-icons';
import { PROFILE_ICONS } from './profile-icons';
import { TALK_ICONS } from './talk-icons';
import { TEAM_ICONS } from './team-icons';
import { WAITLIST_ICONS } from './waitlist-icons';
import { WAY_ICONS } from './way-icons';

// The icons of the parts of the apps, each in its own file: one file stays under 150 lines (docs/11).
export const ICON_GROUPS = {
  ...WAY_ICONS,
  ...PROFILE_ICONS,
  ...TALK_ICONS,
  ...PLACE_ICONS,
  ...TEAM_ICONS,
  ...WAITLIST_ICONS,
  ...GROWTH_ICONS,
};
