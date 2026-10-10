import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { profile, renderProfile } from './profile/profile-test-kit';

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:photo');
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

// A refused photo is said on the main screen too, not only in the bot (G75, docs/158 Ж).
describe('a refused photo on the main screen', () => {
  it('says why and opens «Profil» for a new photo', () => {
    renderProfile({ profile: { ...profile, avatarStatus: 'rejected', avatarReason: 'face_not_visible' } });
    const note = screen.getByText('Rasmingiz qabul qilinmadi');
    expect(note.closest('.home-note')?.textContent).toContain('Yuz aniq koʻrinmaydi');
    fireEvent.click(note);
    expect(screen.getByText('Maʼlumotlarimni oʻchirish')).toBeTruthy();
  });

  it('says nothing while the photo is fine', () => {
    renderProfile();
    expect(screen.queryByText('Rasmingiz qabul qilinmadi')).toBeNull();
  });
});
