import { helpQuestionOf, type Stats } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useHelpValues } from '../help/help-parts';
import { ManageGroup, ManageRow } from '../manage/manage-page';

// «Yordam» of «Statistika» (G97, docs/226): the questions people open most, and how many still wrote to
// the team after the answer. A question with many «yozdi» needs a better answer.
export function HelpSection({ help }: Pick<Stats, 'help'>) {
  const { t, formatNumber } = useI18n();
  const values = useHelpValues();
  const rows = help.flatMap((row) => {
    const question = helpQuestionOf(row.code);
    return question ? [{ ...row, question }] : [];
  });
  if (rows.length === 0) return null;
  return (
    <ManageGroup title={t('stats.help.title')}>
      {rows.map(({ question, opened, more }) => (
        <ManageRow
          key={question}
          icon="help"
          title={t(`help.${question}.q`, values)}
          hint={t('stats.help.more', { count: formatNumber(more) })}
          value={formatNumber(opened)}
        />
      ))}
    </ManageGroup>
  );
}
