-- Migration: Create email tracking tables for broadcast rate limiting
-- Purpose: Track daily email sends and broadcast status for Resend free plan compliance

-- Table 1: Track daily email send counts per admin
CREATE TABLE IF NOT EXISTS email_send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  send_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sent_count INTEGER NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(admin_id, send_date)
);

-- Table 2: Track broadcast campaigns and their status
CREATE TABLE IF NOT EXISTS email_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  segment TEXT NOT NULL, -- 'all', 'symposium', 'webinar', etc.
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  
  -- Recipient tracking
  total_recipients INTEGER NOT NULL,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  pending_count INTEGER,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'queued', 'in_progress', 'completed', 'failed', 'paused'
  error_message TEXT,
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Rate limiting info
  daily_limit_exceeded BOOLEAN DEFAULT FALSE,
  queued_until_date DATE,
  last_batch_sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'queued', 'in_progress', 'completed', 'failed', 'paused')),
  CONSTRAINT valid_counts CHECK (sent_count >= 0 AND failed_count >= 0)
);

-- Table 3: Track individual recipient sends for retry/recovery
CREATE TABLE IF NOT EXISTS broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES email_broadcasts(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Send status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'bounced'
  send_attempts INTEGER DEFAULT 0,
  last_attempted_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Error tracking
  error_code TEXT,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_recipient_status CHECK (status IN ('pending', 'sent', 'failed', 'bounced'))
);

-- Table 4: Store email templates for reuse
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_send_logs_admin_date ON email_send_logs(admin_id, send_date);
CREATE INDEX IF NOT EXISTS idx_email_send_logs_date ON email_send_logs(send_date);

CREATE INDEX IF NOT EXISTS idx_email_broadcasts_admin ON email_broadcasts(admin_id);
CREATE INDEX IF NOT EXISTS idx_email_broadcasts_status ON email_broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_email_broadcasts_created ON email_broadcasts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_broadcasts_scheduled ON email_broadcasts(scheduled_for) WHERE scheduled_for IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_broadcast ON broadcast_recipients(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_status ON broadcast_recipients(status);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_pending ON broadcast_recipients(broadcast_id, status) WHERE status = 'pending';

-- Enable RLS for security
ALTER TABLE email_send_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_send_logs (admins only)
CREATE POLICY "Admins can view own send logs" 
  ON email_send_logs FOR SELECT 
  USING (auth.uid() = admin_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for email_broadcasts (admins only)
CREATE POLICY "Admins can view all broadcasts" 
  ON email_broadcasts FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can insert broadcasts" 
  ON email_broadcasts FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) AND admin_id = auth.uid());

CREATE POLICY "Admins can update own broadcasts" 
  ON email_broadcasts FOR UPDATE 
  USING (admin_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (admin_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for broadcast_recipients
CREATE POLICY "Admins can view recipients" 
  ON broadcast_recipients FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM email_broadcasts eb 
    WHERE eb.id = broadcast_id 
    AND (eb.admin_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ))
  ));

-- RLS Policies for email_templates
CREATE POLICY "Admins can manage templates" 
  ON email_templates FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));
