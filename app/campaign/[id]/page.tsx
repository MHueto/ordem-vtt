'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { rollDice, calculatePatente } from '@/lib/dice';
import { Dices, Shield } from 'lucide-react';
import AttributeGrid from '@/components/AttributeGrid';

export default function CampaignPage({ params }: { params: { id: string } }) {
  const [char, setChar] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [diceInput, setDiceInput] = useState('');

  useEffect(() => {
    fetchCharacter();
    fetchLogs();
    const channel = supabase.channel(`campaign_${params.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dice_logs' }, (payload) => {
      setLogs((prev) => [payload.new, ...prev].slice(0, 20));
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [params.id]);

  async function fetchCharacter() {
    const { data } = await supabase.from('characters').select('*').eq('campaign_id', params.id).single();
    setChar(data);
  }

  async function fetchLogs() {
    const { data } = await supabase.from('dice_logs').select('*').eq('campaign_id', params.id).order('created_at', { ascending: false }).limit(20);
    setLogs(data || []);
  }

  async function updateAttribute(key: string, val: number) {
    const newAttrs = { ...char.attributes, [key]: val };
    await supabase.from('characters').update({ attributes: newAttrs }).eq('id', char.id);
    setChar({ ...char, attributes: newAttrs });
  }

  async function handleRoll() {
    try {
      const res = rollDice(diceInput);
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('dice_logs').insert({ campaign_id: params.id, user_id: user?.id, roll_expression: diceInput, result: res.result });
      setDiceInput('');
    } catch (e: any) { alert(e.message); }
  }

  if (!char) return <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center text-white">Carregando Ficha...</div>;

  return (
    <main className="min-h-screen bg-[#0f0f12] text-slate-200 p-6">
      <header className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Campanha <span className="text-rose-600">Paranormal</span></h1>
          <p className="text-zinc-500 text-sm">Personagem: {char.name} | NEX: {char.nex}% | Patente: {calculatePatente(char.nex)}</p>
        </div>
        <div className="flex gap-2 bg-[#1a1a20] p-2 rounded-lg border border-zinc-800">
          <input
            value={diceInput} onChange={(e) => setDiceInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRoll()}
            placeholder="2d6+5" className="bg-[#0f0f12] p-2 rounded text-white outline-none w-32"
          />
          <button onClick={handleRoll} className="bg-rose-600 p-2 rounded text-white hover:bg-rose-500 transition-all"><Dices size={20}/></button>
        </div>
      </header>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <section className="bg-[#1a1a20] p-6 rounded-xl border border-zinc-800 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-zinc-800 rounded-full border-2 border-rose-600 overflow-hidden">
                {char.photo_url && <img src={char.photo_url} className="w-full h-full object-cover" />}
              </div>
              <h2 className="text-2xl font-bold text-white">{char.name}</h2>
            </div>
            <AttributeGrid values={char.attributes} onUpdate={updateAttribute} />
          </section>
          <div className="bg-[#1a1a20] p-6 rounded-xl border border-zinc-800 h-64">
            <h3 className="text-zinc-400 font-bold uppercase text-xs mb-4">Perícias & Inventário</h3>
            <p className="text-zinc-600 italic text-sm">Módulo de Perícias em desenvolvimento...</p>
          </div>
        </div>
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-rose-950/10 p-6 rounded-xl border border-rose-900/30">
            <h3 className="text-rose-500 font-bold uppercase text-xs mb-4 flex items-center gap-2"><Shield size={14}/> Escudo do Mestre</h3>
            <div className="space-y-2">
              <button className="w-full text-left p-2 text-sm bg-[#0f0f12] rounded border border-zinc-800 hover:border-rose-600 transition-all">Gerenciar Jogadores</button>
              <button className="w-full text-left p-2 text-sm bg-[#0f0f12] rounded border border-zinc-800 hover:border-rose-600 transition-all">NPCs e Criaturas</button>
              <button className="w-full text-left p-2 text-sm bg-[#0f0f12] rounded border border-zinc-800 hover:border-rose-600 transition-all">Livro de Regras</button>
            </div>
          </div>
          <div className="bg-[#1a1a20] p-6 rounded-xl border border-zinc-800">
            <h3 className="text-zinc-400 font-bold uppercase text-xs mb-4 flex items-center gap-2"><Dices size={14}/> Log Global</h3>
            <div className="space-y-3 h-64 overflow-y-auto font-mono text-xs">
              {logs.map((log: any) => (
                <div key={log.id} className="p-2 bg-[#0f0f12] rounded border-l-2 border-rose-600 animate-in slide-in-from-right-2">
                  <span className="text-zinc-500">Rolou {log.roll_expression}: </span>
                  <span className="text-white font-bold text-sm">{log.result}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
