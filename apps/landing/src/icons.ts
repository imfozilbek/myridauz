import {
  Banknote,
  CarFront,
  EyeOff,
  Flag,
  HeartHandshake,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-static';

// Icons only from Lucide (docs/19), always next to a text. aria-hidden: the text says it all.
const ICONS = {
  together: Users,
  share: Banknote,
  notTaxi: HeartHandshake,
  passenger: Search,
  driver: CarFront,
  checked: ShieldCheck,
  // The same icon as "Mashinada ayol bor" in the Mini Apps.
  woman: UserRound,
  phone: EyeOff,
  complaints: Flag,
} as const;

export type IconName = keyof typeof ICONS;

export const icon = (name: IconName) => ICONS[name].replace('<svg', '<svg aria-hidden="true"');
