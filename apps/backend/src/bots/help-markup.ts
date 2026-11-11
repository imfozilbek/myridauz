import type { BrandConfig } from '@platform/brands';
import {
  helpQuestions,
  helpTopicsFor,
  helpValues,
  type HelpQuestion,
  type HelpTopic,
} from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { bold, escapeHtml } from '../shared/telegram/html';
import { supportUrl } from './support-link';

const { t, formatMoney } = createI18n(DEFAULT_LOCALE);

// The help in the bots (G97, docs/226): one message changes in place, topic, questions, answer.
// help:topics, help:t:<topic>, help:q:<topic.question>, help:more (the support bot only).
export const HELP_PREFIX = 'help';
export const HELP_COMMAND = '/yordam';
export type HelpBot = 'passenger' | 'driver' | 'main' | 'support';
type Button = { readonly text: string } & ({ readonly callback_data: string } | { readonly url: string });
export type HelpView = { readonly text: string; readonly rows: readonly (readonly Button[])[] };

const TOPICS_IN_ROW = 2;
const button = (text: string, data: string): Button => ({ text, callback_data: `${HELP_PREFIX}:${data}` });

// «Boshqa savolim bor»: the support bot waits for the question, the other bots lead there.
const more = (brand: BrandConfig, bot: HelpBot): Button =>
  bot === 'support'
    ? button(t('help.bot.more'), 'more')
    : { text: t('help.bot.more'), url: supportUrl(brand) };

const appOf = (bot: HelpBot) => (bot === 'driver' || bot === 'passenger' ? bot : 'other');

function inRows(buttons: readonly Button[]): Button[][] {
  const rows: Button[][] = [];
  for (let start = 0; start < buttons.length; start += TOPICS_IN_ROW)
    rows.push(buttons.slice(start, start + TOPICS_IN_ROW));
  return rows;
}

// The topics two in a row, «Boshqa savolim bor» alone under them.
export function topicRows(brand: BrandConfig, bot: HelpBot): Button[][] {
  const topics = helpTopicsFor(appOf(bot)).map((topic) => button(t(`help.bot.topic.${topic}`), `t:${topic}`));
  return [...inRows(topics), [more(brand, bot)]];
}

export const topicsView = (brand: BrandConfig, bot: HelpBot): HelpView => ({
  text: escapeHtml(t('help.bot.topics')),
  rows: topicRows(brand, bot),
});

export function questionsView(brand: BrandConfig, bot: HelpBot, topic: HelpTopic): HelpView {
  const values = helpValues(brand, formatMoney);
  const questions = helpQuestions(topic).map((question) => [
    button(t(`help.${question}.q`, values), `q:${question}`),
  ]);
  return {
    text: escapeHtml(t('help.bot.questions', { topic: t(`help.topic.${topic}`) })),
    rows: [...questions, [button(t('help.bot.back'), 'topics'), more(brand, bot)]],
  };
}

// The answer: the question in bold, the answer under it, back to the topics or to the team.
export function answerView(brand: BrandConfig, bot: HelpBot, question: HelpQuestion): HelpView {
  const values = helpValues(brand, formatMoney);
  return {
    text: `${bold(escapeHtml(t(`help.${question}.q`, values)))}\n\n${escapeHtml(t(`help.${question}.a`, values))}`,
    rows: [[button(t('help.bot.back'), 'topics'), more(brand, bot)]],
  };
}
