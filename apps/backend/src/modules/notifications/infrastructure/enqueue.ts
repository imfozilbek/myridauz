import type { Bindings } from '../../../env';
import { recordServerEvent } from '../../analytics';
import type { QueueMessage, TimedTask } from '../application/job';
import { secondsUntil } from '../application/pace';

// One sendBatch of Queues takes at most 100 messages.
const BATCH = 100;

// Messages and tasks into the queue, counted as its operations for the dashboard (G85 T1).
export async function enqueue(env: Bindings, items: readonly MessageSendRequest<QueueMessage>[]) {
  const queue = env.NOTIFICATIONS;
  if (!queue || items.length === 0) return;
  for (let start = 0; start < items.length; start += BATCH)
    await queue.sendBatch(items.slice(start, start + BATCH));
  recordServerEvent(env, { name: 'queue_ops', source: 'write', count: items.length });
}

// Tasks that wait for their moment in the queue (G85 R3). Without the queue they run at once.
export async function scheduleTasks(
  env: Bindings,
  tasks: readonly { readonly task: TimedTask; readonly at: number }[],
  runNow: (task: TimedTask) => Promise<void>,
): Promise<void> {
  if (!env.NOTIFICATIONS) {
    for (const { task } of tasks) await runNow(task);
    return;
  }
  const now = Date.now();
  await enqueue(
    env,
    tasks.map(({ task, at }) => ({ body: task, delaySeconds: secondsUntil(at, now) })),
  );
}
