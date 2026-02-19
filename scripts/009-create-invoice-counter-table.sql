-- Create invoice_counters table for sequential invoice numbering
CREATE TABLE IF NOT EXISTS public.invoice_counters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  counter_date DATE NOT NULL UNIQUE,
  last_sequence INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.invoice_counters ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access only (server-side operations)
CREATE POLICY "Service role can manage invoice counters"
  ON public.invoice_counters
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for fast date lookups
CREATE INDEX IF NOT EXISTS idx_invoice_counters_date ON public.invoice_counters(counter_date);

-- Create function to get next invoice sequence (atomic operation)
CREATE OR REPLACE FUNCTION get_next_invoice_sequence(p_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_sequence INTEGER;
BEGIN
  -- Insert or update the counter for the given date (atomic upsert)
  INSERT INTO public.invoice_counters (counter_date, last_sequence, updated_at)
  VALUES (p_date, 1, NOW())
  ON CONFLICT (counter_date)
  DO UPDATE SET 
    last_sequence = public.invoice_counters.last_sequence + 1,
    updated_at = NOW()
  RETURNING last_sequence INTO v_sequence;
  
  RETURN v_sequence;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_next_invoice_sequence(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_invoice_sequence(DATE) TO service_role;
