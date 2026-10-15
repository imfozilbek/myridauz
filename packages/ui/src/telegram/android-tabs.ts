// Telegram for Android calls window.__tg__postBackgroundChange() each time a Mini App comes back from
// its tabs (BotWebViewContainer.setContainers), after «Ulashish» too, but defines it only in its own
// browser. The call fails on every Android phone and the browser shows it as «Script error.» (lesson
// 283, docs/112). An empty function lets the call pass: the app sets its colors itself (docs/21).
type Host = { __tg__postBackgroundChange?: () => void };

export function answerBackFromTabs(host: Host = window as unknown as Host): void {
  host.__tg__postBackgroundChange ??= () => undefined;
}
