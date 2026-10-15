import type { AdLink } from '@platform/contracts';
import { useScreenView } from '../../context/analytics-context';
import { useI18n } from '../../context/i18n-context';
import { ManagePage } from '../../manage/manage-page';
import { MainButton } from '../../telegram/bottom-button';
import { haptic } from '../../telegram/feedback';
import { useAdWords } from './ad-words';

// «Havola tayyor» (docs/184, mockup 7-team-ad-links screens 3 and 7): the link, where it leads, and
// «Havolani nusxalash»; the seller puts it under any content of the ad.
export function AdReady({ ad, onBack }: { readonly ad: AdLink; readonly onBack: () => void }) {
  useScreenView('ads_ready');
  const { t } = useI18n();
  const words = useAdWords();
  const leads =
    ad.target === 'bot' ? t('ads.botLink') : t('ads.channelLink', { channel: words.channelName(ad.channel) });
  return (
    <ManagePage title={t('ads.ready')} hint={`${ad.name} · ${words.target(ad)}`} onBack={onBack}>
      <p className="ad-link-box">{ad.link}</p>
      <p className="ad-hint">
        {leads} {t('ads.readyHint')}
      </p>
      <MainButton
        text={t('ads.copy')}
        onClick={async () => {
          await navigator.clipboard.writeText(ad.link);
          haptic.success();
        }}
      />
    </ManagePage>
  );
}
