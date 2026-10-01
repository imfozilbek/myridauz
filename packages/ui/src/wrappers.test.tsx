import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AppRoot } from '@telegram-apps/telegram-ui';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadBrand } from '@platform/brands';
import { Cell, Section } from './components';
import { IconTile } from './icon-tile';
import { renderInShell } from './test-shell';

afterEach(cleanup);
const show = (node: ReactNode) => render(<AppRoot>{node}</AppRoot>);
const lines = () => document.querySelectorAll('hr').length;

describe('Section and Cell of packages/ui', () => {
  it('draws no line under the last row when a row is missing', () => {
    show(
      <Section>
        <Cell>Bir</Cell>
        {null}
      </Section>,
    );
    expect(lines()).toBe(0);
    cleanup();
    show(
      <Section>
        <Cell>Bir</Cell>
        {null}
        <Cell>Ikki</Cell>
      </Section>,
    );
    expect(lines()).toBe(1);
  });

  it('makes a row that opens something a button for TalkBack and the keyboard', () => {
    const open = vi.fn();
    show(<Cell onClick={open}>Mening safarlarim</Cell>);
    const row = screen.getByRole('button', { name: 'Mening safarlarim' });
    fireEvent.keyDown(row, { key: 'Enter' });
    fireEvent.keyDown(row, { key: ' ' });
    expect(open).toHaveBeenCalledTimes(2);
  });

  it('keeps a plain row and a row with its own element as they are', () => {
    show(
      <>
        <Cell>Matn</Cell>
        <Cell Component="label" onClick={() => undefined}>
          Belgi
        </Cell>
      </>,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('IconTile', () => {
  it('paints the second color in its strong tone, so the white icon stays readable', () => {
    const { container } = renderInShell(<IconTile name="destination" tone="accent" />);
    const tile = container.querySelector<HTMLElement>('span[style]');
    const hex = loadBrand().theme.colors.accentStrong;
    const [red, green, blue] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
    expect(tile?.style.background).toBe(`rgb(${red}, ${green}, ${blue})`);
  });
});
