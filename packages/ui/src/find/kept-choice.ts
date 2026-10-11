import type { SeatChoice } from './seat-choice';

// The seats chosen on a trip of a channel post before the registration (G79 П5): after it the
// booking opens with them at once. It lives while the app is open and is taken once.
let kept: { readonly id: string; readonly choice: SeatChoice } | null = null;

export function keepChoice(id: string, choice: SeatChoice) {
  kept = { id, choice };
}

export function takeChoice(id: string): SeatChoice | null {
  const choice = kept?.id === id ? kept.choice : null;
  kept = null;
  return choice;
}
