import { useCallback, useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';

// The money of the driver next to a commission (docs/65 C): a confirmation the wallet cannot pay
// is never offered as a plain «Tasdiqlash» (G27). Null until the wallet comes or when it fails:
// then the server still says «wallet.not_enough».
export function useBalance() {
  const { wallet } = useApiClients();
  const [balance, setBalance] = useState<number | null>(null);
  const reload = useCallback(() => {
    wallet.mine().then(
      (mine) => setBalance(mine.bonus + mine.main),
      () => undefined,
    );
  }, [wallet]);
  useEffect(reload, [reload]);
  return { balance, reload };
}

export const short = (balance: number | null, commission: number) => balance !== null && balance < commission;
