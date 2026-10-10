import {
  Armchair,
  Ban,
  RefreshCw,
  Banknote,
  Bell,
  BriefcaseBusiness,
  Camera,
  Car,
  CarFront,
  ChartColumn,
  Check,
  ChevronRight,
  CircleAlert,
  CircleFadingPlus,
  ClipboardCheck,
  Clock,
  ClockArrowUp,
  EyeOff,
  FileText,
  Flag,
  Gift,
  Heart,
  History,
  Inbox,
  Languages,
  Lock,
  Mars,
  Megaphone,
  MessageSquarePlus,
  Minus,
  Newspaper,
  Palette,
  Play,
  Plus,
  RectangleEllipsis,
  Route,
  ScanFace,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Smartphone,
  SquarePlus,
  Star,
  Ticket,
  Trash2,
  TrendingDown,
  UserRound,
  Users,
  Venus,
  Volume2,
  WifiOff,
  X,
  type LucideIcon,
} from 'lucide-react';
import { PLACE_ICONS } from './place-icons';
import { PROFILE_ICONS } from './profile-icons';
import { TALK_ICONS } from './talk-icons';
import { TEAM_ICONS } from './team-icons';
import { WAY_ICONS } from './way-icons';
// One meaning = one icon in all three Mini Apps (docs/19).
const ICONS = {
  trip: Route,
  search: Search,
  request: MessageSquarePlus,
  myTrips: Ticket,
  newTrip: SquarePlus,
  passengers: Users,
  applications: ClipboardCheck,
  complaints: Flag,
  arrived: Flag, // the badge of «Yetib keldingizmi?» (mockup g60/6)
  statistics: ChartColumn,
  team: ShieldCheck,
  empty: Inbox,
  error: CircleAlert,
  language: Languages,
  selected: Check,
  next: ChevronRight,
  profile: UserRound,
  camera: Camera,
  document: FileText,
  // «Mening safarlarim» of a driver before the application is sent (mockup g62/1 screen 1).
  adverts: Newspaper,
  blocked: Ban,
  reopen: RefreshCw, // «Ilovani qayta oching» of an old launch (mockup g75/1 A)
  ...WAY_ICONS,
  ...PROFILE_ICONS,
  ...TALK_ICONS,
  ...PLACE_ICONS,
  ...TEAM_ICONS,
  car: CarFront,
  carSide: Car,
  carInterior: Armchair,
  less: Minus,
  more: Plus,
  price: Banknote,
  share: Share2,
  subscriptions: Bell,
  star: Star,
  favorite: Heart, // "Sevimli haydovchilar" and "Safarlar tarixi" (G18, docs/18)
  history: History,
  // "Maʼlumotlarimni oʻchirish" (docs/30); the phone is never shown (docs/07); a channel (docs/63).
  erase: Trash2,
  hidden: EyeOff,
  channel: Megaphone,
  // An approved application (docs/86 V7); send like Telegram, home screen, story (docs/88 L10, L17, L19).
  approved: ShieldCheck,
  send: Send,
  homeScreen: Smartphone,
  story: CircleFadingPlus,
  // The first contact of a driver (G34, docs/95): every choice and every line of a summary has its icon.
  male: Mars,
  female: Venus,
  bonus: Gift,
  face: ScanFace,
  color: Palette,
  plate: RectangleEllipsis,
  seats: Armchair,
  waiting: Clock,
  later: ClockArrowUp, // a trip moves later; a cheaper trip in the search (G39, docs/104)
  cheaper: TrendingDown,
  // The sounds of the brand, a sound to listen to in the admin Mini App (G54, docs/115); no network.
  sounds: Volume2,
  play: Play,
  offline: WifiOff,
  close: X, // a channel offered once closes for good (docs/119)
  work: BriefcaseBusiness, // «Ishxonam», a place kept once (docs/126)
  locked: Lock, // numbers and links are hidden in a chat (docs/07, mockup g60/2)
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

const DEFAULT_SIZE = 24;

type IconProps = {
  readonly name: IconName;
  readonly size?: number;
  readonly color?: string;
  readonly filled?: boolean; // filled with its color: a chosen star (docs/24)
};

export function Icon({ name, size = DEFAULT_SIZE, color = 'currentColor', filled = false }: IconProps) {
  const Component = ICONS[name];
  return <Component size={size} color={color} fill={filled ? color : 'none'} aria-hidden />;
}
