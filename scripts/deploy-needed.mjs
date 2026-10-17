// Prints true when an environment needs a deploy of the checked out commit, else false (docs/45):
// node scripts/deploy-needed.mjs --env=<internal|production> --workflow=<its deploy workflow>
// [--after=<workflow of the gates>] [--always]. --after: the push of the commit must have passed it
// (a newer main waits for its own gates); --always: a deploy by hand, whatever changed.
// Runs in CI with GH_TOKEN, GITHUB_REPOSITORY and GITHUB_SHA; plain Node, no install.
import { execFileSync } from 'node:child_process';
import { deploysCode, lastDeploy, passed } from './deploy/needed.mjs';

const value = (name) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1];
const [environment, workflow, gates] = [value('env'), value('workflow'), value('after')];
if (!environment || !workflow) throw new Error('deploy-needed: --env= and --workflow= are required');
const { GH_TOKEN, GITHUB_REPOSITORY, GITHUB_API_URL = 'https://api.github.com' } = process.env;

const request = async (path) => {
  const response = await fetch(`${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/${path}`, {
    // Without a token (a run by hand) the public repository still answers.
    headers: {
      accept: 'application/vnd.github+json',
      ...(GH_TOKEN && { authorization: `Bearer ${GH_TOKEN}` }),
    },
  });
  if (!response.ok) throw new Error(`deploy-needed: GitHub ${response.status} on ${path}`);
  return response.json();
};
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const known = (sha) => {
  try {
    git('cat-file', '-e', `${sha}^{commit}`);
    return true;
  } catch {
    return false;
  }
};

async function needed() {
  const head = git('rev-parse', 'HEAD');
  if (gates && !(await passed(request, gates, head))) {
    console.error(`${head}: ${gates} has not passed on this push`);
    return false;
  }
  if (process.argv.includes('--always')) return true;
  // No answer from GitHub or no known base: the deploy is offered (docs/46).
  const base = await lastDeploy(request, environment, workflow).catch((error) => {
    console.error(String(error));
    return null;
  });
  console.error(`last ${environment} deploy: ${base ?? 'none'}`);
  if (!base || !known(base)) return true;
  return deploysCode(git('diff', '--name-only', base, 'HEAD').split('\n').filter(Boolean));
}

console.log(String(await needed()));
