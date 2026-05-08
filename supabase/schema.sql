-- AI News Agent: initial schema
-- Run this in the Supabase SQL editor to set up the database.

create table if not exists articles (
  id           uuid        primary key default gen_random_uuid(),
  title        text        not null,
  url          text        not null unique,
  source       text        not null,
  published_at timestamptz,
  summary      text,
  created_at   timestamptz not null default now()
);

-- Index for the frontend query: latest articles first
create index if not exists articles_created_at_idx
  on articles (created_at desc);

-- Migration: run this if the table already exists
-- alter table articles add column if not exists summary text;
