'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { database, errorMessage } from '@/lib/workspace';

export default function LoginPage() {
  const router = useRouter();
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    Promise.resolve().then(() => {
      if (!active) return;
      const db = database();
      db.auth.getSession().then(({ data, error }) => {
        if (error) setError(errorMessage(error));
        else if (data.session) router.replace('/campaign/dashboard');
      }).catch(e => setError(errorMessage(e)));
      const { data } = db.auth.onAuthStateChange((_event, session) => {
        if (session) router.replace('/campaign/dashboard');
      });
      unsubscribe = () => data.subscription.unsubscribe();
    }).catch(e => { if (active) setError(errorMessage(e)); });
    return () => { active = false; unsubscribe?.(); };
  }, [router]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email')).trim();
    const password = String(form.get('password'));
    setBusy(true); setError(''); setMessage('');
    try {
      const db = database();
      const result = signup
        ? await db.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/login` } })
        : await db.auth.signInWithPassword({ email, password });
      if (result.error) {
        const text = result.error.message;
        throw new Error(/invalid login/i.test(text) ? 'E-mail ou senha incorretos.' : /email not confirmed/i.test(text) ? 'Confirme seu e-mail antes de entrar.' : /rate limit/i.test(text) ? 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' : text);
      }
      if (result.data.session) router.replace('/campaign/dashboard');
      else setMessage('Confira seu e-mail e abra o link de confirmação. Depois volte aqui para entrar.');
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><section className="auth-story">
    <Link className="brand" href="/">ORDEM <span>VTT</span></Link>
    <p className="eyebrow">SEU ESPAÇO DE PREPARAÇÃO</p>
    <h1>A história começa<br />do seu lado da mesa.</h1>
    <p>Reúna personagens, organize os lugares e mantenha suas anotações por perto. Menos abas abertas, mais tempo para narrar.</p>
    <div className="auth-caption">CAMPANHAS · NPCs · LOCAIS · ANOTAÇÕES</div>
  </section><section className="auth-panel">
    <form onSubmit={submit} className="panel auth-form">
      <p className="eyebrow">ESCUDO DO MESTRE</p>
      <h2>{signup ? 'Crie seu espaço' : 'Bem-vindo de volta'}</h2>
      <p className="muted">{signup ? 'Use seu e-mail para guardar suas campanhas.' : 'Entre para continuar preparando sua próxima sessão.'}</p>
      <label>E-mail<input name="email" type="email" required autoComplete="email" maxLength={254} /></label>
      <label>Senha<input name="password" type="password" required minLength={signup ? 8 : 1} maxLength={128} autoComplete={signup ? 'new-password' : 'current-password'} /></label>
      {signup && <p className="hint">Use pelo menos 8 caracteres.</p>}
      {error && <p role="alert" className="error">{error}</p>}
      {message && <p role="status" className="success">{message}</p>}
      <button className="primary" disabled={busy}>{busy ? 'Aguarde…' : signup ? 'Criar conta' : 'Entrar'}</button>
      <button type="button" className="text-button" disabled={busy} onClick={() => { setSignup(!signup); setError(''); setMessage(''); }}>{signup ? 'Já tenho conta' : 'Ainda não tenho conta'}</button>
    </form>
    <p className="hint">Suas anotações ficam disponíveis somente na sua conta.</p>
  </section></main>;
}
