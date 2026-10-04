// One job of the Cron: a name for the log and the work.
export type Job = readonly [name: string, run: () => Promise<unknown>];

// Every job runs on its own: a broken one does not stop the others. Each writes its time or its
// error to the log of the Worker (G42, docs/111). The names of the broken jobs come back.
export async function runJobs(jobs: readonly Job[], clock: () => number = Date.now): Promise<string[]> {
  const results = await Promise.allSettled(
    jobs.map(async ([job, run]) => {
      const start = clock();
      try {
        await run();
        console.log(JSON.stringify({ event: 'cron_job', job, ms: clock() - start }));
      } catch (error) {
        console.error(
          JSON.stringify({ event: 'cron_failed', job, ms: clock() - start, message: String(error) }),
        );
        throw error;
      }
    }),
  );
  return jobs.flatMap(([job], index) => (results[index]?.status === 'rejected' ? [job] : []));
}
