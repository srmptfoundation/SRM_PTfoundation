-- Fix approved_by column type
-- It was created as UUID references profiles(id), but the UI sends the Signatory Name (text).
-- We need to change it to TEXT to store the name that appears on the slip.

-- First drop the foreign key constraint if it exists
alter table public.leave_requests drop constraint if exists leave_requests_approved_by_fkey;

-- Then change the column type to text
alter table public.leave_requests alter column approved_by type text;
