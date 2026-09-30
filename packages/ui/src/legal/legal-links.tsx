import { LEGAL_DOCUMENTS, type LegalDocument } from '@platform/contracts';
import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { Icon } from '../icons';
import { legalTitle } from '@platform/i18n';

type Props = { readonly onOpen: (document: LegalDocument) => void; readonly header?: string };

// The three documents, each opens on a tap: on the consent screen and in the profile (docs/30).
export function LegalLinks({ onOpen, header }: Props) {
  const { t } = useI18n();
  return (
    <Section header={header}>
      {LEGAL_DOCUMENTS.map((document) => (
        <Cell
          key={document}
          before={<IconTile name="document" />}
          after={<Icon name="next" />}
          multiline
          onClick={() => onOpen(document)}
        >
          {t(legalTitle(document))}
        </Cell>
      ))}
    </Section>
  );
}
