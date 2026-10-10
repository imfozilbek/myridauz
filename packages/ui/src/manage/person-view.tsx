import { BLOCK_DAYS, formatPlate, type BlockInput, type PersonCard } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ChoiceStep } from '../driver/steps/choice-step';
import { allowBlock } from '../moderation/ask-block';
import { BlockJournal } from '../moderation/block-journal';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { haptic } from '../telegram/feedback';
import { ManageGroup, ManagePage, ManageRow } from './manage-page';

type ViewProps = { readonly card: PersonCard; readonly onBack: () => void; readonly onChanged: () => void };

// One person for the owner: since when, the rating, the trips and rides, the complaints, the car,
// the block now; «Bloklash» for 1, 7, 30 days or for good, the history and «Blokdan chiqarish».
export function PersonView({ card, onBack, onChanged }: ViewProps) {
  const { t, formatDate, formatRating } = useI18n();
  const { moderation } = useApiClients();
  const [blocking, setBlocking] = useState(false);
  const { failure, fail, clear } = useFailure();
  const block = async (days: BlockInput['days']) => {
    if (!(await allowBlock(days ?? null, t))) return;
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
  if (blocking)
    return (
      <ChoiceStep
        screen="manage.block"
        icon="blocked"
        title={t('moderation.block.title')}
        choices={[
          ...BLOCK_DAYS.map((value) => ({
            value,
            label: t('moderation.block.days', { days: String(value) }),
          })),
          { value: null, label: t('moderation.block.forever') },
        ]}
        onBack={() => setBlocking(false)}
        onDone={block}
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
            hint={formatDate(new Date(card.joinedAt))}
          />
        )}
        <ManageRow
          icon="star"
          title={t('manage.person.rating')}
          hint={
            rating.average === null
              ? t('manage.person.noRating')
              : t('manage.person.ratingValue', { average: formatRating(rating.average), count: rating.count })
          }
        />
        <ManageRow
          icon="car"
          title={t('manage.person.trips')}
          hint={t('manage.person.tripsValue', { trips: card.trips, rides: card.rides })}
        />
        <ManageRow
          icon="complaints"
          title={t('manage.person.complaints')}
          hint={String(card.complaintsAgainst)}
        />
        {car ? (
          <ManageRow icon="carSide" title={`${car.make} ${car.model}`} hint={formatPlate(car.plate)} />
        ) : null}
        <ManageRow
          icon="blocked"
          title={card.blocked ? t('manage.person.blocked') : t('moderation.blocks.notNow')}
          {...(card.blocked ? { hint: blocked, danger: true } : {})}
        />
        {card.blocked ? null : (
          <ManageRow icon="blocked" title={t('moderation.block')} danger onClick={() => setBlocking(true)} />
        )}
      </ManageGroup>
      <ActionFailure error={failure} />
      <BlockJournal userId={card.id} />
    </ManagePage>
  );
}
