import type { BrandConfig } from '@platform/brands';
import {
  helpQuestions,
  helpTopicsFor,
  helpValues,
  type HelpAudience,
  type HelpQuestion,
  type HelpTopic,
} from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { bold, escapeHtml } from '../shared/telegram/html';
import { supportUrl } from './support-link';

const { t, formatMoney } = createI18n(DEFAULT_LOCALE);

// The help in the bots (G97, docs/226): one message changes in place, topic, questions, answer.
// help:topics:<audience>, help:t:<topic>:<audience>, help:q:<topic.question>:<audience>, help:more
// (the support bot only). The audience keeps the topics of the person on «Mavzular» (docs/231).
export const HELP_PREFIX = 'help';
export const HELP_COMMAND = '/yordam';
export type HelpBot = 'passenger' | 'driver' | 'main' | 'support';
type Button = { readonly text: string } & ({ readonly callback_data: string } | { readonly url: string });
export type HelpView = { readonly text: string; readonly rows: readonly (readonly Button[])[] };

const TOPICS_IN_ROW = 2;
const button = (text: string, data: string): Button => ({ text, callback_data: `${HELP_PREFIX}:${data}` });
const valuesOf = (brand: BrandConfig) => helpValues(brand, formatMoney);

// «Boshqa savolim bor»: the support bot waits for the question, the other bots lead there.
const more = (brand: BrandConfig, bot: HelpBot): Button =>
  bot === 'support'
    ? button(t('help.bot.more'), 'more')
    : { text: t('help.bot.more'), url: supportUrl(brand) };

const back = (audience: HelpAudience) => button(t('help.bot.back'), `topics:${audience}`);

function inRows(buttons: readonly Button[]): Button[][] {
  const rows: Button[][] = [];
  for (let start = 0; start < buttons.length; start += TOPICS_IN_ROW)
    rows.push(buttons.slice(start, start + TOPICS_IN_ROW));
  return rows;
}

// The topics of the person two in a row, «Boshqa savolim bor» alone under them. The support bot
// adds «Yordam xizmati» (docs/231).
export function topicRows(brand: BrandConfig, bot: HelpBot, audience: HelpAudience): Button[][] {
  const values = valuesOf(brand);
  const topics = helpTopicsFor(audience, bot === 'support').map((topic) =>
    button(t(`help.bot.topic.${topic}`, values), `t:${topic}:${audience}`),
  );
  return [...inRows(topics), [more(brand, bot)]];
}

export const topicsView = (brand: BrandConfig, bot: HelpBot, audience: HelpAudience): HelpView => ({
  text: escapeHtml(t('help.bot.topics')),
  rows: topicRows(brand, bot, audience),
});

export function questionsView(
  brand: BrandConfig,
  bot: HelpBot,
  topic: HelpTopic,
  audience: HelpAudience,
  approved = false,
): HelpView {
  const values = valuesOf(brand);
  const questions = helpQuestions(topic, approved).map((question) => [
    button(t(`help.${question}.q`, values), `q:${question}:${audience}`),
  ]);
  return {
    text: escapeHtml(t('help.bot.questions', { topic: t(`help.topic.${topic}`, values) })),
    rows: [...questions, [back(audience), more(brand, bot)]],
  };
}

// The answer: the question in bold, the answer under it, back to the topics or to the team.
export function answerView(
  brand: BrandConfig,
  bot: HelpBot,
  question: HelpQuestion,
  audience: HelpAudience,
): HelpView {
  const values = valuesOf(brand);
  return {
    text: `${bold(escapeHtml(t(`help.${question}.q`, values)))}\n\n${escapeHtml(t(`help.${question}.a`, values))}`,
    rows: [[back(audience), more(brand, bot)]],
  };
}
