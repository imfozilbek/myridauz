import { type BrandConfig } from '@platform/brands';
import { LEGAL_DOCUMENTS } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { botAppUrl } from '../shared/telegram/open-button';

const { t } = createI18n(DEFAULT_LOCALE);
export const DOCUMENTS_COMMAND = '/hujjatlar';

// "/hujjatlar": the three documents, each opens in the Mini App before any registration (docs/30).
export function documentsReply(brand: BrandConfig, role: 'passenger' | 'driver' | 'main', chatId: number) {
  const rows = LEGAL_DOCUMENTS.map((document) => [
    {
      text: t(`legal.${document}.title`),
      web_app: { url: botAppUrl(brand, role, 'doc', { doc: document }) },
    },
  ]);
  return {
    method: 'sendMessage',
    chat_id: chatId,
    text: t('bot.documents', { brand: brand.name }),
    reply_markup: { inline_keyboard: rows },
  };
}

// The menu of the passenger and the driver bots (setMyCommands).
export const botCommands = () => [
  { command: 'start', description: t('bot.commands.start') },
  { command: DOCUMENTS_COMMAND.slice(1), description: t('bot.commands.documents') },
];
