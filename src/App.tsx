import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { PresencaNacionalPage } from '@/pages/PresencaNacionalPage';
import { AnaliseConversaoPresidenciaPage } from '@/dashboards/analise-conversao-presidencia/page';
import { BolsasEDescontosPage } from '@/dashboards/bolsas-e-descontos/page';
import { AnaliseDeConversaoPage } from '@/dashboards/analise-de-conversao/page';
import { AppShell } from '@/components/layout/AppShell';
import { ModulePlaceholder } from '@/components/ui/ModulePlaceholder';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

function DashboardRouter() {
  const { slug = '' } = useParams();
  if (slug === 'presenca-nacional') return <PresencaNacionalPage />;
  if (slug === 'analise-conversao-presidencia')
    return <AnaliseConversaoPresidenciaPage />;
  if (slug === 'bolsas-e-descontos') return <BolsasEDescontosPage />;
  if (slug === 'analise-de-conversao') return <AnaliseDeConversaoPage />;
  return (
    <AppShell title="Dashboard em breve" subtitle={`Modulo: ${slug}`}>
      <ModulePlaceholder
        title="Este dashboard sera liberado em breve"
        description="Estamos preparando os indicadores deste painel. Enquanto isso, explore o Presenca Nacional que ja esta disponivel."
      />
    </AppShell>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/dashboards/:slug"
          element={
            <ErrorBoundary title="Nao foi possivel exibir este dashboard">
              <DashboardRouter />
            </ErrorBoundary>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
