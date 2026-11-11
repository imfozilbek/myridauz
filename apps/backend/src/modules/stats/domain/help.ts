import { helpQuestionOf, type HelpCount } from '@platform/contracts';
import type { Counter } from './counters';

// G97 (docs/226): the questions of the help opened in the Mini Apps and the bots, and «Boshqa savolim
// bor» after one of them; the topics are only the way to a question and are not counted.
export const HELP_OPEN = 'help_open';
export const HELP_MORE = 'help_more';
const TOP_QUESTIONS = 10;

export function helpOf(counters: readonly Counter[]): HelpCount[] {
  const byCode = new Map<string, { code: string; opened: number; more: number }>();
  for (const row of counters) {
    const question = helpQuestionOf(row.code);
    if (!question || (row.name !== HELP_OPEN && row.name !== HELP_MORE)) continue;
    const one = byCode.get(question) ?? { code: question, opened: 0, more: 0 };
    if (row.name === HELP_OPEN) one.opened += row.events;
    else one.more += row.events;
    byCode.set(question, one);
  }
  return [...byCode.values()].sort((a, b) => b.opened - a.opened).slice(0, TOP_QUESTIONS);
}
