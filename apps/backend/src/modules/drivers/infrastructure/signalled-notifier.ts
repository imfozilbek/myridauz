import type { Bindings } from '../../../env';
import { sendSignals } from '../../feed';
import type { ModerationNotifier } from '../application/ports';

// The moderation card goes to Telegram directly (an album of photos), not through notify: so the
// open Mini Apps hear "something changed" here (docs/64). A new application: the team's queue;
// a decision: the driver's application screen and the queues of the other moderators.
export function signalledNotifier(
  env: Bindings,
  notifier: ModerationNotifier,
  teamIds: () => Promise<number[]>,
): ModerationNotifier {
  const team = async () => (await teamIds()).map((userId) => ({ userId, app: 'admin' as const }));
  return {
    submitted: async (application, person) => {
      await notifier.submitted(application, person);
      await sendSignals(env, await team());
    },
    decided: async (application, fixedPlate, bonus) => {
      await notifier.decided(application, fixedPlate, bonus);
      await sendSignals(env, [{ userId: application.userId, app: 'driver' }, ...(await team())]);
    },
  };
}
