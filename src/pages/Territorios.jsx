import { useState } from 'react';
import { useTerritorios, useCondominios, useRegistrosS13, getTerritorioStatus } from '../lib/useGeoData';
import TerritoryGrid from '../components/TerritoryGrid';
import TerritoryPanel from '../components/TerritoryPanel';

export default function Territorios() {
  const { territorios, loading: lt } = useTerritorios();
  const { condominios, loading: lc } = useCondominios();
  const { registros, loading: lr, refetch: refetchS13 } = useRegistrosS13();
  const [selected, setSelected] = useState(null);

  const loading = lt || lc || lr;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const stats = {
    conc: territorios.filter(t => getTerritorioStatus(t.num, registros) === 'concluido').length,
    and: territorios.filter(t => getTerritorioStatus(t.num, registros) === 'andamento').length,
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-[#10131f] border-b border-border px-4 py-2.5 flex items-center justify-between gap-2.5 flex-wrap shrink-0">
        <div className="flex gap-3.5 items-center flex-wrap">
          <span className="text-[11px] font-bold tracking-wider">33 TERRITÓRIOS — JARDIM PAULISTA</span>
          <div className="flex gap-2 text-[10px] items-center">
            <span className="w-2 h-2 rounded-full bg-geo-green inline-block" /> Concluído
            <span className="w-2 h-2 rounded-full bg-geo-orange inline-block ml-1" /> Andamento
            <span className="w-2 h-2 rounded-full bg-muted-foreground inline-block ml-1" /> Livre
            <span className="w-2 h-2 rounded-full bg-geo-red inline-block ml-1" /> Não mapeado
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-3.5">
          <TerritoryGrid
            territorios={territorios}
            registros={registros}
            selected={selected}
            onSelect={setSelected}
          />
        </div>

        {/* Right panel */}
        <div className="w-[340px] bg-card border-l border-border flex flex-col overflow-hidden shrink-0 hidden lg:flex">
          <TerritoryPanel
            territorio={selected ? territorios.find(t => t.num === selected) : null}
            condominios={condominios}
            registros={registros}
            onRegistered={refetchS13}
          />
        </div>
      </div>
    </div>
  );
}