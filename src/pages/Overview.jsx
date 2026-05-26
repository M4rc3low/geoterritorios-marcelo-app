import { useState } from 'react';
import StatCard from '../components/StatCard';
import ModuleCard from '../components/ModuleCard';
import ProgressTable from '../components/ProgressTable';
import { useTerritorios, useCondominios, useRegistrosS13, getTerritorioStats } from '../lib/useGeoData';

export default function Overview() {
  const { territorios, loading: lt } = useTerritorios();
  const { condominios, loading: lc } = useCondominios();
  const { registros, loading: lr } = useRegistrosS13();
  const [campFilter, setCampFilter] = useState(false);

  const loading = lt || lc || lr;

  const filteredRegistros = campFilter ? registros.filter(r => r.campanha) : registros;
  const stats = !loading ? getTerritorioStats(territorios, condominios, filteredRegistros) : null;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-5 flex flex-col gap-4">
      {/* Campaign filter */}
      <div className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg text-[11px]">
        <input
          type="checkbox"
          checked={campFilter}
          onChange={e => setCampFilter(e.target.checked)}
          className="w-3.5 h-3.5 accent-geo-purple cursor-pointer"
        />
        <label className="cursor-pointer" onClick={() => setCampFilter(!campFilter)}>
          🎯 Ver somente registros de <strong>Campanha</strong>
        </label>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <StatCard value={stats.conc} label="Territórios concluídos" color="text-geo-green" />
        <StatCard value={stats.and} label="Em andamento" color="text-geo-orange" />
        <StatCard value={stats.livre} label="Sem designação" color="text-geo-red" />
        <StatCard value={stats.totalConds} label="Condomínios mapeados" color="text-geo-blue" />
        <StatCard value={stats.totalAptos} label="Apartamentos" color="text-primary" />
        <StatCard value={`${stats.pctCartas}%`} label="% cartas/aptos" color="text-geo-purple" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Casa em Casa */}
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3">
          <div className="text-[11px] font-bold tracking-wider uppercase">🏠 Trabalho Casa em Casa</div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-background border border-border rounded-lg p-2.5 text-center">
              <div className="font-crimson text-[26px] text-geo-purple">{stats.totalConvCel}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">🎉 Conv. Celebração</div>
            </div>
            <div className="bg-background border border-border rounded-lg p-2.5 text-center">
              <div className="font-crimson text-[26px] text-geo-blue">{stats.totalConvCong}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">🏟️ Conv. Congresso</div>
            </div>
          </div>
        </div>

        {/* Cartas em Condomínios */}
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3">
          <div className="text-[11px] font-bold tracking-wider uppercase">🏢 Cartas em Condomínios</div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-[11px]">
                <div className="w-2.5 h-2.5 rounded-full bg-geo-green" />
                <span>{stats.totalCartas} enviadas</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <div className="w-2.5 h-2.5 rounded-full bg-muted" />
                <span>{stats.totalAptos - stats.totalCartas} pendentes</span>
              </div>
              <div className="text-[13px] font-bold text-primary">{stats.pctCartas}%</div>
            </div>
            <div className="flex-1">
              <div className="w-full bg-muted rounded h-2 overflow-hidden">
                <div className="h-full bg-geo-green rounded transition-all duration-500" style={{ width: `${stats.pctCartas}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <ModuleCard
          icon="📌" title="33 Territórios" color="orange"
          desc="Clique em qualquer território para ver detalhes e registrar no S-13."
          nums={[
            { value: stats.conc, label: 'concluídos', color: 'text-geo-green' },
            { value: stats.and, label: 'andamento', color: 'text-geo-orange' },
            { value: stats.livre, label: 'livres', color: 'text-geo-red' },
          ]}
          cta="Abrir painel →" to="/territorios"
        />
        <ModuleCard
          icon="🏢" title="Condomínios" color="blue"
          desc="Adicione novos e exporte para Excel."
          nums={[
            { value: stats.totalConds, label: 'condomínios', color: 'text-geo-blue' },
            { value: stats.totalAptos, label: 'aptos', color: 'text-geo-blue' },
          ]}
          cta="Ver condomínios →" to="/condominios"
        />
        <ModuleCard
          icon="⬇️" title="Compilador GeoSampa" color="green"
          desc="Cole a tabela do GeoSampa para importar novos prédios."
          nums={[{ value: stats.totalAptos, label: 'aptos importados', color: 'text-geo-green' }]}
          cta="Abrir compilador →" to="/geosampa"
        />
        <ModuleCard
          icon="🗺️" title="Mapa KML" color="yellow"
          desc="Polígono interativo do território Jardim Paulista."
          nums={[{ value: 50, label: 'vértices', color: 'text-primary' }]}
          cta="Abrir mapa →" to="/mapa"
        />
      </div>

      {/* Progress table */}
      <ProgressTable territorios={territorios} condominios={condominios} />
    </div>
  );
}