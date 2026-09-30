import type { LegalDocument } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';

// The sections of each document in legal.json: "<document>.<n>.title" and "<document>.<n>.text".
const SECTIONS: Readonly<Record<LegalDocument, number>> = { offer: 12, privacy: 8, consent: 5 };

type Section = { readonly title: TranslationKey; readonly text: TranslationKey };

export function sectionsOf(document: LegalDocument): Section[] {
  return Array.from({ length: SECTIONS[document] }, (_, index) => ({
    title: `legal.${document}.${index + 1}.title` as TranslationKey,
    text: `legal.${document}.${index + 1}.text` as TranslationKey,
  }));
}

export const titleOf = (document: LegalDocument) => `legal.${document}.title` as const;
