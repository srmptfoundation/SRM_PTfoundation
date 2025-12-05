-- Add columns for leave slip feature
alter table public.leave_requests
  add column if not exists submitted_data jsonb not null default '{}'::jsonb,
  add column if not exists slip_url text,
  add column if not exists approved_by uuid references public.profiles(id),
  add column if not exists approved_at timestamp with time zone;

-- Update RLS policies to ensure users can insert their own requests with the new columns
-- (Existing policies might already cover this, but good to be explicit if needed)
-- The existing policy "Users can insert their own leave requests" should work if it doesn't restrict columns.

-- Allow admins to update status and slip_url
create policy "Admins can update leave requests"
  on public.leave_requests
  for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
