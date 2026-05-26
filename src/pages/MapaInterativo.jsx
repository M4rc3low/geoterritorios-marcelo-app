import { useState, useEffect } from 'react';
import { geoterritoriosApi } from '@/api/geoterritoriosClient';
import { toast } from 'sonner';
import { X, Save } from 'lucide-react';

// Layout visual do mapa baseado no PDF
const MAP_GRID = [
  [null, null, null, null, null, null, null, '25', null, null, '2',  null],
  [null, null, null, '23', '24', null, '27', null, null, null, '5',  null],
  [null, '22', null, null, null, null, '30', null, '33', null, null, null],
  ['21', null, '26', null, '29', null, null, null, null, '4',  null, null],
  ['20', null, null, '28', null, '32', null, '10', null, null, '3',  null],
  ['19', null, null, null, null, '31', null, null, '9',  null, null, null],
  [null, '18', null, null, '14', null, null, null, null, '7',  null, null],
  [null, null, '17', null, '13', null, null, null, '8',  '6',  null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, '16', null, null, null, null, null, null, null, null, null],
  [null, null, null, null, '11', null, null, null, null, null, null, null],
  [null, null, '15', '12', null, null, null, null, null, null, null, null],
];

const GROUP_COLORS = {
  '1':  'purple', '2':  'purple', '3':  'purple', '4':  'purple',
  '5':  'purple', '6':  'purple', '7':  'purple',
  '27': 'blue',   '29': 'blue',   '30': 'blue',   '32': 'blue',
  '33': 'blue',   '10': 'blue',   '9':  'blue',   '14': 'blue',
  '13': 'blue',   '31': 'blue',   '28': 'blue',   '26': 'blue',
  '8':  'orange', '11': 'orange', '12': 'orange', '15': 'orange',
  '16': 'orange', '17': 'orange',
  '18': 'yellow', '19': 'yellow', '20': 'yellow', '21': 'yellow', '22': 'yellow',
  '23': 'slate',  '24': 'slate',  '25': 'slate',
};

const GROUP_BASE_COLORS = {
  purple: '#7c3aed',
  blue:   '#2563eb',
  orange: '#ea580c',
  yellow: '#ca8a04',
  slate:  '#475569',
};

export default function MapaInterativo() {
  const [territorios, setTerritorios] = useState([]);
  const [condominios, setCondominios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTerr, setSelectedTerr] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [terr, conds] = await Promise.all([
        geoterritoriosApi.entities.Territorio.list('num', 5000),
        geoterritoriosApi.entities.Condominio.list('territorio', 5000),
      ]);
      setTerritorios(terr);
      setCondominios(conds);
      setLoading(false);
    };
    loadData();
  }, []);

  const getStats = (num) => {
    const conds = condominios.filter(c => c.territorio === num);
    const total = conds.reduce((s, c) => s + (c.total_aptos || 0), 0);
    const cartas = conds.reduce((s, c) => s + (c.cartas_enviadas || 0), 0);
    const fechados = conds.filter(c => c.fechado === 'SIM').length;
    return { total, cartas, pct: total > 0 ? Math.round((cartas / total) * 100) : 0, fechados, conds: conds.length };
  };

  const getTerrObj = (num) => territorios.find(t => t.num === num);

  const getOverlayColor = (num) => {
    const stats = getStats(num);
    if (stats.conds === 0) return null;
    if (stats.pct === 100) return 'rgba(5,150,105,0.75)';
    if (stats.pct >= 50)  return 'rgba(251,191,36,0.70)';
    return 'rgba(239,68,68,0.70)';
  };

  const handleTileClick = (num) => {
    const terr = getTerrObj(num);
    if (!terr) return;
    setSelectedTerr(terr);
    setEditForm({ mapeado: terr.mapeado || 'NAO', interno: terr.interno || 'NAO' });
  };

  const handleSave = async () => {
    if (!editForm || !selectedTerr) return;
    setSaving(true);
    try {
      await geoterritoriosApi.entities.Territorio.update(selectedTerr.id, {
        mapeado: editForm.mapeado,
        interno: editForm.interno,
      });
      toast.success(`Território ${selectedTerr.num} atualizado`);
      setTerritorios(prev => prev.map(t =>
        t.id === selectedTerr.id ? { ...t, ...editForm } : t
      ));
      setSelectedTerr(null);
      setEditForm(null);
    } catch (e) {
      toast.error('Erro: ' + e.message);
    }
    setSaving(false);
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
      <div className="text-center">
        <h1 className="font-crimson text-3xl text-primary tracking-wide">🗺️ MAPA — JARDIM PAULISTA</h1>
        <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5">Clique em um território para editar</p>
      </div>

      {/* Legenda progresso */}
      <div className="flex flex-wrap gap-3 justify-center text-[10px]">
        {[
          { color: '#059669', label: 'Cartas 100%' },
          { color: '#fbbf24', label: 'Cartas 50–99%' },
          { color: '#ef4444', label: 'Cartas 0–49%' },
          { color: '#6b7280', label: 'Sem dados' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: color }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Mapa */}
      <div className="bg-card border border-border rounded-xl p-4 overflow-x-auto">
        <div className="min-w-[480px]">
          {MAP_GRID.map((row, ri) => (
            <div key={ri} className="flex gap-1 mb-1">
              {row.map((num, ci) => {
                if (!num) {
                  return <div key={ci} className="w-10 h-10 flex-shrink-0" />;
                }
                const group = GROUP_COLORS[num] || 'slate';
                const baseColor = GROUP_BASE_COLORS[group];
                const overlayColor = getOverlayColor(num);
                const stats = getStats(num);
                const terr = getTerrObj(num);

                return (
                  <button
                    key={ci}
                    onClick={() => handleTileClick(num)}
                    title={`Terr. ${num}: ${stats.cartas}/${stats.total} cartas (${stats.pct}%) | ${stats.fechados}/${stats.conds} fechados`}
                    className="w-10 h-10 flex-shrink-0 rounded-md flex flex-col items-center justify-center font-bold transition-all hover:scale-110 hover:ring-2 hover:ring-primary relative overflow-hidden"
                    style={{ backgroundColor: baseColor }}
                  >
                    {overlayColor && (
                      <div className="absolute inset-0 rounded-md" style={{ backgroundColor: overlayColor }} />
                    )}
                    <span className="relative z-10 text-[11px] font-bold text-white drop-shadow leading-none">{num}</span>
                    {stats.conds > 0 && (
                      <span className="relative z-10 text-[8px] text-white drop-shadow leading-none opacity-90">{stats.pct}%</span>
                    )}
                    {terr?.mapeado === 'SIM' && (
                      <span className="relative z-10 text-[7px] text-white leading-none opacity-80">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Modal de edição */}
      {selectedTerr && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-crimson text-2xl text-primary">Território {String(selectedTerr.num).padStart(2, '0')}</h2>
              <button onClick={() => { setSelectedTerr(null); setEditForm(null); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const s = getStats(selectedTerr.num);
              return (
                <div className="space-y-1.5 mb-4 pb-4 border-b border-border text-[11px]">
                  <div className="flex justify-between"><span className="text-muted-foreground">Condomínios:</span><span className="font-bold">{s.conds}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Fechados:</span><span className="font-bold text-geo-green">{s.fechados}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total aptos:</span><span className="font-bold">{s.total}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Cartas enviadas:</span><span className="font-bold text-geo-green">{s.cartas} ({s.pct}%)</span></div>
                </div>
              );
            })()}

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Mapeado</label>
                <select
                  value={editForm.mapeado}
                  onChange={(e) => setEditForm({ ...editForm, mapeado: e.target.value })}
                  className="w-full px-3 py-2 mt-1 rounded-md bg-input border border-border text-[11px]"
                >
                  <option value="SIM">✓ SIM</option>
                  <option value="NAO">✗ NÃO</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Interno</label>
                <select
                  value={editForm.interno}
                  onChange={(e) => setEditForm({ ...editForm, interno: e.target.value })}
                  className="w-full px-3 py-2 mt-1 rounded-md bg-input border border-border text-[11px]"
                >
                  <option value="SIM">✓ SIM</option>
                  <option value="NAO">✗ NÃO</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-md bg-geo-green text-white text-[11px] font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Salvar
                </button>
                <button
                  onClick={() => { setSelectedTerr(null); setEditForm(null); }}
                  className="flex-1 px-4 py-2 rounded-md bg-muted text-muted-foreground text-[11px] font-bold hover:bg-border"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}