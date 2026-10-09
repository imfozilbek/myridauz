import type { BrandConfig } from '@platform/brands';
import { OPEN_LINK, WALLET_SECTION, type Wallet } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Card, Ring } from '../../notifications';
import { bold, italic } from '../../../shared/telegram/html';
import { appButton } from '../../../shared/telegram/open-button';
import type { WalletNews } from '../application/ports';

const { t, formatDate, formatMoney, formatTime } = createI18n(DEFAULT_LOCALE);

const walletCardKey = (driverId: number) => `wallet:${driverId}`;

// The wallet of a driver in one card of the driver bot (G68, docs/122): the bonus with its last
// day, the main money, how many seats it still confirms, and «Hamyonni ochish».
export function walletCard(brand: BrandConfig, driverId: number, wallet: Wallet, now: number): Card {
  const ends = wallet.bonusExpiresAt;
  const bonus = {
    amount: bold(formatMoney(wallet.bonus)),
    date: ends === null ? '' : formatDate(new Date(ends)),
  };
  const text = [
    bold(t('bot.dwallet.title')),
    ...(wallet.bonus > 0 ? [t('bot.dwallet.bonus', bonus)] : []),
    t('bot.dwallet.main', { amount: bold(formatMoney(wallet.main)) }),
    ...(wallet.seatsLeft === null ? [] : [t('bot.dwallet.seats', { count: String(wallet.seatsLeft) })]),
  ].join('\n');
  const open = appButton(brand, 'driver', t('bot.dwallet.open'), { name: OPEN_LINK, id: WALLET_SECTION });
  return {
    bot: 'driver',
    chatId: driverId,
    key: walletCardKey(driverId),
    text,
    footer: italic(t('bot.card.updated', { time: formatTime(new Date(now)) })),
    markup: { inline_keyboard: [[open]] },
  };
}

function newsText(wallet: Wallet, news: WalletNews): string {
  if (news === 'bonusEnds') {
    const date = formatDate(new Date(wallet.bonusExpiresAt ?? 0));
    return t('bot.dwallet.bonusEnds', { date, amount: formatMoney(wallet.bonus) });
  }
  const count = wallet.seatsLeft ?? 0;
  return count > 0 ? t('bot.dwallet.fewSeats', { count: String(count) }) : t('bot.dwallet.empty');
}

// The news rings under the card: it says itself what happened, the lock screen shows only it.
export const walletRing = (driverId: number, wallet: Wallet, news: WalletNews, quiet: boolean): Ring => ({
  bot: 'driver',
  chatId: driverId,
  text: newsText(wallet, news),
  card: walletCardKey(driverId),
  quiet,
});
