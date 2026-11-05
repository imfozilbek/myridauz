// Bot messages in HTML (docs/15, G68): names come from people and the directory, so they are escaped.
// Only what Telegram draws: bold, italic, quote, monospace, a custom emoji (lesson №137).
export const escapeHtml = (text: string) =>
  text.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;');
export const bold = (text: string) => `<b>${text}</b>`;
export const italic = (text: string) => `<i>${text}</i>`;
export const mono = (text: string) => `<code>${text}</code>`;
export const quote = (lines: readonly string[]) => `<blockquote>${lines.join('\n')}</blockquote>`;
// A tile of the brand's emoji set; `shown` where a phone cannot draw it (docs/223).
export const customEmoji = (id: string, shown: string) => `<tg-emoji emoji-id="${id}">${shown}</tg-emoji>`;
