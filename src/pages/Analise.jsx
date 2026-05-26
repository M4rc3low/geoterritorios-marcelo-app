import { useTerritorios, useRegistrosS13 } from '../lib/useGeoData';
import StatCard from '../components/StatCard';
import Pill from '../components/Pill';

export default function Analise() {
  const { territorios, loading: lt } = useTerritorios();
  const { registros, loading: lr } = useRegistrosS13();
  const loading = lt || lr;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const concluidos = [...new Set(registros.filter(r => r.status === 'concluido').map(r => r.territorio_num))].length;
  const andamento = [...new Set(registros.filter(r => r.status === 'em_andamento').map(r => r.territorio_num))].length;
  const trabalhados = new Set(registros.map(r => r.territorio_num));
  const nuncaTrabalhados = territorios.filter(t => !trabalhados.has(t.num)).length;
  const totalConvCel = registros.reduce((s, r) => s + (r.conv_celebracao || 0), 0);
  const totalConvCong = registros.reduce((s, r) => s + (r.conv_congresso || 0), 0);

  // Priority analysis
  const prioData = territorios.map(t => {
    const regs = registros.filter(r => r.territorio_num === t.num);
    const conclRegs = regs.filter(r => r.status === 'concluido');
    const lastReg = conclRegs.sort((a, b) => (b.data_conclusao || '').localeCompare(a.data_conclusao || ''))[0];
    const maxPct = regs.reduce((max, r) => Math.max(max, r.pct_trabalhado || 0), 0);
    const convCel = regs.reduce((s, r) => s + (r.conv_celebracao || 0), 0);
    const convCong = regs.reduce((s, r) => s + (r.conv_congresso || 0), 0);
    const hasAndamento = regs.some(r => r.status === 'em_andamento');

    return {
      num: t.num,
      tipo: t.tipo,
      ultimoTrabalho: lastReg?.data_conclusao || null,
      pctTrabalhado: maxPct,
      vezes: conclRegs.length,
      convCel,
      convCong,
      status: hasAndamento ? 'andamento' : conclRegs.length > 0 ? 'concluido' : 'nunca',
    };
  }).sort((a, b) => {
    if (a.pctTrabalhado !== b.pctTrabalhado) return a.pctTrabalhado - b.pctTrabalhado;
    return (a.ultimoTrabalho || '').localeCompare(b.ultimoTrabalho || '');
  });

  const fmtD = d => d ? new Date(d).toLocaleDateString('pt-BR') : null;

  return (
    <div className="h-full overflow-y-auto p-5 flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <StatCard value={concluidos} label="Territórios concluídos" color="text-geo-green" />
        <StatCard value={andamento} label="Em andamento" color="text-geo-orange" />
        <StatCard value={nuncaTrabalhados} label="Nunca trabalhados" color="text-geo-red" />
        <StatCard value={totalConvCel} label="Conv. Celebração total" color="text-geo-purple" />
        <StatCard value={totalConvCong} label="Conv. Congresso total" color="text-geo-blue" />
      </div>

      {/* Priority table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-bold tracking-wider uppercase">🎯 Sugestão para o Próximo Ano</h3>
          <span className="text-[11px] text-muted-foreground">Ordenado por menor % trabalhado + há mais tempo não visitado</span>
        </div>
        <div className="overflow-auto max-h-[320px]">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-[#10131f] sticky top-0 z-10">
              <tr>
                {['Prioridade', 'Território', 'Tipo', 'Último trabalho', '% Trabalhado', 'Vezes trabalhado', 'Conv. Cel.', 'Conv. Cong.', 'Situação'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prioData.map((d, i) => {
                const pctColor = d.pctTrabalhado >= 80 ? 'text-geo-green' : d.pctTrabalhado >= 40 ? 'text-primary' : 'text-geo-red';
                const stVariant = d.status === 'andamento' ? 'orange' : d.status === 'concluido' ? 'green' : 'red';
                const stLabel = d.status === 'andamento' ? 'Andamento' : d.status === 'concluido' ? 'Concluído' : 'Nunca';
                return (
                  <tr key={d.num} className="hover:bg-primary/[0.04]">
                    <td className="px-3 py-2.5 border-b border-border font-bold text-primary">{i + 1}º</td>
                    <td className="px-3 py-2.5 border-b border-border"><Pill>{d.num}</Pill></td>
                    <td className="px-3 py-2.5 border-b border-border">{d.tipo}</td>
                    <td className="px-3 py-2.5 border-b border-border">{fmtD(d.ultimoTrabalho) || <span className="text-geo-red">Nunca</span>}</td>
                    <td className="px-3 py-2.5 border-b border-border">
                      <div className="flex items-center gap-1.5">
                        <div className="w-20 bg-muted rounded h-1.5 overflow-hidden">
                          <div className="h-full bg-primary rounded transition-all" style={{ width: `${d.pctTrabalhado}%` }} />
                        </div>
                        <span className={`font-bold ${pctColor}`}>{d.pctTrabalhado}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 border-b border-border text-center">{d.vezes}x</td>
                    <td className="px-3 py-2.5 border-b border-border">{d.convCel || '—'}</td>
                    <td className="px-3 py-2.5 border-b border-border">{d.convCong || '—'}</td>
                    <td className="px-3 py-2.5 border-b border-border"><Pill variant={stVariant}>{stLabel}</Pill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full history by territory */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border">
          <h3 className="text-[11px] font-bold tracking-wider uppercase">Histórico Completo por Território</h3>
        </div>
        <div className="overflow-auto max-h-[400px]">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-[#10131f] sticky top-0 z-10">
              <tr>
                {['Território', 'Designado', 'Designação', 'Conclusão', '% Trab.', 'Conv. Cel.', 'Conv. Cong.', 'Status'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registros.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-muted-foreground py-7 italic text-[13px]">Nenhum registro S-13</td></tr>
              ) : registros.sort((a, b) => (a.territorio_num || '').localeCompare(b.territorio_num || '')).map(r => (
                <tr key={r.id} className="hover:bg-primary/[0.04]">
                  <td className="px-3 py-2.5 border-b border-border"><Pill>{r.territorio_num}</Pill></td>
                  <td className="px-3 py-2.5 border-b border-border">{r.designado}</td>
                  <td className="px-3 py-2.5 border-b border-border">{fmtD(r.data_designacao)}</td>
                  <td className="px-3 py-2.5 border-b border-border">{fmtD(r.data_conclusao)}</td>
                  <td className="px-3 py-2.5 border-b border-border font-bold text-primary">{r.pct_trabalhado || 0}%</td>
                  <td className="px-3 py-2.5 border-b border-border">{r.conv_celebracao || '—'}</td>
                  <td className="px-3 py-2.5 border-b border-border">{r.conv_congresso || '—'}</td>
                  <td className="px-3 py-2.5 border-b border-border">
                    <Pill variant={r.status === 'concluido' ? 'green' : 'orange'}>
                      {r.status === 'concluido' ? 'Concluído' : 'Andamento'}
                    </Pill>
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