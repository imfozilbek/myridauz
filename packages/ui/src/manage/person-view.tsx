import { formatPlate, type BlockInput, type PersonCard } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { BlockJournal } from '../moderation/block-journal';
import { BlockSheet } from '../moderation/block-sheet';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { DriverWallet } from '../wallet/driver-wallet';
import { ManageGroup, ManagePage, ManageRow } from './manage-page';
import { PersonActivityGroups } from './person-activity';
import { PersonSupport } from './person-support';

type ViewProps = { readonly card: PersonCard; readonly onBack: () => void; readonly onChanged: () => void };

// One person for the owner: since when, the rating, the trips and rides, the complaints, the car,
// the block now, each value on the right (G78 sheet 6); what the person did lately (G45); the history
// and «Blokdan chiqarish»;
// «Bloklash» at the bottom opens the days in a sheet.
export function PersonView({ card, onBack, onChanged }: ViewProps) {
  const { t, formatDate, formatRating } = useI18n();
  const { moderation } = useApiClients();
  const [blocking, setBlocking] = useState(false);
  // The wallet of a driver opens right from the card (G79 К5).
  const [wallet, setWallet] = useState(false);
  const { failure, fail, clear } = useFailure();
  const block = async (days: BlockInput['days']) => {
    clear();
    try {
      await moderation.block(card.id, days);
      haptic.success();
      onChanged();
    } catch (caught) {
      fail(caught);
    }
    setBlocking(false);
  };
  if (wallet)
    return (
      <DriverWallet
        owner={{ driverId: card.id, firstName: card.firstName }}
        onBack={() => setWallet(false)}
      />
    );
  const { rating, car } = card;
  const blocked =
    card.blockedUntil === null
      ? t('moderation.blocks.forever')
      : t('moderation.blocks.until', { date: formatDate(new Date(card.blockedUntil)) });
  return (
    <ManagePage title={card.firstName} hint={card.id} onBack={onBack}>
      <ManageGroup title={t('manage.people')}>
        {card.joinedAt === null ? null : (
          <ManageRow
            icon="day"
            title={t('manage.person.joined')}
            value={formatDate(new Date(card.joinedAt))}
          />
        )}
        <ManageRow
          icon="star"
          title={t('manage.person.rating')}
          value={
            rating.average === null
              ? t('manage.person.noRating')
              : t('manage.person.ratingValue', { average: formatRating(rating.average), count: rating.count })
          }
        />
        <ManageRow
          icon="car"
          title={t('manage.person.trips')}
          value={t('manage.person.tripsValue', { trips: card.trips, rides: card.rides })}
        />
        <ManageRow
          icon="complaints"
          title={t('manage.person.complaints')}
          value={String(card.complaintsAgainst)}
        />
        {car ? (
          <>
            <ManageRow icon="carSide" title={`${car.make} ${car.model}`} value={formatPlate(car.plate)} />
            <ManageRow icon="wallet" title={t('wallet.title')} onClick={() => setWallet(true)} />
          </>
        ) : null}
        <ManageRow
          icon="blocked"
          title={card.blocked ? t('manage.person.blocked') : t('moderation.blocks.notNow')}
          {...(card.blocked ? { value: blocked, danger: true } : {})}
        />
      </ManageGroup>
      <ActionFailure error={failure} />
      <PersonActivityGroups id={card.id} />
      <PersonSupport id={card.id} />
      <BlockJournal userId={card.id} />
      {card.blocked ? null : (
        <MainButton text={t('moderation.block')} destructive onClick={() => setBlocking(true)} />
      )}
      <BlockSheet open={blocking} onClose={() => setBlocking(false)} onBlock={block} />
    </ManagePage>
  );
}
