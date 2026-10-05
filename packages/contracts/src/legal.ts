// The three legal documents (docs/30): the offer, the privacy policy, the personal data consent.
export const LEGAL_DOCUMENTS = ['offer', 'privacy', 'consent'] as const;
export type LegalDocument = (typeof LEGAL_DOCUMENTS)[number];

// The current edition: a new text gets a new version and date (docs/30).
export const LEGAL_EDITION = { version: '1.2', date: '2026-10-05' } as const;
