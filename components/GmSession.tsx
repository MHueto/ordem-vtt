'use client';
import { useEffect, useState, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { database, errorMessage } from '@/lib/workspace';

const Owner = createContext('');
export const useOwner = () => useContext(Owner);
export function GmSession({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [owner, setOwner] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    Promise.resolve().then(() => {
      if (!active) return;
      const db = database();
      const { data } = db.auth.onAuthStateChange((_event, session) => {
        if (!active) return;
        if (!session) { setOwner(''); router.replace('/login'); }
        else setOwner(session.user.id);
      });
      db.auth.getSession().then(({ data, error }) => {
        if (!active) return;
        if (error) setError(errorMessage(error));
        else if (data.session) setOwner(data.session.user.id);
        else router.replace('/login');
      }).catch(e => { if (active) setError(errorMessage(e)); });
      unsubscribe = () => data.subscription.unsubscribe();
    }).catch(e => { if (active) setError(errorMessage(e)); });
    return () => { active = false; unsubscribe?.(); };
  }, [router]);
  if (error) return <main className="center"><p className="error" role="alert">{error}</p><Link href="/login">Voltar para entrar</Link></main>;
  if (!owner) return <Loading />;
  return <Owner.Provider value={owner}><div key={owner}>{children}</div></Owner.Provider>;
}
export function Loading() { return <div className="center" role="status">Abrindo seu espaço…</div>; }
export function Shell({ children, campaign }: { children: React.ReactNode; campaign?: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      const { error } = await database().auth.signOut();
      if (error) throw error;
      router.replace('/login');
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <><a href="#main" className="skip-link">Ir para o conteúdo</a><header className="topbar">
    <Link className="brand" href="/campaign/dashboard">ORDEM <span>VTT</span></Link>
    <div className="breadcrumb"><Link href="/campaign/dashboard">Minhas campanhas</Link>{campaign && <><span>/</span><span>{campaign}</span></>}</div>
    <button className="quiet" onClick={logout} disabled={busy}>{busy ? 'Saindo…' : 'Sair'}</button>
  </header>{error && <p className="error" role="alert">{error}</p>}{children}</>;
}
