import {
  CarFront,
  ChevronDown,
  Clock,
  EyeOff,
  Flag,
  Gift,
  Hourglass,
  MapPin,
  Minus,
  Plus,
  Repeat,
  Search,
  Send,
  Share2,
  ShieldCheck,
  TrendingUp,
  UserRound,
  UserRoundX,
} from 'lucide-static';

// Icons only from Lucide (docs/19), always next to a text; one meaning, one icon, as in the Mini Apps.
const ICONS = {
  wait: Hourglass,
  price: TrendingUp,
  stranger: UserRoundX,
  woman: UserRound,
  empty: Repeat,
  checked: ShieldCheck,
  phone: EyeOff,
  telegram: Send,
  share: Share2,
  complaints: Flag,
  passenger: Search,
  driver: CarFront,
  pitak: Clock,
  return: Repeat,
  bonus: Gift,
  place: MapPin,
  less: Minus,
  more: Plus,
  open: ChevronDown,
} as const;

export type IconName = keyof typeof ICONS;

export const icon = (name: IconName) => ICONS[name].replace('<svg', '<svg aria-hidden="true"');
