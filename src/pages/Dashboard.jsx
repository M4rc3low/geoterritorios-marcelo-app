import { useMemo } from 'react';
import { useTerritorios, useCondominios, useRegistrosS13, getTerritorioStatus } from '../lib/useGeoData';
import StatCard from '../components/StatCard';
import TerritoryStatusRow from '../components/TerritoryStatusRow';

function MetricRow({ label, value, sub, valueColor = 'text-primary' }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-crimson text-[22px] leading-none font-medium ${valueColor}`}>{value}</span>
        {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { territorios, loading: lt, refetch: refetchTerr } = useTerritorios();
  const { condominios, loading: lc, refetch: refetchCond } = useCondominios();
  const { registros, loading: lr } = useRegistrosS13();

  const loading = lt || lc || lr;

  const handleUpdate = () => {
    refetchTerr();
    refetchCond();
  };

  const stats = useMemo(() => {
    if (loading) return null;

    const totalAptos = condominios.reduce((s, c) => s + (c.total_aptos || 0), 0);
    const totalCartas = condominios.reduce((s, c) => s + (c.cartas_enviadas || 0), 0);
    const totalPendentes = totalAptos - totalCartas;
    const pctCartas = totalAptos > 0 ? Math.round((totalCartas / totalAptos) * 100) : 0;

    const terrNums = [...new Set(condominios.map(c => c.territorio))];
    const quadrasSet = new Set(condominios.map(c => `${c.territorio}_${c.quadra}`));
    const totalQuadras = quadrasSet.size;
    const quadrasFechadas = [...quadrasSet].filter(k => {
      const [te, qu] = k.split('_');
      const conds = condominios.filter(c => c.territorio === te && c.quadra === qu);
      return conds.length > 0 && conds.every(c => c.fechado === 'SIM');
    }).length;

    const conc = territorios.filter(t => getTerritorioStatus(t.num, registros) === 'concluido').length;
    const and = territorios.filter(t => getTerritorioStatus(t.num, registros) === 'andamento').length;
    const livre = territorios.length - conc - and;

    const condsFechados = condominios.filter(c => c.fechado === 'SIM').length;
    const pctCondsFechados = condominios.length > 0 ? Math.round((condsFechados / condominios.length) * 100) : 0;
    const pctTerrConc = territorios.length > 0 ? Math.round((conc / territorios.length) * 100) : 0;
    const pctQuadras = totalQuadras > 0 ? Math.round((quadrasFechadas / totalQuadras) * 100) : 0;

    // Tendência: total de aptos / média de cartas por dia (baseado em registros com data)
    const avgCartasDia = 10; // placeholder conservador
    const mesesRestantes = avgCartasDia > 0 ? Math.ceil(totalPendentes / (avgCartasDia * 22)) : null;

    // Tabela por território
    const terrRows = territorios.map(t => {
      const status = getTerritorioStatus(t.num, registros);
      const condsTerr = condominios.filter(c => c.territorio === t.num);
      const aptos = condsTerr.reduce((s, c) => s + (c.total_aptos || 0), 0);
      const cartas = condsTerr.reduce((s, c) => s + (c.cartas_enviadas || 0), 0);
      const pct = aptos > 0 ? Math.round((cartas / aptos) * 100) : 0;
      const fechados = condsTerr.filter(c => c.fechado === 'SIM').length;
      const pctFech = condsTerr.length > 0 ? Math.round((fechados / condsTerr.length) * 100) : 0;
      return { id: t.id, num: t.num, mapeado: t.mapeado, interno: t.interno, status, aptos, cartas, pct, conds: condsTerr.length, fechados, pctFech };
    }).sort((a, b) => Number(a.num) - Number(b.num));

    return {
      totalAptos, totalCartas, totalPendentes, pctCartas,
      totalQuadras, quadrasFechadas, pctQuadras,
      conc, and, livre, pctTerrConc,
      totalConds: condominios.length, condsFechados, pctCondsFechados,
      mesesRestantes, terrRows,
    };
  }, [loading, territorios, condominios, registros]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const statusColor = { concluido: 'text-geo-green', andamento: 'text-geo-orange', livre: 'text-geo-red' };
  const statusLabel = { concluido: 'SIM', andamento: 'EM ANDAMENTO', livre: 'NÃO' };

  return (
    <div className="h-full overflow-y-auto p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-crimson text-3xl text-primary tracking-wide">MAPEAMENTO DOS CONDOMÍNIOS</h1>
        <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5">Território Cond. Jardim Paulista</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <StatCard value={stats.totalAptos.toLocaleString('pt-BR')} label="Aptos levantados" color="text-primary" />
        <StatCard value={`${stats.totalCartas.toLocaleString('pt-BR')} (${stats.pctCartas}%)`} label="Cartas enviadas" color="text-geo-green" />
        <StatCard value={`${stats.totalPendentes.toLocaleString('pt-BR')} (${100 - stats.pctCartas}%)`} label="Cartas pendentes" color="text-geo-orange" />
        <StatCard value={`${stats.mesesRestantes ?? '?'} meses`} label="Tendência fechamento" color="text-geo-purple" />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Metrics */}
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-1">
          <div className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-2">📊 Resumo Operacional</div>

          <MetricRow label="Quadras totais" value={stats.totalQuadras} />
          <MetricRow
            label="Quadras fechadas"
            value={`${stats.quadrasFechadas} (${stats.pctQuadras}%)`}
            valueColor="text-geo-green"
          />
          <MetricRow label="Territórios totais" value={territorios.length} />
          <MetricRow label="Territórios concluídos" value={`${stats.conc} (${stats.pctTerrConc}%)`} valueColor="text-geo-green" />
          <MetricRow label="Territórios em andamento" value={stats.and} valueColor="text-geo-orange" />
          <MetricRow label="Territórios sem designação" value={stats.livre} valueColor="text-geo-red" />
          <MetricRow label="Condomínios levantados" value={stats.totalConds} />
          <MetricRow
            label="Condomínios fechados"
            value={`${stats.condsFechados} (${stats.pctCondsFechados}%)`}
            valueColor="text-geo-green"
          />

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Progresso geral de cartas</span>
              <span className="text-primary font-bold">{stats.pctCartas}%</span>
            </div>
            <div className="w-full bg-muted rounded h-2.5 overflow-hidden">
              <div
                className="h-full bg-geo-green rounded transition-all duration-700"
                style={{ width: `${stats.pctCartas}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] mt-1">
              <span className="text-geo-green">{stats.totalCartas.toLocaleString('pt-BR')} enviadas</span>
              <span className="text-geo-orange">{stats.totalPendentes.toLocaleString('pt-BR')} pendentes</span>
            </div>
          </div>
        </div>

        {/* Right: Territory table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-border text-[11px] font-bold tracking-wider uppercase">
            📋 Status por Território
          </div>
          <div className="overflow-auto flex-1 max-h-[380px]">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-background sticky top-0 z-10">
                <tr>
                  {['Terr.', 'Mapeado?', 'Fechado?', 'Aptos', 'Cartas', '%'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.terrRows.map(r => (
                  <TerritoryStatusRow key={r.num} row={r} onUpdate={handleUpdate} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}