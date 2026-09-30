// 24.47 → 40.47 s: the passenger path in the Mini App, one step per 4 s phrase. The camera
// floats, pushes in on the key moment of each step and lifts to the booking button.
import { COPY, g, enter, leave } from '../kit.mjs';
import { phone, slide } from '../phone.mjs';
import { stepCaption } from '../type.mjs';
import { stage } from '../world.mjs';
import { search } from '../screens/search.mjs';
import { results } from '../screens/results.mjs';
import { trip } from '../screens/trip.mjs';
import { chat } from '../screens/chat.mjs';

const SCREENS = [search, results, trip, chat];
const STEP = 4, SLIDE = 0.35;
// Push-in per step: [start, end, zoom, frame y of the focus].
const FOCUS = [[0, 3.6, 1, 960], [1.4, 3.2, 1.32, 875], [2.0, 3.1, 1.18, 951], [2.9, 3.8, 1.25, 1035]];

export function passenger(t) {
  const i = Math.min(SCREENS.length - 1, Math.floor(t / STEP)), local = t - i * STEP;
  const p = (local - (STEP - SLIDE)) / SLIDE;
  const content = i < SCREENS.length - 1 && p > 0 ? slide(SCREENS[i](local), SCREENS[i + 1](local - STEP), p) : SCREENS[i](local);
  const [a, b, z, fy] = FOCUS[i], push = enter(local, a, 0.5) * leave(local, b + 0.4, 0.4);
  const lift = i === 2 ? enter(local, 0.3, 0.5) * leave(local, 3.4, 0.5) : 0;
  const cam = 420 * (1 - enter(t, 0, 0.7)) - 360 * lift + Math.sin(t * 1.4) * 8;
  const tilt = -6 * (1 - enter(t, 0, 0.9)) + Math.sin(t * 0.9) * 0.6;
  const zoom = 1 + (z - 1) * push;
  // The caption lies under the phone: when the camera lifts the phone, it never shows through the screen.
  return stage(t) + g(stepCaption(i + 1, COPY.passenger.steps[i], local), { o: Math.min(1 - lift, 1 - (zoom - 1) * 20) }) +
    phone(content, { cam, zoom, fy, tilt });
}
