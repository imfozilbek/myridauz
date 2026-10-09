import { teamRole } from '../modules/team';
import { isFaceButton } from '../modules/users';
import { answerQuery as answer, type BotContext } from './bot-context';
import { onFaceButton } from './face-callbacks';
import { HISTORY_DATA, REPLY_DATA } from './support-card';
import { onHistoryButton, onReplyButton } from './support-reply';
import { onTeamButton } from './team-bot';
import type { BotCallback } from './telegram-update';

// The buttons of the admin bot: the team list, the support answer and history, the card of a new
// face photo (G51). Driver applications are decided in the admin app only (G68, docs/122): an old
// card of an application only stops its spinner.
export async function onAdminCallback(context: BotContext, query: BotCallback) {
  const token = context.env.ADMIN_BOT_TOKEN;
  const data = query.data ?? '';
  if (!token || (await teamRole(context.env, query.from.id)) === null) return answer(query);
  if (data.startsWith('team:')) return onTeamButton(context, query, data);
  if (data === REPLY_DATA) return onReplyButton(context, query);
  if (data === HISTORY_DATA) return onHistoryButton(context, query);
  if (isFaceButton(data)) return onFaceButton(context, query, token);
  return answer(query);
}
