import { useState, useMemo, useRef } from 'react';
import { geoterritoriosApi } from '@/api/geoterritoriosClient';
import { useCondominios, useTerritorios } from '../lib/useGeoData';

export default function Etiquetas() {
  const { condominios, loading: lc } = useCondominios();
  const { territorios, loading: lt } = useTerritorios();
  const [filtroTerr, setFiltroTerr] = useState('');
  const [filtroQuadra, setFiltroQuadra] = useState('Todos');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [selectedConds, setSelectedConds] = useState(new Set());
  const [aptosPorCond, setAptosPorCond] = useState({});
  const [loadingAptos, setLoadingAptos] = useState(false);
  const [preview, setPreview] = useState(false);
  const printRef = useRef();

  const loading = lc || lt;

  const terrNums = useMemo(() =>
    [...new Set(condominios.map(c => c.territorio))].sort((a, b) => Number(a) - Number(b)),
    [condominios]
  );

  const quadras = useMemo(() => {
    if (!filtroTerr) return [];
    return [...new Set(condominios.filter(c => c.territorio === filtroTerr).map(c => c.quadra))].sort();
  }, [condominios, filtroTerr]);

  const condsFiltrados = useMemo(() => {
    if (!filtroTerr) return [];
    return condominios.filter(c => {
      if (c.territorio !== filtroTerr) return false;
      if (filtroQuadra !== 'Todos' && c.quadra !== filtroQuadra) return false;
      return true;
    });
  }, [condominios, filtroTerr, filtroQuadra]);

  // Sync selectedConds when condsFiltrados changes
  const condsFiltradosKey = condsFiltrados.map(c => c.id).join(',');
  useMemo(() => {
    if (condsFiltrados.length > 0) {
      setSelectedConds(new Set(condsFiltrados.map(c => c.id)));
    }
  }, [condsFiltradosKey]);

  const toggleCond = (id) => {
    setSelectedConds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const etiquetasBase = useMemo(() => {
    return condsFiltrados.filter(c => selectedConds.has(c.id));
  }, [condsFiltrados, selectedConds]);

  // Build flat list of rows from aptos (or from condominios if no aptos loaded)
  const etiquetasRows = useMemo(() => {
    const rows = [];
    for (const c of etiquetasBase) {
      const aptos = aptosPorCond[c.id];
      if (aptos && aptos.length > 0) {
        for (const a of aptos) {
          if (filtroStatus === 'Enviadas' && !a.carta_enviada) continue;
          if (filtroStatus === 'Pendentes' && a.carta_enviada) continue;
          rows.push({ cond: c, apto: a });
        }
      } else {
        // Fallback: one row per condomínio
        if (filtroStatus === 'Enviadas' && c.fechado !== 'SIM') continue;
        if (filtroStatus === 'Pendentes' && c.fechado === 'SIM') continue;
        rows.push({ cond: c, apto: null });
      }
    }
    return rows;
  }, [etiquetasBase, aptosPorCond, filtroStatus]);

  const loadAptos = async () => {
    setLoadingAptos(true);
    const toLoad = etiquetasBase.filter(c => !aptosPorCond[c.id]);
    const results = await Promise.all(
      toLoad.map(c => geoterritoriosApi.entities.Apartamento.filter({ condominio_id: c.id }, 'complemento', 2000)
        .then(aptos => ({ id: c.id, aptos })))
    );
    setAptosPorCond(prev => {
      const next = { ...prev };
      results.forEach(r => { next[r.id] = r.aptos; });
      return next;
    });
    setLoadingAptos(false);
    setPreview(true);
  };

  const handlePreview = async () => {
    if (!preview) {
      await loadAptos();
    } else {
      setPreview(false);
    }
  };

  const handlePrint = async () => {
    if (Object.keys(aptosPorCond).length === 0) await loadAptos();
    setTimeout(() => {
      const printContents = printRef.current.innerHTML;
      const win = window.open('', '_blank');
      win.document.write(`
        <html>
          <head>
            <title>Etiquetas - Território ${filtroTerr}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; background: white; }
              .page { padding: 10mm; }
              .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }
              .etiqueta {
                border: 1px solid #ccc; border-radius: 4px; padding: 6px 8px;
                min-height: 28mm; display: flex; flex-direction: column;
                justify-content: center; page-break-inside: avoid;
              }
              .terr { font-size: 8px; color: #666; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
              .nome { font-size: 11px; font-weight: bold; color: #111; line-height: 1.2; margin-bottom: 3px; }
              .apto { font-size: 10px; font-weight: bold; color: #333; margin-bottom: 2px; }
              .end { font-size: 9px; color: #333; line-height: 1.3; }
              .cep { font-size: 9px; color: #555; margin-top: 2px; }
              .enviada { display: inline-block; font-size: 7px; font-weight: bold; color: #16a34a; border: 1px solid #16a34a; border-radius: 3px; padding: 0 3px; margin-top: 3px; }
              @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            </style>
          </head>
          <body><div class="page"><div class="grid">${printContents}</div></div></body>
        </html>
      `);
      win.document.close();
      setTimeout(() => { win.print(); }, 300);
    }, 100);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 flex flex-col gap-4">
      {/* Filtros */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-1.5 mb-4">
          <span className="text-primary text-lg">🏷️</span>
          <h2 className="font-bold text-sm tracking-wide uppercase">Impressão de Etiquetas por Quadra</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
          {/* Território */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Território</label>
            <select
              value={filtroTerr}
              onChange={e => { setFiltroTerr(e.target.value); setFiltroQuadra('Todos'); setPreview(false); setAptosPorCond({}); }}
              className="bg-background border border-border text-foreground px-2.5 py-1.5 rounded-md font-syne text-[11px] focus:border-primary outline-none"
            >
              <option value="">Selecione...</option>
              {terrNums.map(t => <option key={t} value={t}>Território {t}</option>)}
            </select>
          </div>

          {/* Quadra */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Quadra</label>
            <select
              value={filtroQuadra}
              onChange={e => { setFiltroQuadra(e.target.value); setPreview(false); setAptosPorCond({}); }}
              disabled={!filtroTerr}
              className="bg-background border border-border text-foreground px-2.5 py-1.5 rounded-md font-syne text-[11px] focus:border-primary outline-none disabled:opacity-40"
            >
              <option value="Todos">Todas</option>
              {quadras.map(q => <option key={q} value={q}>Quadra {q}</option>)}
            </select>
          </div>

          {/* Condomínio (info) */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Condomínio (opcional)</label>
            <select
              disabled={!filtroTerr}
              defaultValue="Todos"
              className="bg-background border border-border text-foreground px-2.5 py-1.5 rounded-md font-syne text-[11px] focus:border-primary outline-none disabled:opacity-40"
              onChange={() => {}}
            >
              <option value="Todos">Todos ({condsFiltrados.length} condomínios)</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Status Carta</label>
            <select
              value={filtroStatus}
              onChange={e => { setFiltroStatus(e.target.value); setPreview(false); }}
              className="bg-background border border-border text-foreground px-2.5 py-1.5 rounded-md font-syne text-[11px] focus:border-primary outline-none"
            >
              <option value="Todos">Todos</option>
              <option value="Pendentes">Pendentes</option>
              <option value="Enviadas">Enviadas</option>
            </select>
          </div>

          {/* Botões */}
          <div className="flex gap-2">
            <button
              onClick={handlePreview}
              disabled={!filtroTerr || loadingAptos}
              className="flex-1 py-1.5 px-3 rounded-md bg-primary text-primary-foreground font-syne text-[11px] font-bold hover:opacity-90 disabled:opacity-40 whitespace-nowrap"
            >
              {loadingAptos ? '⏳ Carregando...' : '👁 Pré-visualizar'}
            </button>
            <button
              onClick={handlePrint}
              disabled={!filtroTerr || etiquetasBase.length === 0}
              className="flex-1 py-1.5 px-3 rounded-md bg-geo-green text-background font-syne text-[11px] font-bold hover:opacity-90 disabled:opacity-40 whitespace-nowrap"
            >
              🖨 Gerar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Info count + seleção de condomínios */}
      {filtroTerr && (
        <div className="bg-card border border-border rounded-lg p-3 flex flex-col gap-3">
          <div className="text-[11px] text-muted-foreground">
            {etiquetasRows.length} etiqueta{etiquetasRows.length !== 1 ? 's' : ''} no filtro atual
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">Selecione os condomínios:</div>
            <div className="flex flex-wrap gap-2 items-center">
              <button onClick={() => setSelectedConds(new Set(condsFiltrados.map(c => c.id)))}
                className="text-[11px] font-bold text-geo-green hover:underline">✓ Todos</button>
              <button onClick={() => setSelectedConds(new Set())}
                className="text-[11px] font-bold text-geo-red hover:underline">✕ Nenhum</button>
              {condsFiltrados.map(c => {
                const sel = selectedConds.has(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCond(c.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-bold transition-colors ${sel ? 'bg-geo-blue/15 border-geo-blue/40 text-geo-blue' : 'bg-background border-border text-muted-foreground opacity-50'}`}
                  >
                    <div className={`w-3 h-3 rounded border flex items-center justify-center ${sel ? 'bg-geo-blue border-geo-blue' : 'border-muted-foreground'}`}>
                      {sel && <span className="text-[8px] text-white font-bold">✓</span>}
                    </div>
                    {c.nome.toUpperCase()} <span className="opacity-70">({c.total_aptos || 0})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Preview tabela */}
      {preview && etiquetasRows.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border text-[11px] font-bold uppercase tracking-wider">
            Pré-visualização (primeiras 50 linhas) · {etiquetasRows.length} etiquetas
          </div>
          <div className="overflow-auto max-h-[400px]">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-[#10131f] sticky top-0 z-10">
                <tr>
                  {['Terr', 'Quad', 'CD', 'Nº', 'Nome do Condomínio', 'Apartamento', 'Endereço', 'CEP', 'Carta'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {etiquetasRows.slice(0, 50).map((row, i) => (
                  <tr key={i} className="hover:bg-primary/[0.04] border-b border-border">
                    <td className="px-3 py-2 text-primary font-bold">{row.cond.territorio}</td>
                    <td className="px-3 py-2 text-primary font-bold">{row.cond.quadra || '—'}</td>
                    <td className="px-3 py-2 text-muted-foreground">CD {String(i + 1).padStart(2, '0')}</td>
                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{row.cond.nome.toUpperCase()}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.apto ? row.apto.complemento.toUpperCase() : '—'}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.apto?.logradouro || row.cond.endereco || '—'}</td>
                    <td className="px-3 py-2 font-bold text-primary">{row.cond.cep || '—'}</td>
                    <td className="px-3 py-2">{row.apto?.carta_enviada ? <span className="text-geo-green font-bold">✓</span> : <span className="text-muted-foreground">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {etiquetasRows.length > 50 && (
              <div className="text-center py-3 text-[11px] text-muted-foreground italic">
                ... e mais {etiquetasRows.length - 50} etiquetas
              </div>
            )}
          </div>
        </div>
      )}

      {!filtroTerr && (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-4xl mb-3">🏷️</div>
          <div className="text-sm font-bold">Selecione um território para começar</div>
          <div className="text-xs mt-1">Filtre por quadra e status de carta, depois pré-visualize ou gere o PDF.</div>
        </div>
      )}

      {/* Hidden print content */}
      <div className="hidden">
        <div ref={printRef}>
          {etiquetasRows.map((row, i) => (
            <div key={i} className="etiqueta">
              <div className="terr">Terr. {row.cond.territorio}{row.cond.quadra ? ` · Quadra ${row.cond.quadra}` : ''}</div>
              <div className="nome">{row.cond.nome}</div>
              {row.apto && <div className="apto">{row.apto.complemento}</div>}
              <div className="end">{row.apto?.logradouro || row.cond.endereco}</div>
              {row.cond.cep && <div className="cep">CEP: {row.cond.cep}</div>}
              {row.apto?.carta_enviada && <span className="enviada">CARTA ENVIADA</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}