begin;
alter table public.gm_entries add column if not exists sheet jsonb;
alter table public.gm_entries add constraint gm_entries_sheet_valid check (
  sheet is null or (kind = 'npc' and jsonb_typeof(sheet) = 'object' and coalesce(sheet->>'version' = '1', false) and octet_length(sheet::text) <= 200000)
);
notify pgrst, 'reload schema';
commit;
