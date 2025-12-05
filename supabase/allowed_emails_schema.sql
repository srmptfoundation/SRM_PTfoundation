-- Add allowed_emails table for managing access control
create table public.allowed_emails (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  role text check (role in ('student', 'staff', 'admin')) not null,
  added_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.allowed_emails enable row level security;

-- Policies for allowed_emails
create policy "Admins can view all allowed emails." on allowed_emails
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can insert allowed emails." on allowed_emails
  for insert with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete allowed emails." on allowed_emails
  for delete using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Update the trigger to check allowed_emails and auto-provision profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Check if email is in allowed_emails
  declare
    allowed_role text;
  begin
    select role into allowed_role
    from public.allowed_emails
    where email = new.email;

    -- If found in allowed_emails, use that role; otherwise check hardcoded admins
    if allowed_role is not null then
      insert into public.profiles (id, email, full_name, role, created_at)
      values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
        allowed_role,
        now()
      );
    elsif new.email in ('srmptfoundation@gmail.com', 'emaniraj1989@gmail.com') then
      -- Hardcoded admin emails
      insert into public.profiles (id, email, full_name, role, created_at)
      values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
        'admin',
        now()
      );
    else
      -- Not in allowed list, don't create profile (will be redirected to /forbidden)
      return new;
    end if;
  end;
  
  return new;
end;
$$;

-- Recreate trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
