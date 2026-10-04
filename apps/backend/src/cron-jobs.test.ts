import { describe, expect, it, vi } from 'vitest';
import { runJobs } from './cron-jobs';

// A broken job of the Cron does not stop the others; each one writes its time or its error to the
// log of the Worker (G42, docs/111).
describe('the jobs of the Cron', () => {
  it('runs every job, reports the broken one and logs each', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const done: string[] = [];
    const failed = await runJobs([
      ['first', async () => void done.push('first')],
      [
        'broken',
        async () => {
          throw new Error('D1 is down');
        },
      ],
      ['last', async () => void done.push('last')],
    ]);
    expect(done).toEqual(['first', 'last']);
    expect(failed).toEqual(['broken']);
    expect(log).toHaveBeenCalledTimes(2);
    expect(String(error.mock.calls[0]?.[0])).toContain('"job":"broken"');
    log.mockRestore();
    error.mockRestore();
  });
});
