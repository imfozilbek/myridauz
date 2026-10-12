import { fireEvent, waitFor } from '@testing-library/react';
import { expect } from 'vitest';

// A day of the row of the week by its place: 0 today, 1 tomorrow … 6 (docs/172).
export async function pickDay(index: number) {
  await waitFor(() => expect(document.querySelectorAll('.week-day').length).toBeGreaterThan(index));
  fireEvent.click(document.querySelectorAll('.week-day')[index] as HTMLElement);
}
