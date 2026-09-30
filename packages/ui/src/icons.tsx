import {
  Armchair,
  Building2,
  Bus,
  Hospital,
  House,
  Landmark,
  School,
  ShoppingBasket,
  Signpost,
  Banknote,
  Bell,
  Ban,
  Camera,
  Car,
  CarFront,
  ChartColumn,
  Check,
  ChevronRight,
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
  Share2,
  Star,
  type LucideIcon,
} from 'lucide-react';

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
  // The kinds of places found by name on the map (G23).
  mahalla: House,
  settlement: Building2,
  street: Signpost,
  market: ShoppingBasket,
  school: School,
  mosque: Landmark,
  health: Hospital,
  transport: Bus,
  place: MapPin,
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
  // A Telegram channel of the team (docs/63).
  channel: Megaphone,
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
