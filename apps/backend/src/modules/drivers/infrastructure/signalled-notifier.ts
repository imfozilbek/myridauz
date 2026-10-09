import type { Bindings } from '../../../env';
import { sendSignals } from '../../feed';
import type { ModerationNotifier } from '../application/ports';

// The open Mini Apps hear "something changed" here (docs/64): a new application, the team's queue;
// a decision, the driver's application screen and the queues of the other moderators.
export function signalledNotifier(
  env: Bindings,
  notifier: ModerationNotifier,
  teamIds: () => Promise<number[]>,
): ModerationNotifier {
  const team = async () => (await teamIds()).map((userId) => ({ userId, app: 'admin' as const }));
  return {
    submitted: async (application) => {
      await notifier.submitted(application);
      await sendSignals(env, await team());
    },
    decided: async (application, fixedPlate, bonus) => {
      await notifier.decided(application, fixedPlate, bonus);
      await sendSignals(env, [{ userId: application.userId, app: 'driver' }, ...(await team())]);
    },
  };
}
