import { LEGAL_DOCUMENTS, type LegalDocument } from '@platform/contracts';
import { Link, Text } from '@telegram-apps/telegram-ui';
import type { MouseEvent } from 'react';
import { useI18n } from '../../context/i18n-context';

type ConsentLineProps = { readonly onOpen: (document: LegalDocument) => void };

const isDocument = (part: string): part is LegalDocument =>
  LEGAL_DOCUMENTS.some((document) => document === part);
// Each document name is a placeholder of the line: the translation decides the order of the words.
const marker = (document: LegalDocument) => `\u0000${document}\u0000`;

// «Davom etish» is the consent (docs/30, G34): the line names the three documents and each opens on a tap.
export function ConsentLine({ onOpen }: ConsentLineProps) {
  const { t } = useI18n();
  const line = t('account.consent.line', {
    button: t('common.continue'),
    offer: marker('offer'),
    privacy: marker('privacy'),
    consent: marker('consent'),
  });
  const open = (document: LegalDocument) => (event: MouseEvent) => {
    event.preventDefault();
    onOpen(document);
  };
  return (
    <Text className="welcome-consent">
      {line.split('\u0000').map((part, index) =>
        isDocument(part) ? (
          <Link key={part} href={`?doc=${part}`} onClick={open(part)}>
            {t(`account.consent.link.${part}`)}
          </Link>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </Text>
  );
}
