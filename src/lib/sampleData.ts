import type { Dashboard } from '@/lib/supabase';

export const SAMPLE_DASHBOARDS: Dashboard[] = [
  {
    id: '1',
    slug: 'presenca-nacional',
    title: 'Presença Nacional',
    description:
      'Mapa por estado das matrículas de Pós-graduação e Cursos Livres.',
    icon: 'MapPin',
    color: 'fmp',
    category: 'Geolocalização',
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: '7',
    slug: 'analise-conversao-presidencia',
    title: 'Análise de Conversão - Presidência',
    description:
      'Funil comercial acadêmico: Graduação, Mestrado e Especializações frente às metas.',
    icon: 'Target',
    color: 'fmp',
    category: 'Presidência',
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: '8',
    slug: 'bolsas-e-descontos',
    title: 'Bolsas e Descontos - Performance e Retenção',
    description:
      'Visão geral de matrículas, bolsas, descontos, faturamento e evasão relacionada a benefícios financeiros.',
    icon: 'Percent',
    color: 'fmp',
    category: 'Financeiro',
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: '9',
    slug: 'analise-de-conversao',
    title: 'Análise de Conversão',
    description:
      'Funil comercial completo: leads, inscrições e matrículas por processo (Graduação, Especializações, Mestrado e Cursos Livres).',
    icon: 'Target',
    color: 'fmp',
    category: 'Comercial',
    is_active: true,
    sort_order: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: '10',
    slug: 'growth-e-performance',
    title: 'Growth e Performance',
    description:
      'Mídia paga (Google + Meta) cruzada com o funil de captação, segmentada por produto.',
    icon: 'TrendingUp',
    color: 'fmp',
    category: 'Comercial',
    is_active: true,
    sort_order: 5,
    created_at: new Date().toISOString(),
  },
];
