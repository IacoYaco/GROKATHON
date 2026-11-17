create table if not exists ceid_accounts (
  id bigserial primary key,
  cursor_sub text not null unique,
  netid text not null,
  display_name text not null default '',
  email text not null default '',
  role text not null check (role in ('student', 'faculty')),
  affiliations text[] not null default '{}',
  auth_source text not null default 'demo' check (auth_source in ('yale_cas', 'demo')),
  college text not null default '',
  class_year text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz not null default now()
);

create index if not exists ceid_accounts_netid_idx on ceid_accounts (netid);
create index if not exists ceid_accounts_role_idx on ceid_accounts (role);

create table if not exists ceid_floor_announcements (
  id bigserial primary key,
  author_sub text not null,
  author_name text not null default '',
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists ceid_rsvp_roster (
  id bigserial primary key,
  workshop_id text not null,
  workshop_title text not null,
  starts_at timestamptz,
  location text not null default '',
  cursor_sub text not null,
  netid text not null,
  display_name text not null default '',
  role text not null,
  claimed_at timestamptz not null default now(),
  unique (workshop_id, cursor_sub)
);
