create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null check (role in ('administrator', 'principal', 'vice-principal', 'head-of-department', 'teacher')),
  department text not null default '',
  subjects text[] not null default '{}',
  grade_classes text[] not null default '{}',
  status text not null default 'inactive' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_active_or_self"
on public.profiles for select
using (
  auth.uid() = id
  or exists (
    select 1 from public.profiles authority
    where authority.id = auth.uid()
      and authority.status = 'active'
      and authority.role in ('administrator', 'principal', 'vice-principal', 'head-of-department')
  )
);

create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);

create policy "profiles_update_self_or_authority"
on public.profiles for update
using (
  auth.uid() = id
  or exists (
    select 1 from public.profiles authority
    where authority.id = auth.uid()
      and authority.status = 'active'
      and authority.role in ('administrator', 'principal', 'vice-principal')
  )
)
with check (
  auth.uid() = id
  or exists (
    select 1 from public.profiles authority
    where authority.id = auth.uid()
      and authority.status = 'active'
      and authority.role in ('administrator', 'principal', 'vice-principal')
  )
);

create policy "profiles_delete_by_authority"
on public.profiles for delete
using (
  exists (
    select 1 from public.profiles authority
    where authority.id = auth.uid()
      and authority.status = 'active'
      and authority.role in ('administrator', 'principal', 'vice-principal')
  )
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_status_idx on public.profiles(status);

create table if not exists public.lesson_plans (
  id text primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  department text not null default '',
  status text not null default 'draft',
  payload jsonb not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lesson_plans enable row level security;

create policy "lesson_plans_select_by_authority"
on public.lesson_plans for select
using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.profiles profile
    where profile.id = auth.uid()
      and profile.status = 'active'
      and (
        profile.role in ('administrator', 'principal', 'vice-principal')
        or (profile.role = 'head-of-department' and profile.department = lesson_plans.department)
      )
  )
);

create policy "lesson_plans_insert_own"
on public.lesson_plans for insert
with check (owner_id = auth.uid());

create policy "lesson_plans_update_by_owner_or_authority"
on public.lesson_plans for update
using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.profiles profile
    where profile.id = auth.uid()
      and profile.status = 'active'
      and (
        profile.role in ('administrator', 'principal', 'vice-principal')
        or (profile.role = 'head-of-department' and profile.department = lesson_plans.department)
      )
  )
)
with check (
  owner_id = auth.uid()
  or exists (
    select 1 from public.profiles profile
    where profile.id = auth.uid()
      and profile.status = 'active'
      and (
        profile.role in ('administrator', 'principal', 'vice-principal')
        or (profile.role = 'head-of-department' and profile.department = lesson_plans.department)
      )
  )
);

create index if not exists lesson_plans_owner_idx on public.lesson_plans(owner_id);
create index if not exists lesson_plans_department_idx on public.lesson_plans(department);
create index if not exists lesson_plans_status_idx on public.lesson_plans(status);
