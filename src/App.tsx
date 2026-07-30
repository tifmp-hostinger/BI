import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { AppShell } from '@/components/layout/AppShell';
import { ModulePlaceholder } from '@/components/ui/ModulePlaceholder';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { AuthGate } from '@/components/auth/AuthGate';

// Code-split por rota: cada dashboard (com recharts/leaflet pesados) vira um
// chunk próprio, carregado só quando o usuário navega até ele.
const PresencaNacionalPage = lazy(() =>
  import('@/pages/PresencaNacionalPage').then((m) => ({ default: m.PresencaNacionalPage })),
);
const AnaliseConversaoPresidenciaPage = lazy(() =>
  import('@/dashboards/analise-conversao-presidencia/page').then((m) => ({
    default: m.AnaliseConversaoPresidenciaPage,
  })),
);
const BolsasEDescontosPage = lazy(() =>
  import('@/dashboards/bolsas-e-descontos/page').then((m) => ({ default: m.BolsasEDescontosPage })),
);
const AnaliseDeConversaoPage = lazy(() =>
  import('@/dashboards/analise-de-conversao/page').then((m) => ({
    default: m.AnaliseDeConversaoPage,
  })),
);
const GrowthEPerformancePage = lazy(() =>
  import('@/dashboards/growth-e-performance/page').then((m) => ({
    default: m.GrowthEPerformancePage,
  })),
);

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <p className="text-xs font-medium uppercase tracking-widest text-ink-3">
        Carregando dashboard…
      </p>
    </div>
  );
}

function DashboardRouter() {
  const { slug = '' } = useParams();
  if (slug === 'presenca-nacional') return <PresencaNacionalPage />;
  if (slug === 'analise-conversao-presidencia')
    return <AnaliseConversaoPresidenciaPage />;
  if (slug === 'bolsas-e-descontos') return <BolsasEDescontosPage />;
  if (slug === 'analise-de-conversao') return <AnaliseDeConversaoPage />;
  if (slug === 'growth-e-performance') return <GrowthEPerformancePage />;
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
    <AuthGate>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/dashboards/:slug"
            element={
              <ErrorBoundary title="Nao foi possivel exibir este dashboard">
                <Suspense fallback={<RouteFallback />}>
                  <DashboardRouter />
                </Suspense>
              </ErrorBoundary>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthGate>
  );
}

export default App;
