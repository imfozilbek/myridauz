import { CircleDot, Image, List, Pencil, Shield, type LucideIcon } from 'lucide-react';

// The main screen of the team (G75, mockup g67/1): the photo of a passenger to check and «Boshqaruv».
// The screens of «Boshqaruv» (G78 sheets 4 and 5): a fact of a trip or of the formula, the state of a
// trip, a change by hand («Hamyonni tuzatish», «Formulani oʻzgartirish»).
export const TEAM_ICONS = {
  photo: Image,
  management: Shield,
  fact: List,
  state: CircleDot,
  change: Pencil,
} satisfies Record<string, LucideIcon>;
