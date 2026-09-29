import { Text, Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { Cell, List, Section } from '../../components';
import { useScreenView } from '../../context/analytics-context';
import { useI18n } from '../../context/i18n-context';
import { BackButton } from '../../telegram/back-button';
import { useScreenBackground } from '../../telegram/screen-background';
import { useAccount } from '../account-context';
import { CellValue, formatPhone } from '../cell-value';
import { HistoryEntry } from '../../comfort/comfort-entries';
import { HistoryScreen } from '../../comfort/history-screen';
import { CarCell, WalletCell } from '../../driver/car-cell';
import { WalletScreen } from '../../wallet/wallet-screen';
import { AvatarPicker } from './avatar-picker';
import { ProfilePhoto } from './profile-photo';

// Own profile: photo, name, rating; a driver's car and "Hamyon". The phone is shown only here, to its owner (docs/07).
export function ProfileScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenView('profile');
  useScreenBackground('grouped');
  const account = useAccount();
  const { t } = useI18n();
  const [open, setOpen] = useState<'wallet' | 'history' | null>(null);
  if (!account) return null;
  if (open === 'wallet') return <WalletScreen onBack={() => setOpen(null)} />;
  if (open === 'history') return <HistoryScreen onBack={() => setOpen(null)} />;
  const { profile } = account;
  const rating = profile.rating === null ? t('account.profile.newRating') : String(profile.rating);
  return (
    <div className="profile">
      <BackButton onClick={onBack} />
      <div className="profile-photo">
        <ProfilePhoto userId={profile.id} name={profile.firstName} hasAvatar={profile.hasAvatar} />
        <Title weight="1">{profile.firstName}</Title>
        <AvatarPicker />
        <Text className="step-hint">{t('account.avatar.rules')}</Text>
      </div>
      <List>
        <Section footer={t('account.profile.phoneHint')}>
          <Cell after={<CellValue>{rating}</CellValue>}>{t('account.profile.rating')}</Cell>
          <Cell after={<CellValue>{formatPhone(profile.phone)}</CellValue>}>
            {t('account.profile.phone')}
          </Cell>
        </Section>
        <HistoryEntry onOpen={() => setOpen('history')} />
        <CarCell />
        <WalletCell onOpen={() => setOpen('wallet')} />
      </List>
    </div>
  );
}
