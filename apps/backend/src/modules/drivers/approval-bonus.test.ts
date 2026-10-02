import { loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import { emptyApplication } from './domain/application';
import { telegramNotifier } from './infrastructure/telegram-notifier';

const APPROVED = { ...emptyApplication(7, 0), status: 'approved' as const };

// The driver bot names the bonus and until when it lives (docs/89 D4); a driver approved again
// after a new photo got no bonus and hears nothing about it.
describe('the approval message of the driver bot', () => {
  const sent = async (bonus: { amount: number; expiresAt: number } | null) => {
    const texts: string[] = [];
    const notifier = telegramNotifier({
      fetch: async (_url, init) => {
        texts.push((JSON.parse(String(init?.body)) as { text: string }).text);
        return new Response(JSON.stringify({ ok: true, result: {} }));
      },
      brand: loadBrand(),
      adminToken: undefined,
      driverToken: 'token',
      recipients: async () => [],
      photos: {} as never,
      people: {} as never,
    });
    await notifier.decided(APPROVED, null, bonus);
    return texts.join('\n');
  };

  it('names the amount and the last day of the bonus', async () => {
    const text = await sent({ amount: 500_000, expiresAt: Date.parse('2026-11-01T07:00:00Z') });
    expect(text).toMatch(/Sizga 500\s000\ssoʻm bonus berdik\. U 1-noyabrgacha komissiyaga ishlatiladi\./u);
  });

  it('says nothing about a bonus when none was given', async () => {
    expect(await sent(null)).not.toContain('bonus');
  });
});
