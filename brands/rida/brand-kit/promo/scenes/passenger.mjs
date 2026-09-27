// 24.47 → 40.47 s: the passenger path in the Mini App, one step per 4 s phrase.
import { COPY, bg, step, g, enter, leave, SOFT } from '../kit.mjs';
import { phone, slide } from '../phone.mjs';
import { search } from '../screens/search.mjs';
import { results } from '../screens/results.mjs';
import { trip } from '../screens/trip.mjs';
import { chat } from '../screens/chat.mjs';

const SCREENS = [search, results, trip, chat];
const STEP = 4, SLIDE = 0.35;

export function passenger(t) {
  const i = Math.min(SCREENS.length - 1, Math.floor(t / STEP)), local = t - i * STEP;
  const p = (local - (STEP - SLIDE)) / SLIDE;
  const content = i < SCREENS.length - 1 && p > 0 ? slide(SCREENS[i](local), SCREENS[i + 1](local - STEP), p) : SCREENS[i](local);
  // Camera: the phone rises in, and lifts on the booking step to show the button.
  const lift = i === 2 ? enter(local, 0.3, 0.5) * leave(local, 3.4, 0.5) : 0;
  const cam = 420 * (1 - enter(t, 0, 0.7)) - 360 * lift;
  const caption = g(step(i + 1, COPY.passenger.steps[i]), { o: Math.min(enter(local, 0.05, 0.3), 1 - lift) });
  return bg(SOFT) + phone(content, { cam }) + caption;
}
