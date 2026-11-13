import type { Path } from '@platform/contracts';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManageNote, ManagePage, ManageRow } from '../manage/manage-page';

// A drop from this share is where people get stuck: it is marked, as in the funnels (docs/29).
const HIGH_DROP = 50;

// One slice of «Yoʻl manbalari» or «Telegram versiyalari» (G99, docs/234): the path of the
// passengers and the path of the drivers, people on each step and the share that left.
export function PathScreen({
  title,
  paths,
  onBack,
}: {
  readonly title: string;
  readonly paths: readonly Path[];
  readonly onBack: () => void;
}) {
  useScreenView('stats.path');
  const { t, formatNumber } = useI18n();
  return (
    <ManagePage title={title} onBack={onBack}>
      {paths.map((path) => (
        <ManageGroup key={path.role} title={t(`stats.funnel.${path.role}`)}>
          {path.steps.map((step) => (
            <ManageRow
              key={step.step}
              icon="statistics"
              title={t(`stats.step.${step.step}`)}
              {...(step.drop
                ? { hint: t('stats.left', { drop: step.drop }), alarm: step.drop >= HIGH_DROP }
                : {})}
              value={formatNumber(step.count)}
            />
          ))}
        </ManageGroup>
      ))}
      <ManageNote>{t('stats.funnelHint')}</ManageNote>
    </ManagePage>
  );
}
