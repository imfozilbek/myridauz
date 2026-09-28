// Compares secrets in constant time, so the answer time does not leak how much of a guess was right.
export function safeEqual(actual: string, expected: string): boolean {
  let difference = actual.length ^ expected.length;
  for (let i = 0; i < expected.length; i += 1)
    difference |= (actual.charCodeAt(i) || 0) ^ expected.charCodeAt(i);
  return difference === 0;
}
