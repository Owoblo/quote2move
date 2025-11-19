-- Add expires_at column for customer upload links
alter table public.uploads add column if not exists expires_at timestamp with time zone;

-- Add index for expiration queries
create index if not exists uploads_expires_at_idx on public.uploads(expires_at);

-- Comment
comment on column public.uploads.expires_at is 'Expiration date for customer upload links (NULL = never expires)';
