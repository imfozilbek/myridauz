// Bot messages in HTML (docs/15, G68): names come from people and the directory, so they are escaped.
// Only what Telegram draws: bold, italic, quote, monospace (lesson №137).
export const escapeHtml = (text: string) =>
  text.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;');
export const bold = (text: string) => `<b>${text}</b>`;
export const italic = (text: string) => `<i>${text}</i>`;
export const mono = (text: string) => `<code>${text}</code>`;
export const quote = (lines: readonly string[]) => `<blockquote>${lines.join('\n')}</blockquote>`;
