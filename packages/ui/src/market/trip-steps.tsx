import { COMMENT_MAX } from '@platform/contracts';
import { useState } from 'react';
import { Textarea } from '../components';
import { useI18n } from '../context/i18n-context';
import { FormSheet } from '../sheet/form-sheet';
import { MainButton } from '../telegram/bottom-button';
import './trip-steps.css';

type CommentProps = {
  readonly open: boolean;
  readonly initial: string;
  // Each letter goes to the draft: a closed app gives the comment back (docs/94 F3).
  readonly onType: (text: string) => void;
  readonly onClose: () => void;
  readonly onDone: (text: string) => void;
  // The note of a booking has its own hint and limit (G63); a trip keeps its own.
  readonly hint?: string;
  readonly max?: number;
};

// The only text of a trip or a booking, and it may stay empty (docs/19: typing only when it is
// needed): a sheet over the form (G75, mockup g75/3 A phone 3), the letters counted to the limit.
export function CommentSheet({
  open,
  initial,
  onType,
  onClose,
  onDone,
  hint,
  max = COMMENT_MAX,
}: CommentProps) {
  const { t, formatNumber } = useI18n();
  const [text, setText] = useState(initial);
  return (
    <FormSheet
      open={open}
      title={t('market.comment.title')}
      hint={hint ?? t('market.comment.hint')}
      onClose={onClose}
    >
      <div className="comment-field">
        <Textarea
          className="comment-area"
          placeholder={t('market.comment.placeholder')}
          value={text}
          maxLength={max}
          onChange={(event) => {
            setText(event.target.value);
            onType(event.target.value);
          }}
        />
      </div>
      <span className="comment-count">
        {t('common.counter', { count: formatNumber(text.length), max: formatNumber(max) })}
      </span>
      <button type="button" className="form-sheet-link" onClick={() => onDone('')}>
        {t('market.comment.skip')}
      </button>
      {open && text.trim() ? (
        <MainButton text={t('common.continue')} onClick={() => onDone(text.trim())} />
      ) : null}
    </FormSheet>
  );
}
