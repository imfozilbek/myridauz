import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { COMPLAINT, COMPLAINT_DETAIL, KAMOLA, MADINA, renderNavbat } from './navbat-test-kit';

afterEach(cleanup);
URL.createObjectURL = vi.fn(() => 'blob:photo');
URL.revokeObjectURL = vi.fn();

// The cases of «Navbat» other than an application (G75, docs/120, mockup g67/2 screens 4 and 5).
describe('the cases of «Navbat»', () => {
  it('checks a face photo by 3 points and refuses it by the first point not ticked', async () => {
    const decideFace = vi.fn(async () => undefined);
    renderNavbat({ filter: 'face', kind: 'face', id: MADINA.id }, [MADINA], {
      moderation: { facePhoto: async () => new Blob(['x']), decideFace },
    });
    expect(await screen.findByText('Madina · yoʻlovchi')).toBeTruthy();
    expect(screen.getByText('10 daqiqa kutmoqda')).toBeTruthy();
    const face = screen.getByRole('checkbox', { name: 'Yuz aniq koʻrinadi' });
    fireEvent.click(face);
    expect(face.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByText('Mos emas: sababi'));
    expect(await screen.findByText('Rasm nimasi bilan mos emas?')).toBeTruthy();
    fireEvent.click(screen.getByText('Rasmda bitta odam emas'));
    expect(await screen.findByText('Hammasi koʻrildi')).toBeTruthy();
    expect(decideFace).toHaveBeenCalledWith(MADINA.id, { action: 'reject', reason: 'not_one_person' });
  });

  it('shows who, why and the words of a complaint, warns with the main button, blocks for 7 days', async () => {
    const decide = vi.fn(async () => undefined);
    const feedback = { complaint: async () => COMPLAINT_DETAIL, decide };
    renderNavbat({ filter: 'all', kind: 'complaint', id: COMPLAINT.id }, [COMPLAINT], { feedback });
    expect(await screen.findByText('Madina → Jasur (haydovchi)')).toBeTruthy();
    expect(screen.getByText('Kelmadi')).toBeTruthy();
    expect(screen.getByText('Madinaning soʻzi')).toBeTruthy();
    expect(screen.getByText('2 soat oldin')).toBeTruthy();
    expect(screen.getByText('Haydovchiga komissiyani qaytarish')).toBeTruthy();
    fireEvent.click(screen.getByText('Bloklash'));
    vi.stubGlobal('confirm', () => true);
    fireEvent.click(await screen.findByText('7 kun'));
    vi.unstubAllGlobals();
    expect(await screen.findByText('Bloklandi')).toBeTruthy();
    expect(decide).toHaveBeenCalledWith('c1', { action: 'block', days: 7, refund: false });
  });

  it('answers a question of support: the talk, «Blok haqida» and the answer from the bot', async () => {
    const answer = vi.fn(async () => undefined);
    const talk = [
      { author: 'person' as const, name: 'Kamola', kind: 'text' as const, text: 'Nega bloklandim?', at: 1 },
    ];
    renderNavbat({ filter: 'all', kind: 'support', id: KAMOLA.id }, [KAMOLA], {
      team: { support: async () => ({ name: 'Kamola', appeal: true, talk }), answer },
    });
    expect(await screen.findByText('Kamola · murojaat')).toBeTruthy();
    expect(screen.getByText('Blok haqida')).toBeTruthy();
    expect(screen.getByText('Nega bloklandim?')).toBeTruthy();
    expect(screen.queryByText('Javob yuborish')).toBeNull();
    fireEvent.change(screen.getByPlaceholderText('Javobingizni yozing'), {
      target: { value: ' Tekshiramiz ' },
    });
    fireEvent.click(screen.getByText('Javob yuborish'));
    expect(await screen.findByText('Hammasi koʻrildi')).toBeTruthy();
    expect(answer).toHaveBeenCalledWith(KAMOLA.id, 'Tekshiramiz');
    expect(within(document.body).getByText('Javob yuborildi')).toBeTruthy();
  });
});
