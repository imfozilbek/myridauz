import { LEGAL_DOCUMENTS, type LegalDocument } from '@platform/contracts';
import { Link } from '@telegram-apps/telegram-ui';
import type { MouseEvent } from 'react';
import { Cell, Checkbox, Section } from '../../components';
import { useI18n } from '../../context/i18n-context';
import { haptic } from '../../telegram/feedback';

// Two consents, not three (docs/118, docs/30): the offer is a contract and the data needs an
// agreement; the privacy policy is read, not signed.
export type Consents = { readonly offer: boolean; readonly data: boolean };
type Consent = keyof Consents;

type ConsentChecksProps = {
  // Kept by the flow: back from a document, the ticks are still there (docs/118).
  readonly value: Consents;
  readonly onChange: (value: Consents) => void;
  readonly onOpen: (document: LegalDocument) => void;
};

const CONSENTS = ['offer', 'data'] as const satisfies readonly Consent[];
const isDocument = (part: string): part is LegalDocument =>
  LEGAL_DOCUMENTS.some((document) => document === part);
// Each document name is a placeholder of the line: the translation decides the order of the words.
const marker = (document: LegalDocument) => `\u0000${document}\u0000`;
const MARKERS = { offer: marker('offer'), privacy: marker('privacy'), consent: marker('consent') };

export const bothAccepted = (value: Consents) => value.offer && value.data;

// The consent of screen 1 (G58): two ticks; the name of a document opens it, the tick stays.
export function ConsentChecks({ value, onChange, onOpen }: ConsentChecksProps) {
  const { t } = useI18n();
  const toggle = (consent: Consent) => {
    haptic.select();
    onChange({ ...value, [consent]: !value[consent] });
  };
  // A link inside the label opens the document and does not tick the box.
  const open = (document: LegalDocument) => (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onOpen(document);
  };
  const line = (consent: Consent) =>
    t(`account.consent.${consent}`, MARKERS)
      .split('\u0000')
      .map((part, index) =>
        isDocument(part) ? (
          <Link key={part} href={`?doc=${part}`} onClick={open(part)}>
            {t(`account.consent.link.${part}`)}
          </Link>
        ) : (
          <span key={index}>{part}</span>
        ),
      );
  return (
    <Section className="welcome-consent">
      {CONSENTS.map((consent) => (
        <Cell
          key={consent}
          Component="label"
          className="welcome-tick"
          before={<Checkbox checked={value[consent]} onChange={() => toggle(consent)} />}
        >
          <span className="welcome-tick-text">{line(consent)}</span>
        </Cell>
      ))}
    </Section>
  );
}
