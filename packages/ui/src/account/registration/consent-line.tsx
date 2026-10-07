import { LEGAL_DOCUMENTS, type LegalDocument } from '@platform/contracts';
import type { MouseEvent } from 'react';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { Icon } from '../../icons';
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
const TICK = 14;
const isDocument = (part: string): part is LegalDocument =>
  LEGAL_DOCUMENTS.some((document) => document === part);
// Each document name is a placeholder of the line: the translation decides the order of the words.
const marker = (document: LegalDocument) => `\u0000${document}\u0000`;
const MARKERS = { offer: marker('offer'), privacy: marker('privacy'), consent: marker('consent') };

export const bothAccepted = (value: Consents) => value.offer && value.data;

// The consent of screen 1 (G58): two ticks as on the approved mockup; the name of a document
// opens it, the tick stays.
export function ConsentChecks({ value, onChange, onOpen }: ConsentChecksProps) {
  const { t } = useI18n();
  const { colors } = useBrand().theme;
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
          <a key={part} href={`?doc=${part}`} onClick={open(part)}>
            {t(`account.consent.link.${part}`)}
          </a>
        ) : (
          <span key={index}>{part}</span>
        ),
      );
  return (
    <div className="welcome-consent">
      {CONSENTS.map((consent) => (
        <label key={consent} className="welcome-tick">
          <input type="checkbox" checked={value[consent]} onChange={() => toggle(consent)} />
          <span className="welcome-box">
            {value[consent] ? <Icon name="selected" size={TICK} color={colors.bg} /> : null}
          </span>
          <span>{line(consent)}</span>
        </label>
      ))}
    </div>
  );
}
