import { LEGAL_DOCUMENTS, type LegalDocument } from '@platform/contracts';
import { useState, type ReactNode } from 'react';
import { forgetLaunchParam, launchParam } from '../telegram/launch-param';
import { LegalScreen } from './legal-screen';

const PARAM = 'doc';
const DOCUMENT = new RegExp(`^(${LEGAL_DOCUMENTS.join('|')})$`, 'u');

// "Hujjatlar" in a bot opens the Mini App with ?doc=<document>: it is readable before the
// registration too (docs/30).
export function LegalGate({ children }: { readonly children: ReactNode }) {
  const [document, setDocument] = useState(() => launchParam(PARAM, DOCUMENT) as LegalDocument | null);
  if (!document) return <>{children}</>;
  const close = () => {
    forgetLaunchParam(PARAM);
    setDocument(null);
  };
  return <LegalScreen document={document} onBack={close} />;
}
