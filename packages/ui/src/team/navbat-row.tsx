import { formatPlate, type NavbatItem, type NavbatKind } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { Icon, type IconName } from '../icons';

type Translate = ReturnType<typeof useI18n>['t'];
const ICON = 20;
const HOUR = 60;
const ICONS: Record<NavbatKind, IconName> = {
  application: 'applications',
  complaint: 'complaints',
  face: 'photo',
  support: 'help',
};

// «Shikoyat: Madina → Jasur» and what it is about: the car, the reason, a passenger, a question.
function words(item: NavbatItem, t: Translate): { readonly title: string; readonly hint: string } {
  switch (item.kind) {
    case 'application':
      return {
        title: t('team.case.application', { name: item.name }),
        hint: `${item.car.model} · ${formatPlate(item.car.plate)}`,
      };
    case 'complaint':
      return {
        title: t('team.case.complaint', { name: item.name, against: item.against }),
        hint: t(`complaints.reason.${item.reason}`),
      };
    case 'face':
      return { title: t('team.case.face', { name: item.name }), hint: t('team.case.passenger') };
    case 'support':
      return {
        title: t('team.case.support', { name: item.name }),
        hint: t(item.appeal ? 'team.case.appeal' : 'team.case.question'),
      };
  }
}

// How long it waits in team hours: «25 daq», then «2 soat» (mockup g67/1).
const waited = (minutes: number, t: Translate) =>
  minutes < HOUR
    ? t('team.wait.minutes', { count: minutes })
    : t('team.wait.hours', { count: Math.floor(minutes / HOUR) });

type RowProps = { readonly item: NavbatItem; readonly onOpen: () => void };

// One case of «Navbat»: its icon, who and what, how long it waits; red over the limit (G34). Another
// member who opened it says «Aziz koʻrmoqda» instead of the details.
export function NavbatRow({ item, onOpen }: RowProps) {
  const { t } = useI18n();
  const { title, hint } = words(item, t);
  return (
    <button type="button" className="navbat-row" onClick={onOpen}>
      <span className="navbat-icon">
        <Icon name={ICONS[item.kind]} size={ICON} />
      </span>
      <span className="navbat-words">
        <span className="navbat-title">{title}</span>
        {item.takenBy ? (
          <span className="navbat-hint navbat-taken">{t('team.case.taken', { name: item.takenBy })}</span>
        ) : (
          <span className="navbat-hint">{hint}</span>
        )}
      </span>
      <span className={item.late ? 'navbat-wait navbat-late' : 'navbat-wait'}>{waited(item.minutes, t)}</span>
    </button>
  );
}
