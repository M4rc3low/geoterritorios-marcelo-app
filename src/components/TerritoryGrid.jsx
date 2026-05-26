import { getTerritorioStatus } from '../lib/useGeoData';

const STATUS_STYLES = {
  livre: 'border-border bg-card',
  andamento: 'border-geo-orange/45 bg-geo-orange/5',
  concluido: 'border-geo-green/40 bg-geo-green/[0.04]',
};

const NUM_COLORS = {
  livre: 'text-muted-foreground',
  andamento: 'text-geo-orange',
  concluido: 'text-geo-green',
};

const PILL_STYLES = {
  livre: 'bg-muted-foreground/15 text-muted-foreground',
  andamento: 'bg-geo-orange/15 text-geo-orange',
  concluido: 'bg-geo-green/12 text-geo-green',
};

export default function TerritoryGrid({ territorios, registros, selected, onSelect }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(78px,1fr))] gap-2">
      {territorios.map(t => {
        const status = getTerritorioStatus(t.num, registros);
        const isSel = selected === t.num;
        const isUnmapped = t.mapeado === 'NAO';

        return (
          <div
            key={t.num}
            onClick={() => onSelect(t.num)}
            className={`rounded-lg border p-2.5 px-1.5 cursor-pointer transition-all duration-200 flex flex-col items-center gap-1 relative select-none
              hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.4)]
              ${isUnmapped ? 'border-geo-red/30 bg-geo-red/[0.03]' : STATUS_STYLES[status]}
              ${isSel ? 'border-primary shadow-[0_0_0_2px_rgba(245,200,66,0.25)]' : ''}
            `}
          >
            <div className={`font-crimson text-[22px] font-medium leading-none ${isUnmapped ? 'text-geo-red' : NUM_COLORS[status]}`}>
              {t.num}
            </div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">
              {t.tipo}
            </div>
            <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 text-center
              ${isUnmapped ? 'bg-geo-red/10 text-geo-red' : PILL_STYLES[status]}
            `}>
              {isUnmapped ? 'N/M' : status === 'concluido' ? '✓' : status === 'andamento' ? '⏳' : '—'}
            </div>
          </div>
        );
      })}
    </div>
  );
}