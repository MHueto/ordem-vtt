'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { database, emptyEntry, errorMessage, singular, type Entry, type EntryDraft, type Kind } from '@/lib/workspace';

export default function EntryEditor({ entry, kind, campaignId, owner, locations, onSaved, onClose }: {
  entry: Entry | null; kind: Kind; campaignId: string; owner: string; locations: Entry[];
  onSaved: (entry: Entry) => void; onClose: () => void;
}) {
  const [initial] = useState<EntryDraft>(() => entry ? {
    kind: entry.kind, name: entry.name, content: entry.content, occupation: entry.occupation,
    appearance: entry.appearance, role: entry.role, desire: entry.desire, bonds: entry.bonds, location_id: entry.location_id,
  } : emptyEntry(kind));
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [discard, setDiscard] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  function field(key: keyof EntryDraft, value: string | null) { setDraft(prev => ({ ...prev, [key]: value })); }
  async function save(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    if (!draft.name.trim()) { setError('Preencha o nome ou título.'); return; }
    setBusy(true); setError('');
    try {
      const payload = { ...draft, name: draft.name.trim() };
      const table = database().from('gm_entries');
      const query = entry
        ? table.update(payload).eq('id', entry.id).eq('owner_id', owner).eq('campaign_id', campaignId).eq('updated_at', entry.updated_at)
        : table.insert({ ...payload, campaign_id: campaignId, owner_id: owner });
      const { data, error } = await query.select().maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Este registro mudou em outra aba. Copie seu texto, feche o editor e atualize a página antes de tentar novamente.');
      onSaved(data);
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  const textField = (key: 'content' | 'appearance' | 'role' | 'desire' | 'bonds', label: string, placeholder: string, rows = 3) => <label key={key}>{label}<textarea value={draft[key]} rows={rows} maxLength={key === 'content' ? 30000 : 10000} placeholder={placeholder} onChange={e => field(key, e.target.value)} /></label>;
  return <section className="panel editor"><p className="eyebrow">{entry ? 'EDITAR REGISTRO' : 'NOVO REGISTRO'}</p><h2>{entry ? `Editar ${singular[kind]}` : kind === 'npc' ? 'Novo NPC' : kind === 'location' ? 'Novo local' : 'Nova anotação'}</h2>
    <form onSubmit={save}><fieldset disabled={busy}>
      <label>{kind === 'note' ? 'Título' : 'Nome'}<input autoFocus required maxLength={120} value={draft.name} onChange={e => field('name', e.target.value)} /></label>
      {kind === 'npc' && <><div className="form-grid"><label>O que faz<input maxLength={1000} value={draft.occupation} onChange={e => field('occupation', e.target.value)} placeholder="Profissão ou função" /></label>
        <label>Local<select value={draft.location_id || ''} onChange={e => field('location_id', e.target.value || null)}><option value="">Sem local definido</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}{l.archived_at ? ' (arquivado)' : ''}</option>)}</select></label></div>
        {textField('appearance', 'Descrição física', 'Rosto, cabelo, roupas, postura e marcas particulares…')}
        {textField('role', 'Quem é na história', 'O papel na campanha e o que sabe…')}
        <div className="form-grid">{textField('desire', 'O que deseja', 'Objetivos, medos e motivações…')}{textField('bonds', 'Vínculos', 'Com quem se relaciona e de que forma…')}</div>
      </>}
      {textField('content', kind === 'location' ? 'Descrição do local' : kind === 'note' ? 'Texto da anotação' : 'Anotações do mestre', kind === 'location' ? 'Atmosfera, aparência, pontos de interesse e segredos…' : 'Escreva o que precisa lembrar durante a sessão…', kind === 'note' ? 12 : 5)}
    </fieldset>
      {error && <p role="alert" className="error">{error}</p>}
      {discard ? <div className="notice"><p>Há alterações não salvas. Descartar esse rascunho?</p><div className="actions"><button type="button" onClick={onClose}>Descartar alterações</button><button type="button" onClick={() => setDiscard(false)}>Continuar editando</button></div></div> : <div className="actions"><button className="primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</button><button type="button" disabled={busy} onClick={() => dirty ? setDiscard(true) : onClose()}>Cancelar</button><span className="hint">{dirty ? 'Alterações ainda não salvas' : 'Somente você pode ver'}</span></div>}
    </form>
  </section>;
}
