import { useState } from 'react';
import { MyChannelsScreen } from '../../channels/my-channels-screen';
import { useScreenView } from '../../context/analytics-context';
import { useApiClients } from '../../context/api-clients';
import { useBrand } from '../../context/brand-context';
import { useLoad } from '../../market/use-list';
import { Screen } from '../../screen/screen';
import { useScreenBackground } from '../../telegram/screen-background';
import { brandVars } from '../../theme/brand-vars';
import { useAccount } from '../account-context';
import { DeleteAccountScreen } from './delete-account';
import { DocumentsScreen } from './documents-screen';
import { LookScreen } from './look-screen';
import { MyReviewsScreen } from './my-reviews-screen';
import { ProfileRows, type ProfileOpen } from './profile-rows';
import { ProfileStats } from './profile-stats';
import { ProfileTop } from './profile-top';
import './profile.css';
import './profile-parts.css';

// «Profil» of a passenger and of a driver (G65, mockup g65/3): the face and how the other side sees
// the person, three numbers, the rows. The phone is shown only here, to its owner (docs/07).
export function ProfileScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenView('profile');
  useScreenBackground();
  const account = useAccount();
  const { comfort } = useApiClients();
  const { colors } = useBrand().theme;
  const { value: standing } = useLoad(() => comfort.standing(), 'profile.standing');
  const [open, setOpen] = useState<ProfileOpen | 'look' | null>(null);
  if (!account) return null;
  const back = () => setOpen(null);
  const { profile } = account;
  if (open === 'look')
    return <LookScreen rating={standing?.rating ?? { average: profile.rating, count: 0 }} onBack={back} />;
  if (open === 'reviews') return <MyReviewsScreen userId={profile.id} onBack={back} />;
  if (open === 'channels') return <MyChannelsScreen onBack={back} />;
  if (open === 'documents') return <DocumentsScreen onBack={back} />;
  if (open === 'delete') return <DeleteAccountScreen client={account.client} onBack={back} />;
  return (
    <div className="profile profile-page" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <ProfileTop onLook={() => setOpen('look')} />
      <ProfileStats standing={standing} />
      <ProfileRows standing={standing} onOpen={setOpen} />
    </div>
  );
}
