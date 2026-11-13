import type { StatsPeriod } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Bindings } from '../../../env';
import { sendTextFile } from '../../../shared/telegram/telegram-api';

const { t } = createI18n(DEFAULT_LOCALE);

// G99 T6 (docs/234): the files for the analyst by the admin bot, the first one with the caption.
export async function sendFilesTo(
  env: Bindings,
  chatId: number,
  files: readonly { readonly name: string; readonly text: string }[],
  period: StatsPeriod,
): Promise<void> {
  const token = env.ADMIN_BOT_TOKEN ?? '';
  const caption = t('bot.stats.pathsFile', { period: t(`stats.period.${period}`) });
  for (const [index, file] of files.entries())
    await sendTextFile((input, init) => fetch(input, init), token, chatId, file, index === 0 ? caption : '');
}
