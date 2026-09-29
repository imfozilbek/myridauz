import {
  Armchair,
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
  Flag,
  Inbox,
  Languages,
  MapPin,
  Phone,
  MessageSquarePlus,
  Minus,
  Plus,
  Route,
  Search,
  ShieldCheck,
  SquarePlus,
  Ticket,
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
