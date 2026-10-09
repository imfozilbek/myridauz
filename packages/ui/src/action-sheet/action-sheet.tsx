import { SHEET_LINK, SHEET_LINK_VALUE } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { Modal, Snackbar } from '../components';
import { useI18n } from '../context/i18n-context';
import { SheetOverlay } from '../home/sheet-overlay';
import { Icon } from '../icons';
import { forgetLaunchParam, launchParam } from '../telegram/launch-param';
import { useSheetShown } from '../telegram/sheet-shown';
import { ActionCard } from './action-card';
import { pinFirst, putAside, useActionQueue } from './action-queue';

// Long enough to read «Madina tasdiqlandi · 20 000 komissiya» once.
const PLAQUE_MS = 4000;

// The sheet of the open Mini App (docs/122, mockups g68/7, g68/8): the bot calls, the app answers.
// One thing at a time in its order, «1 / 3» while more wait, the next one right after an answer.
// After an answer the sheet closes and a short plaque on top says what happened.
export function ActionSheet() {
  const { t } = useI18n();
  const queue = useActionQueue();
  const [done, setDone] = useState(0);
  const [plaque, setPlaque] = useState<string | null>(null);
  const item = queue[0];
  useSheetShown(item !== undefined);
  // A bot link names its thing: the main screen opens and that sheet comes first.
  useEffect(() => {
    const named = launchParam(SHEET_LINK, SHEET_LINK_VALUE);
    if (named === null) return;
    forgetLaunchParam(SHEET_LINK);
    pinFirst(named);
  }, []);
  useEffect(() => {
    if (!item) setDone(0);
  }, [item]);
  const total = done + queue.length;
  const leave = (key: string) => {
    setDone((count) => count + 1);
    putAside(key);
  };
  return (
    <>
      <Modal
        overlayComponent={<SheetOverlay />}
        open={item !== undefined}
        onOpenChange={(open) => (open || !item ? undefined : leave(item.key))}
      >
        {item ? (
          <ActionCard
            key={item.key}
            item={item}
            counter={total > 1 ? t('sheet.counter', { index: String(done + 1), total: String(total) }) : null}
            laterLabel={t('sheet.later')}
            onDone={(words) => {
              leave(item.key);
              if (words) setPlaque(words);
            }}
            onLater={() => leave(item.key)}
          />
        ) : null}
      </Modal>
      {plaque ? (
        <Snackbar
          className="action-plaque"
          duration={PLAQUE_MS}
          before={<Icon name="selected" size={20} />}
          onClose={() => setPlaque(null)}
        >
          {plaque}
        </Snackbar>
      ) : null}
    </>
  );
}
