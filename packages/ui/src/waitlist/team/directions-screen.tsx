import { useApiClients } from '../../context/api-clients';
import { useScreenView } from '../../context/analytics-context';
import { useI18n } from '../../context/i18n-context';
import { ManageGroup, ManagePage } from '../../manage/manage-page';
import { useLoad } from '../../market/use-list';
import { ScreenSkeleton } from '../../states/screen-skeleton';
import { DirectionRow } from './waiting-block';

type Props = { readonly onDirection: (region: string) => void; readonly onBack: () => void };

// «Hammasi»: every direction of the list, the most people first (docs/181).
export function DirectionsScreen({ onDirection, onBack }: Props) {
  useScreenView('waitlist_directions');
  const { t } = useI18n();
  const { waitlist } = useApiClients();
  const { value } = useLoad(() => waitlist.overview(), 'waitlist.overview');
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  return (
    <ManagePage
      title={t('waitlistTeam.waiting')}
      hint={t('waitlistTeam.directions', { n: value.directions.length })}
      onBack={onBack}
    >
      <ManageGroup>
        {value.directions.map((row) => (
          <DirectionRow key={row.region} row={row} onOpen={onDirection} />
        ))}
      </ManageGroup>
    </ManagePage>
  );
}
