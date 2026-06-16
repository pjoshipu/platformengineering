-- Create enhanced agent_runs table (replaces demo_runs for new agents)
CREATE TABLE public.agent_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name TEXT NOT NULL,
  agent_version TEXT DEFAULT '1.0',
  status TEXT NOT NULL DEFAULT 'completed',
  input_payload JSONB NOT NULL,
  output_data JSONB NOT NULL,
  execution_mode TEXT NOT NULL DEFAULT 'local',
  model_used TEXT DEFAULT 'gpt-4o-mini',
  execution_time_ms INTEGER,
  cost_usd DECIMAL(10, 4),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit trail table for critical decisions
CREATE TABLE public.agent_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name TEXT NOT NULL,
  decision_type TEXT NOT NULL,
  decision_outcome TEXT,
  confidence_score SMALLINT CHECK (confidence_score >= 0 AND confidence_score <= 100),
  input_context JSONB NOT NULL,
  decision_data JSONB NOT NULL,
  rationale TEXT,
  human_override BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  override_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feature flags inventory table (for Feature Flag Lifecycle agent)
CREATE TABLE public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_name TEXT NOT NULL UNIQUE,
  owner_team TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE,
  last_accessed TIMESTAMP WITH TIME ZONE,
  code_references TEXT[],
  lifecycle_metadata JSONB,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Create policies (permissive for demo purposes)
CREATE POLICY "Anyone can view agent runs"
ON public.agent_runs FOR SELECT USING (true);

CREATE POLICY "Anyone can insert agent runs"
ON public.agent_runs FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view agent decisions"
ON public.agent_decisions FOR SELECT USING (true);

CREATE POLICY "Anyone can insert agent decisions"
ON public.agent_decisions FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view feature flags"
ON public.feature_flags FOR SELECT USING (true);

CREATE POLICY "Anyone can insert feature flags"
ON public.feature_flags FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_agent_runs_agent_name ON public.agent_runs(agent_name);
CREATE INDEX idx_agent_runs_created_at ON public.agent_runs(created_at DESC);
CREATE INDEX idx_agent_runs_status ON public.agent_runs(status);
CREATE INDEX idx_agent_decisions_agent_name ON public.agent_decisions(agent_name);
CREATE INDEX idx_agent_decisions_decision_type ON public.agent_decisions(decision_type);
CREATE INDEX idx_agent_decisions_created_at ON public.agent_decisions(created_at DESC);
CREATE INDEX idx_feature_flags_status ON public.feature_flags(status);
CREATE INDEX idx_feature_flags_created_at ON public.feature_flags(created_at DESC);
