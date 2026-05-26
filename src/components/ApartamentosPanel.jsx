import { useState, useEffect } from 'react';
import { geoterritoriosApi } from '@/api/geoterritoriosClient';
import Pill from './Pill';
import { toast } from 'sonner';

export default function ApartamentosPanel({ condominio }) {
  const [aptos, setAptos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    if (!condominio) return;
    setLoading(true);
    geoterritoriosApi.entities.Apartamento.filter({ condominio_id: condominio.id }, 'complemento', 200)
      .then(res => setAptos(res))
      .finally(() => setLoading(false));
  }, [condominio?.id]);

  if (!condominio) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2.5 text-muted-foreground p-6 text-center text-xs">
        <div className="text-[30px] opacity-35">🏢</div>
        <p>Clique em um condomínio<br />para ver os apartamentos</p>
      </div>
    );
  }

  const toggleCarta = async (apto) => {
    setSaving(apto.id);
    await geoterritoriosApi.entities.Apartamento.update(apto.id, { carta_enviada: !apto.carta_enviada });
    setAptos(prev => prev.map(a => a.id === apto.id ? { ...a, carta_enviada: !apto.carta_enviada } : a));
    setSaving(null);
  };

  const updatePublicador = async (apto, value) => {
    await geoterritoriosApi.entities.Apartamento.update(apto.id, { publicador: value });
    setAptos(prev => prev.map(a => a.id === apto.id ? { ...a, publicador: value } : a));
  };

  const cartasEnviadas = aptos.filter(a => a.carta_enviada).length;
  const pct = aptos.length > 0 ? Math.round((cartasEnviadas / aptos.length) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
      {/* Header */}
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Condomínio</div>
        <div className="font-crimson text-2xl font-medium leading-tight">{condominio.nome}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{condominio.endereco}</div>
      </div>

      <div className="h-px bg-border" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-background border border-border rounded-lg p-2.5 text-center">
          <div className="font-crimson text-2xl text-primary">{aptos.length}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Aptos</div>
        </div>
        <div className="bg-background border border-border rounded-lg p-2.5 text-center">
          <div className="font-crimson text-2xl text-geo-green">{cartasEnviadas}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Cartas</div>
        </div>
        <div className="bg-background border border-border rounded-lg p-2.5 text-center">
          <div className={`font-crimson text-2xl ${pct >= 80 ? 'text-geo-green' : pct >= 40 ? 'text-primary' : 'text-geo-red'}`}>{pct}%</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Cobertura</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded h-1.5 overflow-hidden">
        <div className="h-full bg-geo-green rounded transition-all" style={{ width: `${pct}%` }} />
      </div>

      {/* Apartment list */}
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-border text-[10px] font-bold tracking-wider uppercase">
          Apartamentos — clique para marcar carta enviada
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : aptos.length === 0 ? (
          <div className="px-3 py-6 text-center text-muted-foreground text-[11px] italic">Nenhum apartamento cadastrado</div>
        ) : (
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border">
            {aptos.map(a => (
              <div key={a.id} className={`px-3 py-2.5 flex items-center gap-2 transition-colors cursor-pointer hover:bg-primary/[0.04] ${a.carta_enviada ? 'bg-geo-green/[0.04]' : ''}`}
                onClick={() => toggleCarta(a)}>
                {/* Checkbox visual */}
                <div className={`w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center transition-all ${a.carta_enviada ? 'bg-geo-green border-geo-green' : 'border-muted-foreground'}`}>
                  {a.carta_enviada && <span className="text-[10px] text-black font-bold">✓</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium">{a.complemento}</div>
                  {a.uso && <div className="text-[10px] text-muted-foreground">{a.uso}</div>}
                </div>
                {saving === a.id && <div className="w-3 h-3 border-2 border-muted border-t-primary rounded-full animate-spin shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Marcar todos */}
      {aptos.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={async () => {
              setSaving('all');
              await Promise.all(aptos.filter(a => !a.carta_enviada).map(a =>
                geoterritoriosApi.entities.Apartamento.update(a.id, { carta_enviada: true })
              ));
              setAptos(prev => prev.map(a => ({ ...a, carta_enviada: true })));
              setSaving(null);
              toast.success('Todas as cartas marcadas!');
            }}
            className="flex-1 py-2 rounded-md bg-geo-green/10 border border-geo-green/30 text-geo-green font-syne text-[11px] font-bold hover:bg-geo-green/20 transition-colors"
          >
            ✓ Marcar Todas
          </button>
          <button
            onClick={async () => {
              setSaving('all');
              await Promise.all(aptos.filter(a => a.carta_enviada).map(a =>
                geoterritoriosApi.entities.Apartamento.update(a.id, { carta_enviada: false })
              ));
              setAptos(prev => prev.map(a => ({ ...a, carta_enviada: false })));
              setSaving(null);
            }}
            className="flex-1 py-2 rounded-md bg-geo-red/10 border border-geo-red/30 text-geo-red font-syne text-[11px] font-bold hover:bg-geo-red/20 transition-colors"
          >
            ✕ Desmarcar Todas
          </button>
        </div>
      )}
    </div>
  );
}