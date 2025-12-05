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
      else 'student' -- Default role for others, or 'pending' if you want to block them
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

-- If these users have ALREADY signed in and exist in auth.users but not profiles, insert them now
-- Note: This requires knowing their IDs, which we can't easily query from here if we are just running SQL.
-- But if they exist in profiles (e.g. created by a previous trigger or manual insert), update them:
update public.profiles
set role = 'admin'
where email in ('srmptfoundation@gmail.com', 'emaniraj1989@gmail.com');
