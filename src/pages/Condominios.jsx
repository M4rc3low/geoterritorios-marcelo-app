import { useState, useMemo } from 'react';
import { geoterritoriosApi } from '@/api/geoterritoriosClient';
import { useCondominios } from '../lib/useGeoData';
import StatCard from '../components/StatCard';
import Pill from '../components/Pill';
import ApartamentosModal from '../components/ApartamentosModal';
import EditCondominioModal from '../components/EditCondominioModal';
import { toast } from 'sonner';
import { Pencil, Trash2, Building2 } from 'lucide-react';

export default function Condominios() {
  const { condominios, loading, refetch } = useCondominios();
  const [busca, setBusca] = useState('');
  const [filtroTerr, setFiltroTerr] = useState('');
  const [aptosModal, setAptosModal] = useState(null);
  const [editModal, setEditModal] = useState(null);

  const totalAptos = condominios.reduce((s, c) => s + (c.total_aptos || 0), 0);
  const totalCartas = condominios.reduce((s, c) => s + (c.cartas_enviadas || 0), 0);
  const pct = totalAptos > 0 ? Math.round((totalCartas / totalAptos) * 100) : 0;
  const terrNums = useMemo(() => [...new Set(condominios.map(c => c.territorio))].sort((a,b) => Number(a)-Number(b)), [condominios]);

  const filtered = useMemo(() => condominios.filter(c => {
    if (filtroTerr && c.territorio !== filtroTerr) return false;
    if (busca) {
      const s = busca.toLowerCase();
      return (c.nome || '').toLowerCase().includes(s) || (c.endereco || '').toLowerCase().includes(s) || (c.territorio || '').includes(s);
    }
    return true;
  }), [condominios, filtroTerr, busca]);

  const handleDelete = async (c) => {
    if (!confirm(`Excluir "${c.nome}"?`)) return;
    await geoterritoriosApi.entities.Condominio.delete(c.id);
    toast.success('Condomínio excluído');
    refetch();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 pb-0 shrink-0">
        <StatCard value={condominios.length} label="Condomínios" color="text-geo-blue" />
        <StatCard value={totalAptos.toLocaleString('pt-BR')} label="Apartamentos" color="text-geo-blue" />
        <StatCard value={totalCartas.toLocaleString('pt-BR')} label="Cartas enviadas" color="text-geo-green" />
        <StatCard value={`${pct}%`} label="% coberto" color="text-geo-purple" />
      </div>

      {/* Table */}
      <div className="flex flex-col flex-1 overflow-hidden mx-4 my-4 bg-card border border-border rounded-lg">
        {/* Filters */}
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between gap-2 flex-wrap shrink-0">
          <h3 className="text-[11px] font-bold tracking-wider uppercase">Condomínios Mapeados</h3>
          <div className="flex gap-2 items-center flex-wrap">
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="🔍 Buscar..."
              className="bg-background border border-border text-foreground px-2.5 py-1.5 rounded-md font-syne text-[11px] focus:border-primary outline-none"
            />
            <select
              value={filtroTerr}
              onChange={e => setFiltroTerr(e.target.value)}
              className="bg-background border border-border text-foreground px-2.5 py-1.5 rounded-md font-syne text-[11px] focus:border-primary outline-none"
            >
              <option value="">Todos os territórios</option>
              {terrNums.map(t => <option key={t} value={t}>Território {t}</option>)}
            </select>
            <button
              onClick={() => setEditModal({})}
              className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-syne text-[11px] font-bold hover:opacity-90"
            >
              + Adicionar
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-[#10131f] sticky top-0 z-10">
              <tr>
                {['Terr.', 'Quadra', 'Condomínio', 'Endereço', 'CEP', 'Aptos', 'Cartas', '%', 'Publicadores', 'Ações'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center text-muted-foreground py-7 italic text-[13px]">Nenhum condomínio encontrado</td></tr>
              ) : filtered.map(c => {
                const cpct = c.total_aptos > 0 ? Math.round(((c.cartas_enviadas || 0) / c.total_aptos) * 100) : 0;
                return (
                  <tr key={c.id} className="hover:bg-primary/[0.04] transition-colors">
                    <td className="px-3 py-2.5 border-b border-border"><Pill>{c.territorio}</Pill></td>
                    <td className="px-3 py-2.5 border-b border-border text-muted-foreground">{c.quadra || '—'}</td>
                    <td className="px-3 py-2.5 border-b border-border font-medium">{c.nome}</td>
                    <td className="px-3 py-2.5 border-b border-border text-muted-foreground text-[10px]">{c.endereco}</td>
                    <td className="px-3 py-2.5 border-b border-border text-muted-foreground">{c.cep || '—'}</td>
                    <td className="px-3 py-2.5 border-b border-border">{c.total_aptos || 0}</td>
                    <td className="px-3 py-2.5 border-b border-border text-geo-green font-bold">{c.cartas_enviadas || 0}</td>
                    <td className="px-3 py-2.5 border-b border-border">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cpct === 100 ? 'bg-geo-green/20 text-geo-green' : cpct >= 50 ? 'bg-primary/20 text-primary' : 'bg-geo-red/20 text-geo-red'}`}>
                        {cpct}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 border-b border-border text-muted-foreground text-[10px] max-w-[140px] truncate">{c.publicadores || '—'}</td>
                    <td className="px-3 py-2.5 border-b border-border">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setAptosModal(c)}
                          className="px-2 py-1 rounded bg-geo-blue/15 text-geo-blue font-syne text-[10px] font-bold hover:bg-geo-blue/30 transition-colors whitespace-nowrap flex items-center gap-1"
                        >
                          <Building2 className="w-3 h-3" /> Aptos
                        </button>
                        <button
                          onClick={() => setEditModal(c)}
                          className="p-1.5 rounded bg-primary/10 text-primary hover:bg-primary/25 transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="p-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/25 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {aptosModal && (
        <ApartamentosModal condominio={aptosModal} onClose={() => { setAptosModal(null); refetch(); }} />
      )}
      {editModal !== null && (
        <EditCondominioModal condominio={editModal} onClose={() => { setEditModal(null); refetch(); }} />
      )}
    </div>
  );
}