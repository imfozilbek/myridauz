import { LEGAL_EDITION, type PublicCompany } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';

// Without an answer the documents name the brand and keep the base edition: never a placeholder.
const WITHOUT: PublicCompany = { company: null, edition: LEGAL_EDITION };

// The requisites and the edition the owner saved in the admin Mini App (G34). null while loading.
export function useRequisites(): PublicCompany | null {
  const { company } = useApiClients();
  const [answer, setAnswer] = useState<PublicCompany | null>(null);
  useEffect(() => {
    let shown = true;
    company.current().then(
      (fresh) => shown && setAnswer(fresh),
      () => shown && setAnswer(WITHOUT),
    );
    return () => {
      shown = false;
    };
  }, [company]);
  return answer;
}
