import { renderInShell } from '@platform/ui/testing';
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StartPage } from './start-page';

describe('StartPage', () => {
  it('welcomes and opens the main screen with 3 actions', () => {
    const { tracked } = renderInShell(<StartPage />);
    expect(screen.getByText(/Safaringizga yoʻlovchi toping/)).toBeTruthy();
    fireEvent.click(screen.getByText('Davom etish'));
    for (const action of ['Yangi safar', 'Yoʻlovchilar soʻrovlari', 'Mening safarlarim'])
      expect(screen.getByText(action)).toBeTruthy();
    expect(tracked.map((event) => event.screen)).toEqual(['welcome', 'home']);
  });
});
