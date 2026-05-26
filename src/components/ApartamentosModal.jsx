import { useState, useEffect, useMemo } from 'react';
import { geoterritoriosApi } from '@/api/geoterritoriosClient';
import { toast } from 'sonner';
import { X, Save } from 'lucide-react';

export default function ApartamentosModal({ condominio, onClose }) {
  const [aptos, setAptos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroUso, setFiltroUso] = useState('Todos os usos');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [changed, setChanged] = useState({});

  useEffect(() => {
    setLoading(true);
    geoterritoriosApi.entities.Apartamento.filter({ condominio_id: condominio.id }, 'complemento', 2000)
      .then(res => setAptos(res))
      .finally(() => setLoading(false));
  }, [condominio.id]);

  const usos = useMemo(() => ['Todos os usos', ...new Set(aptos.map(a => a.uso).filter(Boolean))], [aptos]);

  const filtered = useMemo(() => aptos.filter(a => {
    if (busca && !(a.complemento || '').toLowerCase().includes(busca.toLowerCase())) return false;
    if (filtroUso !== 'Todos os usos' && a.uso !== filtroUso) return false;
    if (filtroStatus === 'Enviadas' && !a.carta_enviada) return false;
    if (filtroStatus === 'Pendentes' && a.carta_enviada) return false;
    return true;
  }), [aptos, busca, filtroUso, filtroStatus]);

  const cartasEnviadas = aptos.filter(a => a.carta_enviada).length;
  const pct = aptos.length > 0 ? Math.round((cartasEnviadas / aptos.length) * 100) : 0;

  const updateLocal = (id, field, value) => {
    setAptos(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
    setChanged(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));
  };

  const toggleCarta = (apto) => updateLocal(apto.id, 'carta_enviada', !apto.carta_enviada);

  const markAll = (val) => {
    filtered.forEach(a => updateLocal(a.id, 'carta_enviada', val));
  };

  const handleSave = async () => {
    const ids = Object.keys(changed);
    if (ids.length === 0) { onClose(); return; }
    setSaving(true);
    await Promise.all(ids.map(id => geoterritoriosApi.entities.Apartamento.update(id, changed[id])));
    toast.success(`${ids.length} apartamento(s) atualizado(s)`);
    setSaving(false);
    setChanged({});
    onClose();
  };

  const handleExcel = () => {
    const rows = [['Complemento','Logradouro','Nº','Lote','Uso','Área m²','Carta Enviada','Publicador']];
    aptos.forEach(a => rows.push([a.complemento,a.logradouro||'',a.numero||'',a.lote||'',a.uso||'',a.area||'',a.carta_enviada?'SIM':'NÃO',a.publicador||'']));
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${condominio.nome}_aptos.csv`; a.click();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-start justify-between gap-4 shrink-0">
          <div>
            <h2 className="font-crimson text-2xl text-primary">{condominio.nome}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{condominio.endereco} · CEP {condominio.cep} · Território {condominio.territorio}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 px-6 py-3 border-b border-border shrink-0">
          {[
            { val: aptos.length, label: 'TOTAL', color: 'text-foreground' },
            { val: cartasEnviadas, label: 'CARTAS ENVIADAS', color: 'text-geo-green' },
            { val: aptos.length - cartasEnviadas, label: 'PENDENTES', color: 'text-geo-orange' },
            { val: `${pct}%`, label: '% COBERTO', color: 'text-geo-purple' },
          ].map(s => (
            <div key={s.label} className="bg-background border border-border rounded-lg p-3 text-center">
              <div className={`font-crimson text-3xl font-medium ${s.color}`}>{s.val}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="px-6 py-2 shrink-0">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>Progresso de envio de cartas</span>
            <span className="text-primary font-bold">{pct}%</span>
          </div>
          <div className="w-full bg-muted rounded h-2 overflow-hidden">
            <div className="h-full bg-geo-green rounded transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-2 border-b border-border flex gap-2 flex-wrap items-center shrink-0">
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="🔍 Buscar unidade..."
            className="bg-background border border-border text-foreground px-2.5 py-1.5 rounded-md font-syne text-[11px] focus:border-primary outline-none w-40"
          />
          <select value={filtroUso} onChange={e => setFiltroUso(e.target.value)}
            className="bg-background border border-border text-foreground px-2.5 py-1.5 rounded-md font-syne text-[11px] focus:border-primary outline-none">
            {usos.map(u => <option key={u}>{u}</option>)}
          </select>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
            className="bg-background border border-border text-foreground px-2.5 py-1.5 rounded-md font-syne text-[11px] focus:border-primary outline-none">
            <option>Todos</option>
            <option>Enviadas</option>
            <option>Pendentes</option>
          </select>
          <button onClick={() => markAll(true)}
            className="px-3 py-1.5 rounded-md bg-geo-green text-white font-syne text-[11px] font-bold hover:opacity-90 flex items-center gap-1">
            ✓ Marcar todos visíveis
          </button>
          <button onClick={() => markAll(false)}
            className="px-3 py-1.5 rounded-md bg-geo-red text-white font-syne text-[11px] font-bold hover:opacity-90 flex items-center gap-1">
            ✕ Desmarcar todos visíveis
          </button>
          <button onClick={handleExcel}
            className="px-3 py-1.5 rounded-md bg-geo-green/15 border border-geo-green/30 text-geo-green font-syne text-[11px] font-bold hover:bg-geo-green/25">
            ↓ Excel
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead className="bg-[#10131f] sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 w-8 border-b border-border"></th>
                  {['Unidade / Complemento','Logradouro','Nº','Lote','Uso','Área m²','Carta Enviada','Publicador'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center text-muted-foreground py-8 italic">Nenhum apartamento encontrado</td></tr>
                ) : filtered.map(a => (
                  <tr key={a.id} className={`transition-colors hover:bg-primary/[0.04] ${a.carta_enviada ? 'bg-geo-green/[0.03]' : ''}`}>
                    <td className="px-3 py-2.5 border-b border-border">
                      <div
                        onClick={() => toggleCarta(a)}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${a.carta_enviada ? 'bg-geo-green border-geo-green' : 'border-muted-foreground hover:border-primary'}`}
                      >
                        {a.carta_enviada && <span className="text-[9px] text-black font-bold">✓</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 border-b border-border font-medium">{a.complemento}</td>
                    <td className="px-3 py-2.5 border-b border-border text-muted-foreground">{a.logradouro || '—'}</td>
                    <td className="px-3 py-2.5 border-b border-border text-muted-foreground">{a.numero || '—'}</td>
                    <td className="px-3 py-2.5 border-b border-border text-muted-foreground">{a.lote || '—'}</td>
                    <td className="px-3 py-2.5 border-b border-border">
                      {a.uso ? <span className="px-1.5 py-0.5 rounded bg-geo-blue/15 text-geo-blue text-[10px] font-bold">{a.uso}</span> : '—'}
                    </td>
                    <td className="px-3 py-2.5 border-b border-border text-muted-foreground">{a.area || '—'}</td>
                    <td className="px-3 py-2.5 border-b border-border">
                      {a.carta_enviada
                        ? <span className="px-2 py-0.5 rounded bg-geo-green/20 text-geo-green text-[10px] font-bold">✓ Enviada</span>
                        : <span className="text-muted-foreground text-[10px]">—</span>}
                    </td>
                    <td className="px-3 py-2.5 border-b border-border">
                      <input
                        value={a.publicador || ''}
                        onChange={e => updateLocal(a.id, 'publicador', e.target.value)}
                        placeholder="—"
                        className="bg-transparent border-b border-border/50 focus:border-primary outline-none text-[11px] w-24 py-0.5"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex justify-end gap-2 shrink-0">
          <button onClick={onClose} className="px-5 py-2 rounded-md bg-muted text-muted-foreground font-syne text-[11px] font-bold hover:bg-border">
            Fechar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-md bg-geo-green text-white font-syne text-[11px] font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}