import {
  Building2,
  Bus,
  Hospital,
  House,
  Landmark,
  MapPin,
  School,
  ShoppingBasket,
  Signpost,
  type LucideIcon,
} from 'lucide-react';

// The kinds of places found by name on the map (G23).
export const PLACE_ICONS = {
  mahalla: House,
  settlement: Building2,
  street: Signpost,
  market: ShoppingBasket,
  school: School,
  mosque: Landmark,
  health: Hospital,
  transport: Bus,
  place: MapPin,
} satisfies Record<string, LucideIcon>;
