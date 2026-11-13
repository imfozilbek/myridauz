// Whether an environment needs a deploy (docs/45, docs/46): only when something that is deployed changed
// since the last commit a deploy of that environment brought there. Not the previous push: a red main
// skips its deploy, and the next merge of docs alone must still bring that code (lesson 208). Not "Map
// data" either: it runs in the same GitHub Environment, but it deploys no code.
const DEPLOYED =
  /^(apps\/|packages\/|brands\/|scripts\/deploy|package\.json$|pnpm-lock\.yaml$|pnpm-workspace\.yaml$)/u;
const PAGE = 30;

export const deploysCode = (changed) => changed.some((path) => DEPLOYED.test(path));

const runOf = (url) => /\/actions\/runs\/(\d+)/u.exec(url ?? '')?.[1];

// The commit of the last successful deploy of the environment by its deploy workflow, or null.
// request(path) reads the GitHub API of the repository.
export async function lastDeploy(request, environment, workflow) {
  const deployments = (await request(`deployments?environment=${environment}&per_page=${PAGE}`)) ?? [];
  for (const deployment of deployments) {
    const [status] = (await request(`deployments/${deployment.id}/statuses?per_page=1`)) ?? [];
    const run = status?.state === 'success' ? runOf(status.log_url) : undefined;
    if (!run) continue;
    const { path } = await request(`actions/runs/${run}`);
    if (path === `.github/workflows/${workflow}`) return deployment.sha;
  }
  return null;
}

// Whether the push of this commit passed the workflow of the gates: only such a commit is deployed.
// The filter «status=success» of GitHub knows a fresh run only minutes later (prod 13.11.2026: G99
// skipped twice, 3 seconds and 10 minutes after its green CI): the runs of the push are read whole and
// their conclusion checked here; a run listed late is asked again a few times before the answer no.
const TRIES = 6;
const PAUSE_MS = 10_000;
const sleep = (ms) => new Promise((resume) => setTimeout(resume, ms));
export async function passed(request, workflow, sha, pause = sleep) {
  const query = `head_sha=${sha}&event=push&per_page=${PAGE}`;
  for (let left = TRIES; ; left -= 1) {
    const runs = await request(`actions/workflows/${workflow}/runs?${query}`);
    if ((runs?.workflow_runs ?? []).some((run) => run.conclusion === 'success')) return true;
    if (left <= 1) return false;
    await pause(PAUSE_MS);
  }
}
