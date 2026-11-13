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
// The deploy starts the moment the gates end, and GitHub lists that run as passed a little later
// (prod 13.11.2026: G99 skipped 3 seconds after its CI): it asks again a few times before it says no.
const TRIES = 6;
const PAUSE_MS = 10_000;
const sleep = (ms) => new Promise((resume) => setTimeout(resume, ms));
export async function passed(request, workflow, sha, pause = sleep) {
  const query = `head_sha=${sha}&event=push&status=success&per_page=1`;
  for (let left = TRIES; ; left -= 1) {
    const runs = await request(`actions/workflows/${workflow}/runs?${query}`);
    if ((runs?.total_count ?? 0) > 0) return true;
    if (left <= 1) return false;
    await pause(PAUSE_MS);
  }
}
