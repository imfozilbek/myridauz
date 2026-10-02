// Test helper: the native «Назад» and main button of Telegram, recorded for a test (docs/94).
// A test mocks the SDK with nativeButtons and reads what Telegram would show from native.
type Listener = () => void;
type Params = { readonly isVisible?: boolean };

export const native = {
  back: null as Listener | null,
  backShown: false,
  main: null as Listener | null,
  mainShown: false,
};

const done = <T>(value?: T) => [true, value] as const;
// The newest listener of a button gets the tap; its removal forgets it.
const listen = (slot: 'back' | 'main') => ({
  ifAvailable: (listener: Listener) => {
    native[slot] = listener;
    return done(() => {
      if (native[slot] === listener) native[slot] = null;
    });
  },
});

export const nativeButtons = {
  backButton: {
    show: { ifAvailable: () => done((native.backShown = true)) },
    hide: { ifAvailable: () => done((native.backShown = false)) },
    onClick: listen('back'),
  },
  mainButton: {
    setParams: {
      ifAvailable: ({ isVisible }: Params) => done(isVisible === undefined || (native.mainShown = isVisible)),
    },
    onClick: listen('main'),
  },
};

// A tap on «Назад» in the Telegram header.
export const pressBack = () => native.back?.();
