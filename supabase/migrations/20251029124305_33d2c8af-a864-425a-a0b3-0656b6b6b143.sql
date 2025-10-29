-- Create table for AI recommendations feedback
CREATE TABLE public.ai_recommendations_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recommendations_text TEXT NOT NULL,
  context_data JSONB NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_recommendations_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for global admins
CREATE POLICY "Global admins can view all feedback"
ON public.ai_recommendations_feedback
FOR SELECT
USING (is_global_admin(auth.uid()));

CREATE POLICY "Global admins can insert feedback"
ON public.ai_recommendations_feedback
FOR INSERT
WITH CHECK (is_global_admin(auth.uid()));

-- Create index for better query performance
CREATE INDEX idx_ai_feedback_user_id ON public.ai_recommendations_feedback(user_id);
CREATE INDEX idx_ai_feedback_created_at ON public.ai_recommendations_feedback(created_at DESC);