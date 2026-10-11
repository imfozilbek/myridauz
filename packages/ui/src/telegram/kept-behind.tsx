import type { ReactNode } from 'react';
import { Behind, useBehind } from './behind';
import './kept-behind.css';

type Props = { readonly under: boolean; readonly children: ReactNode };

// A screen kept under another one opened over it: a chat, a trip of «Hamyon», the car of «Profil».
// It stays as it was, so «Назад» comes back to the very screen, the list or the details (G76, G77).
// While under it gives away what Telegram shows; a screen already under stays under.
export function KeptBehind({ under, children }: Props) {
  const outer = useBehind();
  return (
    <Behind.Provider value={outer || under}>
      <div className={under ? 'kept-behind' : 'kept-shown'}>{children}</div>
    </Behind.Provider>
  );
}
