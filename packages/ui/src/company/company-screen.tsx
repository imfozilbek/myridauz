import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useLoad } from '../market/use-list';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { CompanyEditor } from './company-editor';

// «Kompaniya rekvizitlari» in «Boshqaruv» (G34, docs/30): the requisites of the legal documents.
export function CompanyScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenView('company');
  const { company } = useApiClients();
  const { value, failed, reload } = useLoad(() => company.state());
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  return <CompanyEditor loaded={value} onBack={onBack} />;
}
