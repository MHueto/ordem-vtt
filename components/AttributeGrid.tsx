'use client';
import React from 'react';

const ATTRIBUTES = [
  { label: 'FORÇA', key: 'FOR', color: 'border-red-500' },
  { label: 'AGILIDADE', key: 'AGI', color: 'border-green-500' },
  { label: 'INTELECTO', key: 'INT', color: 'border-blue-500' },
  { label: 'PRESENÇA', key: 'PRE', color: 'border-yellow-500' },
  { label: 'VIGOR', key: 'VIG', color: 'border-orange-500' },
];

export default function AttributeGrid({ values, onUpdate }: { values: Record<string, number>, onUpdate: (key: string, val: number) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
      {ATTRIBUTES.map((attr) => (
        <div key={attr.key} className={`bg-[#1a1a20] p-4 rounded-lg border-b-4 ${attr.color} transition-all hover:bg-[#22222b]`}>
          <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-tighter mb-1">{attr.label}</label>
          <div className="flex items-center justify-between">
            <input
              type="number"
              value={values[attr.key]}
              onChange={(e) => onUpdate(attr.key, parseInt(e.target.value))}
              className="bg-transparent text-2xl font-black text-white w-12 outline-none"
            />
            <div className="text-zinc-600 font-mono text-xs">MOD</div>
          </div>
        </div>
      ))}
    </div>
  );
}
