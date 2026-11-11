import { toCyrillic } from '@platform/i18n';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BOBUR, COMPLAINT, JASUR, renderNavbat } from './navbat-test-kit';

afterEach(cleanup);
URL.createObjectURL = vi.fn(() => 'blob:photo');
URL.revokeObjectURL = vi.fn();
const open = { filter: 'application' as const, kind: 'application' as const, id: JASUR.id };

// The cases of «Navbat» one after another (G75, docs/120, mockup g67/2 screen 3).
describe('«Navbat»', () => {
  it('opens the application tapped on the main screen as the mockup and takes it', async () => {
    const { take } = renderNavbat(open, [COMPLAINT, JASUR, BOBUR]);
    expect(await screen.findByText(`Jasur · ${toCyrillic('ariza')}`)).toBeTruthy();
    expect(screen.getByText(toCyrillic('1 / 2 · qarordan keyin keyingisi oʻzi ochiladi'))).toBeTruthy();
    expect(screen.getByText(`Chevrolet Cobalt · ${toCyrillic('Oq')}`)).toBeTruthy();
    expect(screen.getByText(toCyrillic('4 joy'))).toBeTruthy();
    expect(screen.getByText(`Jasur, ${toCyrillic('erkak')}`)).toBeTruthy();
    expect(screen.getByText(toCyrillic('Bu raqam yana 1 arizada bor. Tekshiring.'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Rad etish')).className).toContain('case-danger');
    expect(take).toHaveBeenCalledWith('application', JASUR.id);
  });

  it('opens the next case of the filter by itself after a decision', async () => {
    const { decide, take } = renderNavbat(open, [JASUR, BOBUR]);
    fireEvent.click(await screen.findByText(toCyrillic('Rad etish')));
    fireEvent.click(screen.getByText(toCyrillic('Old tomondan olingan rasm tiniq emas')));
    fireEvent.click(screen.getByText(toCyrillic('Yuborish')));
    expect(await screen.findByText(`Bobur · ${toCyrillic('ariza')}`)).toBeTruthy();
    expect(screen.getByText(toCyrillic('2 / 2 · qarordan keyin keyingisi oʻzi ochiladi'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Javob yuborildi'))).toBeTruthy();
    expect(decide).toHaveBeenCalledWith(JASUR.id, { action: 'reject', reasons: ['front_unclear'] });
    await waitFor(() => expect(take).toHaveBeenCalledWith('application', BOBUR.id));
  });

  it('says «Hammasi koʻrildi» when nothing of the filter is left', async () => {
    renderNavbat(undefined, []);
    expect(await screen.findByText(toCyrillic('Hammasi koʻrildi'))).toBeTruthy();
  });
});
