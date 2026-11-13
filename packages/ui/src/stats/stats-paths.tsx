import type { Path, Paths, StatsPeriod } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManageNote, ManageRow } from '../manage/manage-page';
import { useTeamOwner } from '../team/use-owner';

type Slice = { readonly title: string; readonly paths: readonly Path[] };
type Row = Slice & { readonly key: string; readonly people: number; readonly errors: number };

// «Yoʻl manbalari» and «Telegram versiyalari» (G99, docs/234): each source, version of Telegram and
// app with its people and errors; a row opens its paths. The owner gets the files of the analyst.
export function PathSections({
  paths,
  period,
  onOpen,
}: {
  readonly paths: Paths;
  readonly period: StatsPeriod;
  readonly onOpen: (slice: Slice) => void;
}) {
  const { t } = useI18n();
  const owner = useTeamOwner();
  const sources = paths.sources.map((row) => ({
    ...row,
    key: row.kind,
    title: t(`stats.arrival.${row.kind}`),
  }));
  const versions = paths.versions.map((row) => ({
    ...row,
    key: row.tg,
    title: t(`stats.paths.tg.${row.tg}`),
  }));
  const apps = paths.platforms.map((row) => ({
    ...row,
    key: row.platform,
    title: t(`stats.paths.platform.${row.platform}`),
  }));
  return (
    <>
      <SliceGroup title={t('stats.paths.sources')} icon="passengers" rows={sources} onOpen={onOpen} />
      <ManageNote>{t('stats.paths.sourcesHint')}</ManageNote>
      <SliceGroup title={t('stats.paths.versions')} icon="statistics" rows={versions} onOpen={onOpen} />
      <SliceGroup title={t('stats.paths.platforms')} icon="homeScreen" rows={apps} onOpen={onOpen} />
      <ManageNote>{t('stats.paths.versionsHint')}</ManageNote>
      {owner ? <FileRow period={period} /> : null}
    </>
  );
}

function SliceGroup({
  title,
  icon,
  rows,
  onOpen,
}: {
  readonly title: string;
  readonly icon: 'passengers' | 'statistics' | 'homeScreen';
  readonly rows: readonly Row[];
  readonly onOpen: (slice: Slice) => void;
}) {
  const { t, formatNumber } = useI18n();
  return (
    <ManageGroup title={title}>
      {rows.length === 0 ? <ManageRow icon={icon} title={t('stats.paths.empty')} /> : null}
      {rows.map((row) => (
        <ManageRow
          key={row.key}
          icon={icon}
          title={row.title}
          hint={t('stats.paths.row', {
            people: formatNumber(row.people),
            errors: formatNumber(row.errors),
          })}
          onClick={() => onOpen({ title: row.title, paths: row.paths })}
        />
      ))}
    </ManageGroup>
  );
}

// The two files of the period come to the owner by the admin bot (T6): asked once, then said so.
function FileRow({ period }: { readonly period: StatsPeriod }) {
  const { t } = useI18n();
  const { stats } = useApiClients();
  const [sent, setSent] = useState<StatsPeriod | null>(null);
  const [failed, setFailed] = useState(false);
  const send = () => {
    setFailed(false);
    stats.pathsFile(period).then(
      () => setSent(period),
      () => setFailed(true),
    );
  };
  return (
    <>
      <ManageGroup>
        <ManageRow
          icon="download"
          title={t('stats.paths.file')}
          hint={t('stats.paths.fileHint')}
          onClick={send}
        />
      </ManageGroup>
      {sent === period ? <ManageNote>{t('stats.paths.fileSent')}</ManageNote> : null}
      {failed ? <ManageNote>{t('errors.generic.description')}</ManageNote> : null}
    </>
  );
}
