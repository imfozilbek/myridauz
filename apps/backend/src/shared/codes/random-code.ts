const CODE_LETTERS = 'abcdefghijklmnopqrstuvwxyz0123456789';

// A random code of small latin letters and digits: the marks of the links (docs/116, docs/184).
export function randomCode(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => CODE_LETTERS[byte % CODE_LETTERS.length]).join('');
}
