import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderInShell } from '../test-shell';
import { Paged } from './paged';

afterEach(cleanup);

describe('a long list loads by parts (docs/65 B6)', () => {
  it('shows 10 items, then the next ones on "Yana koʻrsatish"', () => {
    const items = Array.from({ length: 23 }, (_, n) => `trip ${n + 1}`);
    renderInShell(<Paged items={items} render={(item) => <p key={item}>{item}</p>} />);
    expect(screen.getByText('trip 10')).toBeTruthy();
    expect(screen.queryByText('trip 11')).toBeNull();
    fireEvent.click(screen.getByText('Yana koʻrsatish'));
    fireEvent.click(screen.getByText('Yana koʻrsatish'));
    expect(screen.getByText('trip 23')).toBeTruthy();
    expect(screen.queryByText('Yana koʻrsatish')).toBeNull();
  });
});
