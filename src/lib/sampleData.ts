import type { Dashboard, UserCep } from '@/lib/supabase';

export const SAMPLE_DASHBOARDS: Dashboard[] = [
  {
    id: '1',
    slug: 'presenca-nacional',
    title: 'Presenca Nacional',
    description:
      'Mapa de calor e drill-down por estado das matriculas de Pos-graduacao e Cursos Livres.',
    icon: 'MapPin',
    color: 'fmp',
    category: 'Geolocalizacao',
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: '7',
    slug: 'analise-conversao-presidencia',
    title: 'Analise de Conversao - Presidencia',
    description:
      'Funil comercial academico: Graduacao, Mestrado e Especializacoes com paridade de regras Power BI.',
    icon: 'Target',
    color: 'fmp',
    category: 'Presidencia',
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
    id: '2',
    slug: 'academic-performance',
    title: 'Desempenho Academico',
    description:
      'Indicadores de aprovacao, retencao e evasao por curso, turma e periodo letivo.',
    icon: 'GraduationCap',
    color: 'emerald',
    category: 'Academico',
    is_active: false,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    slug: 'financial',
    title: 'Financeiro Institucional',
    description:
      'Receita, inadimplencia e projecoes financeiras consolidadas por unidade e curso.',
    icon: 'DollarSign',
    color: 'amber',
    category: 'Financeiro',
    is_active: false,
    sort_order: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    slug: 'admissions',
    title: 'Processo Seletivo',
    description:
      'Funil de inscricao, conversao e matricula do vestibular e ingressos por transferencia.',
    icon: 'UserPlus',
    color: 'rose',
    category: 'Comercial',
    is_active: false,
    sort_order: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    slug: 'engagement',
    title: 'Engajamento Digital',
    description:
      'Acessos ao portal do aluno, uso da biblioteca digital e interacoes com o AVA.',
    icon: 'Activity',
    color: 'info',
    category: 'Experiencia',
    is_active: false,
    sort_order: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    slug: 'faculty',
    title: 'Corpo Docente',
    description:
      'Titulacao, producao cientifica, carga horaria e distribuicao do corpo docente.',
    icon: 'Users',
    color: 'fmp',
    category: 'Academico',
    is_active: false,
    sort_order: 6,
    created_at: new Date().toISOString(),
  },
];

type CepSeed = Omit<UserCep, 'id' | 'created_at'>;

const CITIES: Array<{
  city: string;
  state: string;
  region: string;
  lat: number;
  lng: number;
  weight: number;
  neighborhoods: string[];
  ceps: string[];
}> = [
  { city: 'Rio de Janeiro', state: 'RJ', region: 'Sudeste', lat: -22.9068, lng: -43.1729, weight: 42, neighborhoods: ['Centro', 'Copacabana', 'Tijuca', 'Botafogo', 'Barra da Tijuca'], ceps: ['20040-020', '22070-011', '20511-000', '22250-040', '22640-100'] },
  { city: 'Sao Paulo', state: 'SP', region: 'Sudeste', lat: -23.5505, lng: -46.6333, weight: 30, neighborhoods: ['Se', 'Pinheiros', 'Vila Mariana', 'Moema', 'Tatuape'], ceps: ['01001-000', '05422-010', '04101-300', '04077-000', '03310-000'] },
  { city: 'Belo Horizonte', state: 'MG', region: 'Sudeste', lat: -19.9167, lng: -43.9345, weight: 14, neighborhoods: ['Savassi', 'Funcionarios', 'Centro'], ceps: ['30140-071', '30130-100', '30110-005'] },
  { city: 'Niteroi', state: 'RJ', region: 'Sudeste', lat: -22.8836, lng: -43.1035, weight: 12, neighborhoods: ['Icarai', 'Centro', 'Sao Francisco'], ceps: ['24220-001', '24020-053', '24360-000'] },
  { city: 'Vitoria', state: 'ES', region: 'Sudeste', lat: -20.3155, lng: -40.3128, weight: 8, neighborhoods: ['Praia do Canto', 'Jardim da Penha'], ceps: ['29055-260', '29060-670'] },
  { city: 'Curitiba', state: 'PR', region: 'Sul', lat: -25.4284, lng: -49.2733, weight: 9, neighborhoods: ['Batel', 'Centro', 'Agua Verde'], ceps: ['80420-090', '80020-320', '80620-010'] },
  { city: 'Porto Alegre', state: 'RS', region: 'Sul', lat: -30.0346, lng: -51.2177, weight: 7, neighborhoods: ['Moinhos de Vento', 'Centro Historico'], ceps: ['90570-020', '90010-150'] },
  { city: 'Florianopolis', state: 'SC', region: 'Sul', lat: -27.5954, lng: -48.548, weight: 5, neighborhoods: ['Centro', 'Trindade'], ceps: ['88010-400', '88036-000'] },
  { city: 'Salvador', state: 'BA', region: 'Nordeste', lat: -12.9714, lng: -38.5014, weight: 10, neighborhoods: ['Barra', 'Pituba', 'Ondina'], ceps: ['40140-130', '41810-011', '40170-110'] },
  { city: 'Recife', state: 'PE', region: 'Nordeste', lat: -8.0476, lng: -34.877, weight: 8, neighborhoods: ['Boa Viagem', 'Casa Forte'], ceps: ['51020-000', '52061-000'] },
  { city: 'Fortaleza', state: 'CE', region: 'Nordeste', lat: -3.7319, lng: -38.5267, weight: 7, neighborhoods: ['Aldeota', 'Meireles'], ceps: ['60160-230', '60165-081'] },
  { city: 'Brasilia', state: 'DF', region: 'Centro-Oeste', lat: -15.7801, lng: -47.9292, weight: 9, neighborhoods: ['Asa Sul', 'Asa Norte', 'Lago Sul'], ceps: ['70200-670', '70730-030', '71605-160'] },
  { city: 'Goiania', state: 'GO', region: 'Centro-Oeste', lat: -16.6869, lng: -49.2648, weight: 5, neighborhoods: ['Setor Bueno', 'Setor Oeste'], ceps: ['74210-050', '74110-100'] },
  { city: 'Manaus', state: 'AM', region: 'Norte', lat: -3.119, lng: -60.0217, weight: 4, neighborhoods: ['Adrianopolis', 'Centro'], ceps: ['69057-070', '69010-060'] },
  { city: 'Belem', state: 'PA', region: 'Norte', lat: -1.4558, lng: -48.5044, weight: 4, neighborhoods: ['Nazare', 'Umarizal'], ceps: ['66035-115', '66055-260'] },
];

const AGE_GROUPS = ['18-24', '25-34', '35-44', '45-54', '55+'];
const AGE_WEIGHTS = [0.35, 0.32, 0.18, 0.1, 0.05];
const STATUSES: UserCep['enrollment_status'][] = ['active', 'prospect', 'alumni'];
const STATUS_WEIGHTS = [0.55, 0.3, 0.15];
const PROGRAMS = ['Direito', 'Administracao', 'Medicina', 'Engenharia', 'Psicologia', 'Ciencias Contabeis', 'Arquitetura', 'Nutricao'];

function pickWeighted<T>(items: T[], weights: number[], rand: number): T {
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += weights[i];
    if (rand <= acc) return items[i];
  }
  return items[items.length - 1];
}

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateSampleCeps(): CepSeed[] {
  const rand = seededRand(42);
  const rows: CepSeed[] = [];
  for (const c of CITIES) {
    for (let i = 0; i < c.weight; i++) {
      const jitterLat = (rand() - 0.5) * 0.08;
      const jitterLng = (rand() - 0.5) * 0.08;
      const cepIdx = Math.floor(rand() * c.ceps.length);
      const nbhIdx = Math.floor(rand() * c.neighborhoods.length);
      const progIdx = Math.floor(rand() * PROGRAMS.length);
      rows.push({
        cep: c.ceps[cepIdx],
        city: c.city,
        state: c.state,
        region: c.region,
        neighborhood: c.neighborhoods[nbhIdx],
        latitude: c.lat + jitterLat,
        longitude: c.lng + jitterLng,
        age_group: pickWeighted(AGE_GROUPS, AGE_WEIGHTS, rand()),
        enrollment_status: pickWeighted(STATUSES, STATUS_WEIGHTS, rand()),
        program: PROGRAMS[progIdx],
        intensity: 1 + Math.floor(rand() * 5),
      });
    }
  }
  return rows;
}

export function sampleCepsWithIds(): UserCep[] {
  return generateSampleCeps().map((c, i) => ({
    ...c,
    id: `sample-${i}`,
    created_at: new Date(Date.now() - i * 3600_000).toISOString(),
  }));
}
