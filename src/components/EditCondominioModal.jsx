import { useState } from 'react';
import { geoterritoriosApi } from '@/api/geoterritoriosClient';
import { toast } from 'sonner';
import { X, Save } from 'lucide-react';

export default function EditCondominioModal({ condominio, onClose }) {
  const isNew = !condominio?.id;
  const [form, setForm] = useState({
    territorio: condominio?.territorio || '',
    quadra: condominio?.quadra || '',
    cep: condominio?.cep || '',
    nome: condominio?.nome || '',
    endereco: condominio?.endereco || '',
    total_aptos: condominio?.total_aptos ?? 0,
    cartas_enviadas: condominio?.cartas_enviadas ?? 0,
    fechado: condominio?.fechado || 'NAO',
    publicadores: condominio?.publicadores || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleSave = async () => {
    if (!form.nome) { toast.error('Nome obrigatório'); return; }
    setSaving(true);
    if (isNew) {
      await geoterritoriosApi.entities.Condominio.create({ ...form, total_aptos: Number(form.total_aptos), cartas_enviadas: Number(form.cartas_enviadas) });
      toast.success('Condomínio criado!');
    } else {
      await geoterritoriosApi.entities.Condominio.update(condominio.id, { ...form, total_aptos: Number(form.total_aptos), cartas_enviadas: Number(form.cartas_enviadas) });
      toast.success('Condomínio atualizado!');
    }
    setSaving(false);
    onClose();
  };

  const field = (label, key, type = 'text', opts = {}) => (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => set(key, e.target.value)}
        {...opts}
        className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-primary outline-none transition-colors"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-crimson text-xl text-primary">{isNew ? 'Novo Condomínio' : 'Editar Condomínio'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        {/* Form */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-3 gap-3">
            {field('Território', 'territorio')}
            {field('Quadra', 'quadra')}
            {field('CEP', 'cep')}
          </div>
          {field('Nome do Condomínio', 'nome')}
          {field('Endereço', 'endereco')}
          <div className="grid grid-cols-3 gap-3">
            {field('Total Aptos', 'total_aptos', 'number')}
            {field('Cartas Enviadas', 'cartas_enviadas', 'number')}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fechado?</label>
              <select
                value={form.fechado}
                onChange={e => set('fechado', e.target.value)}
                className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-primary outline-none"
              >
                <option value="SIM">SIM</option>
                <option value="NAO">NÃO</option>
              </select>
            </div>
          </div>
          {field('Publicadores', 'publicadores')}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-md bg-primary text-primary-foreground font-syne text-[11px] font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button onClick={onClose} className="px-5 py-2 rounded-md bg-muted text-muted-foreground font-syne text-[11px] font-bold hover:bg-border">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}