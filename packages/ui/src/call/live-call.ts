// A talk or a ring on the screen right now (docs/115): another ringing call does not take the screen
// away from it; that caller reaches the person through the bot.
let live = 0;

export const callIsLive = () => live > 0;

export function holdLiveCall(): () => void {
  live += 1;
  return () => void (live -= 1);
}
