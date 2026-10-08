import {
  Calendar,
  ChevronDown,
  ChevronUp,
  CircleDot,
  House,
  LocateFixed,
  MapPin,
  Navigation,
  Signpost,
  Waypoints,
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
  // How a passenger is picked up and which day (G35, docs/97 PS11): every choice has its icon. The
  // day is the plain calendar of the approved mockup g63/1.
  door: House,
  pitak: Signpost,
  anyWay: Waypoints,
  day: Calendar,
} satisfies Record<string, LucideIcon>;
