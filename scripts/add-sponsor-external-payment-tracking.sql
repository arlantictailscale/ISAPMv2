-- Add columns to track whether a sponsored payment has been settled externally
-- (i.e., sponsor actually sent the funds after the sponsored registration was approved).

alter table public.order_payments
  add column if not exists sponsor_externally_paid boolean not null default false,
  add column if not exists sponsor_externally_paid_at timestamp with time zone,
  add column if not exists sponsor_externally_paid_by uuid references auth.users(id) on delete set null,
  add column if not exists sponsor_external_payment_notes text;

-- Index for quick filtering of pending vs paid sponsor settlements
create index if not exists idx_order_payments_sponsor_external_paid
  on public.order_payments (sponsor_externally_paid)
  where payment_method = 'sponsored';
