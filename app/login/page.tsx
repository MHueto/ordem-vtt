'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleAuth = async () => {
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) alert(error.message);
    else router.push('/campaign/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center p-4">
      <div className="bg-[#1a1a20] p-8 rounded-2xl border border-zinc-800 w-full max-w-md shadow-2xl">
        <h1 className="text-3xl font-black text-white text-center mb-8 uppercase tracking-tighter">
          Ordem <span className="text-rose-600">VTT</span>
        </h1>
        <div className="space-y-4">
          <input
            type="email" placeholder="E-mail"
            className="w-full p-3 bg-[#0f0f12] border border-zinc-800 rounded text-white outline-none focus:ring-2 ring-rose-600"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password" placeholder="Senha"
            className="w-full p-3 bg-[#0f0f12] border border-zinc-800 rounded text-white outline-none focus:ring-2 ring-rose-600"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={handleAuth}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded transition-all active:scale-95"
          >
            {isSignUp ? 'Criar Conta' : 'Entrar'}
          </button>
          <p
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-center text-zinc-500 text-sm cursor-pointer hover:text-zinc-300"
          >
            {isSignUp ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
          </p>
        </div>
      </div>
    </div>
  );
}
