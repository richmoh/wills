-- Account security and data protection
-- Apply with: psql $DB -f migrations/002_account_security.sql

-- When the user gave explicit consent to their answers being stored. The
-- answers reveal religious belief, which is special category data under UK GDPR.
alter table users add column if not exists consented_at timestamptz;

-- Single-use password reset tokens. Only a hash of the token is stored.
create table if not exists password_resets (
  token_hash text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists password_resets_user_idx on password_resets(user_id);
