// C'est ici qu'on gère la création et l'édition avec les descriptions détaillées.
import { Save, X } from 'lucide-react';

interface Props {
  mode: 'create' | 'edit';
  form: any;
  setForm: (form: any) => void;
  onSave: () => void;
  loading: boolean;
}

export const EventForm = ({ mode, form, setForm, onSave, loading }: Props) => {
  const addOption = () =>
    setForm({
      ...form,
      options: [...form.options, { label: '', description: '', prix: 0 }],
    });
  const removeOption = (index: number) =>
    setForm({
      ...form,
      options: form.options.filter((_: any, i: number) => i !== index),
    });
  const updateOption = (index: number, key: string, val: any) => {
    const opts = [...form.options];
    opts[index][key] = val;
    setForm({ ...form, options: opts });
  };

  return (
    <div className="create-form">
      <h3>{mode === 'edit' ? "Modifier l'événement" : 'Nouvel Événement'}</h3>
      <input
        type="text"
        placeholder="Titre"
        className="modern-input"
        value={form.titre}
        onChange={(e) => setForm({ ...form, titre: e.target.value })}
      />
      <input
        type="date"
        className="modern-input"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
      />
      <input
        type="text"
        placeholder="Lieu"
        className="modern-input"
        value={form.lieu}
        onChange={(e) => setForm({ ...form, lieu: e.target.value })}
      />
      <textarea
        placeholder="Description"
        className="modern-input"
        style={{ height: '80px' }}
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />

      <h4 className="section-title">Options de prix</h4>
      {form.options.map((opt: any, i: number) => (
        <div
          key={i}
          className="opt-form-block"
          style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '15px',
            borderRadius: '12px',
            marginBottom: '15px',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Titre"
              className="modern-input"
              style={{ margin: 0, flex: 2 }}
              value={opt.label}
              onChange={(e) => updateOption(i, 'label', e.target.value)}
            />
            <input
              type="number"
              placeholder="€"
              className="modern-input"
              style={{ margin: 0, flex: 1 }}
              value={opt.prix}
              onChange={(e) =>
                updateOption(i, 'prix', parseFloat(e.target.value))
              }
            />
            {form.options.length > 1 && (
              <button
                onClick={() => removeOption(i)}
                style={{ color: '#ef4444', background: 'none', border: 'none' }}
              >
                <X size={20} />
              </button>
            )}
          </div>
          <input
            type="text"
            placeholder="Détails de l'option..."
            className="modern-input"
            style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}
            value={opt.description}
            onChange={(e) => updateOption(i, 'description', e.target.value)}
          />
        </div>
      ))}
      <button className="admin-link" onClick={addOption}>
        + Ajouter une option
      </button>
      <button
        onClick={onSave}
        className="main-pay-btn"
        style={{ marginTop: '30px' }}
        disabled={loading}
      >
        <Save size={20} /> Enregistrer
      </button>
    </div>
  );
};
