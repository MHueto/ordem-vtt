begin;
create table public.gm_campaigns (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check (char_length(trim(name)) between 1 and 120),
 description text not null default '' check (char_length(description) <= 10000),
 created_at timestamptz not null default now(), unique (id, owner_id)
);
create table public.gm_entries (
 id uuid primary key default gen_random_uuid(), campaign_id uuid not null,
 owner_id uuid not null default auth.uid(),
 kind text not null check (kind in ('npc', 'location', 'note')),
 name text not null check (char_length(trim(name)) between 1 and 120),
 content text not null default '' check (char_length(content) <= 30000),
 occupation text not null default '' check (char_length(occupation) <= 1000),
 appearance text not null default '' check (char_length(appearance) <= 10000),
 role text not null default '' check (char_length(role) <= 10000),
 desire text not null default '' check (char_length(desire) <= 10000),
 bonds text not null default '' check (char_length(bonds) <= 10000),
 location_id uuid, archived_at timestamptz, updated_at timestamptz not null default now(),
 unique (id, campaign_id, owner_id),
 foreign key (campaign_id, owner_id) references public.gm_campaigns(id, owner_id) on delete cascade,
 foreign key (location_id, campaign_id, owner_id) references public.gm_entries(id, campaign_id, owner_id),
 check (location_id is null or (kind = 'npc' and location_id <> id))
);
create index gm_campaigns_owner_idx on public.gm_campaigns(owner_id);
create index gm_entries_campaign_idx on public.gm_entries(campaign_id, owner_id);
create index gm_entries_location_idx on public.gm_entries(location_id);
create function public.gm_entry_before_write() returns trigger
language plpgsql set search_path = '' as $$
begin
 if TG_OP = 'UPDATE' and (new.kind <> old.kind or new.campaign_id <> old.campaign_id or new.owner_id <> old.owner_id) then
  raise exception 'O tipo, a campanha e o proprietário não podem mudar.';
 end if;
 if new.location_id is not null and not exists (
  select 1 from public.gm_entries where id = new.location_id and kind = 'location'
  and campaign_id = new.campaign_id and owner_id = new.owner_id
 ) then raise exception 'Escolha um local da mesma campanha.'; end if;
 new.updated_at = now(); return new;
end;
$$;
create trigger gm_entry_before_write before insert or update on public.gm_entries
for each row execute function public.gm_entry_before_write();
alter table public.gm_campaigns enable row level security;
alter table public.gm_entries enable row level security;
revoke all on public.gm_campaigns, public.gm_entries from anon, authenticated;
grant select, insert, update on public.gm_campaigns, public.gm_entries to authenticated;
create policy gm_campaigns_read on public.gm_campaigns for select to authenticated using ((select auth.uid()) = owner_id);
create policy gm_campaigns_create on public.gm_campaigns for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy gm_campaigns_edit on public.gm_campaigns for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy gm_entries_read on public.gm_entries for select to authenticated using ((select auth.uid()) = owner_id);
create policy gm_entries_create on public.gm_entries for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy gm_entries_edit on public.gm_entries for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
commit;
