'use client';
import React, { useState, useEffect } from 'react';
import { rollDice } from '@/lib/dice';
import { Dices } from 'lucide-react';

export default function DiceRoller() {
  const [input, setInput] = useState('');
  const [lastRoll, setLastRoll] = useState<{result: number, detail: string} | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        document.getElementById('dice-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRoll = async () => {
    try {
      const res = rollDice(input);
      setLastRoll(res);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Não foi possível rolar os dados.');
    }
  };

  return (
    <div className="p-4 bg-[#1a1a20] border-l-4 border-rose-600 rounded-lg shadow-xl">
      <div className="flex items-center gap-3 mb-3 text-rose-500">
        <Dices size={20} />
        <span className="font-bold uppercase text-xs tracking-widest">Rolagem de Dados</span>
      </div>
      <div className="flex gap-2">
        <input
          id="dice-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRoll()}
          placeholder="Ex: 2d6+5"
          className="bg-[#0f0f12] text-white border border-zinc-800 p-2 rounded focus:ring-2 ring-rose-600 outline-none w-full transition-all"
        />
        <button
          onClick={handleRoll}
          className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded font-bold transition-all active:scale-95"
        >
          Rolar
        </button>
      </div>
      {lastRoll && (
        <div className="mt-3 p-2 bg-[#0f0f12] rounded border border-zinc-800">
          <div className="text-2xl font-black text-white">{lastRoll.result}</div>
          <div className="text-xs text-zinc-500 font-mono">{lastRoll.detail}</div>
        </div>
      )}
    </div>
  );
}
