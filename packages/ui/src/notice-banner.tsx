import { useState } from 'react';
import { Banner, Button } from './components';
import { useI18n } from './context/i18n-context';
import { IconTile, type Tone } from './icon-tile';
import type { IconName } from './icons';

type NoticeBannerProps = {
  readonly icon: IconName;
  readonly tone: Tone;
  readonly title: string;
  readonly text: string;
};

// A note on top of a screen, not a row of its list: the TelegramUI Banner with a labeled «Yopish»
// (an icon always has its words, docs/19, docs/88 L11). Closed for this visit of the screen.
export function NoticeBanner({ icon, tone, title, text }: NoticeBannerProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <Banner type="section" before={<IconTile name={icon} tone={tone} />} header={title} description={text}>
      <Button size="s" mode="plain" onClick={() => setOpen(false)}>
        {t('common.close')}
      </Button>
    </Banner>
  );
}
