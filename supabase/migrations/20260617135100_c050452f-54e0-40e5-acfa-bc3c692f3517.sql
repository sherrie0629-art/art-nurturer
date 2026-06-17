CREATE TABLE public.fortune_stick_draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  draw_date date NOT NULL DEFAULT CURRENT_DATE,
  stick_number int NOT NULL,
  stick_level text NOT NULL,
  stick_title text NOT NULL,
  stick_poem text NOT NULL,
  interpretation text NOT NULL,
  action_tip text NOT NULL DEFAULT '',
  energy_score int NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, draw_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fortune_stick_draws TO authenticated;
GRANT ALL ON public.fortune_stick_draws TO service_role;

ALTER TABLE public.fortune_stick_draws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own fortune stick draws"
ON public.fortune_stick_draws
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_fortune_stick_draws_user_date ON public.fortune_stick_draws(user_id, draw_date DESC);

CREATE OR REPLACE FUNCTION public.update_fortune_stick_draws_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_fortune_stick_draws_updated_at
BEFORE UPDATE ON public.fortune_stick_draws
FOR EACH ROW EXECUTE FUNCTION public.update_fortune_stick_draws_updated_at();