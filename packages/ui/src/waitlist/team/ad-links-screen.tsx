import type { AdLink } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../../context/api-clients';
import { useScreenView } from '../../context/analytics-context';
import { useI18n } from '../../context/i18n-context';
import { Icon } from '../../icons';
import { ManageGroup, ManageNote, ManagePage, ManageRow } from '../../manage/manage-page';
import { useLoad } from '../../market/use-list';
import { AdDetail } from './ad-detail';
import { AdForm } from './ad-form';
import { AdReady } from './ad-ready';
import { intoTrips, listedOf, useAdWords } from './ad-words';
import { ErrorScreen } from '../../states/error-screen';

type View =
  | { readonly kind: 'list' }
  | { readonly kind: 'new' }
  | { readonly kind: 'ready'; readonly ad: AdLink }
  | { readonly kind: 'one'; readonly code: string };
const ICON = 20;
const ARROW = 16;

// One link in the list: where and when, the terms, what it gave; on the right one person's price.
function AdRow({ ad, onOpen }: { readonly ad: AdLink; readonly onOpen: () => void }) {
  const { t, formatNumber } = useI18n();
  const words = useAdWords();
  const listed = t('ads.listed', { n: formatNumber(listedOf(ad)) });
  const reach =
    ad.target === 'bot'
      ? t('ads.clicked', { n: formatNumber(ad.result.clicked) })
      : t('ads.joined', { n: formatNumber(ad.result.joined) });
  // Into a bot of the trips: who registered by it, the one number the link gives (owner, 17.10.2026).
  const gave = intoTrips(ad)
    ? t('ads.registered', { n: formatNumber(ad.result.registered) })
    : `${reach} · ${listed}`;
  return (
    <button type="button" className="navbat-row manage-row" onClick={onOpen}>
      <span className="navbat-icon">
        <Icon name={ad.target === 'channel' ? 'channel' : 'botFace'} size={ICON} />
      </span>
      <span className="navbat-words">
        <span className="navbat-title">{ad.name}</span>
        <span className="navbat-hint manage-row-hint">
          <span className="ad-lines">{words.where(ad)}</span>
          <span className="ad-lines">{words.terms(ad)}</span>
          <span className="ad-lines">{gave}</span>
        </span>
      </span>
      <span className="manage-value">{words.per(ad.price, listedOf(ad))}</span>
      <Icon name="next" size={ARROW} />
    </button>
  );
}

// «Reklama havolalari» of «Boshqaruv» (docs/184, mockup 7-team-ad-links): a new link and the list.
export function AdLinksScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenView('ads');
  const { t } = useI18n();
  const { waitlist } = useApiClients();
  const { value, failed, error, reload } = useLoad(() => waitlist.adLinks(), 'waitlist.ads');
  const [view, setView] = useState<View>({ kind: 'list' });
  const list = () => (reload(), setView({ kind: 'list' }));
  if (view.kind === 'new') return <AdForm onMade={(ad) => setView({ kind: 'ready', ad })} onBack={list} />;
  if (view.kind === 'ready') return <AdReady ad={view.ad} onBack={list} />;
  if (view.kind === 'one') return <AdDetail code={view.code} onBack={list} />;
  // A failed list is never an empty one (G91 ADM-10).
  if (failed && !value) return <ErrorScreen onRetry={reload} onBack={onBack} error={error} />;
  return (
    <ManagePage title={t('ads.title')} hint={t('ads.hint')} onBack={onBack}>
      <ManageGroup>
        <ManageRow icon="adLink" title={t('ads.new')} onClick={() => setView({ kind: 'new' })} />
      </ManageGroup>
      {value && value.length > 0 ? (
        <>
          <ManageGroup title={t('ads.list')}>
            {value.map((ad) => (
              <AdRow key={ad.code} ad={ad} onOpen={() => setView({ kind: 'one', code: ad.code })} />
            ))}
          </ManageGroup>
          <ManageNote>{t('ads.costNote')}</ManageNote>
        </>
      ) : null}
    </ManagePage>
  );
}
