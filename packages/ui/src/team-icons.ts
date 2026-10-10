import { Image, Shield, type LucideIcon } from 'lucide-react';

// The main screen of the team (G75, mockup g67/1): the photo of a passenger to check and «Boshqaruv».
export const TEAM_ICONS = {
  photo: Image,
  management: Shield,
} satisfies Record<string, LucideIcon>;
