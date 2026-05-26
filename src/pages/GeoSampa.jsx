import { useState } from 'react';
import { geoterritoriosApi } from '@/api/geoterritoriosClient';
import { toast } from 'sonner';

export default function GeoSampa() {
  const [territorio, setTerritorio] = useState('');
  const [nomeCondominio, setNomeCondominio] = useState('');
  const [cep, setCep] = useState('');
  const [rawText, setRawText] = useState('');
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleDetectar = () => {
    if (!rawText.trim()) { toast.error('Cole o texto do GeoSampa'); return; }

    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    let setor = '', quadra = '', condominio = '', logradouro = '', numero = '';
    const unidades = [];

    for (const line of lines) {
      if (/^Setor:\s*/i.test(line)) setor = line.replace(/^Setor:\s*/i, '').trim();
      else if (/^Quadra:\s*/i.test(line)) quadra = line.replace(/^Quadra:\s*/i, '').trim();
      else if (/^Condomínio:\s*/i.test(line) || /^Condo?m[ií]nio:\s*/i.test(line)) condominio = line.replace(/^Condo?m[ií]nio:\s*/i, '').trim();
      else if (/^Nome logradouro:\s*/i.test(line)) logradouro = line.replace(/^Nome logradouro:\s*/i, '').trim();
      else if (/^N[úu]mero porta:\s*/i.test(line)) numero = line.replace(/^N[úu]mero porta:\s*/i, '').trim();
      else {
        const match = line.match(/^(\d{4})\s+\d\s+\d+\s+[\d.]+[-]\d\s+(.+?)\s+(\d+)\s+(.+?)\s+(Residencial|Comercial|Misto|Terreno)\s+(\d+)/i);
        if (match) {
          unidades.push({
            lote: match[1],
            logradouro: match[2] || logradouro,
            numero: match[3] || numero,
            complemento: match[4],
            uso: match[5],
            area: match[6],
          });
        }
      }
    }

    if (unidades.length === 0) {
      toast.error('Nenhuma unidade detectada. Verifique o formato.');
      return;
    }

    setPreview({
      setor,
      quadra: quadra || territorio,
      condominio: condominio || nomeCondominio,
      logradouro,
      numero,
      unidades,
    });
  };

  const handleImportar = async () => {
    if (!preview) return;
    setSaving(true);

    const cond = await geoterritoriosApi.entities.Condominio.create({
      territorio: territorio || preview.quadra,
      quadra: preview.quadra,
      nome: preview.condominio || nomeCondominio || `Cond. ${preview.logradouro} ${preview.numero}`,
      endereco: `${preview.logradouro}, ${preview.numero}`,
      cep: cep,
      total_aptos: preview.unidades.length,
      cartas_enviadas: 0,
    });

    const aptos = preview.unidades.map(u => ({
      condominio_id: cond.id,
      complemento: u.complemento,
      logradouro: u.logradouro,
      numero: u.numero,
      lote: u.lote,
      uso: u.uso,
      area: u.area,
      carta_enviada: false,
      publicador: '',
    }));

    await geoterritoriosApi.entities.Apartamento.bulkCreate(aptos);

    toast.success(`${preview.unidades.length} unidades importadas!`);
    setSaving(false);
    setPreview(null);
    setRawText('');
    setTerritorio('');
    setNomeCondominio('');
    setCep('');
  };

  const inputCls = "bg-background border border-border text-foreground px-2.5 py-2 rounded-md font-syne text-xs focus:border-primary outline-none transition-colors w-full";

  return (
    <div className="h-full overflow-y-auto p-5 flex flex-col gap-4">
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-bold tracking-wider uppercase">Compilador GeoSampa</h3>
          <span className="text-[11px] text-muted-foreground">Cole o texto copiado diretamente do painel do GeoSampa</span>
        </div>

        <div className="p-4 flex flex-col gap-3.5">
          {/* Instructions */}
          <div className="bg-background border border-border rounded-lg p-3.5 flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[220px]">
              <div className="text-[11px] font-bold tracking-wider mb-2 text-primary">COMO USAR</div>
              <div className="text-[11px] text-muted-foreground leading-[1.8]">
                1. No GeoSampa, clique no prédio no mapa<br />
                2. Abra "Informações dos lotes do condomínio"<br />
                3. Selecione tudo na tela (Ctrl+A)<br />
                4. Copie (Ctrl+C)<br />
                5. Cole abaixo (Ctrl+V)<br />
                6. Clique em <strong className="text-primary">Detectar e Pré-visualizar</strong>
              </div>
            </div>
            <div className="flex-1 min-w-[220px]">
              <div className="text-[11px] font-bold tracking-wider mb-2 text-geo-green">O QUE É DETECTADO</div>
              <div className="text-[11px] text-muted-foreground leading-[1.8]">
                ✓ Setor e Quadra do cadastro<br />
                ✓ Nome do logradouro e número<br />
                ✓ Número do condomínio<br />
                ✓ Todos os apartamentos e complementos<br />
                ✓ Uso (Residencial, Comercial etc.)<br />
                ✓ Área construída de cada unidade
              </div>
            </div>
          </div>

          {/* Manual fields */}
          <div className="bg-background border border-border rounded-lg p-3.5">
            <div className="text-[11px] font-bold tracking-wider mb-2.5 text-muted-foreground">COMPLEMENTAR (OPCIONAL)</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1"><label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Território</label><input value={territorio} onChange={e => setTerritorio(e.target.value)} placeholder="ex: 05" className={inputCls} /></div>
              <div className="flex flex-col gap-1"><label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Nome do Condomínio</label><input value={nomeCondominio} onChange={e => setNomeCondominio(e.target.value)} placeholder="ex: Ed. Urimonduba" className={inputCls} /></div>
              <div className="flex flex-col gap-1"><label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">CEP</label><input value={cep} onChange={e => setCep(e.target.value)} placeholder="00000-000" className={inputCls} /></div>
            </div>
          </div>

          {/* Text area */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Cole aqui o texto do GeoSampa</label>
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Cole aqui todo o conteúdo copiado do GeoSampa..."
              className="w-full min-h-[160px] bg-background border border-border text-foreground p-2.5 rounded-md font-mono text-[11px] resize-y outline-none focus:border-primary transition-colors leading-relaxed"
            />
          </div>

          <button onClick={handleDetectar}
            className="w-full py-3 rounded-md bg-primary border border-primary text-primary-foreground font-syne text-[11px] font-bold cursor-pointer hover:opacity-90 transition-opacity">
            🔍 Detectar e Pré-visualizar
          </button>
        </div>

        {/* Preview */}
        {preview && (
          <div className="px-4 pb-4">
            <div className="bg-background border border-border rounded-lg overflow-hidden">
              <div className="p-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[11px] font-bold tracking-wider">PRÉ-VISUALIZAÇÃO — DADOS DETECTADOS</span>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {preview.logradouro} {preview.numero} — {preview.unidades.length} unidades
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPreview(null)}
                    className="px-3 py-1.5 rounded-md border border-border text-foreground font-syne text-[11px] font-bold hover:border-primary transition-colors">
                    ✕ Cancelar
                  </button>
                  <button onClick={handleImportar} disabled={saving}
                    className="px-3 py-1.5 rounded-md bg-geo-green border border-geo-green text-black font-syne text-[11px] font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
                    ✓ Confirmar e Importar
                  </button>
                </div>
              </div>

              <div className="overflow-auto max-h-[300px]">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-[#10131f] sticky top-0 z-10">
                    <tr>
                      {['Lote', 'Complemento / Unidade', 'Logradouro', 'Nº', 'Uso', 'Área m²'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.unidades.map((u, i) => (
                      <tr key={i} className="hover:bg-primary/[0.04]">
                        <td className="px-3 py-2 border-b border-border">{u.lote}</td>
                        <td className="px-3 py-2 border-b border-border">{u.complemento}</td>
                        <td className="px-3 py-2 border-b border-border">{u.logradouro}</td>
                        <td className="px-3 py-2 border-b border-border">{u.numero}</td>
                        <td className="px-3 py-2 border-b border-border">{u.uso}</td>
                        <td className="px-3 py-2 border-b border-border">{u.area}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}