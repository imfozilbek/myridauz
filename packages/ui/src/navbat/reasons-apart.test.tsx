import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { closeSheet } from '../home/sheet-closed';
import { JASUR, renderNavbat } from './navbat-test-kit';

afterEach(cleanup);
URL.createObjectURL = vi.fn(() => 'blob:photo');
URL.revokeObjectURL = vi.fn();

// G79 К10 (docs/170): the ticks of «Tuzatish» stay with it; «Rad etish» starts empty, so a refusal
// never goes with the reasons of a fix in one tap.
describe('the ticks of «Tuzatish» and «Rad etish»', { timeout: 20_000 }, () => {
  it('stay apart', async () => {
    renderNavbat({ filter: 'application', kind: 'application', id: JASUR.id }, [JASUR]);
    fireEvent.click(await screen.findByText('Tuzatish'));
    fireEvent.click(screen.getByText('Salon rasmi tiniq emas'));
    await closeSheet();
    fireEvent.click(await screen.findByText('Rad etish'));
    expect(screen.queryByText('Yuborish')).toBeNull();
    await closeSheet();
    fireEvent.click(await screen.findByText('Tuzatish'));
    expect(screen.getByText('Yuborish')).toBeTruthy();
    await closeSheet();
  });
});
