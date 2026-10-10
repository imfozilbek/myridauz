import {
  ArrowUpDown,
  Calendar,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Compass,
  House,
  LocateFixed,
  MapPin,
  Navigation,
  PenLine,
  Signpost,
  User,
  Waypoints,
  Undo2,
  type LucideIcon,
} from 'lucide-react';

// The way of a trip: its ends, its points on the map and how a passenger is picked up.
export const WAY_ICONS = {
  origin: CircleDot,
  destination: MapPin,
  // The map of the pickup point (G22): the pin and "Mening joylashuvim".
  pickup: MapPin,
  locate: LocateFixed,
  // The stops of the driver (G24, docs/70): move one up or down, open the way in a navigator.
  up: ChevronUp,
  down: ChevronDown,
  navigate: Navigation,
  // The three navigators of the sheet (G75, mockup g75/6 A): Yandex, Google, Apple.
  compass: Compass,
  // How a passenger is picked up and which day (G35, docs/97 PS11): every choice has its icon. The
  // day is the plain calendar of the approved mockup g63/1.
  door: House,
  pitak: Signpost,
  anyWay: Waypoints,
  day: Calendar,
  // «Vaqt yoki narx» of the own trip (mockup g63/3): the time and the price change there.
  edit: PenLine,
  // The free seats of a trip (G63): one person, as on the approved mockup g63/1.
  seat: User,
  // The ends change places on the main screen; «Qaytish», the way back (G66, mockup g66/1).
  swap: ArrowUpDown,
  comeBack: Undo2,
} satisfies Record<string, LucideIcon>;
