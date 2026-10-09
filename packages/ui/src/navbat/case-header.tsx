import type { CSSProperties } from 'react';
import { useI18n } from '../context/i18n-context';
import type { Progress } from './next-case';

type HeaderProps = { readonly title: string; readonly progress: Progress };

// «Jasur · ariza» and «1 / 9 · qarordan keyin keyingisi oʻzi ochiladi» with its bar (g67/2 screen 3).
export function CaseHeader({ title, progress }: HeaderProps) {
  const { t } = useI18n();
  const share = { '--case-done': `${(progress.n / progress.m) * 100}%` } as CSSProperties;
  return (
    <header className="case-header">
      <h1 className="case-title">{title}</h1>
      <p className="case-progress">
        <span>{t('navbat.progress', { n: progress.n, m: progress.m })}</span>
        <span className="case-bar" style={share} aria-hidden />
      </p>
    </header>
  );
}
