import type { Stamp } from '@platform/contracts';
import { launchArrival } from './arrival';

// G99 (docs/234): the Telegram of the session from its client line «android 8.0 chrome 120»: the
// platform and the version of Telegram WebApp. Outside Telegram: none.
const VERSION = /^\d{1,2}(\.\d{1,2}){0,2}$/;
export function stampOfClient(client: string): Stamp {
  const [platform, tg] = client.split(' ');
  return {
    ...(platform ? { platform } : {}),
    ...(tg && VERSION.test(tg) ? { tg } : {}),
  };
}

// The first touch until the profile names it: the mark of this launch, else the kind of its link.
export function sessionEntry(client: string): string | undefined {
  const arrival = launchArrival(client);
  return arrival.via ?? arrival.source;
}
