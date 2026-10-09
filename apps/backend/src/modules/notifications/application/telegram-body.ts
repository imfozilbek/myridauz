import type { NotificationJob } from './job';

// The Bot API call of a job: a new message, or an edit of the one it names (docs/15, G68).
export const methodOf = (job: NotificationJob) => (job.edit === undefined ? 'sendMessage' : 'editMessageText');

const newOnly = (job: NotificationJob) => ({
  ...(job.silent ? { disable_notification: true } : {}),
  ...(job.replyTo === undefined
    ? {}
    : { reply_parameters: { message_id: job.replyTo, allow_sending_without_reply: true } }),
});

export function bodyOf(job: NotificationJob): object {
  return {
    chat_id: job.chatId,
    text: job.text,
    ...(job.html ? { parse_mode: 'HTML' } : {}),
    ...(job.edit === undefined ? newOnly(job) : { message_id: job.edit }),
    ...(job.markup ? { reply_markup: job.markup } : {}),
    ...(job.preview
      ? { link_preview_options: { url: job.preview, prefer_large_media: true, show_above_text: true } }
      : {}),
  };
}
