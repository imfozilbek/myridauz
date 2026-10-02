import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AppRoot, Cell as TguiCell } from '@telegram-apps/telegram-ui';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadBrand } from '@platform/brands';
import { StepLayout } from './account/step-layout';
import { Cell, Field, Section, Switch } from './components';
import { haptic } from './telegram/feedback';
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

  it('wraps a long subtitle instead of cutting it on a 360 px phone (G27)', () => {
    const { container } = show(
      <>
        <Cell subtitle="Yoʻnalishingizdagi yoʻlovchilar">Bir</Cell>
        <TguiCell multiline subtitle="Yoʻnalishingizdagi yoʻlovchilar">
          Bir
        </TguiCell>
      </>,
    );
    const [ours, wrapped] = Array.from(container.firstElementChild?.children ?? []);
    expect(ours?.className).toBeTruthy();
    expect(ours?.className).toBe(wrapped?.className);
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

describe('StepLayout', () => {
  it('opens at the top, so its question is seen whatever the last screen scrolled (G27)', () => {
    const scroll = vi.spyOn(window, 'scrollTo');
    renderInShell(<StepLayout icon="wallet" title="Joyni tasdiqlaysizmi?" />);
    expect(scroll).toHaveBeenCalledWith(0, 0);
  });
});

describe('Field', () => {
  it('shows its label on every platform as a section header and names the input (G27)', () => {
    show(<Field label="Bir km narxi" value="300" onChange={() => undefined} />);
    expect(screen.getByLabelText('Bir km narxi')).toHaveProperty('value', '300');
    expect(screen.getByText('Bir km narxi').closest('label')).toBeNull();
  });
});

describe('Switch of packages/ui (docs/88 L3)', () => {
  it('ticks softly and passes the change on', () => {
    const select = vi.spyOn(haptic, 'select');
    const changed = vi.fn();
    show(<Switch aria-label="Ayol" checked={false} onChange={changed} />);
    fireEvent.click(screen.getByLabelText('Ayol'));
    expect(select).toHaveBeenCalledOnce();
    expect(changed).toHaveBeenCalledOnce();
  });
});
