-- Add rejection_reason column to leave_requests table
-- This column will store the reason when an admin rejects a leave request

alter table public.leave_requests
  add column if not exists rejection_reason text;

-- Add comment for documentation
comment on column public.leave_requests.rejection_reason is 'Reason provided by admin when rejecting a leave request';
