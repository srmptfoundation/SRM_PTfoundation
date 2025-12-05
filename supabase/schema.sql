-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  role text check (role in ('student', 'staff', 'admin')),
  department text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create leave_requests table
create table public.leave_requests (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id) not null,
  student_name text not null,
  department text not null,
  reason text not null,
  start_date date not null,
  end_date date not null,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.leave_requests enable row level security;

-- Policies for leave_requests
create policy "Students can view their own leave requests." on leave_requests
  for select using (auth.uid() = student_id);

create policy "Students can insert their own leave requests." on leave_requests
  for insert with check (auth.uid() = student_id);

create policy "Staff can view leave requests from their department." on leave_requests
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'staff' and department = leave_requests.department
    )
  );

create policy "Admins can view all leave requests." on leave_requests
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Staff can update leave requests (approve/reject)." on leave_requests
  for update using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'staff' and department = leave_requests.department
    )
  );

create policy "Admins can update all leave requests." on leave_requests
  for update using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Function to handle new user signups
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, created_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    case
      when new.email in ('srmptfoundation@gmail.com', 'emaniraj1989@gmail.com') then 'admin'
      else 'student' -- Default role
    end,
    now()
  );
  return new;
end;
$$;

-- Trigger the function every time a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
