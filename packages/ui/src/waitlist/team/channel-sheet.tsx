import { Fragment } from 'react';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { Icon } from '../../icons';
import { ManageGroup, ManageRow } from '../../manage/manage-page';
import { useDirectory } from '../../places/use-directory';
import { FormSheet } from '../../sheet/form-sheet';
import { useAdWords } from './ad-words';

type Props = {
  readonly open: boolean;
  readonly chosen: string | null;
  readonly onPick: (chat: string) => void;
  readonly onClose: () => void;
};
const TICK = 20;
const REGION_LENGTH = 4;

// «Qaysi kanalga?» (docs/184, mockup 7-team-ad-links screen 6): the main channel of the brand, then the
// channels of the directions by region (docs/176); the link is an invite link of the chosen one.
export function ChannelSheet({ open, chosen, onPick, onClose }: Props) {
  const { t } = useI18n();
  const brand = useBrand();
  const words = useAdWords();
  const [places] = useDirectory();
  const main = `@${brand.mainChannel}`;
  const tick = (chat: string) => (chat === chosen ? <Icon name="selected" size={TICK} /> : undefined);
  const regions = [
    ...new Set(brand.channels.map((channel) => channel.places[0]?.slice(0, REGION_LENGTH) ?? '')),
  ];
  const regionName = (id: string) =>
    places.status === 'ready' ? (places.directory.find(id)?.name ?? id) : id;
  return (
    <FormSheet open={open} grouped title={t('ads.channelAsk')} hint={t('ads.channelHint')} onClose={onClose}>
      <ManageGroup title={t('channels.fixed')}>
        <ManageRow
          icon="channel"
          title={words.channelName(main)}
          hint={t('waitlist.channels.mainHint')}
          value={tick(main)}
          onClick={() => onPick(main)}
          arrow={false}
        />
      </ManageGroup>
      <h2 className="wl-head">{t('ads.zones')}</h2>
      {regions.map((region) => (
        <Fragment key={region}>
          <ManageGroup title={regionName(region)}>
            {brand.channels
              .filter((channel) => channel.places[0]?.startsWith(region))
              .map((channel) => (
                <ManageRow
                  key={channel.chat}
                  icon="channel"
                  title={words.channelName(channel.chat)}
                  value={tick(channel.chat)}
                  onClick={() => onPick(channel.chat)}
                  arrow={false}
                />
              ))}
          </ManageGroup>
        </Fragment>
      ))}
    </FormSheet>
  );
}
