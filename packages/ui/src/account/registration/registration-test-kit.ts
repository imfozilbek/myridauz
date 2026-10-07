import { act, fireEvent, screen } from '@testing-library/react';
import { vi } from 'vitest';

// The picked face is shown at once: jsdom has no object addresses, the test gives one.
Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:face'), revokeObjectURL: vi.fn() });

export const FACE = new File(['face'], 'face.jpg', { type: 'image/jpeg' });

// Screen 1 like a person: both ticks, then «Davom etish» (G58).
export async function passWelcome() {
  for (const box of await screen.findAllByRole('checkbox')) fireEvent.click(box);
  fireEvent.click(screen.getByText('Davom etish'));
  await screen.findByText('Siz haqingizda');
}

// The phone sheet gives a photo from the camera or the gallery.
export async function addFace(container: HTMLElement) {
  const input = container.querySelector<HTMLInputElement>('.face-circle input[type="file"]');
  if (!input) throw new Error('no face input');
  await act(async () => fireEvent.change(input, { target: { files: [FACE] } }));
}
