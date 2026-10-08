import {
  MapIcon,
  MessageCircle,
  MessageSquare,
  Mic,
  MicOff,
  Phone,
  PhoneCall,
  PhoneOff,
  RectangleHorizontal,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

// Two people of one trip: the chat, the call, the meeting and what the trip took from the wallet.
export const TALK_ICONS = {
  phone: Phone,
  chat: MessageSquare,
  // «Yozish» on the meeting card of the driver is a round bubble (mockup g63/4 screen 13).
  write: MessageCircle,
  // A voice call (docs/08): start, hang up, microphone on and off.
  call: PhoneCall,
  hangUp: PhoneOff,
  microphone: Mic,
  muted: MicOff,
  // «Xaritada ochish» on the small map of a meeting point (docs/126, G63).
  map: MapIcon,
  wallet: Wallet,
  // «Hamyon: … yechildi» of «Safar tugadi» (mockup g63/4 screen 15): Lucide has no wallet as flat as
  // the mockup one; the wide rounded rectangle is the nearest by pixels (0.84 against 0.65).
  walletPlain: RectangleHorizontal,
} satisfies Record<string, LucideIcon>;
