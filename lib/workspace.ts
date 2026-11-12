import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { NpcSheet } from './npc-sheet';
let client: SupabaseClient | undefined;
export function database() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('A conexão com o banco ainda não foi configurada.');
  client = createClient(url, key);
  return client;
}
export type Campaign = { id: string; owner_id: string; name: string; description: string; created_at: string };
export type Kind = 'npc' | 'location' | 'note';
export type Entry = {
  id: string; owner_id: string; campaign_id: string; kind: Kind; name: string;
  content: string; occupation: string; appearance: string; role: string; desire: string;
  bonds: string; location_id: string | null; archived_at: string | null; updated_at: string;
  sheet?: NpcSheet | null;
};
export type EntryDraft = Pick<Entry, 'kind' | 'name' | 'content' | 'occupation' | 'appearance' | 'role' | 'desire' | 'bonds' | 'location_id'>;
export const labels: Record<Kind, string> = { npc: 'NPCs', location: 'Locais', note: 'Anotações' };
export const singular: Record<Kind, string> = { npc: 'NPC', location: 'local', note: 'anotação' };
export function emptyEntry(kind: Kind): EntryDraft {
  return { kind, name: '', content: '', occupation: '', appearance: '', role: '', desire: '', bonds: '', location_id: null };
}
export function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String(error.message) : '';
  if (/fetch|network/i.test(message)) return 'Não foi possível conectar. Confira sua internet e tente novamente. Seu texto continua aqui.';
  if (/row.level|permission|JWT|session/i.test(message)) return 'Sua sessão expirou ou você não tem acesso a este conteúdo. Entre novamente.';
  if (/schema cache|does not exist/i.test(message)) return 'O banco ainda precisa receber a estrutura do painel. Tente novamente após a configuração.';
  return message || 'Não foi possível concluir. Tente novamente.';
}
