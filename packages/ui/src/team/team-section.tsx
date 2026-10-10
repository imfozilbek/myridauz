import type { ReactNode } from 'react';

type SectionProps = { readonly title: string; readonly children: ReactNode };

// A part of the main screen of the team with its gray title in capitals: «DIQQAT», «NAVBAT» (g67/1).
export function TeamSection({ title, children }: SectionProps) {
  return (
    <div className="team-section" role="group" aria-label={title}>
      <h2 className="team-section-title">{title}</h2>
      {children}
    </div>
  );
}
