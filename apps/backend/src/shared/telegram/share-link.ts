// Telegram's window «send to a chat» for a link and its words (t.me/share/url): a bot or a channel
// button, and an old Telegram without shareMessage (G88, docs/193).
export const shareLink = (url: string, text: string) =>
  `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
