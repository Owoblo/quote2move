-- Create uploads table for manual photo/video uploads
create table if not exists public.uploads (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  token text unique default encode(gen_random_bytes(16), 'hex'),
  upload_type text check (upload_type in ('manual', 'customer')) not null default 'manual',
  status text check (status in ('pending', 'processing', 'completed', 'error')) not null default 'pending',

  -- Property information
  property_address text,
  bedrooms int,
  bathrooms int,
  sqft int,

  -- Customer info (for customer uploads)
  customer_name text,
  customer_email text,
  customer_phone text,

  -- Detection results
  detections jsonb,

  -- Metadata
  created_at timestamp with time zone default now(),
  processed_at timestamp with time zone,

  -- Indexes
  constraint uploads_user_id_idx unique (user_id, created_at)
);

-- Create upload_files table to store individual files
create table if not exists public.upload_files (
  id uuid primary key default uuid_generate_v4(),
  upload_id uuid references public.uploads on delete cascade not null,

  -- File information
  file_path text not null, -- Supabase storage path
  file_type text check (file_type in ('image', 'video')) not null,
  file_size bigint,
  original_name text,
  mime_type text,

  -- Processing status
  processed boolean default false,
  frames_extracted int, -- for videos

  -- Metadata
  created_at timestamp with time zone default now(),

  -- Indexes
  constraint upload_files_upload_id_idx unique (upload_id, created_at)
);

-- Create indexes for better query performance
create index if not exists uploads_user_id_idx on public.uploads(user_id);
create index if not exists uploads_token_idx on public.uploads(token);
create index if not exists uploads_status_idx on public.uploads(status);
create index if not exists upload_files_upload_id_idx on public.upload_files(upload_id);

-- Enable Row Level Security
alter table public.uploads enable row level security;
alter table public.upload_files enable row level security;

-- RLS Policies for uploads
create policy "Users can view their own uploads"
  on public.uploads for select
  using (auth.uid() = user_id);

create policy "Users can insert their own uploads"
  on public.uploads for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own uploads"
  on public.uploads for update
  using (auth.uid() = user_id);

create policy "Users can delete their own uploads"
  on public.uploads for delete
  using (auth.uid() = user_id);

-- RLS Policies for upload_files
create policy "Users can view files from their uploads"
  on public.upload_files for select
  using (
    exists (
      select 1 from public.uploads
      where uploads.id = upload_files.upload_id
      and uploads.user_id = auth.uid()
    )
  );

create policy "Users can insert files to their uploads"
  on public.upload_files for insert
  with check (
    exists (
      select 1 from public.uploads
      where uploads.id = upload_files.upload_id
      and uploads.user_id = auth.uid()
    )
  );

create policy "Users can delete files from their uploads"
  on public.upload_files for delete
  using (
    exists (
      select 1 from public.uploads
      where uploads.id = upload_files.upload_id
      and uploads.user_id = auth.uid()
    )
  );

-- Allow public access for customer uploads via token
create policy "Anyone can view uploads with valid token"
  on public.uploads for select
  using (upload_type = 'customer');

create policy "Anyone can insert customer uploads"
  on public.uploads for insert
  with check (upload_type = 'customer');

-- Comments
comment on table public.uploads is 'Stores manual photo/video uploads and customer upload sessions';
comment on table public.upload_files is 'Individual files (photos/videos) for each upload session';
comment on column public.uploads.token is 'Unique token for shareable customer upload links';
comment on column public.uploads.upload_type is 'manual = mover upload, customer = customer self-service';
comment on column public.upload_files.frames_extracted is 'Number of frames extracted from video (if applicable)';
