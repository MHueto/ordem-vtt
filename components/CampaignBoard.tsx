'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Users, MapPin, NotebookPen, LayoutDashboard, Archive, Plus, Search, LockKeyhole } from 'lucide-react';
import { database, errorMessage, labels, type Campaign, type Entry, type Kind } from '@/lib/workspace';
import { Shell, useOwner } from './GmSession';
import EntryEditor from './EntryEditor';

type View = 'overview' | Kind | 'archive';
const tabs = [
  { id: 'overview', label: 'Visão geral', Icon: LayoutDashboard },
  { id: 'npc', label: 'NPCs', Icon: Users },
  { id: 'location', label: 'Locais', Icon: MapPin },
  { id: 'note', label: 'Anotações', Icon: NotebookPen },
  { id: 'archive', label: 'Arquivados', Icon: Archive },
] as const;

export default function CampaignBoard() {
  const { id } = useParams<{ id: string }>();
  const owner = useOwner();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [retry, setRetry] = useState(0);
  const [view, setView] = useState<View>('overview');
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ kind: Kind; entry: Entry | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [editCampaign, setEditCampaign] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Este endereço de campanha é inválido.');
        const db = database();
        const [c, e] = await Promise.all([
          db.from('gm_campaigns').select('*').eq('id', id).eq('owner_id', owner).maybeSingle(),
          db.from('gm_entries').select('*').eq('campaign_id', id).eq('owner_id', owner).order('name').limit(1000),
        ]);
        if (!active) return;
        if (c.error) throw c.error;
        if (e.error) throw e.error;
        if (!c.data) throw new Error('Campanha não encontrada ou sem acesso para esta conta.');
        setCampaign(c.data); setEntries(e.data || []); setError('');
        if (e.data?.length === 1000) setNotice('Mostrando os primeiros 1.000 registros desta campanha.');
      } catch (e) { if (active) setError(errorMessage(e)); }
      finally { if (active) setLoading(false); }
    }
    load(); return () => { active = false; };
  }, [id, owner, retry]);
  const current = entries.find(e => e.id === selected);
  const live = entries.filter(e => !e.archived_at);
  const locations = entries.filter(e => e.kind === 'location');
  const filtered = entries.filter(e => {
    const matchesView = view === 'archive' ? !!e.archived_at : !e.archived_at && e.kind === view;
    const text = [e.name, e.content, e.occupation, e.appearance, e.role, e.desire, e.bonds].join(' ').toLocaleLowerCase('pt-BR');
    return matchesView && text.includes(search.toLocaleLowerCase('pt-BR')) && (view !== 'npc' || !location || (location === 'none' ? !e.location_id : e.location_id === location));
  });
  function navigate(next: View) { setView(next); setSelected(null); setSearch(''); setLocation(''); setNotice(''); setError(''); }
  function saved(entry: Entry) {
    setEntries(prev => [...prev.filter(e => e.id !== entry.id), entry].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
    setEditor(null); setView(entry.archived_at ? 'archive' : entry.kind); setSelected(entry.id); setNotice('Registro salvo na sua conta.'); setError(''); setSearch(''); setLocation('');
  }
  async function archive(entry: Entry) {
    if (busy) return; setBusy(true); setError('');
    try {
      const { data, error } = await database().from('gm_entries').update({ archived_at: entry.archived_at ? null : new Date().toISOString() }).eq('id', entry.id).eq('owner_id', owner).eq('updated_at', entry.updated_at).select().maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('O registro mudou em outra aba. Atualize a página e tente novamente.');
      setEntries(prev => prev.map(e => e.id === data.id ? data : e)); setSelected(null);
      setNotice(entry.archived_at ? 'Registro restaurado.' : 'Registro arquivado. Você pode recuperá-lo em Arquivados.');
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  async function updateCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget); const name = String(form.get('name')).trim();
    if (!name) { setError('Preencha o nome da campanha.'); return; }
    setBusy(true); setError('');
    try {
      const { data, error } = await database().from('gm_campaigns').update({ name, description: String(form.get('description')) }).eq('id', id).eq('owner_id', owner).select().single();
      if (error) throw error;
      setCampaign(data); setEditCampaign(false); setNotice('Campanha atualizada.');
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  if (loading) return <Shell><main className="center" role="status">Carregando campanha…</main></Shell>;
  if (!campaign) return <Shell><main className="center"><h1>Não foi possível abrir a campanha</h1><p className="error" role="alert">{error}</p><button onClick={() => { setLoading(true); setRetry(retry + 1); }}>Tentar novamente</button><Link href="/campaign/dashboard">Voltar às campanhas</Link></main></Shell>;
  return <Shell campaign={campaign.name}><div className="workspace"><aside className="sidebar"><p className="eyebrow">ESCUDO DO MESTRE</p><h2>{campaign.name}</h2>
    <nav aria-label="Seções da campanha">{tabs.map(({ id: tab, label, Icon }) => <button key={tab} aria-current={view === tab ? 'page' : undefined} disabled={!!editor || editCampaign || busy} onClick={() => navigate(tab)}><Icon size={18} aria-hidden /><span>{label}</span>{['npc', 'location', 'note'].includes(tab) && <span className="count">{live.filter(e => e.kind === tab).length}</span>}</button>)}</nav>
    <p className="private"><LockKeyhole size={16} aria-hidden />Conteúdo privado do mestre</p>
  </aside><main id="main" className="board">
    <div className="page-heading"><div><p className="eyebrow">PREPARAÇÃO DE SESSÃO</p><h1>{tabs.find(t => t.id === view)?.label}</h1><p className="muted">{view === 'overview' ? 'O que você precisa, a um olhar de distância.' : view === 'npc' ? 'Pessoas, motivações e segredos da sua história.' : view === 'location' ? 'Os lugares onde a história acontece.' : view === 'note' ? 'Pistas, acontecimentos e lembretes para narrar.' : 'Registros guardados. Restaure quando precisar.'}</p></div>
      {!editor && (view === 'npc' || view === 'location' || view === 'note') && <button className="primary" onClick={() => { setEditor({ kind: view, entry: null }); setNotice(''); }}><Plus size={18} aria-hidden />{view === 'npc' ? 'Novo NPC' : view === 'location' ? 'Novo local' : 'Nova anotação'}</button>}
    </div>
    {error && <p className="error" role="alert">{error}</p>}{notice && <p className="success" role="status">{notice}</p>}
    {editor ? <EntryEditor key={editor.entry?.id || editor.kind} {...editor} campaignId={id} owner={owner} locations={locations} onSaved={saved} onClose={() => setEditor(null)} /> : view === 'overview' ? <>
      <div className="stats">{(['npc', 'location', 'note'] as Kind[]).map(kind => <button key={kind} onClick={() => navigate(kind)}><span className="stat-number">{live.filter(e => e.kind === kind).length.toString().padStart(2, '0')}</span><span>{labels[kind]} <span aria-hidden>↗</span></span></button>)}</div>
      <section className="panel"><div className="section-heading"><h2>A história até aqui</h2>{!editCampaign && <button onClick={() => setEditCampaign(true)}>Editar campanha</button>}</div>
        {editCampaign ? <form onSubmit={updateCampaign}><label>Nome<input name="name" required maxLength={120} defaultValue={campaign.name} autoFocus /></label><label>Resumo para o mestre<textarea name="description" maxLength={10000} rows={8} defaultValue={campaign.description} /></label><div className="actions"><button className="primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar campanha'}</button><button type="button" disabled={busy} onClick={() => setEditCampaign(false)}>Cancelar</button></div></form> : <p className="prose">{campaign.description || 'Use este espaço para guardar a premissa, o conflito central e o ponto em que a sessão parou.'}</p>}
      </section>
      <section className="panel"><h2>Comece pelo essencial</h2><div className="quick-actions">{(['location', 'npc', 'note'] as Kind[]).map(kind => <button disabled={editCampaign} key={kind} onClick={() => { navigate(kind); setEditor({ kind, entry: null }); }}><Plus size={17} aria-hidden />{kind === 'location' ? 'Descrever um local' : kind === 'npc' ? 'Criar um NPC' : 'Escrever uma anotação'}</button>)}</div><p className="hint">Cadastre os locais primeiro para associar os NPCs a cada um.</p></section>
    </> : <>
      <div className="filters"><label className="search"><span className="sr-only">Buscar registros</span><Search size={18} aria-hidden /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou conteúdo…" /></label>{view === 'npc' && <label className="location-filter"><span className="sr-only">Filtrar por local</span><select value={location} onChange={e => { setLocation(e.target.value); setSelected(null); }}><option value="">Todos os locais</option><option value="none">Sem local definido</option>{locations.map(l => <option value={l.id} key={l.id}>{l.name}{l.archived_at ? ' (arquivado)' : ''}</option>)}</select></label>}</div>
      <div className="records-layout"><section className="record-list" aria-label="Registros">{filtered.length ? filtered.map(e => <button className={`record ${selected === e.id ? 'selected' : ''}`} key={e.id} onClick={() => setSelected(e.id)} aria-pressed={selected === e.id}><span className="eyebrow">{e.kind === 'npc' ? locations.find(l => l.id === e.location_id)?.name || 'Sem local definido' : labels[e.kind]}</span><strong>{e.name}</strong><span className="muted clamp">{e.occupation || e.content || 'Abrir registro'}</span></button>) : <div className="empty small"><h2>{search || location ? 'Nenhum resultado' : 'Ainda não há registros'}</h2><p>{search || location ? 'Tente outro nome ou remova os filtros.' : view === 'archive' ? 'Os registros arquivados aparecem aqui.' : 'Use o botão acima para começar.'}</p></div>}</section>
        <section className="panel record-detail" aria-label="Detalhes do registro">{current && filtered.some(e => e.id === current.id) ? <>
          <p className="eyebrow">{labels[current.kind]}</p><h2>{current.name}</h2><div className="actions"><button disabled={busy} onClick={() => setEditor({ kind: current.kind, entry: current })}>Editar</button><button disabled={busy} onClick={() => archive(current)}>{busy ? 'Salvando…' : current.archived_at ? 'Restaurar' : 'Arquivar'}</button></div>
          {current.kind === 'npc' && <><Detail label="O que faz" value={current.occupation} /><Detail label="Local" value={locations.find(l => l.id === current.location_id)?.name || 'Sem local definido'} /><Detail label="Descrição física" value={current.appearance} /><Detail label="Quem é na história" value={current.role} /><Detail label="O que deseja" value={current.desire} /><Detail label="Vínculos" value={current.bonds} /></>}
          <Detail label={current.kind === 'location' ? 'Descrição do local' : current.kind === 'note' ? 'Anotação' : 'Anotações do mestre'} value={current.content} />
          {current.kind === 'location' && <div className="detail-section"><h3>NPCs neste local</h3>{live.filter(e => e.location_id === current.id).length ? live.filter(e => e.location_id === current.id).map(e => <button key={e.id} className="text-button" onClick={() => { navigate('npc'); setSelected(e.id); }}>{e.name}</button>) : <p className="muted">Nenhum NPC associado ainda.</p>}</div>}
        </> : <div className="empty small"><NotebookPen aria-hidden size={28} /><h2>Abra um registro</h2><p>Selecione um item para consultar todos os detalhes.</p></div>}</section>
      </div>
    </>}
  </main></div></Shell>;
}
function Detail({ label, value }: { label: string; value: string }) { return <div className="detail-section"><h3>{label}</h3><p className={`prose ${!value ? 'muted' : ''}`}>{value || 'Não preenchido.'}</p></div>; }

