import { useState, type ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useDashboards } from '@/hooks/useDashboards';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AppShell({ title, subtitle, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: dashboards } = useDashboards();

  const items = dashboards.map((d) => ({
    slug: d.slug,
    title: d.title,
    subtitle: d.category,
    icon: d.icon,
    disabled: !d.is_active,
  }));

  return (
    <div className="flex min-h-screen bg-base">
      <Sidebar
        items={items}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={title}
          subtitle={subtitle}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
