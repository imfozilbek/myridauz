import { toCyrillic } from '@platform/i18n';
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
    fireEvent.click(await screen.findByText(toCyrillic('Tuzatish')));
    fireEvent.click(screen.getByText(toCyrillic('Old tomondan olingan rasm tiniq emas')));
    await closeSheet();
    fireEvent.click(await screen.findByText(toCyrillic('Rad etish')));
    expect(screen.queryByText(toCyrillic('Yuborish'))).toBeNull();
    await closeSheet();
    fireEvent.click(await screen.findByText(toCyrillic('Tuzatish')));
    expect(screen.getByText(toCyrillic('Yuborish'))).toBeTruthy();
    await closeSheet();
  });
});
