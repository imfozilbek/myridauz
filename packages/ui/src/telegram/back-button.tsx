import { backButton } from '@telegram-apps/sdk-react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { Button } from '../components';
import { useI18n } from '../context/i18n-context';
import { claimBack, type NativeBack } from '../screen/back-stack';
import { useInTelegram } from './in-telegram-context';

const NATIVE: NativeBack = {
  show: () => void backButton.show.ifAvailable(),
  hide: () => void backButton.hide.ifAvailable(),
  onClick: (listener) => {
    const off = backButton.onClick.ifAvailable(listener);
    return off?.[0] ? off[1] : () => undefined;
  },
};

type Props = { readonly onClick: () => void; readonly overlay?: boolean };

// "Back" is the native button in the Telegram header (docs/21). Outside Telegram a plain button replaces it.
// The latest action is read on the tap, so a new render never hides and shows the button again (docs/94 B1).
// overlay: a camera or a window over the screen, it takes «Назад» first (docs/94 F6, F7).
export function BackButton({ onClick, overlay = false }: Props) {
  const inTelegram = useInTelegram();
  const { t } = useI18n();
  const press = useRef(onClick);
  useLayoutEffect(() => {
    press.current = onClick;
  });
  useEffect(() => (inTelegram ? claimBack({ overlay, press }, NATIVE) : undefined), [inTelegram, overlay]);
  if (inTelegram) return null;
  return (
    <Button mode="plain" size="s" onClick={onClick}>
      {t('common.back')}
    </Button>
  );
}
