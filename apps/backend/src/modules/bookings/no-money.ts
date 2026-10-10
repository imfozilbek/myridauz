import { OPEN_LINK, WALLET_SECTION } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Bindings } from '../../env';
import { brandOf } from '../../shared/brand/brand-of';
import { appButton } from '../../shared/telegram/open-button';
import { notify } from '../notifications';
import { walletShortage } from '../wallet';

const { t, formatMoney } = createI18n(DEFAULT_LOCALE);

// «Qabul qilish» in the bot without money for the commission (G75, docs/158 Г): the short notice
// says why, this message how much is missing, with «Hamyon» to top it up.
export async function tellNoMoney(env: Bindings, driverId: number, commission: number): Promise<void> {
  const missing = await walletShortage(env, driverId, commission);
  if (missing === 0) return;
  const button = appButton(brandOf(env), 'driver', t('bot.dwallet.open'), {
    name: OPEN_LINK,
    id: WALLET_SECTION,
  });
  await notify(env, [
    {
      bot: 'driver',
      chatId: driverId,
      text: t('bot.ask.noMoneyLeft', { amount: formatMoney(missing) }),
      markup: { inline_keyboard: [[button]] },
    },
  ]);
}
