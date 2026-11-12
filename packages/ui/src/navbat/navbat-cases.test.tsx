import { toCyrillic } from '@platform/i18n';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sheetClosed } from '../home/sheet-closed';
import { COMPLAINT, COMPLAINT_DETAIL, KAMOLA, MADINA, renderNavbat } from './navbat-test-kit';

afterEach(cleanup);
URL.createObjectURL = vi.fn(() => 'blob:photo');
URL.revokeObjectURL = vi.fn();

// The cases of «Navbat» other than an application (G75, docs/120, mockup g67/2 screens 4 and 5).
describe('the cases of «Navbat»', () => {
  // «Mos emas» at each point refuses the photo for that point in one tap (G78 К1).
  it('checks a face photo by 3 points and refuses it by the «Mos emas» of one', async () => {
    const decideFace = vi.fn(async () => undefined);
    renderNavbat({ filter: 'face', kind: 'face', id: MADINA.id }, [MADINA], {
      moderation: { facePhoto: async () => new Blob(['x']), decideFace },
    });
    expect(await screen.findByText(`Madina · ${toCyrillic('yoʻlovchi')}`)).toBeTruthy();
    expect(screen.getByText(toCyrillic('10 daqiqa kutmoqda'))).toBeTruthy();
    const face = screen.getByRole('checkbox', { name: toCyrillic('Yuz aniq koʻrinadi') });
    fireEvent.click(face);
    expect(face.getAttribute('aria-checked')).toBe('true');
    expect(screen.getAllByText(toCyrillic('Mos emas'))).toHaveLength(3);
    const one = screen.getByRole('group', { name: toCyrillic('Bitta odam') });
    fireEvent.click(within(one).getByText(toCyrillic('Mos emas')));
    expect(await screen.findByText(toCyrillic('Hammasi koʻrildi'))).toBeTruthy();
    // The photo of the case is the one decided (G89 M8).
    expect(decideFace).toHaveBeenCalledWith(MADINA.id, {
      action: 'reject',
      reason: 'not_one_person',
      at: MADINA.since,
    });
  });

  // Owner, 17.10.2026: the team sees who the person is in Telegram; the public name opens the profile.
  it('shows the Telegram account of the person in the check of a face', async () => {
    const profileLink = 'https://t.me/passenger_bot?start=profile_1';
    const telegramAccount = vi.fn(async () => ({ username: 'madina_uz', profileLink }));
    renderNavbat({ filter: 'face', kind: 'face', id: MADINA.id }, [MADINA], {
      moderation: { facePhoto: async () => new Blob(['x']), telegramAccount },
    });
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    fireEvent.click(await screen.findByText('Telegram: @madina_uz'));
    expect(open.mock.calls[0]?.[0]).toBe('https://t.me/madina_uz');
    open.mockRestore();
    expect(telegramAccount).toHaveBeenCalledWith(MADINA.id);
  });

  // Owner, 18.10.2026: without a public name the profile opens through the bot the person knows.
  it('opens the profile of a person without a public name through their bot', async () => {
    const profileLink = 'https://t.me/passenger_bot?start=profile_1';
    const telegramAccount = vi.fn(async () => ({ username: null, profileLink }));
    renderNavbat({ filter: 'face', kind: 'face', id: MADINA.id }, [MADINA], {
      moderation: { facePhoto: async () => new Blob(['x']), telegramAccount },
    });
    expect(await screen.findByText(toCyrillic('Telegram: username yoʻq'))).toBeTruthy();
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    fireEvent.click(screen.getByText(toCyrillic('Profilni ochish')));
    expect(open.mock.calls[0]?.[0]).toBe(profileLink);
    open.mockRestore();
  });

  it('shows who, why and the words of a complaint, warns with the main button, blocks for 7 days', async () => {
    const decide = vi.fn(async () => undefined);
    const feedback = { complaint: async () => COMPLAINT_DETAIL, decide };
    renderNavbat({ filter: 'all', kind: 'complaint', id: COMPLAINT.id }, [COMPLAINT], { feedback });
    expect(await screen.findByText(`Madina → Jasur (${toCyrillic('haydovchi')})`)).toBeTruthy();
    expect(screen.getByText(toCyrillic('Kelmadi'))).toBeTruthy();
    expect(screen.getByText(`Madinaning ${toCyrillic('soʻzi')}`)).toBeTruthy();
    expect(screen.getByText(toCyrillic('2 soat oldin'))).toBeTruthy();
    // A passenger's «Kelmadi» about the driver: no commission of the driver to give back (G89 A11).
    expect(screen.queryByText(toCyrillic('Haydovchiga komissiyani qaytarish'))).toBeNull();
    fireEvent.click(screen.getByText(toCyrillic('Bloklash')));
    vi.stubGlobal('confirm', () => true);
    fireEvent.click(await screen.findByText(toCyrillic('7 kun')));
    vi.unstubAllGlobals();
    expect(await screen.findByText(toCyrillic('Bloklandi'))).toBeTruthy();
    expect(decide).toHaveBeenCalledWith('c1', { action: 'block', days: 7, refund: false });
    await sheetClosed();
  });

  it('answers a question of support: the talk, «Blok haqida» and the answer from the bot', async () => {
    const answer = vi.fn(async () => undefined);
    const talk = [
      { author: 'person' as const, name: 'Kamola', kind: 'text' as const, text: 'Nega bloklandim?', at: 1 },
    ];
    renderNavbat({ filter: 'all', kind: 'support', id: KAMOLA.id }, [KAMOLA], {
      team: { support: async () => ({ name: 'Kamola', appeal: true, talk }), answer },
    });
    expect(await screen.findByText(`Kamola · ${toCyrillic('murojaat')}`)).toBeTruthy();
    expect(screen.getByText(toCyrillic('Blok haqida'))).toBeTruthy();
    expect(screen.getByText('Nega bloklandim?')).toBeTruthy();
    expect(screen.queryByText(toCyrillic('Javob yuborish'))).toBeNull();
    fireEvent.change(screen.getByPlaceholderText(toCyrillic('Javobingizni yozing')), {
      target: { value: ' Tekshiramiz ' },
    });
    fireEvent.click(screen.getByText(toCyrillic('Javob yuborish')));
    expect(await screen.findByText(toCyrillic('Hammasi koʻrildi'))).toBeTruthy();
    expect(answer).toHaveBeenCalledWith(KAMOLA.id, 'Tekshiramiz');
    expect(within(document.body).getByText(toCyrillic('Javob yuborildi'))).toBeTruthy();
  });
});
