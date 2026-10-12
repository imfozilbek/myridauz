import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MADINA, renderNavbat } from './navbat-test-kit';

afterEach(cleanup);
URL.createObjectURL = vi.fn(() => 'blob:photo');
URL.revokeObjectURL = vi.fn();

// G79 К6 (docs/170): the last case decided, «Hammasi koʻrildi» says so a moment and the main screen
// comes by itself (1 tap → 0).
describe('the last case of «Navbat»', { timeout: 20_000 }, () => {
  it('goes to the main screen by itself', async () => {
    const onBack = vi.fn();
    renderNavbat(
      { filter: 'face', kind: 'face', id: MADINA.id },
      [MADINA],
      { moderation: { facePhoto: async () => new Blob(['x']), decideFace: vi.fn(async () => undefined) } },
      onBack,
    );
    fireEvent.click((await screen.findAllByText('Mos emas')).at(0) as HTMLElement);
    expect(await screen.findByText('Hammasi koʻrildi')).toBeTruthy();
    expect(onBack).not.toHaveBeenCalled();
    await waitFor(() => expect(onBack).toHaveBeenCalledOnce(), { timeout: 4000 });
  });
});
