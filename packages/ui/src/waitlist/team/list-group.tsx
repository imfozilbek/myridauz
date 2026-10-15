import { useState } from 'react';
import { useApiClients } from '../../context/api-clients';
import { useI18n } from '../../context/i18n-context';
import { useWhen } from '../../home/home-when';
import { ManageGroup, ManageNote, ManageRow } from '../../manage/manage-page';
import { useLoad } from '../../market/use-list';
import { FormSheet } from '../../sheet/form-sheet';
import { Switch } from '../../switch';
import { MainButton, SecondaryButton } from '../../telegram/bottom-button';

// «Kutish roʻyxati» on top of «Boshqaruv» (docs/181, mockup 8-team-switch): the switch of the list,
// asked again in a sheet, and the links of the ads (docs/184).
export function ListGroup({ onAds }: { readonly onAds: () => void }) {
  const { t, formatNumber } = useI18n();
  const { waitlist } = useApiClients();
  const when = useWhen(Date.now());
  const state = useLoad(() => waitlist.switchState(), 'waitlist.switch');
  const overview = useLoad(() => waitlist.overview(), 'waitlist.overview');
  const [asking, setAsking] = useState(false);
  const value = state.value;
  if (!value) return null;
  const waiting = (overview.value?.passengers ?? 0) + (overview.value?.drivers ?? 0);
  const since = value.at === null ? '' : when(value.at);
  const change = async () => {
    await waitlist.setSwitch(!value.open);
    setAsking(false);
    state.reload();
  };
  return (
    <>
      <ManageGroup title={t('waitlistTeam.group')}>
        <ManageRow
          icon="onOff"
          title={t('waitlistTeam.switch')}
          hint={
            value.open
              ? t('waitlistTeam.switchOn')
              : t('waitlistTeam.switchOff', {
                  time: `${since.charAt(0).toLocaleLowerCase()}${since.slice(1)}`,
                })
          }
          value={
            <Switch
              checked={value.open}
              aria-label={t('waitlistTeam.switch')}
              onChange={() => setAsking(true)}
            />
          }
        />
        <ManageRow
          icon="adLink"
          title={t('ads.title')}
          hint={t('waitlistTeam.links', { n: value.links })}
          onClick={onAds}
        />
      </ManageGroup>
      <FormSheet
        open={asking}
        grouped
        title={t(value.open ? 'waitlistTeam.closeAsk' : 'waitlistTeam.openListAsk')}
        hint={t(value.open ? 'waitlistTeam.closeHint' : 'waitlistTeam.openListHint')}
        onClose={() => setAsking(false)}
      >
        {value.open ? (
          <ManageNote>{t('waitlistTeam.closeWaiting', { n: formatNumber(waiting) })}</ManageNote>
        ) : null}
        <MainButton
          text={t(value.open ? 'waitlistTeam.closeYes' : 'waitlistTeam.openYes')}
          onClick={change}
        />
        <SecondaryButton text={t('waitlistTeam.cancel')} onClick={() => setAsking(false)} under />
      </FormSheet>
    </>
  );
}
