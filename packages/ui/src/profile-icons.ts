import { Bell, Car, CircleHelp, File, Smartphone, type LucideIcon } from 'lucide-react';

// The rows of «Profil» (G65, mockup g65/3): the car from the side, the messages of the bot, the
// phone, the help, the documents.
export const PROFILE_ICONS = {
  carSide: Car,
  botMessages: Bell,
  mobile: Smartphone,
  help: CircleHelp,
  file: File,
} satisfies Record<string, LucideIcon>;
