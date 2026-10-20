import { useApiClients } from '../context/api-clients';
import { useLoad } from '../market/use-list';

// The owner of the project, not a moderator: the screens show the owner's tools only to the owner,
// as the server allows them only to the owner (ownerOnly, G90 ADM-1, ADM-2, ADM-11). The person came
// with the main screen of the team: the same memory, no second wait.
export function useTeamOwner(): boolean {
  const { moderation } = useApiClients();
  return useLoad(() => moderation.me(), 'home.me').value?.role === 'owner';
}
