import {
  AD_DAYS,
  AD_PIN_HOURS,
  AD_PLACES,
  AD_TOP_HOURS,
  type AdLink,
  type AdLinkInput,
} from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../../context/api-clients';
import { useScreenView } from '../../context/analytics-context';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { ManageGroup, ManagePage, ManageRow } from '../../manage/manage-page';
import { ActionFailure } from '../../states/action-failure';
import { useFailure } from '../../states/use-failure';
import { MainButton } from '../../telegram/bottom-button';
import { useAdWords } from './ad-words';
import { ChannelSheet } from './channel-sheet';
import { OutlineChips } from './outline-chips';

type Props = { readonly onMade: (ad: AdLink) => void; readonly onBack: () => void };
// The terms are picked from the lists of the contract, so a number of the form is one of them.
type Draft = Omit<AdLinkInput, 'days' | 'top' | 'pin'> & {
  readonly days: number | null;
  readonly top: number;
  readonly pin: number;
};
const DIGITS = /\D/gu;

// «Yangi havola» (docs/184, mockup 7-team-ad-links screens 2 and 5): where it leads, where the ad is,
// a name for the statistics, the price if any, and the terms by a tap.
export function AdForm({ onMade, onBack }: Props) {
  useScreenView('ads_new');
  const { t } = useI18n();
  const brand = useBrand();
  const { waitlist } = useApiClients();
  const words = useAdWords();
  const { failure, fail, clear } = useFailure();
  const [input, setInput] = useState<Draft>({
    target: 'bot',
    channel: null,
    place: 'telegram',
    name: '',
    price: null,
    days: 1,
    top: 0,
    pin: 0,
  });
  const [picking, setPicking] = useState(false);
  const set = (patch: Partial<Draft>) => setInput((current) => ({ ...current, ...patch }));
  const hours = (values: readonly number[]) =>
    values.map((id) => ({ id, label: id === 0 ? t('ads.no') : t('ads.hours', { n: id }) }));
  const create = async () => {
    clear();
    try {
      onMade(await waitlist.createAd({ ...input, name: input.name.trim() } as AdLinkInput));
    } catch (caught) {
      fail(caught);
    }
  };
  return (
    <ManagePage title={t('ads.new')} onBack={onBack}>
      <h2 className="wl-head">{t('ads.target')}</h2>
      <OutlineChips
        label={t('ads.target')}
        options={(['bot', 'channel'] as const).map((id) => ({ id, label: t(`ads.target.${id}`) }))}
        value={input.target}
        onChange={(target) => set({ target, channel: target === 'channel' ? `@${brand.mainChannel}` : null })}
      />
      {input.channel ? (
        <ManageGroup>
          <ManageRow
            icon="channel"
            title={words.channelName(input.channel)}
            hint={t('ads.target.channel')}
            onClick={() => setPicking(true)}
          />
        </ManageGroup>
      ) : null}
      <h2 className="wl-head">{t('ads.place')}</h2>
      <OutlineChips
        label={t('ads.place')}
        options={AD_PLACES.map((id) => ({ id, label: t(`ads.place.${id}`) }))}
        value={input.place}
        onChange={(place) => set({ place })}
      />
      <h2 className="wl-head">{t('ads.name')}</h2>
      <input
        className="ad-field"
        aria-label={t('ads.name')}
        placeholder={t('ads.nameHint')}
        value={input.name}
        maxLength={32}
        onChange={(event) => set({ name: event.target.value })}
      />
      <h2 className="wl-head">{t('ads.price')}</h2>
      <input
        className="ad-field"
        aria-label={t('ads.price')}
        inputMode="numeric"
        value={input.price === null ? '' : String(input.price)}
        onChange={(event) => {
          const digits = event.target.value.replace(DIGITS, '');
          set({ price: digits === '' ? null : Number(digits) });
        }}
      />
      <h2 className="wl-head">{t('ads.days')}</h2>
      <OutlineChips
        label={t('ads.days')}
        options={[
          ...AD_DAYS.map((id) => ({ id: id as number | null, label: t('ads.day', { n: id }) })),
          { id: null, label: t('ads.forever') },
        ]}
        value={input.days}
        onChange={(days) => set({ days })}
      />
      <h2 className="wl-head">{t('ads.top')}</h2>
      <OutlineChips
        label={t('ads.top')}
        options={hours(AD_TOP_HOURS)}
        value={input.top}
        onChange={(top) => set({ top })}
      />
      <h2 className="wl-head">{t('ads.pin')}</h2>
      <OutlineChips
        label={t('ads.pin')}
        options={hours(AD_PIN_HOURS)}
        value={input.pin}
        onChange={(pin) => set({ pin })}
      />
      <ActionFailure error={failure} />
      <MainButton text={t('ads.create')} disabled={input.name.trim() === ''} onClick={create} />
      <ChannelSheet
        open={picking}
        chosen={input.channel}
        onPick={(channel) => (set({ channel }), setPicking(false))}
        onClose={() => setPicking(false)}
      />
    </ManagePage>
  );
}
