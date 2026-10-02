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
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Navigation,
  CircleAlert,
  CircleDot,
  ClipboardCheck,
  FileText,
  Heart,
  History,
  Flag,
  Inbox,
  Languages,
  LocateFixed,
  MapPin,
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
  type LucideIcon,
} from 'lucide-react';
import { PLACE_ICONS } from './place-icons';

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
  origin: CircleDot,
  destination: MapPin,
  // The map of the pickup point (G22): the pin and "Mening joylashuvim".
  pickup: MapPin,
  locate: LocateFixed,
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
  // "Maʼlumotlarimni oʻchirish" in the profile (docs/30).
  erase: Trash2,
  // The phone number is never shown to anyone (docs/07).
  hidden: EyeOff,
  // A Telegram channel of the team (docs/63).
  channel: Megaphone,
  // The stops of the driver (G24, docs/70): move one up or down, open the way in a navigator.
  up: ChevronUp,
  down: ChevronDown,
  navigate: Navigation,
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
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

const DEFAULT_SIZE = 24;

type IconProps = {
  readonly name: IconName;
  readonly size?: number;
  readonly color?: string;
  // Filled with its color: a chosen star (docs/24).
  readonly filled?: boolean;
};

export function Icon({ name, size = DEFAULT_SIZE, color = 'currentColor', filled = false }: IconProps) {
  const Component = ICONS[name];
  return <Component size={size} color={color} fill={filled ? color : 'none'} aria-hidden />;
}
