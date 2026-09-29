import { describe, expect, it } from 'vitest';
import { MASK, maskContacts } from './domain/mask';

// docs/07: contacts never pass through the chat, in any form.
const CONTACTS = [
  // Phones in digits.
  '901234567',
  '+998901234567',
  '998901234567',
  '+998 90 123 45 67',
  '90 123 45 67',
  '90-123-45-67',
  '(90) 123-45-67',
  '+998 (90) 123-45-67',
  '90.123.45.67',
  '9 0 1 2 3 4 5 6 7',
  '901 234 567',
  '1234567',
  '123-45-67',
  '+7 999 123 45 67',
  '8 999 123-45-67',
  // Phones in words, Uzbek and Russian.
  'toʻqson bir ikki uch toʻrt besh olti yetti',
  "to'qson bir ikki uch to'rt besh olti",
  'toqson bir ikki uch tort besh olti',
  'тўқсон бир икки уч тўрт беш олти',
  'девять ноль один два три четыре пять шесть семь',
  'девяносто один два три четыре пять шесть',
  '90 bir ikki uch toʻrt besh olti',
  'nol nol bir ikki uch toʻrt besh',
  // Usernames and links.
  '@ali_driver',
  '@Dilnoza1990',
  'ali@mail.uz',
  't.me/ali_driver',
  'https://t.me/ali_driver',
  't . me/ali',
  'telegram.me/ali',
  'wa.me/998901234567',
  'https://instagram.com/ali',
  'instagram.com/ali.uz',
  'www.facebook.com/ali',
  'vk.com/ali',
  'https://example.uz/contact',
];

describe('masking contacts in the chat (docs/07)', () => {
  it.each(CONTACTS)('hides %s', (contact) => {
    const result = maskContacts(`Menga yozing: ${contact} kutaman`);
    expect(result.masked).toBe(true);
    expect(result.text).toContain(MASK);
    expect(result.text).not.toMatch(/\d{5}/u);
    expect(result.text.startsWith('Menga yozing: ')).toBe(true);
  });

  it('hides several contacts in one message', () => {
    const { text } = maskContacts('Raqam 901234567, telegram @ali_driver');
    expect(text).toBe(`Raqam ${MASK}, telegram ${MASK}`);
  });

  it.each([
    'Narxi 90 000 soʻm',
    'Jami 1 500 000 soʻm boʻladi',
    '150000 soʻm',
    'Ikki kishi, 180 000',
    'Sana 02.10.2026, soat 08:30',
    '02.10.2026 08:30 da chiqamiz',
    '2026-10-02 kuni',
    'Soat 7:45 da, 3 ta joy',
    'Bir joy qoldi, ikki kishi boramiz',
    'Uch soatda yetib boramiz',
    'Mashina raqami 01 A 123 BC',
    'Salom! Qachon chiqasiz?',
    '30 km qoldi',
  ])('keeps "%s" as it is', (text) => {
    expect(maskContacts(text)).toEqual({ text, masked: false });
  });
});
