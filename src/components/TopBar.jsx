import { useState, useEffect, useRef } from 'react';
import { geoterritoriosApi } from '@/api/geoterritoriosClient';
import { toast } from 'sonner';

export default function TopBar() {
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('pt-BR'));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleBackup = async () => {
    setSaving(true);
    try {
      const [territorios, condominios, registros, apartamentos] = await Promise.all([
        geoterritoriosApi.entities.Territorio.list('num', 5000),
        geoterritoriosApi.entities.Condominio.list('territorio', 5000),
        geoterritoriosApi.entities.RegistroS13.list('-created_date', 5000),
        geoterritoriosApi.entities.Apartamento.list('condominio_id', 50000),
      ]);
      const data = {
        version: 3,
        date: new Date().toISOString(),
        terr: territorios,
        pred: condominios,
        s13: registros,
        aptos: apartamentos,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `geoterr_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup JSON salvo com sucesso!');
    } catch (e) {
      toast.error('Erro ao gerar backup: ' + e.message);
    }
    setSaving(false);
  };

  const handleRestoreFile = async (file) => {
    if (!file) return;
    if (!window.confirm('⚠️ Restaurar irá APAGAR todos os dados atuais e substituir pelo backup. Confirmar?')) return;
    setRestoring(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const terr = data.terr || data.territorios || [];
      const pred = data.pred || [];
      const s13 = data.s13 || [];
      const aptos = data.aptos || [];

      toast.info('Limpando dados existentes...');
      // Clear existing
      const [existingT, existingC, existingS, existingA] = await Promise.all([
        geoterritoriosApi.entities.Territorio.list('num', 5000),
        geoterritoriosApi.entities.Condominio.list('territorio', 5000),
        geoterritoriosApi.entities.RegistroS13.list('-created_date', 5000),
        geoterritoriosApi.entities.Apartamento.list('condominio_id', 50000),
      ]);
      // Delete in parallel batches
      const deleteChunk = async (entity, items) => {
        for (let i = 0; i < items.length; i += 50) {
          await Promise.all(items.slice(i, i + 50).map(r => geoterritoriosApi.entities[entity].delete(r.id)));
        }
      };
      await Promise.all([
        deleteChunk('Territorio', existingT),
        deleteChunk('Condominio', existingC),
        deleteChunk('RegistroS13', existingS),
        deleteChunk('Apartamento', existingA),
      ]);

      toast.info('Importando dados do backup...');

      // Import territories
      const chunk = async (entity, items, size = 50) => {
        for (let i = 0; i < items.length; i += size) {
          await geoterritoriosApi.entities[entity].bulkCreate(items.slice(i, i + size));
        }
      };

      const terrData = terr.map(t => ({
        num: String(t.num || t.data?.num || ''),
        mapeado: t.mapeado || t.data?.mapeado || 'NAO',
        tipo: t.tipo || t.data?.tipo || 'casas',
        quadras: t.quadras || t.data?.quadras || '',
      }));

      const predData = pred.map(p => {
        const d = p.data || p;
        return {
          territorio: String(d.te || d.territorio || ''),
          quadra: String(d.qu || d.quadra || ''),
          nome: d.cn || d.nome || '',
          endereco: d.en || d.endereco || '',
          cep: d.ce || d.cep || '',
          fechado: d.fe || d.fechado || '',
          total_aptos: Number(d.ap ?? d.total_aptos ?? 0),
          cartas_enviadas: Number(d.ca ?? d.cartas_enviadas ?? 0),
          publicadores: d.pu || d.publicadores || '',
        };
      });

      const s13Data = s13.map(r => {
        const d = r.data || r;
        const rawSt = d.st || d.status || 'C';
        const status = rawSt === 'A' ? 'em_andamento' : rawSt === 'C' ? 'concluido' : rawSt;
        const rawTipo = d.ti || d.tipo || 'casas';
        const tipoMap = { p: 'predios', c: 'casas', casas: 'casas', predios: 'predios', comercial: 'comercial' };
        const tipo = tipoMap[rawTipo] || 'casas';
        return {
          territorio_num: String(d.tn || d.te || d.territorio_num || ''),
          tipo,
          designado: d.de || d.designado || '',
          data_designacao: d.dd || d.data_designacao || '',
          data_conclusao: d.dc || d.data_conclusao || '',
          ano: d.an || d.ano || '',
          status,
          observacoes: d.ob || d.observacoes || '',
          campanha: Boolean(d.cp ?? d.camp ?? d.campanha ?? false),
          conv_celebracao: Number(d.cc ?? d.conv_celebracao ?? 0),
          conv_congresso: Number(d.cg ?? d.conv_congresso ?? 0),
          pct_trabalhado: Number(d.pct ?? d.pt ?? d.pct_trabalhado ?? (status === 'concluido' ? 100 : 0)),
        };
      });

      await chunk('Territorio', terrData);
      // Import condominios and collect created IDs for apartment linking
      const createdConds = [];
      for (let i = 0; i < predData.length; i += 50) {
        const results = await geoterritoriosApi.entities.Condominio.bulkCreate(predData.slice(i, i + 50));
        createdConds.push(...results);
      }
      await chunk('RegistroS13', s13Data);

      // Import apartments (version 3+ backups include them directly with condominio_id)
      if (aptos.length > 0) {
        toast.info(`Importando ${aptos.length} apartamentos...`);
        const aptosData = aptos.map(a => ({
          condominio_id: a.condominio_id || '',
          complemento: a.complemento || '',
          logradouro: a.logradouro || '',
          numero: a.numero || '',
          lote: a.lote || '',
          uso: a.uso || '',
          area: a.area || '',
          carta_enviada: Boolean(a.carta_enviada),
          publicador: a.publicador || '',
        })).filter(a => a.condominio_id && a.complemento);
        await chunk('Apartamento', aptosData, 50);
      }

      toast.success(`Restauração concluída! ${terrData.length} territórios, ${predData.length} condomínios, ${s13Data.length} S-13${aptos.length > 0 ? `, ${aptos.length} apartamentos` : ''}.`);
    } catch (e) {
      toast.error('Erro na restauração: ' + e.message);
    }
    setRestoring(false);
  };

  return (
    <div className="h-[52px] bg-background/60 backdrop-blur-xl border-b border-border flex items-center px-5 gap-3 shrink-0">
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-crimson text-[17px] font-medium text-primary-foreground shrink-0">
        G
      </div>
      <div>
        <div className="text-sm font-bold font-syne">GeoTerritórios</div>
      </div>
      <div className="text-[10px] text-muted-foreground font-syne">Congregação Jardim Paulista</div>
      <div className="flex-1" />
      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-geo-green animate-blink" />
        <span>{time}</span>
      </div>
      <button
        onClick={handleBackup}
        disabled={saving}
        className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-syne text-[10px] font-bold hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
      >
        {saving ? '⏳...' : '💾 Backup JSON'}
      </button>
      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={e => handleRestoreFile(e.target.files[0])} />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={restoring}
        className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground border border-border font-syne text-[10px] font-bold hover:border-primary transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {restoring ? '⏳ Restaurando...' : '♻️ Restaurar'}
      </button>
    </div>
  );
}