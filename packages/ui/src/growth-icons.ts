import { Award, Download, Handshake, QrCode, Trophy, type LucideIcon } from 'lucide-react';

// The loops of growth of G69 (docs/123, mockup g69/2): the badges of «Sizning taʼsiringiz» and the
// QR of a driver on the glass.
export const GROWTH_ICONS = {
  companion: Handshake,
  ambassador: Award,
  hero: Trophy,
  qr: QrCode,
  download: Download,
} satisfies Record<string, LucideIcon>;
