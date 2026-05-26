import { useState } from 'react';
import { geoterritoriosApi } from '@/api/geoterritoriosClient';
import { useRegistrosS13 } from '../lib/useGeoData';
import StatCard from '../components/StatCard';
import Pill from '../components/Pill';
import { toast } from 'sonner';

export default function S13() {
  const { registros, loading, refetch } = useRegistrosS13();

  // Iniciar form
  const [fNum, setFNum] = useState('');
  const [fTipo, setFTipo] = useState('casas');
  const [fDes, setFDes] = useState('');
  const [fData, setFData] = useState('');
  const [fAno, setFAno] = useState('');
  const [fObs, setFObs] = useState('');
  const [fCamp, setFCamp] = useState(false);
  const [fConvCel, setFConvCel] = useState(0);
  const [fConvCong, setFConvCong] = useState(0);
  const [fPct, setFPct] = useState(0);

  // Concluir form
  const [cNum, setCNum] = useState('');
  const [cTipo, setCTipo] = useState('casas');
  const [cData, setCData] = useState('');
  const [cCamp, setCCamp] = useState(false);
  const [cPct, setCPct] = useState(100);

  const [filtro, setFiltro] = useState('');
  const [busca, setBusca] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const andamento = registros.filter(r => r.status === 'em_andamento').length;
  const concluidos = registros.filter(r => r.status === 'concluido').length;

  const filtered = registros.filter(r => {
    if (filtro && r.status !== filtro) return false;
    if (busca) {
      const s = busca.toLowerCase();
      return (r.territorio_num || '').includes(s) || (r.designado || '').toLowerCase().includes(s);
    }
    return true;
  });

  const handleIniciar = async () => {
    if (!fNum.trim() || !fDes.trim()) { toast.error('Preencha território e designado'); return; }
    setSaving(true);
    await geoterritoriosApi.entities.RegistroS13.create({
      territorio_num: fNum.trim().padStart(2, '0'),
      tipo: fTipo,
      designado: fDes.trim(),
      data_designacao: fData,
      ano: fAno,
      status: 'em_andamento',
      observacoes: fObs,
      campanha: fCamp,
      conv_celebracao: fConvCel,
      conv_congresso: fConvCong,
      pct_trabalhado: fPct,
    });
    toast.success('Designação registrada!');
    setFNum(''); setFDes(''); setFData(''); setFAno(''); setFObs('');
    setFCamp(false); setFConvCel(0); setFConvCong(0); setFPct(0);
    setSaving(false);
    refetch();
  };

  const handleConcluir = async () => {
    if (!cNum.trim()) { toast.error('Informe o território'); return; }
    const padded = cNum.trim().padStart(2, '0');
    const reg = registros.find(r => r.territorio_num === padded && r.status === 'em_andamento');
    if (!reg) { toast.error('Território não está em andamento'); return; }
    setSaving(true);
    await geoterritoriosApi.entities.RegistroS13.update(reg.id, {
      status: 'concluido',
      data_conclusao: cData || new Date().toISOString().split('T')[0],
      campanha: cCamp,
      pct_trabalhado: cPct,
    });
    toast.success('Conclusão registrada!');
    setCNum(''); setCData(''); setCCamp(false); setCPct(100);
    setSaving(false);
    refetch();
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir este registro?')) return;
    await geoterritoriosApi.entities.RegistroS13.delete(id);
    toast.success('Registro excluído');
    refetch();
  };

  const fmtD = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  const inputCls = "bg-background border border-border text-foreground px-2.5 py-2 rounded-md font-syne text-xs focus:border-primary outline-none transition-colors w-full";

  return (
    <div className="h-full overflow-y-auto p-5 flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2.5">
        <StatCard value={registros.length} label="Total registros" color="text-geo-purple" />
        <StatCard value={andamento} label="Em andamento" color="text-geo-orange" />
        <StatCard value={concluidos} label="Concluídos" color="text-geo-green" />
      </div>

      {/* Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Iniciar */}
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-2.5">
          <div className="font-crimson text-[15px] italic text-primary pb-2 border-b border-border">Iniciar Designação</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1"><label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Nº Território</label><input value={fNum} onChange={e => setFNum(e.target.value)} placeholder="ex: 01" className={inputCls} /></div>
            <div className="flex flex-col gap-1"><label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Tipo</label>
              <select value={fTipo} onChange={e => setFTipo(e.target.value)} className={inputCls}><option value="casas">Casas</option><option value="predios">Prédios</option><option value="comercial">Comercial</option><option value="outro">Outro</option></select></div>
          </div>
          <div className="flex flex-col gap-1"><label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Designado Para</label><input value={fDes} onChange={e => setFDes(e.target.value)} placeholder="Nome" className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1"><label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Data</label><input type="date" value={fData} onChange={e => setFData(e.target.value)} className={inputCls} /></div>
            <div className="flex flex-col gap-1"><label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Ano</label><input value={fAno} onChange={e => setFAno(e.target.value)} className={inputCls} /></div>
          </div>
          <div className="flex flex-col gap-1"><label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Observações</label><textarea value={fObs} onChange={e => setFObs(e.target.value)} placeholder="Opcional..." className={inputCls + ' min-h-[60px] resize-y'} /></div>
          <button onClick={handleIniciar} disabled={saving}
            className="w-full py-2.5 rounded-md bg-primary border border-primary text-primary-foreground font-syne text-[11px] font-bold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50">
            + Iniciar Território
          </button>
        </div>

        {/* Concluir */}
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-2.5">
          <div className="font-crimson text-[15px] italic text-primary pb-2 border-b border-border">Concluir Território</div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">Ou clique em <strong className="text-geo-green">✓</strong> na tabela abaixo.</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1"><label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Nº Território</label><input value={cNum} onChange={e => setCNum(e.target.value)} placeholder="ex: 01" className={inputCls} /></div>
            <div className="flex flex-col gap-1"><label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Tipo</label>
              <select value={cTipo} onChange={e => setCTipo(e.target.value)} className={inputCls}><option value="casas">Casas</option><option value="predios">Prédios</option><option value="comercial">Comercial</option><option value="outro">Outro</option></select></div>
          </div>
          <div className="flex flex-col gap-1"><label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Data de Conclusão</label><input type="date" value={cData} onChange={e => setCData(e.target.value)} className={inputCls} /></div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">% do Território Trabalhado</label>
            <div className="flex items-center gap-2.5">
              <input type="range" min="0" max="100" value={cPct} onChange={e => setCPct(Number(e.target.value))} className="flex-1 accent-geo-green" />
              <span className="text-[13px] font-bold text-geo-green min-w-[36px]">{cPct}%</span>
            </div>
          </div>
          <button onClick={handleConcluir} disabled={saving}
            className="w-full py-2.5 rounded-md bg-geo-green border border-geo-green text-black font-syne text-[11px] font-bold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50">
            ✓ Registrar Conclusão
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-[11px] font-bold tracking-wider uppercase">Histórico Completo</h3>
          <div className="flex gap-2 items-center">
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..."
              className="bg-background border border-border text-foreground px-2.5 py-1.5 rounded-md font-syne text-[11px] focus:border-primary outline-none transition-colors" />
            <select value={filtro} onChange={e => setFiltro(e.target.value)}
              className="bg-background border border-border text-foreground px-2.5 py-1.5 rounded-md font-syne text-[11px] focus:border-primary outline-none transition-colors">
              <option value="">Todos</option>
              <option value="em_andamento">Em andamento</option>
              <option value="concluido">Concluído</option>
            </select>
          </div>
        </div>
        <div className="overflow-auto max-h-[420px]">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-[#10131f] sticky top-0 z-10">
              <tr>
                {['Nº', 'Tipo', 'Designado', 'Designação', 'Conclusão', 'Ano', '% Trab.', 'Conv.Cel.', 'Conv.Cong.', 'Status', 'Ações'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11} className="text-center text-muted-foreground py-7 italic text-[13px]">Nenhum registro</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="hover:bg-primary/[0.04]">
                  <td className="px-3 py-2.5 border-b border-border"><Pill>{r.territorio_num}</Pill></td>
                  <td className="px-3 py-2.5 border-b border-border">{r.tipo}</td>
                  <td className="px-3 py-2.5 border-b border-border">{r.designado}</td>
                  <td className="px-3 py-2.5 border-b border-border">{fmtD(r.data_designacao)}</td>
                  <td className="px-3 py-2.5 border-b border-border">{fmtD(r.data_conclusao)}</td>
                  <td className="px-3 py-2.5 border-b border-border">{r.ano}</td>
                  <td className="px-3 py-2.5 border-b border-border font-bold text-primary">{r.pct_trabalhado || 0}%</td>
                  <td className="px-3 py-2.5 border-b border-border">{r.conv_celebracao || '—'}</td>
                  <td className="px-3 py-2.5 border-b border-border">{r.conv_congresso || '—'}</td>
                  <td className="px-3 py-2.5 border-b border-border">
                    <Pill variant={r.status === 'concluido' ? 'green' : 'orange'}>
                      {r.status === 'concluido' ? 'Concluído' : 'Andamento'}
                    </Pill>
                  </td>
                  <td className="px-3 py-2.5 border-b border-border">
                    <div className="flex gap-1">
                      {r.status === 'em_andamento' && (
                        <button
                          onClick={async () => {
                            await geoterritoriosApi.entities.RegistroS13.update(r.id, { status: 'concluido', data_conclusao: new Date().toISOString().split('T')[0], pct_trabalhado: 100 });
                            toast.success('Concluído!'); refetch();
                          }}
                          className="px-2 py-0.5 rounded border border-geo-green/35 text-geo-green text-[10px] font-bold hover:bg-geo-green/10 transition-colors"
                        >✓</button>
                      )}
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="px-2 py-0.5 rounded border border-geo-red/35 text-geo-red text-[10px] font-bold hover:bg-geo-red/10 transition-colors"
                      >✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}