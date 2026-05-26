import { useState, useRef } from 'react';
import { geoterritoriosApi } from '@/api/geoterritoriosClient';
import { toast } from 'sonner';

export default function ImportarDados() {
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState({ step: '', pct: 0 });
  const fileRef = useRef();

  const addLog = (msg) => setLog(prev => [...prev, msg]);

  const extractFromHTML = (text) => {
    // Extract PRED0
    let pred = [];
    const pred0Match = text.match(/const PRED0 = (\[[\s\S]*?\]);[\s\r\n]*const TERR0/);
    if (pred0Match) {
      try { pred = JSON.parse(pred0Match[1]); } catch(e) { addLog('⚠️ Erro ao parsear PRED0: ' + e.message); }
    }

    // Extract TERR0
    let terr = [];
    const terr0Match = text.match(/const TERR0 = (\[[\s\S]*?\]);[\s\r\n]*const APTOS0/);
    if (terr0Match) {
      try { terr = JSON.parse(terr0Match[1]); } catch(e) { addLog('⚠️ Erro ao parsear TERR0: ' + e.message); }
    }

    // Extract APTOS0 — may be very large, find start then match braces
    let aptos = {};
    const aptos0Start = text.indexOf('const APTOS0 = {');
    if (aptos0Start !== -1) {
      let depth = 0, i = aptos0Start + 'const APTOS0 = '.length;
      const start = i;
      while (i < text.length) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') { depth--; if (depth === 0) { i++; break; } }
        i++;
      }
      try { aptos = JSON.parse(text.substring(start, i)); } catch(e) { addLog('⚠️ Erro ao parsear APTOS0: ' + e.message); }
    }

    // Extract S13
    let s13 = [];
    const s13Match = text.match(/const S130\s*=\s*(\[[\s\S]*?\]);[\s\r\n]*(?:const|var|let|\/\/|function|document|\})/);
    if (s13Match) {
      try { s13 = JSON.parse(s13Match[1]); } catch(e) { addLog('⚠️ Erro ao parsear S130: ' + e.message); }
    }

    return { pred, terr, s13, aptos };
  };

  const extractFromJSON = (data) => {
    return {
      pred: data.pred || [],
      terr: data.terr || data.territorios || [],
      s13: data.s13 || [],
      aptos: data.aptos || {},
    };
  };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const bulkChunk = async (entity, items, chunkSize = 50) => {
    for (let i = 0; i < items.length; i += chunkSize) {
      await geoterritoriosApi.entities[entity].bulkCreate(items.slice(i, i + chunkSize));
      if (i + chunkSize < items.length) await sleep(300);
    }
  };

  const handleFile = async (file) => {
    if (!file) return;
    setRunning(true);
    setLog([]);
    setDone(false);
    setProgress({ step: 'Lendo arquivo...', pct: 2 });

    addLog(`📂 Lendo arquivo: ${file.name}...`);
    const text = await file.text();

    let pred = [], terr = [], s13 = [], aptos = {};

    if (file.name.endsWith('.json')) {
      addLog('📋 Formato JSON detectado...');
      const data = JSON.parse(text);
      ({ pred, terr, s13, aptos } = extractFromJSON(data));
    } else if (file.name.endsWith('.html')) {
      addLog('🌐 Formato HTML detectado, extraindo dados embutidos...');
      ({ pred, terr, s13, aptos } = extractFromHTML(text));
    } else {
      addLog('❌ Formato não suportado. Use .html ou .json');
      setRunning(false);
      return;
    }

    const aptosKeys = Object.keys(aptos);
    addLog(`✅ Encontrado: ${terr.length} territórios, ${pred.length} condomínios, ${aptosKeys.length} condomínios com aptos, ${s13.length} registros S-13`);
    if (aptosKeys.length > 0) addLog(`  🔑 Exemplo de chave aptos: ${aptosKeys[0]}`);
    if (aptosKeys.length === 0 && file.name.endsWith('.json')) {
      addLog(`⚠️ JSON não contém apartamentos. Use o arquivo .HTML para importar apartamentos.`);
    }

    if (pred.length === 0 && s13.length === 0 && terr.length === 0) {
      addLog('⚠️ Nenhum dado encontrado. Verifique se é o arquivo correto.');
      setRunning(false);
      return;
    }

    // ── 1. Territórios ──────────────────────────────────────────
    if (terr.length > 0) {
      addLog(`🗺️ Importando ${terr.length} territórios...`);
      setProgress({ step: 'Territórios', pct: 5 });
      const terrData = terr.map(t => ({
        num: String(t.num || ''),
        mapeado: t.mapeado || 'NAO',
        tipo: t.tipo || 'casas',
        quadras: t.quadras || '',
      }));
      await bulkChunk('Territorio', terrData);
      addLog(`✅ ${terr.length} territórios importados!`);
    }

    // ── 2. Condomínios ─────────────────────────────────────────
    let createdConds = [];
    if (pred.length > 0) {
      addLog(`🏢 Importando ${pred.length} condomínios...`);
      setProgress({ step: 'Condomínios', pct: 15 });
      const CHUNK = 50;
      let total = 0;
      const condData = pred.map(p => ({
        territorio: String(p.te || p.territorio || ''),
        quadra: String(p.qu || p.quadra || ''),
        nome: p.cn || p.nome || '',
        endereco: p.en || p.endereco || '',
        cep: p.ce || p.cep || '',
        fechado: p.fe || p.fechado || '',
        total_aptos: Number(p.ap ?? p.total_aptos ?? 0),
        cartas_enviadas: Number(p.ca ?? p.cartas_enviadas ?? 0),
        publicadores: p.pu || p.publicadores || '',
      }));

      for (let i = 0; i < condData.length; i += CHUNK) {
        const chunk = condData.slice(i, i + CHUNK);
        const results = await geoterritoriosApi.entities.Condominio.bulkCreate(chunk);
        createdConds.push(...results);
        total += chunk.length;
        setProgress({ step: 'Condomínios', pct: 15 + Math.round((total / pred.length) * 20) });
        addLog(`  ↳ ${total}/${pred.length} condomínios...`);
        if (i + CHUNK < condData.length) await sleep(800);
      }
      addLog(`✅ ${pred.length} condomínios importados!`);
    }

    // ── 3. Apartamentos ────────────────────────────────────────
    if (aptosKeys.length > 0) {
      addLog(`🏠 Preparando importação de apartamentos...`);
      setProgress({ step: 'Apartamentos', pct: 35 });

      // Use createdConds if available, otherwise fetch all from DB
      let allConds = createdConds;
      if (allConds.length === 0) {
        addLog(`  ↳ Buscando condomínios existentes no banco...`);
        allConds = await geoterritoriosApi.entities.Condominio.list('nome', 5000);
        addLog(`  ↳ ${allConds.length} condomínios encontrados no banco`);
      }

        // Normalize helper: strip accents, lowercase, keep only alphanum
        const norm = (s) => s ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '') : '';

        // Build lookup: terrNum+normName → id
        const condByTerrNome = {};
        allConds.forEach(c => {
          const k = (c.territorio || '') + '|' + norm(c.nome);
          condByTerrNome[k] = c.id;
        });

        let allAptos = [];
        let matched = 0, unmatched = 0;

        for (const [key, aptoList] of Object.entries(aptos)) {
          // Key format: cond_TE_NomeParte (e.g. cond_06_Condomínio_Edifício_Four_Seasons)
          // Extract territory number (2nd segment after split by _)
          const parts = key.split('_');
          // parts[0]='cond', parts[1]=terrNum, rest=name parts
          const terrNum = parts[1];
          // Reconstruct nome from remaining parts (joined by space)
          const nomeFromKey = parts.slice(2).join(' ').replace(/__+/g, ' ').trim();

          // Try exact territory+norm name match
          let condId = condByTerrNome[terrNum + '|' + norm(nomeFromKey)];

          // Fallback: find best match by territorio + longest common prefix of normalized name
          if (!condId) {
            const normKey = norm(nomeFromKey);
            const candidates = allConds.filter(c => c.territorio === terrNum);
            let bestScore = 0, bestId = null;
            for (const c of candidates) {
              const normCond = norm(c.nome);
              // Score = length of common prefix
              let score = 0;
              while (score < normKey.length && score < normCond.length && normKey[score] === normCond[score]) score++;
              if (score > bestScore && score >= 8) { bestScore = score; bestId = c.id; }
            }
            condId = bestId;
          }

          if (!condId) { unmatched++; continue; }
          matched++;

          for (const a of aptoList) {
            allAptos.push({
              condominio_id: condId,
              complemento: a.comp || '',
              logradouro: a.log || '',
              numero: a.num || '',
              lote: a.lote || '',
              uso: a.uso || '',
              area: String(a.area || ''),
              carta_enviada: Boolean(a.carta || a.carta_enviada || false),
              publicador: a.pub || '',
            });
          }
        }

        addLog(`  ↳ ${matched} condomínios com aptos matched, ${unmatched} sem match`);
        addLog(`  ↳ ${allAptos.length} apartamentos a importar...`);

        const ACHUNK = 50;
        let aptosImported = 0;
        for (let i = 0; i < allAptos.length; i += ACHUNK) {
          await geoterritoriosApi.entities.Apartamento.bulkCreate(allAptos.slice(i, i + ACHUNK));
          aptosImported += Math.min(ACHUNK, allAptos.length - i);
          setProgress({ step: 'Apartamentos', pct: 35 + Math.round((aptosImported / allAptos.length) * 30) });
          addLog(`  ↳ ${aptosImported}/${allAptos.length} apartamentos...`);
          await sleep(800);
        }
        addLog(`✅ ${aptosImported} apartamentos importados!`);
    }

    // ── 4. S-13 ────────────────────────────────────────────────
    if (s13.length > 0) {
      addLog(`📋 Importando ${s13.length} registros S-13...`);
      setProgress({ step: 'S-13', pct: 70 });
      const CHUNK = 50;
      let total = 0;
      const s13Data = s13.map(r => {
        const rawSt = r.st || r.status || 'C';
        const status = rawSt === 'A' ? 'em_andamento' : rawSt === 'C' ? 'concluido' : rawSt;
        const rawTipo = r.ti || r.tipo || 'casas';
        const tipoMap = { p: 'predios', c: 'casas', casas: 'casas', predios: 'predios', comercial: 'comercial' };
        const tipo = tipoMap[rawTipo] || 'casas';
        return {
          territorio_num: String(r.tn || r.te || r.territorio_num || ''),
          tipo,
          designado: r.de || r.designado || '',
          data_designacao: r.dd || r.data_designacao || '',
          data_conclusao: r.dc || r.data_conclusao || '',
          ano: r.an || r.ano || '',
          status,
          observacoes: r.ob || r.observacoes || '',
          campanha: Boolean(r.cp || r.campanha || false),
          conv_celebracao: Number(r.cc ?? r.conv_celebracao ?? 0),
          conv_congresso: Number(r.cg ?? r.conv_congresso ?? 0),
          pct_trabalhado: Number(r.pct ?? r.pt ?? r.pct_trabalhado ?? (status === 'concluido' ? 100 : 0)),
        };
      });
      for (let i = 0; i < s13Data.length; i += CHUNK) {
        await geoterritoriosApi.entities.RegistroS13.bulkCreate(s13Data.slice(i, i + CHUNK));
        total += Math.min(CHUNK, s13Data.length - i);
        addLog(`  ↳ ${total}/${s13Data.length} registros S-13...`);
        setProgress({ step: 'S-13', pct: 70 + Math.round((total / s13Data.length) * 25) });
        if (i + CHUNK < s13Data.length) await sleep(300);
      }
      addLog(`✅ ${s13Data.length} registros S-13 importados!`);
    }

    addLog('🎉 Importação concluída com sucesso!');
    setProgress({ step: 'Concluído', pct: 100 });
    setRunning(false);
    setDone(true);
    toast.success('Importação concluída com sucesso!');
  };

  return (
    <div className="h-full overflow-y-auto p-5 flex flex-col gap-4 max-w-2xl mx-auto">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="font-crimson text-2xl text-primary mb-2">📦 Importação de Dados</div>
        <p className="text-sm text-muted-foreground mb-1">
          Carregue o arquivo <strong>.html</strong> salvo com o botão "💾 Salvar com dados" ou um <strong>.json</strong> de backup.
        </p>
        <p className="text-xs text-muted-foreground mb-6">
          Importa territórios, condomínios, apartamentos e registros S-13 do arquivo selecionado.
        </p>

        {!done ? (
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".html,.json"
              className="hidden"
              onChange={e => handleFile(e.target.files[0])}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={running}
              className="w-full py-3 rounded-md bg-primary text-primary-foreground font-syne text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {running ? `⏳ Importando... (${progress.step})` : '📂 Selecionar Arquivo (.html ou .json)'}
            </button>

            {running && (
              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                  <span>{progress.step}</span>
                  <span>{progress.pct}%</span>
                </div>
                <div className="w-full bg-muted rounded h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded transition-all duration-300"
                    style={{ width: `${progress.pct}%` }}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">🎉</div>
            <div className="text-geo-green font-bold text-lg">Importação concluída!</div>
            <p className="text-sm text-muted-foreground mt-1">Navegue para as outras páginas para ver os dados.</p>
            <button
              onClick={() => { setDone(false); setLog([]); setProgress({ step: '', pct: 0 }); }}
              className="mt-4 px-4 py-2 rounded-md border border-border text-xs font-syne font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              Importar outro arquivo
            </button>
          </div>
        )}

        {log.length > 0 && (
          <div className="mt-4 bg-background border border-border rounded-md p-3 max-h-80 overflow-y-auto">
            {log.map((line, i) => (
              <div key={i} className="text-xs font-mono text-muted-foreground leading-relaxed">{line}</div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-2">O QUE SERÁ IMPORTADO</div>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          {[
            ['🗺️', 'Territórios', 'Número, tipo, quadras, mapeamento'],
            ['🏢', 'Condomínios', 'Nome, endereço, CEP, publicadores'],
            ['🏠', 'Apartamentos', 'Unidades com status de carta'],
            ['📋', 'S-13', 'Designações e conclusões históricas'],
          ].map(([icon, label, desc]) => (
            <div key={label} className="bg-background border border-border rounded-md p-2.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span>{icon}</span>
                <span className="font-bold text-foreground">{label}</span>
              </div>
              <div className="text-[10px]">{desc}</div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3">
          ⚠️ Recomenda-se limpar os dados existentes antes de importar para evitar duplicatas.
        </p>
      </div>
    </div>
  );
}