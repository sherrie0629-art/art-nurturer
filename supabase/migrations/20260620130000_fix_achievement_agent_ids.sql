-- Sync achievement_defs with pinyin agent IDs + resolve legacy IDs in grant_achievement.

UPDATE public.achievement_defs SET agent_id = 'nuannuan', condition_agent_id = 'nuannuan'
  WHERE id IN ('coffee_regular', 'latte_soulmate');
UPDATE public.achievement_defs SET agent_id = 'laowang', condition_agent_id = 'laowang'
  WHERE id IN ('fireproof', 'breakthrough');
UPDATE public.achievement_defs SET agent_id = 'xinggui', condition_agent_id = 'xinggui'
  WHERE id IN ('trail_companion', 'campfire_bond');
UPDATE public.achievement_defs SET agent_id = 'yunsheng', condition_agent_id = 'yunsheng'
  WHERE id IN ('hype_squad', 'main_character');

UPDATE public.achievements SET agent_id = 'nuannuan' WHERE agent_id = 'barista';
UPDATE public.achievements SET agent_id = 'laowang' WHERE agent_id = 'jax';
UPDATE public.achievements SET agent_id = 'yunsheng' WHERE agent_id = 'mystic';
UPDATE public.achievements SET agent_id = 'xinggui' WHERE agent_id IN ('bestie', 'mentor');

CREATE OR REPLACE FUNCTION public.resolve_agent_id(p_agent_id text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_agent_id
    WHEN 'barista' THEN 'nuannuan'
    WHEN 'jax' THEN 'laowang'
    WHEN 'mystic' THEN 'yunsheng'
    WHEN 'bestie' THEN 'xinggui'
    WHEN 'mentor' THEN 'xinggui'
    ELSE p_agent_id
  END;
$$;

CREATE OR REPLACE FUNCTION public.grant_achievement(p_achievement_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_def public.achievement_defs%ROWTYPE;
  v_met boolean := false;
  v_val integer := 0;
  v_agent text;
BEGIN
  IF v_user IS NULL THEN
    RETURN false;
  END IF;

  SELECT * INTO v_def FROM public.achievement_defs WHERE id = p_achievement_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF EXISTS (SELECT 1 FROM public.achievements WHERE user_id = v_user AND achievement_id = p_achievement_id) THEN
    RETURN true;
  END IF;

  v_agent := public.resolve_agent_id(v_def.condition_agent_id);

  IF v_def.condition_agent_id IS NOT NULL THEN
    IF v_def.condition_type = 'total_turns' THEN
      SELECT COALESCE(total_turns, 0) INTO v_val FROM public.agent_bonds
        WHERE user_id = v_user AND public.resolve_agent_id(agent_id) = v_agent
        ORDER BY total_turns DESC
        LIMIT 1;
      v_met := COALESCE(v_val, 0) >= v_def.threshold;
    ELSIF v_def.condition_type = 'energy_bits' THEN
      SELECT COALESCE(energy_bits, 0) INTO v_val FROM public.agent_bonds
        WHERE user_id = v_user AND public.resolve_agent_id(agent_id) = v_agent
        ORDER BY energy_bits DESC
        LIMIT 1;
      v_met := COALESCE(v_val, 0) >= v_def.threshold;
    ELSIF v_def.condition_type = 'bond_level' THEN
      SELECT COALESCE(bond_level, 0) INTO v_val FROM public.agent_bonds
        WHERE user_id = v_user AND public.resolve_agent_id(agent_id) = v_agent
        ORDER BY bond_level DESC
        LIMIT 1;
      v_met := COALESCE(v_val, 0) >= v_def.threshold;
    ELSIF v_def.condition_type = 'easter_eggs' THEN
      SELECT COALESCE(jsonb_array_length(easter_eggs_found), 0) INTO v_val FROM public.agent_bonds
        WHERE user_id = v_user AND public.resolve_agent_id(agent_id) = v_agent
        ORDER BY jsonb_array_length(easter_eggs_found) DESC
        LIMIT 1;
      v_met := COALESCE(v_val, 0) >= v_def.threshold;
    END IF;
  ELSE
    IF v_def.condition_type = 'total_conversations' THEN
      SELECT COUNT(DISTINCT public.resolve_agent_id(agent_id)) INTO v_val FROM public.conversations WHERE user_id = v_user;
      v_met := v_val >= v_def.threshold;
    ELSIF v_def.condition_type = 'energy_bits' THEN
      SELECT COALESCE(SUM(energy_bits), 0) INTO v_val FROM public.agent_bonds WHERE user_id = v_user;
      v_met := v_val >= v_def.threshold;
    ELSIF v_def.condition_type = 'truth_shards' THEN
      SELECT COUNT(*) INTO v_val FROM public.story_vault WHERE user_id = v_user AND type = 'truth_shard';
      v_met := v_val >= v_def.threshold;
    ELSIF v_def.condition_type = 'easter_eggs' THEN
      SELECT COALESCE(SUM(jsonb_array_length(easter_eggs_found)), 0) INTO v_val FROM public.agent_bonds WHERE user_id = v_user;
      v_met := v_val >= v_def.threshold;
    END IF;
  END IF;

  IF v_met THEN
    INSERT INTO public.achievements (user_id, achievement_id, agent_id)
    VALUES (v_user, p_achievement_id, public.resolve_agent_id(v_def.agent_id))
    ON CONFLICT DO NOTHING;
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_achievement(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_achievement(text) TO authenticated;
