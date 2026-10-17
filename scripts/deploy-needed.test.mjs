import { describe, expect, it } from 'vitest';
import { deploysCode, lastDeploy, passed } from './deploy/needed.mjs';

const run = (id) => `https://github.com/acme/app/actions/runs/${id}/job/9${id}`;
// A GitHub with deployments d1 (newest) … d3, their last statuses and the workflows of their runs.
const github = ({ statuses, workflows }) => {
  const answers = {
    'deployments?environment=production&per_page=30': [
      { id: 'd1', sha: 'sha-1' },
      { id: 'd2', sha: 'sha-2' },
      { id: 'd3', sha: 'sha-3' },
    ],
    ...Object.fromEntries(
      Object.entries(statuses).map(([id, status]) => [`deployments/${id}/statuses?per_page=1`, [status]]),
    ),
    ...Object.fromEntries(
      Object.entries(workflows).map(([id, path]) => [
        `actions/runs/${id}`,
        { path: `.github/workflows/${path}` },
      ]),
    ),
  };
  return async (path) => answers[path] ?? [];
};

// docs/45, lesson 208: the base of a deploy is the last commit its own deploy brought there.
describe('whether an environment needs a deploy', () => {
  it('takes the newest successful deploy of the deploy workflow', async () => {
    const request = github({
      statuses: {
        d1: { state: 'waiting', log_url: run(1) },
        d2: { state: 'success', log_url: run(2) },
        d3: { state: 'success', log_url: run(3) },
      },
      workflows: { 2: 'deploy-production.yml', 3: 'deploy-production.yml' },
    });
    expect(await lastDeploy(request, 'production', 'deploy-production.yml')).toBe('sha-2');
  });

  // The review of G84: "Map data" leaves a successful deployment in the same Environment.
  it('never takes "Map data" for a deploy of the code', async () => {
    const request = github({
      statuses: { d1: { state: 'success', log_url: run(1) }, d2: { state: 'success', log_url: run(2) } },
      workflows: { 1: 'map-data.yml', 2: 'deploy-production.yml' },
    });
    expect(await lastDeploy(request, 'production', 'deploy-production.yml')).toBe('sha-2');
  });

  it('finds none when the environment never had a deploy of its workflow', async () => {
    const request = github({
      statuses: { d1: { state: 'success', log_url: run(1) }, d2: { state: 'failure', log_url: run(2) } },
      workflows: { 1: 'ci.yml' },
    });
    expect(await lastDeploy(request, 'production', 'deploy-production.yml')).toBeNull();
  });

  // A newer main waits for its own gates: production never gets a commit CI has not passed.
  it('deploys only a commit whose push passed the gates', async () => {
    const asked = [];
    const request = async (path) => {
      asked.push(path);
      return { total_count: path.includes('head_sha=good') ? 1 : 0 };
    };
    expect(await passed(request, 'ci.yml', 'good')).toBe(true);
    expect(await passed(request, 'ci.yml', 'newer')).toBe(false);
    expect(asked[0]).toBe('actions/workflows/ci.yml/runs?head_sha=good&event=push&status=success&per_page=1');
  });

  it('deploys when code, brands, dependencies or the deploy script changed, not for docs or CI', () => {
    expect(deploysCode(['docs/46-infrastructure.md', '.github/workflows/ci.yml'])).toBe(false);
    for (const path of ['apps/backend/src/index.ts', 'brands/acme/brand.config.ts', 'pnpm-lock.yaml'])
      expect(deploysCode(['docs/INDEX.md', path])).toBe(true);
    expect(deploysCode(['scripts/deploy/worker-config.mjs'])).toBe(true);
  });
});
