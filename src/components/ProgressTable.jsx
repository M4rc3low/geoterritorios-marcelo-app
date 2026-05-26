export default function ProgressTable({ territorios, condominios }) {
  const terrNums = [...new Set(condominios.map(c => c.territorio))].sort();

  const rows = terrNums.map(t => {
    const conds = condominios.filter(c => c.territorio === t);
    const aptos = conds.reduce((s, c) => s + (c.total_aptos || 0), 0);
    const cartas = conds.reduce((s, c) => s + (c.cartas_enviadas || 0), 0);
    const pct = aptos > 0 ? Math.round((cartas / aptos) * 100) : 0;
    return { t, count: conds.length, aptos, cartas, pct };
  });

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border">
        <h3 className="text-[11px] font-bold tracking-wider uppercase">
          Progresso por Território (Condomínios)
        </h3>
      </div>
      <div className="overflow-auto max-h-[220px]">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-[#10131f] sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border">Território</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border">Condomínios</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border">Aptos</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border">Cartas</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border">Progresso</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-muted-foreground py-7 italic text-[13px]">Nenhum condomínio cadastrado</td></tr>
            ) : rows.map(r => (
              <tr key={r.t} className="hover:bg-primary/[0.04]">
                <td className="px-3 py-2.5 border-b border-border">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/25">
                    {r.t}
                  </span>
                </td>
                <td className="px-3 py-2.5 border-b border-border">{r.count}</td>
                <td className="px-3 py-2.5 border-b border-border">{r.aptos}</td>
                <td className="px-3 py-2.5 border-b border-border">{r.cartas}</td>
                <td className="px-3 py-2.5 border-b border-border">
                  <div className="w-20 bg-muted rounded h-1.5 overflow-hidden">
                    <div className="h-full bg-primary rounded" style={{ width: `${r.pct}%` }} />
                  </div>
                </td>
                <td className="px-3 py-2.5 border-b border-border font-bold text-primary">{r.pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}