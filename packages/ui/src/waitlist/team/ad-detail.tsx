import type { AdLink } from '@platform/contracts';
import { useApiClients } from '../../context/api-clients';
import { useScreenView } from '../../context/analytics-context';
import { useI18n } from '../../context/i18n-context';
import { ManageGroup, ManagePage, ManageRow } from '../../manage/manage-page';
import { useLoad } from '../../market/use-list';
import { ScreenSkeleton } from '../../states/screen-skeleton';
import { SecondaryButton } from '../../telegram/bottom-button';
import { haptic } from '../../telegram/feedback';
import { shareOf } from './share';
import { listedOf, useAdWords } from './ad-words';

const PERCENT = 100;
// The share that did not come from the step before: «30% ketdi».
const dropOf = (before: number, after: number) => (before === 0 ? 0 : PERCENT - shareOf(after, before));

// One ad link (docs/184, mockup 7-team-ad-links screens 4 and 8): what it gave step by step, the terms
// and the money, the friends of the people it brought.
export function AdDetail({ code, onBack }: { readonly code: string; readonly onBack: () => void }) {
  useScreenView('ads_detail');
  const { t, formatMoney, formatNumber } = useI18n();
  const { waitlist } = useApiClients();
  const words = useAdWords();
  const { value } = useLoad(() => waitlist.adLink(code));
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  const ad: AdLink = value;
  const { result } = ad;
  const listed = listedOf(ad);
  const step = (title: string, count: number, drop = 0, word = 'stats.left' as const) => (
    <ManageRow
      key={title}
      icon="statistics"
      title={title}
      {...(drop > 0 ? { hint: t(word, { drop }) } : {})}
      value={formatNumber(count)}
    />
  );
  const bot = ad.target === 'bot';
  return (
    <ManagePage title={ad.name} hint={words.where(ad, true)} onBack={onBack}>
      <ManageGroup title={t('ads.gave')}>
        {bot ? (
          <>
            {step(t('ads.pressed'), result.clicked)}
            {step(t('ads.opened'), result.opened, dropOf(result.clicked, result.opened))}
            {step(t('ads.inList'), listed, dropOf(result.opened, listed))}
            <ManageRow title={t('ads.roles', { p: result.passengers, d: result.drivers })} />
          </>
        ) : (
          <>
            {step(t('ads.inChannel'), result.joined)}
            <ManageRow
              icon="statistics"
              title={t('ads.stayed')}
              {...(result.joined > result.stayed
                ? { hint: t('ads.leftShare', { n: dropOf(result.joined, result.stayed) }) }
                : {})}
              value={formatNumber(result.stayed)}
            />
            {step(t('ads.listedAfter'), listed)}
          </>
        )}
      </ManageGroup>
      <ManageGroup title={t('ads.money')}>
        <ManageRow
          icon="price"
          title={t('ads.cost')}
          hint={words.terms(ad)}
          value={ad.price === null ? '' : formatMoney(ad.price)}
        />
        {bot ? null : (
          <ManageRow
            icon="channel"
            title={t('ads.perSubscriber')}
            value={words.per(ad.price, result.joined)}
          />
        )}
        <ManageRow icon="passengers" title={t('ads.perListed')} value={words.per(ad.price, listed)} />
      </ManageGroup>
      <ManageGroup title={t('ads.later')}>
        <ManageRow
          icon="invite"
          title={t('ads.byFriends')}
          hint={t('ads.byFriendsHint')}
          value={formatNumber(result.byFriends)}
        />
        {bot ? (
          <ManageRow icon="channel" title={t('ads.inChannel')} value={formatNumber(result.joined)} />
        ) : null}
      </ManageGroup>
      <SecondaryButton
        text={t('ads.copy')}
        under
        onClick={async () => {
          await navigator.clipboard.writeText(ad.link);
          haptic.success();
        }}
      />
    </ManagePage>
  );
}
