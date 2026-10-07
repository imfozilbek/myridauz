import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Screen } from '../screen/screen';
import { native, pressBack } from '../test-native';
import { renderInShell, testClients } from '../test-shell';
import { MapSearch } from './map-search';

vi.mock('@telegram-apps/sdk-react', async (original) => ({
  ...(await original<object>()),
  ...(await import('../test-native')).nativeButtons,
}));
afterEach(cleanup);

const TASHKENT = { lat: 41.3111, lng: 69.2797 };

describe('the search on the map and «Назад» (docs/94 B6)', () => {
  it('the first «Назад» clears the search, the second one leaves the screen', () => {
    const onBack = vi.fn();
    const search = vi.fn(async () => []);
    renderInShell(
      <>
        <Screen onBack={onBack} />
        <MapSearch near={TASHKENT} onFound={vi.fn()} />
      </>,
      true,
      true,
      undefined,
      testClients({ map: { search } }),
    );
    const field = screen.getByPlaceholderText('Joy nomini yozing') as HTMLInputElement;
    fireEvent.change(field, { target: { value: 'Chorsu' } });
    act(pressBack);
    expect(field.value).toBe('');
    expect(onBack).not.toHaveBeenCalled();
    expect(native.backShown).toBe(true);
    act(pressBack);
    expect(onBack).toHaveBeenCalledOnce();
  });
});
