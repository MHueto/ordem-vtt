'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, ArrowUpRight, BookOpen } from 'lucide-react';
import { database, errorMessage, type Campaign } from '@/lib/workspace';
import { Shell, useOwner } from './GmSession';

export default function Dashboard() {
  const owner = useOwner();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    database().from('gm_campaigns').select('*').eq('owner_id', owner).order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError(errorMessage(error)); else { setCampaigns(data || []); setError(''); }
        setLoading(false);
      });
    return () => { active = false; };
  }, [owner, retry]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name')).trim();
    if (!name) { setError('Dê um nome à campanha.'); return; }
    setBusy(true); setError('');
    try {
      const { data, error } = await database().from('gm_campaigns').insert({ owner_id: owner, name, description: String(form.get('description')).trim() }).select().single();
      if (error) throw error;
      router.push(`/campaign/${data.id}`);
    } catch (e) { setError(errorMessage(e)); setBusy(false); }
  }
  return <Shell><main id="main" className="dashboard">
    <div className="page-heading"><div><p className="eyebrow">SEU ARQUIVO DE HISTÓRIAS</p><h1>Minhas campanhas</h1><p className="muted">Prepare o próximo encontro. Tudo começa com uma história.</p></div><button className="primary" onClick={() => setCreating(true)}><Plus size={18} aria-hidden />Nova campanha</button></div>
    {error && <div className="error" role="alert">{error} {!creating && <button onClick={() => { setLoading(true); setRetry(retry + 1); }}>Tentar novamente</button>}</div>}
    {creating && <section className="panel create-panel"><h2>Uma nova história</h2><form onSubmit={create}>
      <label>Nome da campanha<input name="name" required maxLength={120} autoFocus placeholder="Ex.: O Eco do Medo" /></label>
      <label>Resumo para o mestre<textarea name="description" rows={4} maxLength={10000} placeholder="O ponto de partida, a atmosfera e o que você quer lembrar…" /></label>
      <div className="actions"><button className="primary" disabled={busy}>{busy ? 'Criando…' : 'Criar e abrir painel'}</button><button type="button" disabled={busy} onClick={() => setCreating(false)}>Cancelar</button></div>
    </form></section>}
    {loading ? <p role="status">Carregando campanhas…</p> : campaigns.length ? <div className="campaign-grid">{campaigns.map((c, i) => <Link className="campaign-card" key={c.id} href={`/campaign/${c.id}`}>
      <div className="card-top"><span className="eyebrow">ARQUIVO {String(i + 1).padStart(2, '0')}</span><ArrowUpRight aria-hidden size={22} /></div><BookOpen size={32} aria-hidden className="accent" /><h2>{c.name}</h2><p className="muted clamp">{c.description || 'Sua próxima sessão começa aqui.'}</p><span className="card-foot">Abrir escudo do mestre <span>→</span></span>
    </Link>)}</div> : !error && <section className="empty"><BookOpen size={40} aria-hidden /><h2>Sua primeira campanha espera por você</h2><p>Crie uma campanha e separe o que precisa consultar em NPCs, locais e anotações.</p><button onClick={() => setCreating(true)}>Criar minha primeira campanha</button></section>}
    <footer className="page-footer">Espaço privado do mestre · Salvo na sua conta</footer>
  </main></Shell>;
}
