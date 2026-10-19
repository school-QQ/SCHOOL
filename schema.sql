-- الخطوة 1: الصق هذا كاملاً في Supabase > SQL Editor ثم Run
create table classes(id bigint generated always as identity primary key,name text not null,sort int default 0,created_at timestamptz default now());
create table students(id bigint generated always as identity primary key,name text not null,class_id bigint not null references classes(id) on delete restrict,guardian_name text,phone text,has_sibling boolean not null default false,fee numeric,created_at timestamptz default now());
create table payments(id bigint generated always as identity primary key,student_id bigint not null references students(id) on delete cascade,amount numeric not null check(amount>0),paid_on date not null default current_date,created_at timestamptz default now());
create table settings(key text primary key,value text);
create table profiles(id uuid primary key references auth.users(id) on delete cascade,username text unique not null,role text not null default 'staff',must_change boolean not null default true);

create function is_staff() returns boolean language sql security definer set search_path=public as $$ select exists(select 1 from profiles where id=auth.uid()) $$;
create function is_admin() returns boolean language sql security definer set search_path=public as $$ select exists(select 1 from profiles where id=auth.uid() and role='admin') $$;
create function clear_must_change() returns void language sql security definer set search_path=public as $$ update profiles set must_change=false where id=auth.uid() $$;

alter table classes enable row level security;alter table students enable row level security;alter table payments enable row level security;alter table settings enable row level security;alter table profiles enable row level security;
create policy staff_all on classes for all to authenticated using(is_staff()) with check(is_staff());
create policy staff_all on students for all to authenticated using(is_staff()) with check(is_staff());
create policy staff_all on payments for all to authenticated using(is_staff()) with check(is_staff());
create policy staff_all on settings for all to authenticated using(is_staff()) with check(is_staff());
create policy read_profiles on profiles for select to authenticated using(id=auth.uid() or is_admin());

insert into classes(name,sort) values('روضة',1),('الأول',2),('الثاني',3);
insert into settings values('title','مركز جودة التعليم'),('monthly_fee','0');
