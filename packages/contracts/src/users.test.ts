import { describe, expect, it } from 'vitest';
import { authHeaders } from './auth';
import { nameSchema, publicProfileSchema, registrationSchema, userAvatarPath } from './users';

describe('nameSchema', () => {
  it('accepts Uzbek names and tidies spaces', () => {
    expect(nameSchema.parse('  Gʻulom  ')).toBe('Gʻulom');
    expect(nameSchema.parse('Oʻlmas  Ali-Bek')).toBe('Oʻlmas Ali-Bek');
    expect(nameSchema.parse('Дилноза')).toBe('Дилноза');
  });

  it('rejects contacts hidden in a name (docs/07)', () => {
    for (const value of ['Ali 998901234567', '@ali', 'Ali t.me/ali', 'A', 'x'.repeat(33)]) {
      expect(nameSchema.safeParse(value).success).toBe(false);
    }
  });
});

describe('registrationSchema', () => {
  const input = { consent: true, firstName: 'Ali', gender: 'male', contact: 'contact=%7B%7D&hash=1' };

  it('needs consent', () => {
    expect(registrationSchema.safeParse(input).success).toBe(true);
    expect(registrationSchema.safeParse({ ...input, consent: false }).success).toBe(false);
  });

  it('accepts only known genders', () => {
    expect(registrationSchema.safeParse({ ...input, gender: 'other' }).success).toBe(false);
  });
});

describe('publicProfileSchema', () => {
  it('never carries a phone or a username', () => {
    const profile = { id: 1, firstName: 'Ali', hasAvatar: false, rating: null };
    expect(publicProfileSchema.parse(profile)).toEqual(profile);
    expect(publicProfileSchema.safeParse({ ...profile, phone: '+998' }).success).toBe(false);
    expect(publicProfileSchema.safeParse({ ...profile, username: 'ali' }).success).toBe(false);
  });
});

describe('paths and headers', () => {
  it('builds the avatar path and the auth headers', () => {
    expect(userAvatarPath(7)).toBe('/users/7/avatar');
    expect(authHeaders('driver', 'a=1')).toEqual({ authorization: 'tma a=1', 'x-mini-app': 'driver' });
  });
});
