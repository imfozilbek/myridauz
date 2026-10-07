import {
  CircleFadingPlus,
  Armchair,
  Banknote,
  Bell,
  Ban,
  Camera,
  Car,
  CarFront,
  ChartColumn,
  Check,
  EyeOff,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  FileText,
  Heart,
  History,
  Flag,
  Inbox,
  Languages,
  Megaphone,
  Mic,
  MicOff,
  Phone,
  PhoneCall,
  PhoneOff,
  MessageSquarePlus,
  Minus,
  Plus,
  Route,
  Search,
  ShieldCheck,
  SquarePlus,
  Ticket,
  Trash2,
  UserRound,
  Users,
  Wallet,
  MessageCircle,
  SendHorizontal,
  Smartphone,
  Share2,
  Star,
  Mars,
  Venus,
  Gift,
  ScanFace,
  Palette,
  RectangleEllipsis,
  Clock,
  ClockArrowUp,
  TrendingDown,
  Volume2,
  Play,
  WifiOff,
  X,
  BriefcaseBusiness,
  type LucideIcon,
} from 'lucide-react';
import { PLACE_ICONS } from './place-icons';
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
  statistics: ChartColumn,
  team: ShieldCheck,
  empty: Inbox,
  error: CircleAlert,
  language: Languages,
  selected: Check,
  next: ChevronRight,
  profile: UserRound,
  camera: Camera,
  phone: Phone,
  document: FileText,
  blocked: Ban,
  ...WAY_ICONS,
  ...PLACE_ICONS,
  car: CarFront,
  carSide: Car,
  carInterior: Armchair,
  less: Minus,
  more: Plus,
  price: Banknote,
  wallet: Wallet,
  chat: MessageCircle,
  share: Share2,
  subscriptions: Bell,
  star: Star,
  // "Sevimli haydovchilar" and "Safarlar tarixi" (G18, docs/18).
  favorite: Heart,
  history: History,
  // A voice call (docs/08): start, hang up, microphone on and off.
  call: PhoneCall,
  hangUp: PhoneOff,
  microphone: Mic,
  muted: MicOff,
  // "Maʼlumotlarimni oʻchirish" (docs/30); the phone is never shown (docs/07); a channel (docs/63).
  erase: Trash2,
  hidden: EyeOff,
  channel: Megaphone,
  // An approved application (docs/86 V7); send like Telegram, home screen, story (docs/88 L10, L17, L19).
  approved: ShieldCheck,
  send: SendHorizontal,
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
  // A channel offered once closes for good (docs/119); «Ishxonam», a place kept once (docs/126).
  close: X,
  work: BriefcaseBusiness,
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
