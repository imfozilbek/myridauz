import type { ErrorRow } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderInShell } from '../test-shell';
import { ErrorsSections } from './stats-errors';

afterEach(cleanup);

const crash: ErrorRow = {
  kind: 'crash',
  app: 'main',
  screen: 'waitlist_done',
  code: 'uncaught',
  what: 'TypeError: x',
  count: 2,
};
const refusal: ErrorRow = {
  kind: 'refusal',
  app: 'passenger',
  screen: 'share.follow',
  code: 'shares.not_found',
  what: '',
  count: 5,
};

// Every row of «Xatolar» has a name a person reads (G52, docs/112): the Mini App of the waitlist too,
// and a refusal without a text of its own takes the words of the screen people saw.
describe('the rows of «Xatolar»', () => {
  it('names the Mini App of the waitlist and a closed link of «Ulashish»', () => {
    renderInShell(<ErrorsSections errors={[crash, refusal]} />);
    expect(screen.getByText('Kutish roʻyxati · waitlist_done')).toBeTruthy();
    expect(screen.getByText('Bu safar endi koʻrinmaydi')).toBeTruthy();
    expect(screen.queryByText('shares.not_found')).toBeNull();
  });
});
