import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { PresencaNacionalPage } from '@/pages/PresencaNacionalPage';
import { AppShell } from '@/components/layout/AppShell';
import { ModulePlaceholder } from '@/components/ui/ModulePlaceholder';

function DashboardRouter() {
  const { slug = '' } = useParams();
  if (slug === 'presenca-nacional') return <PresencaNacionalPage />;
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
        <Route path="/dashboards/:slug" element={<DashboardRouter />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
