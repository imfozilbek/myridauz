import type { StatsPeriod } from '@platform/contracts';
import { errorsFile, peopleFile } from '../domain/paths-file';
import type { StatsDeps } from './ports';
import { pathRowsOf } from './read-paths';

// G99 T6 (docs/234): the two files for the analyst go to the owner by the admin bot: the paths of the
// people and the errors, of the period asked.
export async function sendPathsFile(deps: StatsDeps, period: StatsPeriod, ownerId: number): Promise<void> {
  const { rows, errors } = await pathRowsOf(deps, period);
  await deps.sendFiles(
    ownerId,
    [
      { name: `paths-${period}.csv`, text: peopleFile(rows) },
      { name: `errors-${period}.csv`, text: errorsFile(errors) },
    ],
    period,
  );
}
