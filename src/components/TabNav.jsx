import { Link, useLocation } from 'react-router-dom';

const TABS = [
  { path: '/', icon: '🏠', label: 'Visão Geral' },
  { path: '/territorios', icon: '📌', label: '33 Territórios' },
  { path: '/condominios', icon: '🏢', label: 'Condomínios' },
  { path: '/mapa', icon: '🗺️', label: 'Mapa Interativo' },
  { path: '/geosampa', icon: '⬇️', label: 'GeoSampa' },
  { path: '/s13', icon: '📋', label: 'S-13' },
  { path: '/analise', icon: '📊', label: 'Análise' },
  { path: '/dashboard', icon: '📈', label: 'Dashboard' },
  { path: '/etiquetas', icon: '🏷️', label: 'Etiquetas' },
  { path: '/importar', icon: '📦', label: 'Importar Dados' },
];

export default function TabNav() {
  const { pathname } = useLocation();

  return (
    <div className="flex bg-[#10131f] border-b border-border px-5 gap-1 shrink-0 overflow-x-auto scrollbar-none">
      {TABS.map(t => {
        const active = pathname === t.path;
        return (
          <Link
            key={t.path}
            to={t.path}
            className={`px-4 h-[43px] flex items-center gap-1.5 font-syne text-[11px] font-bold tracking-wider uppercase whitespace-nowrap border-b-2 transition-all duration-150 ${
              active
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}