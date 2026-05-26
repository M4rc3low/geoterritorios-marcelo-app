import { useState } from 'react';
import { geoterritoriosApi } from '@/api/geoterritoriosClient';
import { getTerritorioStatus } from '../lib/useGeoData';
import Pill from './Pill';
import { toast } from 'sonner';

export default function TerritoryPanel({ territorio, condominios, registros, onRegistered }) {
  const [designado, setDesignado] = useState('');
  const [data, setData] = useState('');
  const [ano, setAno] = useState('');
  const [tipo, setTipo] = useState('casas');
  const [campanha, setCampanha] = useState(false);
  const [convCel, setConvCel] = useState(0);
  const [convCong, setConvCong] = useState(0);
  const [pct, setPct] = useState(0);
  const [saving, setSaving] = useState(false);

  if (!territorio) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2.5 text-muted-foreground p-6 text-center text-xs">
        <div className="text-[30px] opacity-35">📌</div>
        <p>Clique em um território<br />para ver detalhes e<br />registrar no S-13</p>
      </div>
    );
  }

  const num = territorio.num;
  const status = getTerritorioStatus(num, registros);
  const terrConds = condominios.filter(c => c.territorio === num);
  const totalAptos = terrConds.reduce((s, c) => s + (c.total_aptos || 0), 0);
  const terrRegs = registros.filter(r => r.territorio_num === num);
  const lastReg = terrRegs[0];

  const pillVariant = status === 'concluido' ? 'green' : status === 'andamento' ? 'orange' : 'muted';
  const pillLabel = status === 'concluido' ? 'Concluído' : status === 'andamento' ? 'Andamento' : 'Livre';

  const handleRegistrar = async () => {
    if (!designado.trim()) { toast.error('Informe quem foi designado'); return; }
    setSaving(true);
    await geoterritoriosApi.entities.RegistroS13.create({
      territorio_num: num,
      tipo,
      designado: designado.trim(),
      data_designacao: data,
      ano,
      status: 'em_andamento',
      campanha,
      conv_celebracao: convCel,
      conv_congresso: convCong,
      pct_trabalhado: pct,
    });
    toast.success(`Território ${num} designado!`);
    setSaving(false);
    setDesignado(''); setData(''); setAno('');
    onRegistered();
  };

  const handleConcluir = async () => {
    const reg = terrRegs.find(r => r.status === 'em_andamento');
    if (!reg) { toast.error('Nenhum registro em andamento'); return; }
    setSaving(true);
    await geoterritoriosApi.entities.RegistroS13.update(reg.id, {
      status: 'concluido',
      data_conclusao: new Date().toISOString().split('T')[0],
      pct_trabalhado: 100,
    });
    toast.success(`Território ${num} concluído!`);
    setSaving(false);
    onRegistered();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Território</div>
          <div className="font-crimson text-[44px] font-medium leading-none">{num}</div>
        </div>
        <div className="text-right flex flex-col gap-1 items-end">
          <Pill variant={pillVariant}>{pillLabel}</Pill>
          <span className="text-[10px] text-muted-foreground">{territorio.tipo}</span>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Details */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Quadras</span>
          <span className="text-xs">{territorio.quadras || '—'}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Status mapeamento</span>
          <span className="text-xs">{territorio.mapeado === 'SIM' ? '✅ Mapeado' : '❌ Não mapeado'}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Condomínios / Aptos</span>
          <span className="text-xs">{terrConds.length} cond. / {totalAptos} aptos</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Última designação</span>
          <span className="text-xs">{lastReg ? `${lastReg.designado} — ${lastReg.data_designacao || ''}` : '—'}</span>
        </div>
      </div>

      {/* History */}
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-border text-[10px] font-bold tracking-wider uppercase">
          Histórico S-13
        </div>
        <div className="max-h-[130px] overflow-y-auto">
          {terrRegs.length === 0 ? (
            <div className="px-3 py-4 text-center text-muted-foreground text-[11px] italic">Nenhum registro</div>
          ) : terrRegs.map(r => (
            <div key={r.id} className="px-3 py-2 border-b border-border flex items-center justify-between gap-1.5 text-[11px] last:border-0">
              <span>{r.designado}</span>
              <Pill variant={r.status === 'concluido' ? 'green' : 'orange'}>
                {r.status === 'concluido' ? '✓' : '⏳'}
              </Pill>
            </div>
          ))}
        </div>
      </div>

      {/* S-13 Form */}
      <div className="bg-background border border-border rounded-lg p-3.5 flex flex-col gap-2.5">
        <div className="text-[10px] font-bold tracking-wider uppercase text-primary">Registrar no S-13</div>

        {status === 'andamento' && (
          <div className="px-2.5 py-2 bg-geo-orange/10 border border-geo-orange/30 rounded-md text-[11px] text-geo-orange">
            ⚠️ Já em andamento.
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Designado Para</label>
          <input value={designado} onChange={e => setDesignado(e.target.value)} placeholder="Nome do publicador"
            className="bg-background border border-border text-foreground px-2.5 py-2 rounded-md font-syne text-xs focus:border-primary outline-none transition-colors w-full" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Data</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              className="bg-background border border-border text-foreground px-2.5 py-2 rounded-md font-syne text-xs focus:border-primary outline-none transition-colors w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Ano</label>
            <input value={ano} onChange={e => setAno(e.target.value)} placeholder="2024/25"
              className="bg-background border border-border text-foreground px-2.5 py-2 rounded-md font-syne text-xs focus:border-primary outline-none transition-colors w-full" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)}
            className="bg-background border border-border text-foreground px-2.5 py-2 rounded-md font-syne text-xs focus:border-primary outline-none transition-colors w-full">
            <option value="casas">Casas</option>
            <option value="predios">Prédios</option>
            <option value="comercial">Comercial</option>
          </select>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-2 bg-background border border-border rounded-md">
          <input type="checkbox" checked={campanha} onChange={e => setCampanha(e.target.checked)}
            className="w-3.5 h-3.5 accent-geo-purple cursor-pointer" />
          <label className="text-[11px] cursor-pointer" onClick={() => setCampanha(!campanha)}>🎯 É uma Campanha?</label>
        </div>

        <button onClick={handleRegistrar} disabled={saving}
          className="w-full py-2.5 rounded-md bg-primary border border-primary text-primary-foreground font-syne text-[11px] font-bold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50">
          📋 Registrar Designação
        </button>

        {status === 'andamento' && (
          <button onClick={handleConcluir} disabled={saving}
            className="w-full py-2.5 rounded-md bg-geo-green border border-geo-green text-black font-syne text-[11px] font-bold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50">
            ✓ Concluir este Território
          </button>
        )}
      </div>
    </div>
  );
}