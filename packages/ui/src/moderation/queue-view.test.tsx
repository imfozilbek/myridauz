import type { ApplicationSummary } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderInShell } from '../test-shell';
import { QueueView } from './queue-view';

afterEach(cleanup);

const MINUTE = 60_000;
const application = (userId: string, firstName: string, minutes: number): ApplicationSummary => ({
  userId,
  firstName,
  status: 'pending',
  car: { make: 'Chevrolet', model: 'Nexia', color: 'black', plate: '10123ABC', seats: 4 },
  reasons: [],
  submittedAt: Date.now() - minutes * MINUTE,
});

describe('the queue of applications for the team (G41, docs/90 F-A2)', () => {
  it('says how many wait and how long each one waits', () => {
    const queue = [
      application('00000000000000000000000000000005', 'Ali', 42),
      application('00000000000000000000000000000006', 'Vali', 7),
    ];
    renderInShell(
      <QueueView
        queue={queue}
        title="Arizalar"
        onOpen={() => undefined}
        onBack={() => undefined}
        onRefresh={() => undefined}
      />,
    );
    expect(screen.getByText('Navbatda: 2')).toBeTruthy();
    expect(screen.getByText('42 daqiqadan beri kutmoqda')).toBeTruthy();
    expect(screen.getByText('7 daqiqadan beri kutmoqda')).toBeTruthy();
  });
});
