import type { CSSProperties } from 'react';
import { useI18n } from '../context/i18n-context';
import { useFitLine } from '../screen/fit-line';
import type { Progress } from './next-case';

// progress: a case of «Navbat»; line: a decided case, its decision and day (G95 «Mening qarorlarim»).
type HeaderProps = { readonly title: string } & (
  | { readonly progress: Progress; readonly line?: never }
  | { readonly line: string; readonly progress?: never }
);

// «Jasur · ariza» and «1 / 9 · qarordan keyin keyingisi oʻzi ochiladi» with its bar (g67/2 screen 3).
export function CaseHeader({ title, progress, line }: HeaderProps) {
  const { t } = useI18n();
  const words = progress ? t('navbat.progress', { n: progress.n, m: progress.m }) : line;
  const fitted = useFitLine<HTMLSpanElement>(words);
  const share = progress
    ? ({ '--case-done': `${(progress.n / progress.m) * 100}%` } as CSSProperties)
    : undefined;
  return (
    <header className="case-header">
      <h1 className="case-title">{title}</h1>
      <p className="case-progress">
        <span ref={fitted}>{words}</span>
        {progress ? <span className="case-bar" style={share} aria-hidden /> : null}
      </p>
    </header>
  );
}
