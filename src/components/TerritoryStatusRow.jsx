import { useState } from 'react';
import { geoterritoriosApi } from '@/api/geoterritoriosClient';
import { toast } from 'sonner';
import { ChevronDown, Check, X } from 'lucide-react';

export default function TerritoryStatusRow({ row, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [mapeado, setMapeado] = useState(row.mapeado || 'NAO');
  const [interno, setInterno] = useState(row.interno || 'NAO');
  const [saving, setSaving] = useState(false);

  // Display values — use local state when edited, otherwise row prop
  const displayMapeado = mapeado;

  const statusColor = { concluido: 'text-geo-green', andamento: 'text-geo-orange', livre: 'text-geo-red' };
  const statusLabel = { concluido: 'SIM', andamento: 'EM ANDAMENTO', livre: 'NÃO' };

  const handleSave = async (e) => {
    e.stopPropagation();
    setSaving(true);
    try {
      await geoterritoriosApi.entities.Territorio.update(row.id, { mapeado, interno });
      toast.success(`Território ${row.num} atualizado`);
      setEditing(false);
      onUpdate();
    } catch (err) {
      toast.error('Erro ao salvar: ' + err.message);
    }
    setSaving(false);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setMapeado(row.mapeado || 'NAO');
    setInterno(row.interno || 'NAO');
    setEditing(false);
  };

  return (
    <>
      <tr
        onClick={(e) => { if (editing) return; setExpanded(v => !v); }}
        className="hover:bg-primary/[0.08] transition-colors cursor-pointer"
      >
        <td className="px-3 py-2 border-b border-border font-bold text-primary">
          <div className="flex items-center gap-2">
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            {String(row.num).padStart(2, '0')}
          </div>
        </td>
        <td className="px-3 py-2 border-b border-border">
          <span className={displayMapeado === 'SIM' ? 'text-geo-green font-bold' : 'text-muted-foreground'}>
            {displayMapeado === 'SIM' ? 'SIM' : 'NÃO'}
          </span>
        </td>
        <td className="px-3 py-2 border-b border-border">
          <span className={(statusColor[row.status] || 'text-muted-foreground') + ' font-bold text-[10px]'}>
            {statusLabel[row.status] || '-'}
          </span>
        </td>
        <td className="px-3 py-2 border-b border-border">{row.aptos}</td>
        <td className="px-3 py-2 border-b border-border text-geo-green font-bold">{row.cartas}</td>
        <td className="px-3 py-2 border-b border-border">
          <div className="flex items-center gap-1.5">
            <div className="w-10 bg-muted rounded h-1.5 overflow-hidden">
              <div className="h-full bg-primary rounded" style={{ width: `${row.pct}%` }} />
            </div>
            <span className="text-primary font-bold">{row.pct}%</span>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-background border-b border-border">
          <td colSpan="6" className="px-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Resumo */}
              <div className="space-y-1.5 text-[11px]">
                <div className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-2">📊 Resumo</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Condomínios:</span><span className="font-bold">{row.conds}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Fechados:</span><span className="font-bold text-geo-green">{row.fechados} ({row.pctFech}%)</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total aptos:</span><span className="font-bold">{row.aptos}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cartas enviadas:</span><span className="font-bold text-geo-green">{row.cartas}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Pendentes:</span><span className="font-bold text-geo-orange">{row.aptos - row.cartas}</span></div>
                <div className="h-px bg-border my-1" />
                <div className="flex justify-between"><span className="text-muted-foreground">Progresso:</span><span className="font-bold text-primary">{row.pct}%</span></div>
              </div>

              {/* Edição */}
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                <div className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-2">✏️ Editar</div>
                {!editing ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                    className="w-full px-3 py-2 rounded-md bg-primary text-primary-foreground text-[11px] font-bold hover:opacity-90"
                  >
                    Editar Mapeado e Interno
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[9px] text-muted-foreground font-bold block mb-1">MAPEADO</label>
                      <select
                        value={mapeado}
                        onChange={(e) => { e.stopPropagation(); setMapeado(e.target.value); }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-3 py-2 rounded-md bg-input border border-border text-[11px] font-bold"
                      >
                        <option value="SIM">✓ SIM</option>
                        <option value="NAO">✗ NÃO</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground font-bold block mb-1">INTERNO</label>
                      <select
                        value={interno}
                        onChange={(e) => { e.stopPropagation(); setInterno(e.target.value); }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-3 py-2 rounded-md bg-input border border-border text-[11px] font-bold"
                      >
                        <option value="SIM">✓ SIM</option>
                        <option value="NAO">✗ NÃO</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 px-3 py-2 rounded-md bg-geo-green text-white text-[10px] font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <Check className="w-3 h-3" /> {saving ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 px-3 py-2 rounded-md bg-muted text-muted-foreground text-[10px] font-bold hover:bg-border flex items-center justify-center gap-1"
                      >
                        <X className="w-3 h-3" /> Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}