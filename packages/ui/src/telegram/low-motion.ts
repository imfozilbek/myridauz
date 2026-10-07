// Telegram for Android ends its user agent with the class of the phone: LOW, AVERAGE or HIGH.
const WEAK_ANDROID = /Telegram-Android\/\S+ \([^)]*;\s*LOW\)/u;
const REDUCED = '(prefers-reduced-motion: reduce)';

// Fewer animations (G43): a weak Android draws them in jerks, and some people turn motion off.
// The styles read data-motion="low" from the page: one mark at the start, before the first screen.
// A very old WebView has no matchMedia: the class of the phone alone decides there.
export function markLowMotion(userAgent = navigator.userAgent): void {
  const reduced = typeof window.matchMedia === 'function' && window.matchMedia(REDUCED).matches;
  if (WEAK_ANDROID.test(userAgent) || reduced) document.documentElement.dataset['motion'] = 'low';
}

// The mark of the start, for code that moves things itself (the map).
export const motionIsLow = (): boolean => document.documentElement.dataset['motion'] === 'low';
