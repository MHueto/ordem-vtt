'use client';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { attributes, changeResource, emptySheet, inventorySlots, validateSheet, type NpcSheet as Sheet, type Resource } from '@/lib/npc-sheet';
import { database, errorMessage, type Entry } from '@/lib/workspace';

const sections = ['Status', 'Perícias', 'Rituais', 'Inventário', 'Combate'] as const;
const resources = [['life', 'Vida'], ['effort', 'Esforço'], ['sanity', 'Sanidade'], ['determination', 'Determinação']] as const;

export default function NpcSheet({ entry, onSaved, onClose }: { entry: Entry; onSaved: (entry: Entry) => void; onClose: () => void }) {
  const [initial] = useState(() => entry.sheet || emptySheet());
  const [sheet, setSheet] = useState<Sheet>(initial);
  const [section, setSection] = useState<typeof sections[number]>('Status');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [discard, setDiscard] = useState(false);
  const dirty = JSON.stringify(initial) !== JSON.stringify(sheet);
  useEffect(() => {
    if (!dirty) return;
    const listener = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', listener);
    return () => window.removeEventListener('beforeunload', listener);
  }, [dirty]);
  function update<K extends keyof Sheet>(key: K, value: Sheet[K]) { setSheet(s => ({ ...s, [key]: value })); setNotice(''); }
  async function save(e: FormEvent) {
    e.preventDefault(); if (busy) return;
    const invalid = validateSheet(sheet);
    if (invalid) { setError(invalid); return; }
    setBusy(true); setError('');
    try {
      const { data, error } = await database().from('gm_entries').update({ sheet }).eq('id', entry.id).eq('campaign_id', entry.campaign_id).eq('owner_id', entry.owner_id).eq('updated_at', entry.updated_at).select().maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Este NPC mudou em outra aba. Guarde suas alterações antes de atualizar a página.');
      onSaved(data);
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  function spend(cost: number, name: string) {
    if (!Number.isInteger(cost) || cost < 0 || sheet.effort.current < cost) { setNotice(`Esforço insuficiente para ${name}.`); return; }
    update('effort', changeResource(sheet.effort, -cost));
    setNotice(`${name}: ${cost} PE descontados no rascunho. Salve a ficha para registrar.`);
  }
  const used = inventorySlots(sheet.inventory);
  return <section className="panel sheet-editor" aria-label={`Ficha de ${entry.name}`}>
    <p className="eyebrow">FICHA DO NPC</p><h2>{entry.name}</h2>
    <p className="muted">Preencha os valores da sua mesa. Máximos, defesa e efeitos de habilidades são definidos por você.</p>
    <form onSubmit={save} noValidate>
      <fieldset disabled={busy}>
        <div className="sheet-resources">{resources.map(([key, label]) => <div className="resource" key={key}><span>{label}</span><strong>{sheet[key].current}<small> / {sheet[key].max}</small></strong><div className="resource-buttons"><button type="button" aria-label={`Diminuir ${label}`} disabled={sheet[key].current === 0} onClick={() => update(key, changeResource(sheet[key], -1))}>−</button><button type="button" aria-label={`Aumentar ${label}`} disabled={sheet[key].current >= sheet[key].max} onClick={() => update(key, changeResource(sheet[key], 1))}>+</button></div></div>)}</div>
        <nav className="sheet-tabs" aria-label="Seções da ficha">{sections.map(tab => <button type="button" key={tab} aria-pressed={tab === section} onClick={() => setSection(tab)}>{tab}</button>)}</nav>
        <div hidden={section !== 'Status'}>
          <h3>Identidade e progressão</h3><div className="sheet-grid"><Text label="Origem" value={sheet.origin} onChange={v => update('origin', v)} /><Text label="Classe" value={sheet.className} onChange={v => update('className', v)} /><Text label="Trilha" value={sheet.trail} onChange={v => update('trail', v)} /><NumberField label="NEX (%)" value={sheet.nex} max={100} onChange={v => update('nex', v)} /></div>
          <h3>Atributos</h3><div className="sheet-grid">{attributes.map(attr => <NumberField key={attr} label={attr} value={sheet.attributes[attr]} max={99} onChange={value => update('attributes', { ...sheet.attributes, [attr]: value })} />)}</div>
          <h3>Recursos</h3><div className="sheet-grid">{resources.map(([key, label]) => <div key={key}><NumberField label={`${label} atual`} value={sheet[key].current} max={sheet[key].max} onChange={current => update(key, { ...sheet[key], current })} /><NumberField label={`${label} ${key === 'effort' ? 'máximo' : 'máxima'}`} value={sheet[key].max} onChange={max => update(key, { max, current: Math.min(sheet[key].current, max) })} /></div>)}</div>
          <div className="sheet-grid"><NumberField label="Defesa" value={sheet.defense} onChange={v => update('defense', v)} /><NumberField label="Deslocamento (m)" value={sheet.movement} step={0.5} onChange={v => update('movement', v)} /><NumberField label="Assistência médica" value={sheet.medical} onChange={v => update('medical', v)} /></div>
          <Text area label="Condições e efeitos ativos" value={sheet.conditions} onChange={v => update('conditions', v)} /><Text area label="Resistências e imunidades" value={sheet.resistances} onChange={v => update('resistances', v)} /><Text area label="Habilidades e poderes" value={sheet.abilities} onChange={v => update('abilities', v)} />
        </div>
        <div hidden={section !== 'Perícias'}><h3>Treino e modificadores</h3><p className="hint">O total soma treino e bônus. Registre aqui os bônus de itens e efeitos que se aplicam à perícia.</p>
          <div className="skill-grid">{sheet.skills.map((skill, index) => <div className="skill-row" key={index}><Text label={`Perícia ${index + 1}`} value={skill.name} onChange={name => update('skills', sheet.skills.map((s, i) => i === index ? { ...s, name } : s))} /><div className="skill-values"><NumberField label={`Treino — ${skill.name}`} value={skill.training} min={-99} max={999} onChange={training => update('skills', sheet.skills.map((s, i) => i === index ? { ...s, training } : s))} /><NumberField label={`Bônus — ${skill.name}`} value={skill.bonus} min={-999} max={999} onChange={bonus => update('skills', sheet.skills.map((s, i) => i === index ? { ...s, bonus } : s))} /><span className="skill-total">Total<strong>{skill.training + skill.bonus >= 0 ? '+' : ''}{skill.training + skill.bonus}</strong></span></div></div>)}</div>
          <button type="button" onClick={() => update('skills', [...sheet.skills, { name: 'Nova perícia', training: 0, bonus: 0 }])}>Adicionar perícia</button>
        </div>
        <div hidden={section !== 'Rituais'}><h3>Rituais conhecidos</h3><p className="hint">O botão Usar desconta apenas o custo de Esforço informado. Outros efeitos são controlados pelo mestre.</p>
          {!sheet.rituals.length && <p className="sheet-empty">Este NPC ainda não tem rituais cadastrados.</p>}
          {sheet.rituals.map((ritual, index) => { const patch = (values: Partial<typeof ritual>) => update('rituals', sheet.rituals.map(r => r.id === ritual.id ? { ...r, ...values } : r)); return <CollectionCard key={ritual.id} title={`Ritual ${index + 1}`} onRemove={() => update('rituals', sheet.rituals.filter(r => r.id !== ritual.id))}>
            <Text label="Nome do ritual" value={ritual.name} onChange={name => patch({ name })} /><div className="sheet-grid"><Text label="Elemento" value={ritual.element} onChange={element => patch({ element })} /><Text label="Círculo" value={ritual.circle} onChange={circle => patch({ circle })} /><NumberField label="Custo em PE" value={ritual.cost} onChange={cost => patch({ cost })} /><Text label="Execução" value={ritual.execution} onChange={execution => patch({ execution })} /><Text label="Alcance / alvo" value={ritual.range} onChange={range => patch({ range })} /><Text label="Duração" value={ritual.duration} onChange={duration => patch({ duration })} /></div><Text area label="Efeito, resistência e aprimoramentos" value={ritual.description} onChange={description => patch({ description })} /><button type="button" disabled={!ritual.name.trim() || !Number.isInteger(ritual.cost) || ritual.cost < 0 || sheet.effort.current < ritual.cost} onClick={() => spend(ritual.cost, ritual.name)}>Usar ritual · {ritual.cost} PE</button>
          </CollectionCard>; })}
          <button type="button" onClick={() => update('rituals', [...sheet.rituals, { id: crypto.randomUUID(), name: '', element: '', circle: '', cost: 0, execution: '', range: '', duration: '', description: '' }])}>Adicionar ritual</button>
        </div>
        <div hidden={section !== 'Inventário'}><div className="section-heading"><div><h3>Equipamentos e suprimentos</h3><p className={used > sheet.capacity ? 'accent' : 'muted'}>Espaços usados: <strong>{used} / {sheet.capacity}</strong>{used > sheet.capacity ? ' · Acima da capacidade' : ''}</p></div><NumberField label="Capacidade em espaços" value={sheet.capacity} step={0.5} onChange={v => update('capacity', v)} /></div>
          {!sheet.inventory.length && <p className="sheet-empty">Adicione armas, proteção, componentes e outros itens.</p>}
          {sheet.inventory.map((item, index) => { const patch = (values: Partial<typeof item>) => update('inventory', sheet.inventory.map(i => i.id === item.id ? { ...i, ...values } : i)); return <CollectionCard key={item.id} title={`Item ${index + 1}`} onRemove={() => update('inventory', sheet.inventory.filter(i => i.id !== item.id))}>
            <Text label="Nome do item" value={item.name} onChange={name => patch({ name })} /><div className="sheet-grid"><NumberField label="Quantidade" value={item.quantity} onChange={quantity => patch({ quantity })} /><NumberField label="Espaços por unidade" value={item.slots} step={0.5} onChange={slots => patch({ slots })} /><label className="sheet-check"><input type="checkbox" checked={item.equipped} onChange={e => patch({ equipped: e.target.checked })} />Equipado</label></div><Text area label="Descrição, categoria e efeitos" value={item.description} onChange={description => patch({ description })} /><p className="hint">Total deste item: {item.quantity * item.slots} espaços. Marcar como equipado não aplica bônus automaticamente.</p>
          </CollectionCard>; })}<button type="button" onClick={() => update('inventory', [...sheet.inventory, { id: crypto.randomUUID(), name: '', quantity: 1, slots: 1, equipped: false, description: '' }])}>Adicionar item</button>
        </div>
        <div hidden={section !== 'Combate'}><h3>Ataques e ações</h3>{!sheet.attacks.length && <p className="sheet-empty">Registre os ataques para consultar durante o combate.</p>}
          {sheet.attacks.map((attack, index) => { const patch = (values: Partial<typeof attack>) => update('attacks', sheet.attacks.map(a => a.id === attack.id ? { ...a, ...values } : a)); return <CollectionCard key={attack.id} title={`Ataque ${index + 1}`} onRemove={() => update('attacks', sheet.attacks.filter(a => a.id !== attack.id))}>
            <Text label="Nome do ataque" value={attack.name} onChange={name => patch({ name })} /><div className="sheet-grid"><Text label="Teste / bônus" value={attack.test} onChange={test => patch({ test })} /><Text label="Dano" value={attack.damage} onChange={damage => patch({ damage })} /><Text label="Alcance do ataque" value={attack.range} onChange={range => patch({ range })} /><Text label="Crítico" value={attack.critical} onChange={critical => patch({ critical })} /></div><Text area label="Efeitos e observações" value={attack.description} onChange={description => patch({ description })} />
          </CollectionCard>; })}<button type="button" onClick={() => update('attacks', [...sheet.attacks, { id: crypto.randomUUID(), name: '', test: '', damage: '', range: '', critical: '', description: '' }])}>Adicionar ataque</button>
        </div>
      </fieldset>
      {notice && <p className="notice" role="status">{notice}</p>}{error && <p className="error" role="alert">{error}</p>}
      <div className="sheet-save"><div className="actions"><button className="primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar ficha'}</button><button type="button" disabled={busy} onClick={() => dirty ? setDiscard(true) : onClose()}>Voltar ao NPC</button><span className="hint">{dirty ? 'Alterações ainda não salvas' : 'Ficha privada do mestre'}</span></div>
      {discard && <div className="notice"><p>Descartar as alterações não salvas na ficha?</p><button type="button" onClick={onClose}>Descartar rascunho</button> <button type="button" onClick={() => setDiscard(false)}>Continuar editando</button></div>}</div>
    </form>
  </section>;
}

function Text({ label, value, onChange, area = false }: { label: string; value: string; onChange: (v: string) => void; area?: boolean }) { return <label>{label}{area ? <textarea rows={3} maxLength={10000} value={value} onChange={e => onChange(e.target.value)} /> : <input maxLength={200} value={value} onChange={e => onChange(e.target.value)} />}</label>; }
function NumberField({ label, value, onChange, min = 0, max = 99999, step = 1 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) { return <label>{label}<input type="number" min={min} max={max} step={step} required value={value} onChange={e => { const number = Number(e.target.value); if (Number.isFinite(number)) onChange(number); }} /></label>; }
function CollectionCard({ title, children, onRemove }: { title: string; children: ReactNode; onRemove: () => void }) { return <section className="sheet-card"><div className="section-heading"><h3>{title}</h3><button type="button" onClick={onRemove}>Remover {title.toLowerCase()}</button></div>{children}</section>; }

export function SheetSummary({ sheet }: { sheet?: Sheet | null }) {
  if (!sheet) return <p className="muted">Ficha ainda não preenchida. Abra a ficha para cadastrar status, perícias, rituais e inventário.</p>;
  return <div className="detail-section"><h3>Ficha do NPC</h3><div className="sheet-summary">{resources.map(([key, label]) => <span key={key}>{label}<strong>{formatResource(sheet[key])}</strong></span>)}<span>Defesa<strong>{sheet.defense}</strong></span></div><p className="hint">{sheet.rituals.length} rituais · {sheet.inventory.length} itens · {sheet.attacks.length} ataques</p>{sheet.conditions && <p className="prose">Condições: {sheet.conditions}</p>}</div>;
}
function formatResource(resource: Resource) { return `${resource.current} / ${resource.max}`; }
